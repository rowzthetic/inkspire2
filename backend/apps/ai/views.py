import base64
import json
import os
import re  # Note: re is no longer used in the simplified view but left for completeness with original code structure.

import requests
from openai import OpenAI
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


# No changes needed here, assuming OpenAI is installed.
class TattooPreviewView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def get_client(self) -> OpenAI:
        # Changed env var to avoid using a VITE_ prefixed key on the backend
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            # For backward compatibility with the user's setup, but adding a check
            api_key = os.getenv("VITE_OPENROUTER_API_KEY")
            if not api_key:
                raise ValueError(
                    "OPENROUTER_API_KEY (or VITE_OPENROUTER_API_KEY) is not set"
                )
            # Log a warning to encourage moving to a server-side key
            # In a real Django project, use logging, not print.
            print(
                "Warning: VITE_OPENROUTER_API_KEY used on the backend. This is not recommended. Move to a server-side OPENROUTER_API_KEY."
            )

        return OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
        )

    def encode_image(self, uploaded_file) -> str:
        # Re-read from the start to ensure all data is captured if the file pointer moved.
        uploaded_file.seek(0)
        return base64.b64encode(uploaded_file.read()).decode("utf-8")

    # Functions extract_visual_prompt and generate_image are REMOVED entirely.
    # The logic is integrated directly into the POST request for a simplified, more reliable workflow.

    def post(self, request):
        mode = request.data.get("mode", "generate")

        try:
            client = self.get_client()
        except ValueError as e:
            return Response({"error": str(e)}, status=500)

        # ------------------------------------------------------------------ #
        #  PREVIEW MODE — blend a tattoo design onto a skin photo            #
        # ------------------------------------------------------------------ #
        if mode == "preview":
            skin_file = request.FILES.get("skin_image")
            tattoo_file = request.FILES.get("tattoo_image")

            if not skin_file or not tattoo_file:
                return Response({"error": "Both images required."}, status=400)

            # Encode both images for image-to-image processing
            skin_b64 = self.encode_image(skin_file)
            tattoo_b64 = self.encode_image(tattoo_file)

            try:
                # INTEGRATED DIRECT BLENDING CALL TO GEMINI (no GPT-4o analysis)

                # Formulate the multi-modal message structure with both images and text prompt
                messages = [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": (
                                    "I am providing two images. First is a photograph of a person's skin "
                                    "on a body part. Second is a tattoo design. Please generate a single "
                                    "photorealistic image that perfectly blends the tattoo design from the "
                                    "second image onto the skin from the first image. The blended tattoo must "
                                    "respect anatomical curvature and skin texture. CRUCIAL: The final image "
                                    "must preserve the EXACT original lighting, shadows, and environment of the "
                                    "first skin photograph. The resulting tattoo should appear as if it is "
                                    "naturally settled into the skin, with realistic depth, and not just "
                                    "overlaid."
                                ),
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{skin_b64}"
                                },
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{tattoo_b64}"
                                },
                            },
                        ],
                    }
                ]

                # Make a single call to Gemini 2.5 Flash Image for blending
                response = client.chat.completions.create(
                    model="google/gemini-2.5-flash-image",
                    messages=messages,
                    extra_body={
                        "modalities": ["image", "text"],
                        # "image_config": {"aspect_ratio": "1:1"}, # If needed, but let model infer from skin image
                    },
                )

                # Process the response to extract the generated image URL (maintained robust checks from original code)
                message = response.choices[0].message
                images = getattr(message, "images", None)

                if not images and hasattr(message, "__dict__"):
                    images = message.__dict__.get("images")
                if not images and isinstance(message, dict):
                    images = message.get("images")

                if images:
                    image_data_url = images[0]["image_url"]["url"]
                    return Response(
                        {
                            "image_url": image_data_url,
                            "message": "Tattoo blending successful.",
                        },
                        status=status.HTTP_200_OK,
                    )
                else:
                    raise ValueError(
                        f"No images field in response. Message content: {getattr(message, 'content', 'N/A')[:200]}"
                    )

            except ValueError as e:
                return Response({"error": str(e)}, status=502)
            except Exception as e:
                # Catch-all for other integration or network issues
                return Response({"error": str(e)}, status=500)

        elif mode == "generate":
            return Response(
                {"error": "Generate mode not yet implemented."},
                status=status.HTTP_501_NOT_IMPLEMENTED,
            )

        return Response({"error": f"Unknown mode: '{mode}'"}, status=400)


class TattooConsultantView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        messages = request.data.get("messages", [])
        if not messages:
            return Response(
                {"error": "Messages payload is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        api_key = os.getenv("VITE_OPENROUTER_API_KEY") or os.getenv(
            "OPENROUTER_API_KEY"
        )
        if not api_key:
            return Response(
                {"error": "OpenRouter API key not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": os.getenv("FRONTEND_URL", "http://localhost:5173"),
            "X-Title": "Inkspire Tattoo Platform",
        }

        # System prompt
        system_msg = {
            "role": "system",
            "content": (
                "You are the Inkspire Symbolism Encyclopedia. When a user searches for a term, "
                "provide a structured 'Knowledge Card' including: 1. Core Meaning, 2. Cultural History, "
                "and 3. Placement Suggestions. Keep it professional and mystical."
            ),
        }

        # Prepare payload for Openrouter
        payload = {
            "model": "google/gemini-2.0-flash-001",
            "messages": [system_msg] + messages,
        }

        try:
            api_resp = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30,
            )
            resp_text = api_resp.text

            try:
                resp_data = json.loads(resp_text)
            except json.JSONDecodeError:
                return Response(
                    {
                        "error": "Failed to parse API response as JSON.",
                        "raw_response": resp_text,
                    },
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            if api_resp.status_code != 200:
                err_msg = resp_data.get("error", {}).get("message", "Unknown API error")
                return Response(
                    {"error": f"API Error ({api_resp.status_code}): {err_msg}"},
                    status=api_resp.status_code,
                )

            choices = resp_data.get("choices", [])
            if not choices:
                return Response(
                    {"error": "Empty response from OpenRouter."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            message_content = choices[0].get("message", {}).get("content", "")
            return Response({"response": message_content}, status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as e:
            return Response(
                {"error": f"Failed to connect to AI service: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
