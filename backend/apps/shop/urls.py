from django.urls import path
from . import views  # <-- THIS IS THE FIXED LINE!

urlpatterns = [
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('create-order/', views.CreateOrderView.as_view(), name='create-order'),
    path('checkout/<int:pk>/', views.CreateShopStripeCheckoutView.as_view(), name='shop-checkout'),
    path('history/', views.OrderHistoryView.as_view(), name='order-history'),
    path('revenue/', views.RevenueStatsView.as_view(), name='revenue-stats'),
    
    # 👇 NEW: The Webhook URL 👇
    path('webhook/', views.stripe_webhook, name='stripe-webhook'),
]