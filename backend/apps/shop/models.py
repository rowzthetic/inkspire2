from django.conf import settings
from django.db import models

from core.models import BaseModel


class Category(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Product(BaseModel):
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name="products",
    )

    # Inventory Management
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    image = models.ImageField(upload_to="shop/products/", blank=True, null=True)

    def __str__(self):
        return self.name


class Order(BaseModel):
    STATUS_CHOICES = [
        ("pending", "Pending Payment"),
        ("paid", "Paid"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    shipping_address = models.TextField()
    is_refunded = models.BooleanField(default=False)

    payment_id = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Order {self.id} by {self.user.username}"


class OrderItem(BaseModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField(default=1)
    price_at_purchase = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    def save(self, *args, **kwargs):
        if not self.price_at_purchase and self.product:
            self.price_at_purchase = self.product.price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.product.name if self.product else 'Unknown Product'}"


# 👇 PROXY MODEL FOR REVENUE DASHBOARD IN ADMIN 👇
class ShopRevenue(Order):
    class Meta:
        proxy = True
        verbose_name = "Shop Revenue Summary"
        verbose_name_plural = "Shop Revenue Summaries"
