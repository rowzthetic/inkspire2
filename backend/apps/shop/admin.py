from django.contrib import admin, messages
from django.db.models import Sum
from django.utils.html import format_html

from .models import Order, OrderItem, Product, ShopRevenue, Category

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}

# ─── Custom Filter for Product Category ──────────────────────────────────────


class ProductCategoryFilter(admin.SimpleListFilter):
    title = "product category"
    parameter_name = "category"

    def lookups(self, request, model_admin):
        return [(c.id, c.name) for c in Category.objects.all()]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(items__product__category_id=self.value()).distinct()
        return queryset


# ─── Mixin for Shared Revenue Dashboard Logic ────────────────────────────────


class RevenueDashboardMixin:
    def changelist_view(self, request, extra_context=None):
        cl = self.get_changelist_instance(request)
        filtered_queryset = cl.get_queryset(request)

        # 1. Gross Revenue (Total Paid)
        gross_revenue = (
            filtered_queryset.filter(status="paid").aggregate(Sum("total_price"))[
                "total_price__sum"
            ]
            or 0
        )
        
        # 2. Total Refunds
        total_refunds = (
            filtered_queryset.filter(is_refunded=True).aggregate(Sum("total_price"))[
                "total_price__sum"
            ]
            or 0
        )

        # 3. Net Revenue
        net_revenue = gross_revenue - total_refunds
        paid_count = filtered_queryset.filter(status="paid").count()
        refund_count = filtered_queryset.filter(is_refunded=True).count()

        metrics_html = format_html(
            '<div style="background: #417690; color: white; padding: 15px 25px; border-radius: 4px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">'
            '<div style="display: flex; align-items: center; justify-content: space-between;">'
            "<div>"
            '<h2 style="margin: 0; font-size: 1.5rem; font-weight: normal; color: white;">📊 Detailed Revenue Dashboard</h2>'
            '<p style="margin: 5px 0 0; opacity: 0.8; font-size: 0.85rem;">Gross revenue includes all paid orders before refunds</p>'
            "</div>"
            '<div style="display: flex; gap: 40px;">'
            '<div style="text-align: right;">'
            '<p style="margin: 0; opacity: 0.8; font-size: 0.7rem; text-transform: uppercase;">Gross</p>'
            '<h3 style="margin: 0; font-size: 1.4rem; font-weight: bold;">${}</h3>'
            "</div>"
            '<div style="text-align: right;">'
            '<p style="margin: 0; opacity: 0.8; font-size: 0.7rem; text-transform: uppercase;">Refunded ({})</p>'
            '<h3 style="margin: 0; font-size: 1.4rem; font-weight: bold; color: #ffcccc;">-${}</h3>'
            "</div>"
            '<div style="text-align: right;">'
            '<p style="margin: 0; opacity: 0.8; font-size: 0.7rem; text-transform: uppercase; font-weight: bold;">Net Revenue</p>'
            '<h3 style="margin: 0; font-size: 1.8rem; font-weight: bold; color: #ccffcc;">${}</h3>'
            "</div>"
            "</div>"
            "</div>"
            "</div>",
            "{:,.2f}".format(gross_revenue),
            refund_count,
            "{:,.2f}".format(total_refunds),
            "{:,.2f}".format(net_revenue),
        )
        self.message_user(request, metrics_html, level=messages.INFO)
        return super().changelist_view(request, extra_context=extra_context)


# ─── Admin Configurations ───────────────────────────────────────────────────


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "display_image",
        "name",
        "category",
        "price",
        "stock_quantity",
        "is_active",
    )
    list_filter = ("category", "is_active", "created_at")
    search_fields = ("name", "description", "category__name")
    list_editable = ("category", "price", "stock_quantity", "is_active")
    readonly_fields = ("created_at", "updated_at")

    def display_image(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 45px; height: 45px; border-radius: 4px; object-fit: cover;" />',
                obj.image.url,
            )
        return "No Image"

    display_image.short_description = "Preview"


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("price_at_purchase", "category_display")
    fields = ("product", "category_display", "quantity", "price_at_purchase")

    def category_display(self, obj):
        return obj.product.category.name if obj.product and obj.product.category else "-"

    category_display.short_description = "Category"


@admin.register(Order)
class OrderAdmin(RevenueDashboardMixin, admin.ModelAdmin):
    list_display = (
        "id",
        "user_display",
        "items_summary",
        "total_price",
        "status_colored",
        "created_at",
    )
    list_filter = (ProductCategoryFilter, "status", "created_at")
    search_fields = ("id", "user__username", "user__email", "shipping_address")
    date_hierarchy = "created_at"
    inlines = [OrderItemInline]

    def user_display(self, obj):
        return f"{obj.user.username} ({obj.user.email})"

    user_display.short_description = "Customer"

    def items_summary(self, obj):
        categories = obj.items.values_list("product__category__name", flat=True).distinct()
        return ", ".join([cat for cat in categories if cat])

    items_summary.short_description = "Categories"

    def status_colored(self, obj):
        colors = {
            "paid": "#10b981",
            "pending": "#f59e0b",
            "shipped": "#3b82f6",
            "delivered": "#6366f1",
            "cancelled": "#ef4444",
        }
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 10px; border-radius: 12px; font-weight: bold; font-size: 11px;">{}</span>',
            colors.get(obj.status, "#6b7280"),
            obj.status.upper(),
        )

    status_colored.short_description = "Status"


@admin.register(ShopRevenue)
class ShopRevenueAdmin(RevenueDashboardMixin, admin.ModelAdmin):
    list_display = ("id", "user", "total_price", "status", "created_at")
    list_filter = (ProductCategoryFilter, "created_at")

    # Disable adding/deleting for report clarity
    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
