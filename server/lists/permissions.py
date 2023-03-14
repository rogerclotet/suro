from typing import Optional
from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.views import View
from core.models import User

from lists.models import List, ListItem


class IsListFamilyMember(permissions.BasePermission):
    # TODO prevent authenticated users from other families to list lists
    def has_object_permission(self, request: Request, view: View, obj: List):
        user: Optional[User] = request.user
        if not user or not user.is_authenticated or user.is_anonymous:
            return False
        return obj.family in user.families.all()


class IsListItemFamilyMember(permissions.BasePermission):
    # TODO prevent authenticated users from other families to list lists
    def has_object_permission(self, request: Request, view: View, obj: ListItem):
        user: Optional[User] = request.user
        if not user or not user.is_authenticated or user.is_anonymous:
            return False
        return obj.list.family in user.families.all()
