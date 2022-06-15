from django.contrib import admin
from .models import Family


class FamilyAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "family_members")
    list_display_links = ("name",)

    def family_members(self, family: Family) -> str:
        return ", ".join([member.email for member in family.members.all()])


admin.site.register(Family, FamilyAdmin)
