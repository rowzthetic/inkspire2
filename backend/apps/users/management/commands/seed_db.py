from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from apps.shop.models import Category, Product
from apps.users.models import WorkSchedule
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = "Seed the database with realistic sample users, artists, shop categories, and products"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting database seeding..."))

        # -------------------------------------------------------------
        # 1. Seed Categories & Products (Shop App)
        # -------------------------------------------------------------
        self.stdout.write("Seeding Shop Categories & Products...")
        
        categories_data = [
            {
                "name": "Aftercare",
                "description": "Keep your new ink clean, hydrated, and healing beautifully."
            },
            {
                "name": "Apparel",
                "description": "High-quality Inkspire streetwear designed by top tattoo artists."
            },
            {
                "name": "Art Prints",
                "description": "Limited-edition giclée prints of original art from our resident artists."
            }
        ]

        categories = {}
        for cat_info in categories_data:
            cat, created = Category.objects.get_or_create(
                slug=slugify(cat_info["name"]),
                defaults={
                    "name": cat_info["name"],
                    "description": cat_info["description"]
                }
            )
            categories[cat.name] = cat
            if created:
                self.stdout.write(self.style.SUCCESS(f"  Created Category: {cat.name}"))

        products_data = [
            # Aftercare Products
            {
                "name": "Inkspire Healing Balm",
                "description": "Organic, vegan-friendly tattoo aftercare balm loaded with vitamins to soothe fresh skin and enhance color longevity.",
                "price": Decimal("18.99"),
                "category_name": "Aftercare",
                "stock_quantity": 150
            },
            {
                "name": "Soothing Foam Cleanser",
                "description": "Antimicrobial and alcohol-free wash designed to gently cleanse fresh tattoos without drying them out.",
                "price": Decimal("12.50"),
                "category_name": "Aftercare",
                "stock_quantity": 100
            },
            # Apparel
            {
                "name": "Neo-Traditional Tiger Tee",
                "description": "Heavyweight 100% organic cotton oversized tee featuring a stunning front illustration of a Neo-Traditional tiger design.",
                "price": Decimal("35.00"),
                "category_name": "Apparel",
                "stock_quantity": 40
            },
            {
                "name": "Classic Logo Pullover",
                "description": "Ultra-soft black hoodie featuring the minimalist white Inkspire emblem embroidered on the chest.",
                "price": Decimal("55.00"),
                "category_name": "Apparel",
                "stock_quantity": 25
            },
            # Art Prints
            {
                "name": "Koi Fish Reflection Giclée Print",
                "description": "Signed and numbered 12x18 limited print of watercolor Japanese Koi. Only 100 copies available.",
                "price": Decimal("45.00"),
                "category_name": "Art Prints",
                "stock_quantity": 15
            },
            {
                "name": "Dark Art Skull Canvas",
                "description": "16x24 textured matte print of a dotwork biomechanical skull by our artist Alex Black.",
                "price": Decimal("60.00"),
                "category_name": "Art Prints",
                "stock_quantity": 10
            }
        ]

        for prod_info in products_data:
            cat_obj = categories.get(prod_info["category_name"])
            prod, created = Product.objects.get_or_create(
                name=prod_info["name"],
                defaults={
                    "description": prod_info["description"],
                    "price": prod_info["price"],
                    "category": cat_obj,
                    "stock_quantity": prod_info["stock_quantity"],
                    "is_active": True
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"  Created Product: {prod.name}"))

        # -------------------------------------------------------------
        # 2. Seed Sample Customers & Artists (Users App)
        # -------------------------------------------------------------
        self.stdout.write("Seeding Sample Users & Artists...")

        # Regular Customers
        customers_data = [
            {
                "username": "sarah_inked",
                "email": "sarah@example.com",
                "password": "customerpassword123",
                "phone_number": "+1234567890"
            },
            {
                "username": "marcus_tats",
                "email": "marcus@example.com",
                "password": "customerpassword123",
                "phone_number": "+1987654321"
            }
        ]

        for u_data in customers_data:
            user, created = User.objects.get_or_create(
                username=u_data["username"],
                defaults={
                    "email": u_data["email"],
                    "phone_number": u_data["phone_number"],
                    "is_artist": False,
                    "is_active": True
                }
            )
            if created:
                user.set_password(u_data["password"])
                user.save()
                self.stdout.write(self.style.SUCCESS(f"  Created Customer: {user.username}"))

        # Active Artists
        artists_data = [
            {
                "username": "alex_blackwork",
                "email": "alex@example.com",
                "password": "artistpassword123",
                "phone_number": "+15551234",
                "bio": "Specializing in bold blackwork, geometric designs, and intricate dotwork mandalas with 8 years of custom tattooing experience.",
                "styles": "Blackwork, Geometric, Dotwork",
                "city": "Los Angeles",
                "shop_name": "Sacred Geometry Tattoo",
                "instagram_link": "https://instagram.com/alex_blackwork_tattoo"
            },
            {
                "username": "elena_traditional",
                "email": "elena@example.com",
                "password": "artistpassword123",
                "phone_number": "+15554321",
                "bio": "Passionate about American Traditional and Neo-Traditional styles. Bold lines, bright colors, and timeless classic designs.",
                "styles": "Traditional, Neo-Traditional",
                "city": "New York",
                "shop_name": "Old School Parlor",
                "instagram_link": "https://instagram.com/elena_traditional"
            }
        ]

        for a_data in artists_data:
            artist, created = User.objects.get_or_create(
                username=a_data["username"],
                defaults={
                    "email": a_data["email"],
                    "phone_number": a_data["phone_number"],
                    "bio": a_data["bio"],
                    "styles": a_data["styles"],
                    "city": a_data["city"],
                    "shop_name": a_data["shop_name"],
                    "instagram_link": a_data["instagram_link"],
                    "is_artist": True,
                    "is_active": True
                }
            )
            if created:
                artist.set_password(a_data["password"])
                artist.save()
                
                # Seed work schedules for the new active artist
                for i in range(7):
                    # Monday (0) to Friday (4) are active, weekends are off by default
                    is_active_day = i < 5
                    WorkSchedule.objects.get_or_create(
                        artist=artist,
                        day_of_week=i,
                        defaults={
                            "is_active": is_active_day,
                            "start_time": "09:00",
                            "end_time": "17:00"
                        }
                    )
                self.stdout.write(self.style.SUCCESS(f"  Created Artist + Schedule: {artist.username}"))

        # Pending Approval Artist
        pending_artist, created = User.objects.get_or_create(
            username="lucas_realism",
            defaults={
                "email": "lucas@example.com",
                "phone_number": "+15559876",
                "bio": "Aspiring realism tattoo artist seeking to showcase ultra-realistic black and grey portraits and nature scenes.",
                "styles": "Realism, Black & Grey",
                "city": "Chicago",
                "shop_name": "Windy City Ink",
                "instagram_link": "https://instagram.com/lucas_realism_art",
                "is_artist": True,
                "is_active": False  # Pending admin approval!
            }
        )
        if created:
            pending_artist.set_password("artistpassword123")
            pending_artist.save()
            
            # Setup schedules
            for i in range(7):
                WorkSchedule.objects.get_or_create(
                    artist=pending_artist,
                    day_of_week=i,
                    defaults={
                        "is_active": False
                    }
                )
            self.stdout.write(self.style.SUCCESS(f"  Created Pending Artist: {pending_artist.username}"))

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
