import base64
import json
import re

from openai import OpenAI
from rest_framework import permissions
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .constants import COMPLEXITY_RATES, PLACEMENT_META


class PriceEstimatorView(APIView):
    def post(self, request):
        size = request.data.get("size")
        complexity_key = request.data.get("complexity")
        placement_key = request.data.get("placement")

        base_price = 0
        if size == "small":
            base_price = 80
        elif size == "medium":
            base_price = 150
        elif size == "large":
            base_price = 300
        elif size == "xlarge":
            base_price = 500
        else:
            return Response({"error": "Invalid size"}, status=400)

        # 2. Get Multipliers from Constants
        comp_mult = COMPLEXITY_RATES.get(complexity_key, 1.0)

        place_data = PLACEMENT_META.get(placement_key, {"pain": 1, "multiplier": 1.0})
        place_mult = place_data["multiplier"]
        pain_score = place_data["pain"]

        # 3. Calculate
        total = base_price * comp_mult * place_mult
        final_price = round(total / 10) * 10

        return Response(
            {
                "estimated_price": final_price,
                "pain_level": pain_score,
                "message": f"Estimated: ${final_price}. Pain Level: {pain_score}/10",
            }
        )


client = OpenAI(api_key="KEY-NOT-FOUND")
model_name = "gpt-4o"


class AIPriceEstimatorView(APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image_file = request.FILES.get("image")
        size_desc = request.data.get("size", "medium")

        if not image_file:
            return Response({"error": "No image provided"}, status=400)

        try:
            # 1. Encode image to Base64
            image_data = image_file.read()
            base64_image = base64.b64encode(image_data).decode("utf-8")

            # 2. Ask AI to analyze it
            prompt = f"""
            You are a professional tattoo artist. Analyze this reference image for a tattoo.
            The user wants this tattoo to be roughly: {size_desc}.
            
            Please output a JSON response with exactly these fields:
            1. complexity_score: A number 1-10 (1=Simple Line, 10=Photorealism/Full Color).
            2. estimated_hours: Your best guess on how long this takes (float).
            3. reasoning: A short sentence explaining why (e.g., "Lots of shading requires time").
            4. style: The style of tattoo (e.g. Traditional, Realism).
            """

            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                },
                            },
                        ],
                    }
                ],
                max_tokens=300,
            )

            # 3. Parse AI Response
            ai_content = response.choices[0].message.content

            json_match = re.search(r"\{.*\}", ai_content, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
            else:
                data = json.loads(ai_content)

            # 4. Calculate Price (e.g., $150 per hour)
            SHOP_HOURLY_RATE = 150
            estimated_price = data["estimated_hours"] * SHOP_HOURLY_RATE

            return Response(
                {
                    "ai_analysis": data,
                    "estimated_price": round(estimated_price, 2),
                    "currency": "USD",
                }
            )

        except Exception as e:
            print(e)
            return Response(
                {"error": "AI could not analyze image. Try again."}, status=500
            )
