from rest_framework import permissions


class UserPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        # Only allow creating users
        return request.method == "POST"
