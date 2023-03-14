import logging

from django.db import transaction
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.request import Request

from lists.models import List, ListItem
from lists.permissions import IsListFamilyMember, IsListItemFamilyMember
from lists.serializers import ListItemSerializer, ListSerializer

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class FamilyListViewSet(viewsets.ModelViewSet):
    serializer_class = ListSerializer
    permission_classes = [IsListFamilyMember]

    def create(self, request: Request, *args, **kwargs):
        family_id = self.kwargs["family_pk"]
        request.data["family"] = family_id
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def partial_update(self, request: Request, id: int, *args, **kwargs):
        if "items" in request.data:
            items = request.data.pop("items")
            for item_data in items:
                if "id" not in item_data:
                    continue
                id = item_data.pop("id")
                ListItem.objects.select_for_update().filter(pk=id).update(**item_data)

        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=["POST"])
    @transaction.atomic
    def change_category_name(self, request: Request, *args, **kwargs):
        list_id = kwargs["pk"]
        list = self.get_queryset().get(pk=list_id)

        item_ids = request.data["items"]
        items = list.items.filter(pk__in=item_ids)

        category = request.data["category"]
        items.update(category=category)

        serializer = self.get_serializer(list)

        return Response(serializer.data)

    def get_queryset(self):
        return List.objects.filter(family=self.kwargs["family_pk"])


class FamilyListItemViewSet(viewsets.ModelViewSet):
    serializer_class = ListItemSerializer
    permission_classes = [IsListItemFamilyMember]

    def create(self, request: Request, *args, **kwargs):
        request.data["list"] = kwargs["list_pk"]
        return super().create(request, *args, **kwargs)

    def update(self, request: Request, *args, **kwargs):
        request.data["list"] = kwargs["list_pk"]
        return super().update(request, *args, **kwargs)

    def partial_update(self, request: Request, *args, **kwargs):
        request.data["list"] = kwargs["list_pk"]
        return super().partial_update(request, *args, **kwargs)

    def get_queryset(self):
        return ListItem.objects.filter(list=self.kwargs["list_pk"])
