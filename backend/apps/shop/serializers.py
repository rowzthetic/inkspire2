from rest_framework import serializers
from .models import Order, OrderItem, Product, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']

class ProductSerializer(serializers.ModelSerializer):
    category_details = CategorySerializer(source='category', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "category",  # Returns the ID
            "category_details", # Returns object with .name
            "stock_quantity",
            "image",
        ]

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["product", "product_name", "quantity", "price_at_purchase"]

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "user",
            "status",
            "total_price",
            "shipping_address",
            "created_at",
            "items",
        ]
        read_only_fields = ["user", "total_price", "status", "created_at"]

class CreateOrderSerializer(serializers.Serializer):
    shipping_address = serializers.CharField()
    items = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField(),
        )
    )
