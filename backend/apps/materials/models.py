from django.conf import settings
from django.db import models


class MaterialQuerySet(models.QuerySet):
    def public(self):
        return self.filter(
            status=Material.Status.PUBLISHED,
            category__is_published=True,
            category__subject__is_published=True,
        )


class Material(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Borrador"
        PUBLISHED = "published", "Publicado"

    category = models.ForeignKey("categories.Category", on_delete=models.PROTECT, related_name="materials")
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220)
    description = models.TextField(blank=True)
    file_key = models.CharField(max_length=255)
    preview_key = models.CharField(max_length=255, blank=True)
    original_filename = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=127)
    file_size = models.PositiveBigIntegerField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT, db_index=True)
    allow_download = models.BooleanField(default=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="materials")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = MaterialQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [models.UniqueConstraint(fields=["category", "slug"], name="uniq_material_slug_per_category")]

    def __str__(self):
        return self.title

    @property
    def extension(self):
        return self.original_filename.rsplit(".", 1)[-1].lower() if "." in self.original_filename else ""
