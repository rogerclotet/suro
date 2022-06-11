from rest_framework import viewsets
from lists.serializers import ListSerializer
from . import models
from rest_framework import permissions


class ListViewSet(viewsets.ModelViewSet):
    queryset = models.List.objects.all().order_by("-updated_at")
    serializer_class = ListSerializer
    permission_classes = [permissions.IsAuthenticated]
