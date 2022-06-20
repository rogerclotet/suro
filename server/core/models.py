from django.db import models
from custom_user.models import User


class Family(models.Model):
    name = models.CharField(max_length=64)
    members = models.ManyToManyField(to=User, related_name="families")

    def __str__(self) -> str:
        return f"{self.name} ({', '.join([member.email for member in self.members.all()])})"

    class Meta:
        verbose_name_plural = "Families"


class Invitation(models.Model):
    token = models.CharField(max_length=20, primary_key=True, blank=False, null=False)
    family = models.ForeignKey(to=Family, on_delete=models.CASCADE)
