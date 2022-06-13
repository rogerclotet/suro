from rest_framework import viewsets
from core.permissions import IsFamilyMember
from core.serializers import FamilySerializer


class FamilyViewSet(viewsets.ModelViewSet):
    serializer_class = FamilySerializer
    permission_classes = [IsFamilyMember]

    def get_queryset(self):
        return self.request.user.families.all()
