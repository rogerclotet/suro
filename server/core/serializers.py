from rest_framework import serializers

from custom_user.serializers import UserSerializer
from . import models


class FamilySerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True)

    class Meta:
        model = models.Family
        fields = ("id", "name", "members")
