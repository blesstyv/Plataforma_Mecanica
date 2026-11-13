from rest_framework.response import Response
from rest_framework.views import APIView

from apps.categories.models import Category
from apps.materials.models import Material
from apps.materials.serializers import AdminMaterialSerializer
from apps.subjects.models import Subject

from .permissions import IsTeacher


class DashboardView(APIView):
    permission_classes = [IsTeacher]

    def get(self, request):
        recent = Material.objects.select_related("category", "category__subject")[:5]
        return Response(
            {
                "subjects": Subject.objects.count(),
                "categories": Category.objects.count(),
                "materials": Material.objects.count(),
                "published": Material.objects.filter(status=Material.Status.PUBLISHED).count(),
                "drafts": Material.objects.filter(status=Material.Status.DRAFT).count(),
                "recent_materials": AdminMaterialSerializer(recent, many=True).data,
            }
        )
