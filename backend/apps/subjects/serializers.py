from django.urls import reverse
from rest_framework import serializers

from apps.core.slugs import unique_slug

from .models import Subject


class AdminSubjectSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, read_only=True)
    image_url = serializers.SerializerMethodField()
    category_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Subject
        fields = ["id", "name", "slug", "description", "image_url", "is_published", "display_order", "category_count", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]

    def get_image_url(self, obj):
        return f"/api/v1/subjects/{obj.slug}/image/?v={int(obj.updated_at.timestamp())}" if obj.image_key else None

    def create(self, data):
        data["slug"] = unique_slug(Subject, data["name"])
        return super().create(data)


class PublicSubjectSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    category_count = serializers.IntegerField(read_only=True, default=0)
    material_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Subject
        fields = ["id", "name", "slug", "description", "image_url", "display_order", "category_count", "material_count"]

    def get_image_url(self, obj):
        return f"/api/v1/subjects/{obj.slug}/image/?v={int(obj.updated_at.timestamp())}" if obj.image_key else None
