from django.db import models


class CategoryQuerySet(models.QuerySet):
    def public(self):
        return self.filter(is_published=True, subject__is_published=True)


class Category(models.Model):
    subject = models.ForeignKey("subjects.Subject", on_delete=models.PROTECT, related_name="categories")
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140)
    description = models.TextField(blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CategoryQuerySet.as_manager()

    class Meta:
        ordering = ["subject__display_order", "display_order", "name"]
        verbose_name_plural = "categories"
        constraints = [
            models.UniqueConstraint(fields=["subject", "slug"], name="uniq_category_slug_per_subject"),
            models.UniqueConstraint(fields=["subject", "name"], name="uniq_category_name_per_subject"),
        ]

    def __str__(self):
        return f"{self.subject.name} / {self.name}"
