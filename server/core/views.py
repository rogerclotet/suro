import logging
import random
import string
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.request import Request
from rest_framework.response import Response
from core.permissions import IsFamilyMember, IsInvitationFamilyMember
from core.serializers import FamilySerializer, InvitationSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from core.models import Family, Invitation

INVITATION_LIMIT = 1

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class FamilyViewSet(viewsets.ModelViewSet):
    serializer_class = FamilySerializer
    permission_classes = [IsFamilyMember]

    def get_queryset(self):
        return self.request.user.families.all()


class InvitationViewSet(viewsets.ModelViewSet):
    queryset = Invitation.objects.all()
    serializer_class = InvitationSerializer
    permission_classes = [IsInvitationFamilyMember]

    def list(self, request: Request, family_pk=None):
        token = request.query_params.get("token", None)
        if token is None:
            return Response(
                {"error": "No token provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        invitation = get_object_or_404(Invitation, pk=token)
        if invitation.family.pk != int(family_pk):
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(invitation)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request, family_pk=None):
        current_invitations = Invitation.objects.filter(family__pk=family_pk)
        if current_invitations.count() >= 1:
            return Response(self.get_serializer(current_invitations.first()).data)

        family = get_object_or_404(Family, pk=family_pk)

        token = "".join(
            random.choice(string.ascii_lowercase + string.digits) for x in range(20)
        )
        invitation = Invitation.objects.create(token=token, family=family)
        serializer = self.get_serializer(invitation)

        return Response(serializer.data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token["first_name"] = user.first_name
        token["last_name"] = user.last_name

        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
