from django.contrib import admin

from .models import Subject


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "is_published", "display_order")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)
