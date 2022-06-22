import json
import logging
import random
import string
from django.http import HttpResponseBadRequest
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from core.permissions import (
    IsFamilyMember,
    IsInvitationFamilyMemberOrReadOnly,
)
from core.serializers import FamilySerializer, InvitationSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from core.models import Family, Invitation
from custom_user.models import User

FAMILIES_LIMIT = 5

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class FamilyViewSet(viewsets.ModelViewSet):
    serializer_class = FamilySerializer
    permission_classes = [IsFamilyMember]

    def get_queryset(self):
        return self.request.user.families.all()

    def create(self, request):
        name = request.data.get("name", None)
        if name is None:
            return HttpResponseBadRequest(
                json.dumps({"error", "Name was not provided"})
            )

        if request.user.families.count() >= FAMILIES_LIMIT:
            return HttpResponseBadRequest(
                json.dumps({"error": "Families limit reached"})
            )

        family = Family.objects.create(name=name)
        family.members.add(request.user)

        serializer = self.get_serializer(family)

        return Response(serializer.data)

    @action(
        detail=True,
        methods=["POST"],
        permission_classes=[permissions.IsAuthenticated],
    )
    def join(self, request, pk=None):
        family = get_object_or_404(Family, pk=pk)

        token = request.data.get("token", None)
        if token is None:
            return Response(
                {"error": "Invitation token was not provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_id = request.data.get("user_id", None)
        if user_id is None:
            return Response(
                {"error": "User id was not provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invitation = get_object_or_404(Invitation, pk=token)

        if invitation.family != family:
            return Response(
                {"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )

        user = get_object_or_404(User, pk=user_id)

        if user.families.count() >= FAMILIES_LIMIT:
            return HttpResponseBadRequest(
                json.dumps({"code": 1, "error": "Families limit reached"})
            )

        family.members.add(user)

        serializer = self.get_serializer(family)

        return Response(serializer.data)


class InvitationViewSet(viewsets.ModelViewSet):
    queryset = Invitation.objects.all()
    serializer_class = InvitationSerializer
    permission_classes = [IsInvitationFamilyMemberOrReadOnly]

    def list(self, request: Request):
        token = request.query_params.get("token", None)
        if token is None:
            return Response(
                {"error": "No token provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        invitation = get_object_or_404(Invitation, pk=token)

        serializer = self.get_serializer(invitation)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request):
        family_pk = request.data.get("family_id", None)
        if family_pk is None:
            return Response(
                {"error": "No family id provided"}, status=status.HTTP_400_BAD_REQUEST
            )

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
