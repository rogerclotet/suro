from rest_framework import viewsets
from lists.permissions import IsListFamilyMember
from lists.serializers import ListSerializer
from lists.models import List


class FamilyListViewSet(viewsets.ModelViewSet):
    serializer_class = ListSerializer
    permission_classes = [IsListFamilyMember]

    def get_queryset(self):
        return List.objects.filter(family=self.kwargs["family_pk"])
