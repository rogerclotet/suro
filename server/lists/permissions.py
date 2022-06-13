from rest_framework import permissions


class IsListFamilyMember(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if (
            not request.user
            or not request.user.is_authenticated
            or request.user.is_anonymous
        ):
            return False
        return obj.family in request.user.families.all()
