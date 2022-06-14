from rest_framework import serializers
from core.models import Family
from . import models


class ListItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ListItem
        fields = ("id", "name", "order", "is_complete", "created_at", "updated_at")


class ListSerializer(serializers.ModelSerializer):
    family = serializers.PrimaryKeyRelatedField(queryset=Family.objects.all())
    items = ListItemSerializer(many=True, read_only=True)

    class Meta:
        model = models.List
        fields = (
            "id",
            "family",
            "name",
            "description",
            "is_favorite",
            "is_template",
            "items",
            "created_at",
            "updated_at",
        )
