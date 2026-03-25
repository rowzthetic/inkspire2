from django.db import models


class TattooMeaning(models.Model):
    title = models.CharField(max_length=100)
    meaning = models.TextField()
    image = models.ImageField(upload_to="library_images/", blank=True, null=True)
    tags = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
