# import stripe
# from django.conf import settings
# from django.db import transaction
# from django.shortcuts import get_object_or_404
# from rest_framework import filters, generics, permissions, status
# from rest_framework.response import Response
# from rest_framework.views import APIView

# from .models import Order, OrderItem, Product
# from .serializers import CreateOrderSerializer, OrderSerializer, ProductSerializer
# from django.views.decorators.csrf import csrf_exempt
# from django.http import HttpResponse

# # Ensure you have your Stripe Secret Key in your settings.py!
# stripe.api_key = settings.STRIPE_SECRET_KEY

# # 1. Product List (Public)
# class ProductListView(generics.ListAPIView):
#     queryset = Product.objects.filter(is_active=True)
#     serializer_class = ProductSerializer
#     permission_classes = [permissions.AllowAny]
#     filter_backends = [filters.SearchFilter]
#     search_fields = ["name", "description"]

# # 2. Product Detail (Public)
# class ProductDetailView(generics.RetrieveAPIView):
#     queryset = Product.objects.filter(is_active=True)
#     serializer_class = ProductSerializer
#     permission_classes = [permissions.AllowAny]

# # 3. Create Order (Authenticated Users Only)
# class CreateOrderView(APIView):
#     permission_classes = [permissions.IsAuthenticated]

#     @transaction.atomic
#     def post(self, request):
#         serializer = CreateOrderSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         address = serializer.validated_data["shipping_address"]
#         items_data = serializer.validated_data["items"]

#         # Create Order
#         order = Order.objects.create(user=request.user, shipping_address=address)
#         total = 0

#         try:
#             for item in items_data:
#                 product = Product.objects.get(id=item["product_id"])
#                 qty = item["quantity"]

#                 if product.stock_quantity < qty:
#                     raise Exception(f"Not enough stock for {product.name}")

#                 OrderItem.objects.create(
#                     order=order,
#                     product=product,
#                     quantity=qty,
#                     price_at_purchase=product.price,
#                 )

#                 product.stock_quantity -= qty
#                 product.save()

#                 total += product.price * qty

#         except Product.DoesNotExist:
#             return Response({"error": "Product not found"}, status=400)
#         except Exception as e:
#             return Response({"error": str(e)}, status=400)

#         order.total_price = total
#         # It's a good practice to set a status to pending before payment!
#         order.status = 'pending'
#         order.save()

#         return Response({
#             "message": "Order created successfully",
#             "order_id": order.id,
#             "order": OrderSerializer(order).data
#         }, status=status.HTTP_201_CREATED)

# # 4. Stripe Checkout View for Shop Orders
# class CreateShopStripeCheckoutView(APIView):
#     permission_classes = [permissions.IsAuthenticated]

#     def post(self, request, pk):
#         # Find the specific order that belongs to the logged-in user
#         order = get_object_or_404(Order, pk=pk, user=request.user)

#         frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')

#         try:
#             checkout_session = stripe.checkout.Session.create(
#                 payment_method_types=['card'],
#                 line_items=[{
#                     'price_data': {
#                         'currency': 'usd', # Using USD for Stripe test mode
#                         'unit_amount': int(order.total_price * 100), # Convert dollars to cents
#                         'product_data': {
#                             'name': f'Inkspire Order #{order.id}',
#                         },
#                     },
#                     'quantity': 1,
#                 }],
#                 mode='payment',
#                 # Redirect back to the shop with a success or cancel tag
#                 success_url=f'{frontend_url}/shop?payment=success&order_id={order.id}',
#                 cancel_url=f'{frontend_url}/shop?payment=cancelled',
#                 metadata={'order_id': order.id} # Good for backend tracking
#             )
#             return Response({'url': checkout_session.url})
#         except Exception as e:
#             return Response({'error': str(e)}, status=500)

# # 5. Order History (Authenticated Users Only)
# class OrderHistoryView(generics.ListAPIView):
#     serializer_class = OrderSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def get_queryset(self):
#         # Grabs only the logged-in user's orders, newest first
#         return Order.objects.filter(user=self.request.user).order_by("-created_at")


#     # 6. STRIPE WEBHOOK (The Secret Phone Line)
# @csrf_exempt
# def stripe_webhook(request):
#     payload = request.body
#     sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
#     # We will get this secret key from Stripe in Step 3!
#     endpoint_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')

#     try:
#         event = stripe.Webhook.construct_event(
#             payload, sig_header, endpoint_secret
#         )
#     except ValueError as e:
#         # Invalid payload
#         return HttpResponse(status=400)
#     except stripe.error.SignatureVerificationError as e:
#         # Invalid signature (Someone pretending to be Stripe)
#         return HttpResponse(status=400)

#     # Handle the checkout.session.completed event
#     if event['type'] == 'checkout.session.completed':
#         session = event['data']['object']

#         # Remember when we saved the order_id in metadata? Here it is!
#         order_id = session.get('metadata', {}).get('order_id')

#         if order_id:
#             try:
#                 order = Order.objects.get(id=order_id)
#                 order.status = 'paid' # 🟢 BOOM! Order is officially paid!
#                 order.save()
#                 print(f"🎉 SUCCESS! Stripe confirmed Order #{order_id} is PAID!")
#             except Order.DoesNotExist:
#                 print(f"⚠️ Webhook error: Order #{order_id} not found in database.")

#     # Always return a 200 OK so Stripe knows we received the message
#     return HttpResponse(status=200)

from datetime import timedelta

import stripe
from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import filters, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, Order, OrderItem, Product
from .serializers import (
    CategorySerializer,
    CreateOrderSerializer,
    OrderSerializer,
    ProductSerializer,
)

# Ensure you have your Stripe Secret Key in your settings.py!
stripe.api_key = settings.STRIPE_SECRET_KEY


# 0. Category List (Public)
class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


# 1. Product List (Public)
class ProductListView(generics.ListAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "description"]


# 2. Product Detail (Public)
class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]


# 3. Create Order (Authenticated Users Only)
class CreateOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        address = serializer.validated_data["shipping_address"]
        items_data = serializer.validated_data["items"]

        order = Order.objects.create(user=request.user, shipping_address=address)
        total = 0

        try:
            for item in items_data:
                product = Product.objects.get(id=item["product_id"])
                qty = item["quantity"]

                if product.stock_quantity < qty:
                    raise Exception(f"Not enough stock for {product.name}")

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=qty,
                    price_at_purchase=product.price,
                )

                product.stock_quantity -= qty
                product.save()
                total += product.price * qty

        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

        order.total_price = total
        order.status = "pending"
        order.save()

        return Response(
            {
                "message": "Order created successfully",
                "order_id": order.id,
                "order": OrderSerializer(order).data,
            },
            status=status.HTTP_201_CREATED,
        )


# 4. Stripe Checkout View
class CreateShopStripeCheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": "usd",
                            "unit_amount": int(order.total_price * 100),
                            "product_data": {"name": f"Inkspire Order #{order.id}"},
                        },
                        "quantity": 1,
                    }
                ],
                mode="payment",
                success_url=f"{frontend_url}/shop?payment=success&order_id={order.id}",
                cancel_url=f"{frontend_url}/shop?payment=cancelled",
                metadata={"order_id": order.id},
            )
            return Response({"url": checkout_session.url})
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class ConfirmPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        order.status = "paid"
        order.save()
        return Response({"message": "Order status updated to PAID"}, status=200)


# 5. Order History
class OrderHistoryView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by("-created_at")


# 6. REVENUE STATS VIEW (NEW FILTER LOGIC)
class RevenueStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]  # Only you should see this!

    def get(self, request):
        period = request.query_params.get("period", "all")
        start_param = request.query_params.get("start")
        end_param = request.query_params.get("end")
        now = timezone.now()

        start_date = None
        end_date = None

        if period == "7days":
            start_date = now - timedelta(days=7)
        elif period == "month":
            start_date = now - timedelta(days=30)
        elif period == "year":
            start_date = now - timedelta(days=365)
        elif period == "custom" and start_param:
            try:
                from django.utils.dateparse import parse_date

                parsed_start = parse_date(start_param)
                if parsed_start:
                    start_date = timezone.make_aware(
                        timezone.datetime.combine(
                            parsed_start, timezone.datetime.min.time()
                        )
                    )

                if end_param:
                    parsed_end = parse_date(end_param)
                    if parsed_end:
                        end_date = timezone.make_aware(
                            timezone.datetime.combine(
                                parsed_end, timezone.datetime.max.time()
                            )
                        )
            except Exception:
                pass
        else:
            start_date = None

        queryset = Order.objects.filter(status="paid")
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)

        total_revenue = (
            queryset.aggregate(Sum("total_price"))["total_price__sum"] or 0.00
        )

        return Response(
            {
                "period": period,
                "total_revenue": float(total_revenue),
                "order_count": queryset.count(),
            }
        )


# 7. STRIPE WEBHOOK
@csrf_exempt
def stripe_webhook(request):
    payload = request.body

    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    endpoint_secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponse(status=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = session.get("metadata", {}).get("order_id")

        if order_id:
            try:
                order = Order.objects.get(id=order_id)
                order.status = "paid"
                order.save()
                print(f"🎉 SUCCESS! Order #{order_id} PAID!")
            except Order.DoesNotExist:
                pass

    return HttpResponse(status=200)
