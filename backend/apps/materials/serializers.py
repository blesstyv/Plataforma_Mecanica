from rest_framework import serializers

from apps.categories.models import Category
from apps.core import files as fileutil

from .models import Material


class _MaterialBase(serializers.ModelSerializer):
    subject_slug = serializers.CharField(source="category.subject.slug", read_only=True)
    subject_name = serializers.CharField(source="category.subject.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    file_type = serializers.CharField(source="extension", read_only=True)
    has_preview = serializers.SerializerMethodField()
    viewable = serializers.SerializerMethodField()

    def get_has_preview(self, obj):
        return bool(obj.preview_key)

    def get_viewable(self, obj):
        """Se puede visualizar en el navegador (archivo nativo o PDF adjunto)."""
        return obj.extension in fileutil.INLINE_EXTS or bool(obj.preview_key)


class PublicMaterialSerializer(_MaterialBase):
    class Meta:
        model = Material
        fields = [
            "id", "title", "slug", "description", "subject_slug", "subject_name", "category", "category_slug",
            "category_name", "file_type", "original_filename", "file_size", "allow_download", "has_preview",
            "viewable", "created_at", "updated_at",
        ]


class AdminMaterialSerializer(_MaterialBase):
    file = serializers.FileField(write_only=True, required=True)
    preview_file = serializers.FileField(write_only=True, required=False)
    # default explícito: en multipart un booleano ausente se leería como False
    allow_download = serializers.BooleanField(default=True)

    class Meta:
        model = Material
        fields = [
            "id", "title", "slug", "description", "subject_slug", "subject_name", "category", "category_slug",
            "category_name", "file_type", "original_filename", "mime_type", "file_size", "status", "allow_download",
            "has_preview", "viewable", "uploaded_by", "created_at", "updated_at", "file", "preview_file",
        ]
        read_only_fields = ["slug", "original_filename", "mime_type", "file_size", "uploaded_by", "created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance is not None and not isinstance(self.instance, (list, tuple)) or self.partial:
            self.fields["file"].required = False  # el archivo solo es obligatorio al crear

    def validate_category(self, value: Category):
        return value

    def validate_file(self, f):
        self._ext, self._mime = fileutil.validate_upload(f)
        return f

    def validate_preview_file(self, f):
        fileutil.validate_upload(f, allowed=["pdf"], field="preview_file")
        return f
