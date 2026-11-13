"""Respuestas de error consistentes: {"error": {"code", "message", "details"}}."""
from django.db.models import ProtectedError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def _first_message(data):
    if isinstance(data, dict):
        for value in data.values():
            return _first_message(value)
    if isinstance(data, (list, tuple)) and data:
        return _first_message(data[0])
    return str(data)


def api_exception_handler(exc, context):
    if isinstance(exc, ProtectedError):
        return Response(
            {"error": {"code": "protected", "message": "No se puede eliminar: tiene elementos asociados. Elimina o mueve primero su contenido.", "details": {}}},
            status=status.HTTP_409_CONFLICT,
        )
    response = exception_handler(exc, context)
    if response is None:
        return None
    data = response.data
    code = getattr(getattr(exc, "detail", None), "code", None) or getattr(exc, "default_code", "error")
    if response.status_code == 400 and isinstance(data, dict):
        message, details, code = _first_message(data), data, "validation_error"
    else:
        message = data.get("detail") if isinstance(data, dict) and "detail" in data else _first_message(data)
        details = {}
    response.data = {"error": {"code": str(code), "message": str(message), "details": details}}
    return response
