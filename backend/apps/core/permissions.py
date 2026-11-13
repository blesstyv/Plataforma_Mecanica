from rest_framework.permissions import BasePermission


class IsTeacher(BasePermission):
    """Solo personal administrativo activo (el profesor)."""

    message = "Se requiere una sesión de profesor."

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.is_active and u.is_staff)
