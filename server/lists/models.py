from django.db import models
from core.models import Family


class List(models.Model):
    name = models.CharField(max_length=256, blank=False, db_index=True)
    description = models.TextField(blank=True)
    is_favorite = models.BooleanField(blank=True, default=False)
    is_template = models.BooleanField(blank=True, default=False)
    family = models.ForeignKey(
        to=Family, related_name="lists", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.name

    class Meta:
        ordering = ["-is_favorite", "-updated_at"]


class ListItem(models.Model):
    name = models.TextField(blank=False)
    order = models.IntegerField(blank=True, default=1)
    is_complete = models.BooleanField(blank=True, default=False)
    list = models.ForeignKey(to=List, related_name="items", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["is_complete", "order"]
