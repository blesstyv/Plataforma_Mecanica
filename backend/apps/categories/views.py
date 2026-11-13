from django.db.models import Count, Q
from rest_framework import viewsets

from apps.audit.services import log_action
from apps.core.permissions import IsTeacher
from apps.materials.models import Material

from .models import Category
from .serializers import AdminCategorySerializer, PublicCategorySerializer

PUBLISHED = Q(materials__status=Material.Status.PUBLISHED)


class PublicCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PublicCategorySerializer
    filterset_fields = {"subject__slug": ["exact"]}
    search_fields = ["name", "description"]
    ordering_fields = ["display_order", "name"]
    lookup_field = "pk"

    def get_queryset(self):
        return (
            Category.objects.public()
            .select_related("subject")
            .annotate(material_count=Count("materials", filter=PUBLISHED, distinct=True))
        )


class AdminCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsTeacher]
    serializer_class = AdminCategorySerializer
    filterset_fields = ["subject", "is_published"]
    search_fields = ["name", "description", "subject__name"]
    ordering_fields = ["display_order", "name", "created_at"]

    def get_queryset(self):
        return Category.objects.select_related("subject").annotate(material_count=Count("materials", distinct=True))

    def perform_create(self, s):
        c = s.save()
        log_action(self.request.user, "create", "category", c.pk, {"name": c.name})

    def perform_update(self, s):
        c = s.save()
        log_action(self.request.user, "update", "category", c.pk, {"fields": sorted(s.validated_data)})

    def perform_destroy(self, instance):
        pk, name = instance.pk, instance.name
        instance.delete()  # ProtectedError -> 409 si tiene materiales
        log_action(self.request.user, "delete", "category", pk, {"name": name})
