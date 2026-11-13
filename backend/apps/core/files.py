"""Validación, almacenamiento y entrega de archivos educativos."""
import mimetypes
import re
import uuid
import zipfile
from pathlib import PurePath

from django.conf import settings
from django.core.files.storage import default_storage
from django.http import FileResponse, HttpResponseRedirect
from rest_framework.exceptions import ValidationError

# extensión -> (mime, validador de contenido real)
MIME_BY_EXT = {
    "pdf": "application/pdf",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
}
INLINE_EXTS = {"pdf", "jpg", "jpeg", "png"}  # visualizables en el navegador


def _head(f, n=16):
    f.seek(0)
    data = f.read(n)
    f.seek(0)
    return data


def _check_content(ext, f):
    head = _head(f)
    if ext == "pdf":
        ok = head.startswith(b"%PDF-")
    elif ext in {"jpg", "jpeg"}:
        ok = head.startswith(b"\xff\xd8\xff")
    elif ext == "png":
        ok = head.startswith(b"\x89PNG\r\n\x1a\n")
    elif ext in {"docx", "pptx"}:
        folder = "word/" if ext == "docx" else "ppt/"
        try:
            f.seek(0)
            with zipfile.ZipFile(f) as z:
                names = z.namelist()
                ok = "[Content_Types].xml" in names and any(n.startswith(folder) for n in names)
        except zipfile.BadZipFile:
            ok = False
        finally:
            f.seek(0)
    else:
        ok = False
    if not ok:
        raise ValidationError({"file": "El contenido del archivo no corresponde con su extensión."})


def sanitize_filename(name):
    base = PurePath(str(name).replace("\\", "/")).name
    base = re.sub(r"[^\w.\- ()]", "_", base, flags=re.UNICODE).strip(" .")
    return base[:200] or "archivo"


def validate_upload(f, allowed=None, field="file"):
    """Devuelve (extensión, mime). Lanza ValidationError si no es válido."""
    allowed = allowed or settings.ALLOWED_UPLOAD_EXTENSIONS
    name = sanitize_filename(f.name)
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext not in allowed:
        raise ValidationError({field: f"Formato no permitido. Formatos válidos: {', '.join(sorted(allowed))}."})
    if f.size <= 0:
        raise ValidationError({field: "El archivo está vacío."})
    limit = settings.MAX_UPLOAD_MB * 1024 * 1024
    if f.size > limit:
        raise ValidationError({field: f"El archivo supera el límite de {settings.MAX_UPLOAD_MB} MB."})
    try:
        _check_content(ext, f)
    except ValidationError as exc:
        raise ValidationError({field: exc.detail.get("file", exc.detail)}) from None
    return ext, MIME_BY_EXT[ext]


def store_file(f, prefix, ext):
    """Guarda con nombre único y no adivinable; devuelve la clave."""
    key = f"{prefix}/{uuid.uuid4().hex}.{ext}"
    return default_storage.save(key, f)


def delete_file(key):
    if key:
        try:
            default_storage.delete(key)
        except Exception:  # el borrado físico nunca debe romper la operación
            import logging

            logging.getLogger(__name__).exception("No se pudo borrar %s", key)


def serve_file(key, filename, mime, download=False):
    """URL firmada temporal (S3/R2) o streaming autorizado (disco local)."""
    disposition = "attachment" if download else "inline"
    safe = sanitize_filename(filename)
    if settings.USE_S3:
        url = default_storage.url(
            key,
            parameters={
                "ResponseContentDisposition": f'{disposition}; filename="{safe}"',
                "ResponseContentType": mime,
            },
        )
        resp = HttpResponseRedirect(url)
    else:
        resp = FileResponse(default_storage.open(key, "rb"), content_type=mime)
        resp["Content-Disposition"] = f'{disposition}; filename="{safe}"'
        resp["X-Content-Type-Options"] = "nosniff"
    resp["Cache-Control"] = "private, no-store"
    return resp
