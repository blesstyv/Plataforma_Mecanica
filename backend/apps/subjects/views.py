from django.db.models import Count, Q
from django.http import Http404
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.audit.services import log_action
from apps.categories.models import Category
from apps.categories.serializers import PublicCategorySerializer
from apps.core import files as fileutil
from apps.core.permissions import IsTeacher
from apps.materials.models import Material

from .models import Subject
from .serializers import AdminSubjectSerializer, PublicSubjectSerializer

IMAGE_EXTS = ["jpg", "jpeg", "png"]


class PublicSubjectViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PublicSubjectSerializer
    lookup_field = "slug"
    search_fields = ["name", "description"]
    ordering_fields = ["display_order", "name"]

    def get_queryset(self):
        return Subject.objects.public().order_by("display_order", "name").annotate(
            category_count=Count("categories", filter=Q(categories__is_published=True), distinct=True),
            material_count=Count(
                "categories__materials",
                filter=Q(categories__is_published=True, categories__materials__status=Material.Status.PUBLISHED),
                distinct=True,
            ),
        )

    def retrieve(self, request, *args, **kwargs):
        subject = self.get_object()
        data = self.get_serializer(subject).data
        cats = (
            Category.objects.public()
            .filter(subject=subject)
            .select_related("subject")
            .annotate(material_count=Count("materials", filter=Q(materials__status=Material.Status.PUBLISHED), distinct=True))
        )
        data["categories"] = PublicCategorySerializer(cats, many=True).data
        return Response(data)

    @action(detail=True, methods=["get"], url_path="image")
    def image(self, request, slug=None):
        subject = self.get_object()
        if not subject.image_key:
            raise Http404
        mime = fileutil.MIME_BY_EXT[subject.image_key.rsplit(".", 1)[-1]]
        return fileutil.serve_file(subject.image_key, f"{subject.slug}.{subject.image_key.rsplit('.', 1)[-1]}", mime)


class AdminSubjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsTeacher]
    serializer_class = AdminSubjectSerializer
    filterset_fields = ["is_published"]
    search_fields = ["name", "description"]
    ordering_fields = ["display_order", "name", "created_at"]

    def get_queryset(self):
        return Subject.objects.order_by("display_order", "name").annotate(category_count=Count("categories", distinct=True))

    def perform_create(self, s):
        o = s.save()
        log_action(self.request.user, "create", "subject", o.pk, {"name": o.name})

    def perform_update(self, s):
        o = s.save()
        log_action(self.request.user, "update", "subject", o.pk, {"fields": sorted(s.validated_data)})

    def perform_destroy(self, instance):
        pk, name, key = instance.pk, instance.name, instance.image_key
        instance.delete()  # ProtectedError -> 409 si tiene categorías
        fileutil.delete_file(key)
        log_action(self.request.user, "delete", "subject", pk, {"name": name})

    @action(detail=True, methods=["post", "delete"], url_path="image")
    def image(self, request, pk=None):
        subject = self.get_object()
        old = subject.image_key
        if request.method == "DELETE":
            subject.image_key = ""
        else:
            f = request.FILES.get("file")
            if not f:
                raise ValidationError({"file": "Adjunta una imagen JPG o PNG."})
            ext, _ = fileutil.validate_upload(f, allowed=IMAGE_EXTS)
            subject.image_key = fileutil.store_file(f, "subjects", ext)
        subject.save()
        fileutil.delete_file(old)
        log_action(request.user, "image", "subject", subject.pk)
        return Response(self.get_serializer(subject).data)
