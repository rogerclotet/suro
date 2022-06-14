from rest_framework import permissions


class IsListFamilyMember(permissions.BasePermission):
    # TODO prevent authenticated users from other families to list lists
    def has_object_permission(self, request, view, obj):
        if (
            not request.user
            or not request.user.is_authenticated
            or request.user.is_anonymous
        ):
            return False
        return obj.family in request.user.families.all()


class IsListItemFamilyMember(permissions.BasePermission):
    # TODO prevent authenticated users from other families to list lists
    def has_object_permission(self, request, view, obj):
        if (
            not request.user
            or not request.user.is_authenticated
            or request.user.is_anonymous
        ):
            return False
        return obj.list.family in request.user.families.all()
