from django.contrib import admin

from .models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "subject", "is_published", "display_order")
    list_filter = ("subject", "is_published")
    prepopulated_fields = {"slug": ("name",)}
