from django.utils.text import slugify


def unique_slug(model, base, scope=None, exclude_pk=None, max_length=140):
    """Genera un slug único dentro de `scope` (dict de filtros)."""
    root = (slugify(base) or "item")[: max_length - 8]
    slug, n = root, 2
    qs = model.objects.filter(**(scope or {}))
    if exclude_pk:
        qs = qs.exclude(pk=exclude_pk)
    while qs.filter(slug=slug).exists():
        slug = f"{root}-{n}"
        n += 1
    return slug
