# from django.db import models
# import uuid

# class BaseModel(models.Model):
#     # Primary key as UUID (more secure for marketplaces)
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

#     # Timestamps
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         abstract = True  # This ensures no table is created for BaseModel

from django.db import models


# ✅ NO User model here. Only BaseModel.
class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
