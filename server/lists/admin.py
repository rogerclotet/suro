from django.contrib import admin
from .models import List, ListItem


class ListItemInline(admin.TabularInline):
    model = ListItem


class ListAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "family")
    list_display_links = ("id", "name")
    inlines = (ListItemInline,)


admin.site.register(List, ListAdmin)
