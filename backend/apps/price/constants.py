# --- 1. COMPLEXITY LEVELS ---
# Format: (Database Key, Human Readable Name)
COMPLEXITY_CHOICES = (
    ("simple", "Simple (Line Work / Text)"),
    ("moderate", "Moderate (Shading / Geometric)"),
    ("complex", "Complex (Color / Neo-Traditional)"),
    ("realism", "Realism / Portrait"),
)

# Metadata: Multipliers for Price Calculation
COMPLEXITY_RATES = {
    "simple": 1.0,
    "moderate": 1.3,
    "complex": 1.6,
    "realism": 2.0,  # Realism is usually double the effort/skill
}

# --- 2. PLACEMENT & PAIN LEVELS ---
# Format: (Database Key, Display Name)
PLACEMENT_CHOICES = (
    ("arm_outer", "Outer Arm / Shoulder"),
    ("forearm", "Inner Forearm"),
    ("thigh", "Thigh"),
    ("calf", "Calf"),
    ("chest", "Chest"),
    ("back", "Back"),
    ("neck", "Neck"),
    ("ribs", "Ribs / Side"),
    ("stomach", "Stomach"),
    ("hands", "Hands / Fingers"),
    ("feet", "Feet / Ankle"),
    ("spine", "Spine"),
)

# Metadata: Pain Score (1-10) and Price Multiplier (Harder spots cost more)
PLACEMENT_META = {
    "arm_outer": {"pain": 2, "multiplier": 1.0},
    "forearm": {"pain": 3, "multiplier": 1.0},
    "thigh": {"pain": 4, "multiplier": 1.0},
    "calf": {"pain": 4, "multiplier": 1.0},
    "upper_back": {"pain": 5, "multiplier": 1.1},
    "chest": {"pain": 6, "multiplier": 1.2},
    "hands": {"pain": 7, "multiplier": 1.3},  # Hard to tattoo skin
    "neck": {"pain": 8, "multiplier": 1.4},  # Risky spot
    "feet": {"pain": 8, "multiplier": 1.3},
    "spine": {"pain": 9, "multiplier": 1.4},
    "ribs": {"pain": 9, "multiplier": 1.5},  # Very difficult + breathing
    "stomach": {"pain": 9, "multiplier": 1.5},
}
