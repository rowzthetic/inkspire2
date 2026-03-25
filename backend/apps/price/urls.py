from django.urls import path

from .views import AIPriceEstimatorView, PriceEstimatorView

urlpatterns = [
    path(
        "estimate-price/",
        PriceEstimatorView.as_view(),
        name="estimate-price",
    ),
    path(
        "estimate-ai/",
        AIPriceEstimatorView.as_view(),
        name="ai-estimator",
    ),
]
