from rest_framework import serializers

from apps.core.slugs import unique_slug
from apps.subjects.models import Subject

from .models import Category


class AdminCategorySerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    material_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ["id", "subject", "subject_name", "name", "slug", "description", "display_order", "is_published", "material_count", "created_at", "updated_at"]
        read_only_fields = ["slug", "created_at", "updated_at"]

    def validate(self, attrs):
        subject = attrs.get("subject") or getattr(self.instance, "subject", None)
        name = attrs.get("name") or getattr(self.instance, "name", None)
        qs = Category.objects.filter(subject=subject, name__iexact=name)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError({"name": "Ya existe una categoría con ese nombre en la asignatura."})
        return attrs

    def create(self, data):
        data["slug"] = unique_slug(Category, data["name"], {"subject": data["subject"]})
        return super().create(data)


class PublicCategorySerializer(serializers.ModelSerializer):
    subject = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    material_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ["id", "subject", "subject_name", "name", "slug", "description", "display_order", "material_count"]
