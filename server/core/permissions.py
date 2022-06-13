from rest_framework import permissions


class IsFamilyMember(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if (
            not request.user
            or not request.user.is_authenticated
            or request.user.is_anonymous
        ):
            return False
        return obj in request.user.families.all()
