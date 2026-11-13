from django.http import Http404
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core import files as fileutil
from apps.core.permissions import IsTeacher

from . import services
from .filters import MaterialFilter
from .models import Material
from .serializers import AdminMaterialSerializer, PublicMaterialSerializer

SELECT = ("category", "category__subject")


def _truthy(v):
    return str(v).lower() in {"1", "true", "yes"}


class FileDeliveryMixin:
    """Entrega archivo principal o PDF de vista previa de un material ya autorizado."""

    def _deliver(self, request, material, variant="file", force_download_check=True):
        want_download = _truthy(request.query_params.get("download"))
        if variant == "preview":
            if not material.preview_key:
                raise Http404
            return fileutil.serve_file(material.preview_key, f"{material.title}.pdf", "application/pdf", download=False)
        if want_download and force_download_check and not material.allow_download:
            raise PermissionDenied("La descarga de este material no está permitida.")
        inline_ok = material.extension in fileutil.INLINE_EXTS
        return fileutil.serve_file(material.file_key, material.original_filename, material.mime_type, download=want_download or not inline_ok)


class PublicMaterialViewSet(FileDeliveryMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = PublicMaterialSerializer
    filterset_class = MaterialFilter
    search_fields = ["title", "description", "category__name", "category__subject__name"]
    ordering_fields = ["created_at", "title", "file_size"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Material.objects.public().select_related(*SELECT)

    @action(detail=True, methods=["get"], url_path="file")
    def file(self, request, pk=None):
        return self._deliver(request, self.get_object())

    @action(detail=True, methods=["get"], url_path="preview")
    def preview(self, request, pk=None):
        return self._deliver(request, self.get_object(), variant="preview")


class AdminMaterialViewSet(FileDeliveryMixin, viewsets.ModelViewSet):
    permission_classes = [IsTeacher]
    serializer_class = AdminMaterialSerializer
    filterset_class = MaterialFilter
    search_fields = ["title", "description", "original_filename", "category__name", "category__subject__name"]
    ordering_fields = ["created_at", "updated_at", "title", "file_size", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Material.objects.select_related(*SELECT)

    def perform_create(self, serializer):
        serializer.instance = services.create_material(self.request.user, dict(serializer.validated_data))

    def perform_update(self, serializer):
        serializer.instance = services.update_material(self.request.user, serializer.instance, dict(serializer.validated_data))

    def perform_destroy(self, instance):
        services.delete_material(self.request.user, instance)

    def _ok(self, instance):
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        return self._ok(services.set_status(request.user, self.get_object(), Material.Status.PUBLISHED))

    @action(detail=True, methods=["post"])
    def unpublish(self, request, pk=None):
        return self._ok(services.set_status(request.user, self.get_object(), Material.Status.DRAFT))

    @action(detail=True, methods=["post"], url_path="replace-file")
    def replace_file(self, request, pk=None):
        f = request.FILES.get("file")
        if not f:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"file": "Adjunta el nuevo archivo."})
        return self._ok(services.replace_file(request.user, self.get_object(), f))

    @action(detail=True, methods=["post", "delete"], url_path="preview-file")
    def preview_file(self, request, pk=None):
        obj = self.get_object()
        if request.method == "DELETE":
            services.remove_preview(request.user, obj)
            return self._ok(obj)
        f = request.FILES.get("file")
        if not f:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"file": "Adjunta el PDF de vista previa."})
        return self._ok(services.set_preview(request.user, obj, f))

    @action(detail=True, methods=["get"], url_path="file")
    def file(self, request, pk=None):
        return self._deliver(request, self.get_object(), force_download_check=False)

    @action(detail=True, methods=["get"], url_path="preview")
    def preview(self, request, pk=None):
        return self._deliver(request, self.get_object(), variant="preview")
