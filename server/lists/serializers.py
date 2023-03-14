from typing import Any, Dict, Iterable
from rest_framework import serializers
from core.models import Family
from lists.models import ListItem
from . import models


class ListItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ListItem
        fields = (
            "id",
            "name",
            "order",
            "is_complete",
            "category",
            "list",
            "created_at",
            "updated_at",
        )


class ListSerializer(serializers.ModelSerializer):
    family = serializers.PrimaryKeyRelatedField(queryset=Family.objects.all())
    items = ListItemSerializer(many=True, default=[])

    def create(self, validated_data: Dict[str, Any]):
        items_data: Iterable[Dict[str, Any]] = validated_data.pop("items", None) or []

        list = super().create(validated_data)

        for item_data in items_data:
            item_data.pop("list", None)
            item_data.pop("is_complete", None)
            ListItem.objects.create(**item_data, list=list)

        return list

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
