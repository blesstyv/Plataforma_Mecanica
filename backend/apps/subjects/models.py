from django.db import models
from django.db.models import Q


class SubjectQuerySet(models.QuerySet):
    def public(self):
        return self.filter(is_published=True)


class Subject(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True)
    description = models.TextField(blank=True)
    image_key = models.CharField(max_length=255, blank=True)
    is_published = models.BooleanField(default=False, db_index=True)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = SubjectQuerySet.as_manager()

    class Meta:
        ordering = ["display_order", "name"]

    def __str__(self):
        return self.name
