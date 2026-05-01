import base64
import json
import os

import requests
from openai import OpenAI
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


# No changes needed here, assuming OpenAI is installed.
class TattooPreviewView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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
            prompt = request.data.get("prompt")
            if not prompt:
                return Response(
                    {"error": "Prompt required for generation."}, status=400
                )

            try:
                # INTEGRATED DIRECT TATTOO DESIGN GENERATION
                messages = [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": (
                                    f"Please generate a photorealistic, high-contrast tattoo design based on this prompt: '{prompt}'. "
                                    "The design should be presented as a clean tattoo flash (black/grey or vibrant color as requested) "
                                    "on a plain white or neutral background, perfectly suitable for a tattoo artist to use as a stencil. "
                                    "Ensure the lines are sharp and the artistic detail is elite."
                                ),
                            },
                        ],
                    }
                ]

                # Make a call to Gemini 2.5 Flash for image generation
                response = client.chat.completions.create(
                    model="google/gemini-2.5-flash-image",
                    messages=messages,
                    extra_body={
                        "modalities": ["image", "text"],
                    },
                )

                # Extract and return the generated image URL
                message = response.choices[0].message
                images = getattr(message, "images", None)
                if not images and hasattr(message, "__dict__"):
                    images = message.__dict__.get("images")

                if images:
                    image_data_url = images[0]["image_url"]["url"]
                    return Response(
                        {
                            "image_url": image_data_url,
                            "message": "Tattoo design generation successful.",
                        },
                        status=status.HTTP_200_OK,
                    )
                else:
                    raise ValueError("Failed to generate design image.")

            except Exception as e:
                return Response({"error": str(e)}, status=500)

        elif mode == "stencil":
            # Extract the raw design to be converted to a stencil
            tattoo_file = request.FILES.get("tattoo_image")
            if not tattoo_file:
                return Response(
                    {"error": "Image required for stencil conversion."}, status=400
                )

            tattoo_b64 = self.encode_image(tattoo_file)

            try:
                messages = [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": (
                                    "Please convert the provided tattoo design into a professional, high-contrast "
                                    "black and white thermal stencil outline. Instructions: 1. Remove all shading, "
                                    "colors, and textures. 2. Extract only the core line-work. 3. Output as pure "
                                    "black ink on a solid white background. 4. Preserve the exact proportions and "
                                    "intricate detail of the original design. The result must be ready for printing."
                                ),
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

                response = client.chat.completions.create(
                    model="google/gemini-2.5-flash-image",
                    messages=messages,
                    extra_body={"modalities": ["image", "text"]},
                )

                message = response.choices[0].message
                images = getattr(message, "images", None)
                if not images and hasattr(message, "__dict__"):
                    images = message.__dict__.get("images")

                if images:
                    return Response(
                        {
                            "image_url": images[0]["image_url"]["url"],
                            "message": "Stencil conversion successful.",
                        },
                        status=status.HTTP_200_OK,
                    )
                else:
                    raise ValueError(
                        "Failed to extract stencil image from AI response."
                    )

            except Exception as e:
                return Response({"error": str(e)}, status=500)

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


class TattooLibraryAIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        name = request.data.get("name")
        if not name:
            return Response({"error": "Tattoo name is required."}, status=400)

        api_key = os.getenv("VITE_OPENROUTER_API_KEY") or os.getenv(
            "OPENROUTER_API_KEY"
        )
        if not api_key:
            return Response({"error": "AI API key not configured."}, status=500)

        client = OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
        )

        prompt = (
            f"You are a world-class tattoo historian and symbolism expert. "
            f"The user wants to know about the '{name}' tattoo. "
            f"Generate a deep analysis in a strict JSON format. "
            f"The response MUST ONLY be the JSON object with the following fields:\n"
            f"- name: the tattoo name\n"
            f"- culture: the primary cultural origin (e.g. 'Greek Mythology', 'Polynesian', etc.)\n"
            f"- emoji: a single relevant emoji\n"
            f"- color: a suitable brand hex color representing the symbol (e.g. #C9A84C for gold)\n"
            f"- tags: 6 lowercase descriptive tags\n"
            f"- placements: 4 lowercase body part placements (from: chest, back, upperarm, forearm, thigh, calf, shoulder, ankle, sleeve, wrist)\n"
            f"- sensitive: boolean (true if the symbol is culturally protected/sacred)\n"
            f"- history: a 2-sentence historical background\n"
            f"- meaning: a powerful 2-sentence poetic meaning\n"
            f"- bestPlacement: a 1-sentence expert placement recommendation.\n"
            f"Ensure the JSON is valid and contains no extra text."
        )

        try:
            response = client.chat.completions.create(
                model="google/gemini-2.0-flash-001",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            # Clean up potential markdown formatting
            content = content.replace("```json", "").replace("```", "").strip()

            data = json.loads(content)
            # Add a mock ID for frontend
            data["id"] = int(base64.b64encode(name.encode()).hex()[:6], 16)

            return Response(data, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
