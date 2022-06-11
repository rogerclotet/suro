from rest_framework import serializers
from drf_writable_nested.serializers import WritableNestedModelSerializer
from core.models import Family
from . import models


class ListItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ListItem
        fields = ("id", "name", "order", "is_complete", "created_at", "updated_at")


class ListSerializer(WritableNestedModelSerializer):
    family = serializers.PrimaryKeyRelatedField(queryset=Family.objects.all())
    items = ListItemSerializer(many=True, required=False)

    class Meta:
        model = models.List
        fields = (
            "id",
            "family",
            "name",
            "description",
            "is_template",
            "items",
            "created_at",
            "updated_at",
        )
