from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.views import CsrfView, LoginView, LogoutView, MeView
from apps.categories.views import AdminCategoryViewSet, PublicCategoryViewSet
from apps.materials.views import AdminMaterialViewSet, PublicMaterialViewSet
from apps.subjects.views import AdminSubjectViewSet, PublicSubjectViewSet

from .dashboard import DashboardView

public = DefaultRouter()
public.include_root_view = False
public.register("subjects", PublicSubjectViewSet, basename="subject")
public.register("categories", PublicCategoryViewSet, basename="category")
public.register("materials", PublicMaterialViewSet, basename="material")

admin = DefaultRouter()
admin.include_root_view = False
admin.register("subjects", AdminSubjectViewSet, basename="admin-subject")
admin.register("categories", AdminCategoryViewSet, basename="admin-category")
admin.register("materials", AdminMaterialViewSet, basename="admin-material")

urlpatterns = [
    path("auth/csrf/", CsrfView.as_view()),
    path("auth/login/", LoginView.as_view()),
    path("auth/logout/", LogoutView.as_view()),
    path("auth/me/", MeView.as_view()),
    path("admin/dashboard/", DashboardView.as_view()),
    path("admin/", include(admin.urls)),
    path("", include(public.urls)),
]
