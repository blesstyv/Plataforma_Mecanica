from django.db import transaction

from apps.audit.services import log_action
from apps.core import files as fileutil
from apps.core.slugs import unique_slug

from .models import Material


@transaction.atomic
def create_material(user, validated):
    f = validated.pop("file")
    preview = validated.pop("preview_file", None)
    ext, mime = fileutil.validate_upload(f)
    key = fileutil.store_file(f, "materials", ext)
    preview_key = fileutil.store_file(preview, "previews", "pdf") if preview else ""
    m = Material.objects.create(
        slug=unique_slug(Material, validated["title"], {"category": validated["category"]}),
        file_key=key,
        preview_key=preview_key,
        original_filename=fileutil.sanitize_filename(f.name),
        mime_type=mime,
        file_size=f.size,
        uploaded_by=user,
        **validated,
    )
    log_action(user, "create", "material", m.pk, {"title": m.title, "status": m.status})
    return m


def update_material(user, instance, validated):
    validated.pop("file", None)
    preview = validated.pop("preview_file", None)
    for k, v in validated.items():
        setattr(instance, k, v)
    if preview:
        _swap_preview(instance, preview)
    instance.save()
    log_action(user, "update", "material", instance.pk, {"fields": sorted(validated)})
    return instance


def _swap_preview(instance, preview):
    old = instance.preview_key
    instance.preview_key = fileutil.store_file(preview, "previews", "pdf")
    return old


def replace_file(user, instance, f):
    ext, mime = fileutil.validate_upload(f)
    new_key = fileutil.store_file(f, "materials", ext)
    old = instance.file_key
    instance.file_key, instance.mime_type = new_key, mime
    instance.original_filename, instance.file_size = fileutil.sanitize_filename(f.name), f.size
    instance.save()
    fileutil.delete_file(old)
    log_action(user, "replace_file", "material", instance.pk, {"filename": instance.original_filename})
    return instance


def set_preview(user, instance, f):
    fileutil.validate_upload(f, allowed=["pdf"], field="file")
    old = _swap_preview(instance, f)
    instance.save()
    fileutil.delete_file(old)
    log_action(user, "set_preview", "material", instance.pk)
    return instance


def remove_preview(user, instance):
    old, instance.preview_key = instance.preview_key, ""
    instance.save()
    fileutil.delete_file(old)
    log_action(user, "remove_preview", "material", instance.pk)


def set_status(user, instance, status):
    instance.status = status
    instance.save(update_fields=["status", "updated_at"])
    log_action(user, "publish" if status == Material.Status.PUBLISHED else "unpublish", "material", instance.pk)
    return instance


def delete_material(user, instance):
    keys = [instance.file_key, instance.preview_key]
    pk, title = instance.pk, instance.title
    instance.delete()
    for k in keys:
        fileutil.delete_file(k)
    log_action(user, "delete", "material", pk, {"title": title})
