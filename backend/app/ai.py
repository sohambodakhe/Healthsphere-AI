from .config import settings

SYSTEM = (
    "You are HealthSphere AI, a supportive general wellness information assistant. "
    "Do not diagnose, prescribe, recommend medication changes, or claim to replace a clinician. "
    "Do not recommend restrictive diets, calorie deficits, rapid weight change, or unsafe exercise. "
    "Be especially cautious for minors: focus on balanced meals, enjoyable movement, sleep and support; "
    "do not give weight-loss targets or calorie targets. Encourage a trusted adult and qualified clinician "
    "for personal medical concerns. For possible emergencies, tell the user to contact local emergency services."
)


def bmi_meal_variation(bmi: float) -> str:
    seed = int(round(bmi * 10))
    breakfasts = [
        "overnight oats with berries, yogurt, and seeds",
        "whole-grain toast with eggs and sliced tomato",
        "warm porridge with banana and nut or seed butter",
        "plain yogurt with fruit and a small granola topping",
        "a breakfast wrap with beans, egg, and greens",
        "cottage cheese or a plant-based alternative with fruit and toast",
        "savory oats with spinach and a protein you enjoy",
        "whole-grain cereal with milk or a fortified alternative and fruit",
        "whole-grain pancakes with fruit and yogurt",
        "scrambled tofu with toast and sliced peppers",
        "a banana and yogurt smoothie with oats",
        "poached eggs or beans over roasted tomatoes",
        "chia pudding with fruit and a handful of cereal",
        "a breakfast quesadilla with beans and vegetables",
        "muesli with milk or a fortified alternative and apple",
        "a baked potato with egg or beans and spinach",
    ]
    lunches = [
        "chickpea and vegetable grain bowl with lemon dressing",
        "lentil soup with whole-grain bread and side salad",
        "rice bowl with tofu, vegetables, and sesame dressing",
        "tuna or bean salad sandwich with crunchy vegetables",
        "roasted vegetable and hummus wrap with fruit",
        "chicken or tempeh with quinoa and mixed vegetables",
        "bean and avocado tacos with cabbage slaw",
        "pasta salad with vegetables and beans or cheese",
        "baked falafel with couscous and chopped vegetables",
        "a jacket potato topped with beans and a side salad",
        "soba noodles with edamame and mixed vegetables",
        "a tomato and white-bean soup with toast",
        "a spinach and cheese or tofu frittata with bread",
        "a brown rice bowl with salmon or beans and vegetables",
        "a vegetable and lentil shepherd's pie with greens",
        "a whole-grain pita with grilled vegetables and yogurt dip",
    ]
    snacks = [
        "apple slices with yogurt",
        "carrots and hummus",
        "a pear with a handful of nuts or seeds",
        "whole-grain crackers with cheese or a plant-based alternative",
        "banana with nut or seed butter",
        "berries with plain yogurt",
        "roasted chickpeas and fruit",
        "toast with avocado",
        "cucumber with a yogurt or bean dip",
        "a small bowl of cereal with milk or a fortified alternative",
        "orange slices with a few nuts or seeds",
        "edamame with fruit",
        "a boiled egg and whole-grain crackers",
        "a fruit smoothie with yogurt or a plant-based alternative",
        "dates with tahini or seed butter",
        "vegetable sticks with guacamole",
    ]
    dinners = [
        "baked fish or tofu with potatoes and green vegetables",
        "bean chili with rice and a side of vegetables",
        "chicken or lentil curry with rice and vegetables",
        "whole-grain pasta with tomato sauce, vegetables, and beans",
        "vegetable stir-fry with tofu or egg and noodles",
        "baked potato with beans, yogurt, or a plant-based topping and salad",
        "vegetable soup with a cheese or bean toastie",
        "grain bowl with roasted vegetables and a protein you enjoy",
        "a vegetable omelet or chickpea pancake with potatoes",
        "whole-grain flatbread with vegetables and lentils",
        "a mild bean and vegetable stew with bread",
        "rice noodles with vegetables and egg or tofu",
        "a baked sweet potato with black beans and salsa",
        "barley with roasted vegetables and chicken or chickpeas",
        "a salmon or tofu tray bake with carrots and rice",
        "vegetable lasagna with a side of greens",
    ]
    breakfast = breakfasts[seed & 15]
    lunch = lunches[(seed >> 4) & 15]
    snack = snacks[(seed >> 8) & 15]
    dinner = dinners[(seed >> 12) & 15]
    return (
        f"Balanced menu variation for BMI screening value {bmi:.1f} (variety only, not a medical prescription):\n"
        f"Breakfast: {breakfast}.\nLunch: {lunch}.\n"
        f"Snack: {snack}.\n"
        f"Dinner: {dinner}.\n"
        "Choose suitable substitutions for allergies, dietary needs, budget, and appetite. BMI alone does not determine nutrition needs."
    )


def _local_response(prompt: str, profile: dict | None = None) -> str:
    text = prompt.lower()
    profile = profile or {}
    age = profile.get("age")
    minor = isinstance(age, (int, float)) and age < 18
    allergies = str(profile.get("allergies") or "").strip()
    restrictions = str(profile.get("restrictions") or "").strip()
    diet = str(profile.get("diet") or profile.get("dietary_preference") or "").replace("_", " ")
    equipment = str(profile.get("equipment") or "bodyweight").replace("_", " ")
    activity_level = str(profile.get("activity") or profile.get("activity_level") or "moderate").replace("_", " ")
    experience = str(profile.get("experience") or profile.get("experience_level") or "beginner").replace("_", " ")

    if any(term in text for term in ("emergency", "can't breathe", "cannot breathe", "chest pain", "suicid")):
        return "This may need urgent help. Contact your local emergency services now, or ask someone nearby to help you."

    if any(term in text for term in ("diagnos", "symptom", "medication", "medicine", "injury", "pain", "sick")):
        return (
            "I can't assess symptoms or advise on treatment. Please contact a qualified healthcare professional, "
            "especially if this is new, worsening, or affecting your daily activities. For severe or sudden symptoms, "
            "seek urgent medical care. I can still help with general wellness habits while you get appropriate advice."
        )

    if any(term in text for term in ("meal", "diet plan", "nutrition", "what should i eat", "balanced food")):
        note = f" Your profile lists {diet} as your preference." if diet and diet != "no preference" else ""
        goal = str(profile.get("goal") or "general wellness").replace("_", " ")
        bmi = profile.get("bmi")
        bmi_note = f" Your BMI screening value is {bmi}; it is a limited screening measure, so this plan focuses on balanced nourishment rather than BMI-driven weight change." if bmi is not None else ""
        menu = bmi_meal_variation(float(bmi)) if bmi is not None else ""
        note += f" Recommendations are framed around your {goal} goal and {activity_level} activity level.{bmi_note}"
        if allergies:
            note += f" Please avoid your listed allergy: {allergies}; check labels and cross-contact carefully."
        if restrictions:
            note += f" Keep your listed restriction in mind: {restrictions}."
        age_note = " Keep meals varied and nourishing; this plan is not for weight change." if minor else " Treat this as flexible meal inspiration, not a prescription."
        goal_guidance = {
            "build strength": "Include a satisfying protein source with meals and enough varied foods to support regular activity.",
            "improve endurance": "Include familiar carbohydrate-rich foods such as grains, fruit, or potatoes alongside protein and vegetables.",
            "increase mobility": "Keep the pattern varied and practical, with regular meals that support energy for comfortable movement.",
            "feel more energetic": "Choose regular, satisfying meals and snacks that fit your schedule and help you feel comfortably fueled.",
        }.get(goal, "Aim for a varied pattern of satisfying meals with grains or starchy foods, protein, and colorful produce.")
        return (
            f"{menu}\n\n"
            f"{note} {goal_guidance} {age_note} Choose foods that fit your culture, budget, appetite, and any clinician-provided guidance."
        )

    if any(term in text for term in ("workout", "exercise", "movement", "physical activity")):
        days = profile.get("days", profile.get("workout_days", 3))
        try:
            days = max(1, min(int(days), 7))
        except (TypeError, ValueError):
            days = 3
        activity = "gentle, enjoyable movement" if minor else "comfortable, moderate movement"
        return (
            f"Here is a flexible {days}-day movement outline for a {activity_level} activity level and {experience} experience, using {equipment}:\n\n"
            f"**Each session:** Start with 5 minutes of easy warm-up, then do {activity} such as walking, "
            "cycling, or comfortable bodyweight movements for 15-25 minutes. Finish with a few minutes of easy movement.\n"
            "**Weekly rhythm:** Spread sessions across the week and leave a rest or light-activity day between harder efforts. "
            "If strength work feels comfortable, try 1-2 easy sets of chair squats, wall push-ups, and hip bridges.\n"
            "**Adjust:** Start shorter if you are new, rest as needed, and stop if you feel pain, dizziness, or unusual shortness of breath."
        )

    if any(term in text for term in ("sleep", "bedtime", "insomnia", "tired")):
        return (
            "A low-pressure place to start is to keep a fairly regular wake time, get daylight early in the day, "
            "and make the last 30 minutes before bed calmer and dimmer. Keep caffeine earlier if it affects your sleep. "
            "If sleep problems persist or are affecting daily life, discuss them with a healthcare professional."
        )

    if any(term in text for term in ("stress", "anxious", "anxiety", "overwhelmed", "relax")):
        return (
            "Try one small reset: put both feet on the floor, relax your shoulders, and take a few slow, comfortable breaths. "
            "Then choose one manageable next step, such as a short walk, a glass of water, or contacting someone you trust. "
            "If distress feels intense or ongoing, reaching out to a qualified professional can help."
        )

    if any(term in text for term in ("habit", "motivat", "consistent", "routine", "goal")):
        return (
            "Make the next step small enough to repeat: choose one action that takes a few minutes, connect it to an existing "
            "daily cue, and track whether you showed up rather than aiming for perfection. What habit would you like to make easier?"
        )

    return (
        "I can help with general ideas for balanced meals, enjoyable movement, sleep, stress, and building everyday habits. "
        "Tell me what you are working on and any preferences or practical limits, and I will suggest a few realistic next steps."
    )


def generate(prompt: str, profile: dict | None = None) -> tuple[str, bool]:
    context = f"\nRelevant user preferences (use only when helpful): {profile}" if profile else ""
    provider = settings.ai_provider.lower()
    if provider == "openai" and settings.openai_api_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.openai_api_key)
            response = client.chat.completions.create(
                model=settings.openai_model,
                messages=[{"role": "system", "content": SYSTEM + context},
                          {"role": "user", "content": prompt}],
                temperature=0.5,
            )
            answer = response.choices[0].message.content
            if answer:
                return answer, False
        except Exception:
            pass
    if provider == "gemini" and settings.gemini_api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.gemini_api_key)
            model = genai.GenerativeModel(settings.gemini_model, system_instruction=SYSTEM + context)
            response = model.generate_content(prompt)
            if response.text:
                return response.text, False
        except Exception:
            pass
    return _local_response(prompt, profile), True
