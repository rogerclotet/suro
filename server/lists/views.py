from rest_framework import viewsets
from lists.permissions import IsListFamilyMember, IsListItemFamilyMember
from lists.serializers import ListItemSerializer, ListSerializer
from lists.models import List, ListItem


class FamilyListViewSet(viewsets.ModelViewSet):
    serializer_class = ListSerializer
    permission_classes = [IsListFamilyMember]

    def get_queryset(self):
        return List.objects.filter(family=self.kwargs["family_pk"])


class FamilyListItemViewSet(viewsets.ModelViewSet):
    serializer_class = ListItemSerializer
    permission_classes = [IsListItemFamilyMember]

    def get_queryset(self):
        return ListItem.objects.filter(list=self.kwargs["list_pk"])
