from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.services import log_action

from . import throttle


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    is_staff = serializers.BooleanField()


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=256, trim_whitespace=False)


def _error(code, message, http_status):
    return Response({"error": {"code": code, "message": message, "details": {}}}, status=http_status)


def _ip(request):
    return request.META.get("REMOTE_ADDR", "")


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"detail": "ok"})


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        s = LoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        username, ip = s.validated_data["username"], _ip(request)
        if throttle.is_locked(username, ip):
            return _error("too_many_attempts", "Demasiados intentos fallidos. Inténtalo de nuevo más tarde.", 429)
        user = authenticate(request, username=username, password=s.validated_data["password"])
        if user is None or not user.is_staff:
            throttle.register_failure(username, ip)
            return _error("invalid_credentials", "Usuario o contraseña incorrectos.", 401)
        throttle.reset(username, ip)
        login(request, user)
        log_action(user, "login", "user", user.pk)
        return Response(UserSerializer(user).data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        log_action(request.user, "logout", "user", request.user.pk)
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
