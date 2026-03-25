from django.contrib import admin
from .models import Product, Order, OrderItem

# 1. Register the Product model
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    # This controls what columns show up in the admin list view
    list_display = ('name', 'price', 'stock_quantity', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')

# 2. Make an "Inline" view for Order Items
# This lets you see the specific items purchased INSIDE the Order page
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price_at_purchase')

# 3. Register the Order model
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_price', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'shipping_address')
    inlines = [OrderItemInline] # Adds the items directly into the order view