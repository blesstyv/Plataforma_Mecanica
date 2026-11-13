import django_filters as df

from .models import Material


class MaterialFilter(df.FilterSet):
    subject = df.CharFilter(field_name="category__subject__slug")
    category = df.CharFilter(field_name="category__slug")
    category_id = df.NumberFilter(field_name="category_id")
    file_type = df.CharFilter(method="filter_type")
    status = df.CharFilter(field_name="status")

    class Meta:
        model = Material
        fields = ["subject", "category", "category_id", "file_type", "status"]

    def filter_type(self, qs, name, value):
        value = value.lower().lstrip(".")
        exts = {"jpg": ["jpg", "jpeg"], "jpeg": ["jpg", "jpeg"]}.get(value, [value])
        from django.db.models import Q

        q = Q()
        for e in exts:
            q |= Q(original_filename__iendswith=f".{e}")
        return qs.filter(q)
