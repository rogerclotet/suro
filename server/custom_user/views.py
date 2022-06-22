from django.http import HttpResponseBadRequest
from rest_framework import viewsets
from rest_framework.response import Response
from custom_user.models import User
from custom_user.permissions import UserPermission
from custom_user.serializers import UserSerializer


class MissingParameterException(Exception):
    def __init__(self, parameter_name: str) -> None:
        self.parameter_name = parameter_name


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [UserPermission]

    def get_parameter(self, request, name):
        value = request.data.get(name, None)
        if value is None:
            raise MissingParameterException(name)
        return value

    def create(self, request):
        try:
            email = self.get_parameter(request, "email")
            first_name = self.get_parameter(request, "first_name")
            last_name = self.get_parameter(request, "last_name")
            password = self.get_parameter(request, "password")
        except MissingParameterException as e:
            return HttpResponseBadRequest(
                {"error": f"Missing required parameter {e.parameter_name}"}
            )

        user = User.objects.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password,
        )

        serializer = self.get_serializer(user)

        return Response(serializer.data)
