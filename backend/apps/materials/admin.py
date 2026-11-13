from django.contrib import admin

from .models import Material


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "status", "allow_download", "created_at")
    list_filter = ("status", "category__subject")
    search_fields = ("title", "original_filename")
    readonly_fields = ("file_key", "preview_key", "mime_type", "file_size", "uploaded_by")
