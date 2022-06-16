import logging
from rest_framework import viewsets
from lists.permissions import IsListFamilyMember, IsListItemFamilyMember
from lists.serializers import ListItemSerializer, ListSerializer
from lists.models import List, ListItem

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class FamilyListViewSet(viewsets.ModelViewSet):
    serializer_class = ListSerializer
    permission_classes = [IsListFamilyMember]

    def create(self, request, *args, **kwargs):
        family_id = self.kwargs["family_pk"]
        request.data["family"] = family_id
        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        return List.objects.filter(family=self.kwargs["family_pk"])


class FamilyListItemViewSet(viewsets.ModelViewSet):
    serializer_class = ListItemSerializer
    permission_classes = [IsListItemFamilyMember]

    def create(self, request, *args, **kwargs):
        list_id = self.kwargs["list_pk"]
        request.data["list"] = list_id
        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        return ListItem.objects.filter(list=self.kwargs["list_pk"])
