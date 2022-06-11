from rest_framework import viewsets
from core.serializers import FamilySerializer
from . import models
from rest_framework import permissions


class FamilyViewSet(viewsets.ModelViewSet):
    queryset = models.Family.objects.all()
    serializer_class = FamilySerializer
    permission_classes = [permissions.IsAuthenticated]
