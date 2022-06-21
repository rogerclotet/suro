"""familia URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from core import views
from lists.views import FamilyListItemViewSet, FamilyListViewSet
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from core.views import CustomTokenObtainPairView, InvitationViewSet
from rest_framework_nested import routers


router = routers.DefaultRouter()
router.register("families", views.FamilyViewSet, basename="family")
router.register("invitations", InvitationViewSet, basename="invitation")

families_router = routers.NestedDefaultRouter(router, "families", lookup="family")
families_router.register("lists", FamilyListViewSet, basename="list")

family_lists_router = routers.NestedDefaultRouter(
    families_router, "lists", lookup="list"
)
family_lists_router.register("items", FamilyListItemViewSet, basename="item")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include(router.urls)),
    path("", include(families_router.urls)),
    path("", include(family_lists_router.urls)),
    path("api-auth/", include("rest_framework.urls")),
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
