from rest_framework import viewsets
from core.permissions import IsFamilyMember
from core.serializers import FamilySerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class FamilyViewSet(viewsets.ModelViewSet):
    serializer_class = FamilySerializer
    permission_classes = [IsFamilyMember]

    def get_queryset(self):
        return self.request.user.families.all()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token["first_name"] = user.first_name
        token["last_name"] = user.last_name

        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
