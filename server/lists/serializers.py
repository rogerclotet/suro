from rest_framework import serializers
from core.models import Family
from lists.models import List, ListItem
from . import models


class ListItemSerializer(serializers.ModelSerializer):
    list = serializers.PrimaryKeyRelatedField(queryset=List.objects.all())

    class Meta:
        model = models.ListItem
        fields = (
            "id",
            "list",
            "name",
            "order",
            "is_complete",
            "category",
            "created_at",
            "updated_at",
        )


class ListSerializer(serializers.ModelSerializer):
    family = serializers.PrimaryKeyRelatedField(queryset=Family.objects.all())
    items = ListItemSerializer(many=True, read_only=True)

    def create(self, validated_data):
        items_data = validated_data.pop("items") if "items" in validated_data else []

        list = super().create(validated_data)

        for item_data in items_data:
            item_data.pop("list")
            item_data.pop("is_complete")
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
