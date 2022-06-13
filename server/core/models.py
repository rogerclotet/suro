from django.db import models

from custom_user.models import User


class Family(models.Model):
    name = models.CharField(max_length=64)
    members = models.ManyToManyField(to=User, related_name="families")

    def __str__(self) -> str:
        return f"{self.name} ({', '.join([member.email for member in self.members.all()])}) [{self.id}]"
