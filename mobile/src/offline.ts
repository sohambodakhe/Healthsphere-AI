import AsyncStorage from "@react-native-async-storage/async-storage";

const STORE_KEY = "healthsphere_offline_data_v1";

type OfflineStore = {
  users: Record<string, { id: string; name: string; email: string; password: string }>;
  activeEmail: string | null;
  profile: Record<string, any>;
  weights: Array<{ weight_kg: number; bmi: number; recorded_at: string }>;
  activities: Array<{ event_key: string; xp: number; event_date: string }>;
  chats: Array<{ role: string; content: string; created_at: string }>;
  plans: Record<string, string>;
  cachedGamification: any;
};

const initialStore = (): OfflineStore => ({
  users: {},
  activeEmail: null,
  profile: {
    age: 18,
    height_cm: 170,
    weight_kg: 65,
    goal: "general_wellness",
    activity_level: "moderate",
    dietary_preference: "no_preference",
    allergies: "",
    restrictions: "",
    experience_level: "beginner",
    equipment: "bodyweight",
    workout_days: 3,
  },
  weights: [],
  activities: [],
  chats: [],
  plans: {},
  cachedGamification: null,
});

async function load(): Promise<OfflineStore> {
  const raw = await AsyncStorage.getItem(STORE_KEY);
  if (!raw) return initialStore();
  try {
    return { ...initialStore(), ...JSON.parse(raw) };
  } catch {
    return initialStore();
  }
}

async function save(store: OfflineStore) {
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function bmi(weight: number, heightCm: number) {
  return Math.round((weight / ((heightCm / 100) ** 2)) * 10) / 10;
}

function bmiMealVariation(value: number) {
  const seed = Math.round(value * 10);
  const breakfasts = ["overnight oats with berries, yogurt, and seeds", "whole-grain toast with eggs and sliced tomato", "warm porridge with banana and nut or seed butter", "plain yogurt with fruit and a small granola topping", "a breakfast wrap with beans, egg, and greens", "cottage cheese or a plant-based alternative with fruit and toast", "savory oats with spinach and a protein you enjoy", "whole-grain cereal with milk or a fortified alternative and fruit", "whole-grain pancakes with fruit and yogurt", "scrambled tofu with toast and sliced peppers", "a banana and yogurt smoothie with oats", "poached eggs or beans over roasted tomatoes", "chia pudding with fruit and a handful of cereal", "a breakfast quesadilla with beans and vegetables", "muesli with milk or a fortified alternative and apple", "a baked potato with egg or beans and spinach"];
  const lunches = ["chickpea and vegetable grain bowl with lemon dressing", "lentil soup with whole-grain bread and side salad", "rice bowl with tofu, vegetables, and sesame dressing", "tuna or bean salad sandwich with crunchy vegetables", "roasted vegetable and hummus wrap with fruit", "chicken or tempeh with quinoa and mixed vegetables", "bean and avocado tacos with cabbage slaw", "pasta salad with vegetables and beans or cheese", "baked falafel with couscous and chopped vegetables", "a jacket potato topped with beans and a side salad", "soba noodles with edamame and mixed vegetables", "a tomato and white-bean soup with toast", "a spinach and cheese or tofu frittata with bread", "a brown rice bowl with salmon or beans and vegetables", "a vegetable and lentil shepherd's pie with greens", "a whole-grain pita with grilled vegetables and yogurt dip"];
  const snacks = ["apple slices with yogurt", "carrots and hummus", "a pear with a handful of nuts or seeds", "whole-grain crackers with cheese or a plant-based alternative", "banana with nut or seed butter", "berries with plain yogurt", "roasted chickpeas and fruit", "toast with avocado", "cucumber with a yogurt or bean dip", "a small bowl of cereal with milk or a fortified alternative", "orange slices with a few nuts or seeds", "edamame with fruit", "a boiled egg and whole-grain crackers", "a fruit smoothie with yogurt or a plant-based alternative", "dates with tahini or seed butter", "vegetable sticks with guacamole"];
  const dinners = ["baked fish or tofu with potatoes and green vegetables", "bean chili with rice and a side of vegetables", "chicken or lentil curry with rice and vegetables", "whole-grain pasta with tomato sauce, vegetables, and beans", "vegetable stir-fry with tofu or egg and noodles", "baked potato with beans, yogurt, or a plant-based topping and salad", "vegetable soup with a cheese or bean toastie", "grain bowl with roasted vegetables and a protein you enjoy", "a vegetable omelet or chickpea pancake with potatoes", "whole-grain flatbread with vegetables and lentils", "a mild bean and vegetable stew with bread", "rice noodles with vegetables and egg or tofu", "a baked sweet potato with black beans and salsa", "barley with roasted vegetables and chicken or chickpeas", "a salmon or tofu tray bake with carrots and rice", "vegetable lasagna with a side of greens"];
  return `Balanced menu variation for BMI screening value ${value.toFixed(1)} (variety only, not a medical prescription):\nBreakfast: ${breakfasts[seed & 15]}.\nLunch: ${lunches[(seed >> 4) & 15]}.\nSnack: ${snacks[(seed >> 8) & 15]}.\nDinner: ${dinners[(seed >> 12) & 15]}.\nChoose suitable substitutions for allergies, dietary needs, budget, and appetite. BMI alone does not determine nutrition needs.`;
}

function localReply(message: string, profile: Record<string, any>) {
  const text = message.toLowerCase();
  if (/emergency|can't breathe|cannot breathe|chest pain|suicid/.test(text)) {
    return "This may need urgent help. Contact your local emergency services now, or ask someone nearby to help you.";
  }
  if (/symptom|diagnos|medication|medicine|injury|pain|sick/.test(text)) {
    return "I can't assess symptoms or advise on treatment. Please contact a qualified healthcare professional. For severe or sudden symptoms, seek urgent medical care.";
  }
  if (/meal|food|nutrition|eat|diet/.test(text)) {
    const diet = String(profile.dietary_preference || "no preference").replaceAll("_", " ");
    const goal = String(profile.goal || "general wellness").replaceAll("_", " ");
    const activity = String(profile.activity_level || "moderate").replaceAll("_", " ");
    const bmiValue = bmi(Number(profile.weight_kg), Number(profile.height_cm));
    const goalGuidance: Record<string, string> = {
      build_strength: "Include a satisfying protein source with meals and varied foods to support regular activity.",
      improve_endurance: "Include familiar carbohydrate-rich foods such as grains, fruit, or potatoes alongside protein and vegetables.",
      increase_mobility: "Choose a varied and practical meal pattern that supports energy for comfortable movement.",
      more_energy: "Choose regular, satisfying meals and snacks that fit your schedule and help you feel comfortably fueled.",
    };
    const allergy = profile.allergies ? ` Avoid your listed allergy (${profile.allergies}) and check labels carefully.` : "";
    const minor = Number(profile.age) < 18;
    return `${bmiMealVariation(bmiValue)}\n\nPreference noted: ${diet}. Recommendations reflect your ${goal} goal and ${activity} activity level. ${goalGuidance[profile.goal] || "Aim for varied, satisfying meals with grains or starchy foods, protein, and colorful produce."} Your BMI is used only to vary the menu; it is not a measure of nutrition needs or a weight-change prescription.${allergy} ${minor ? "Keep meals varied and nourishing; this is not for weight change." : "Treat this as inspiration, not a prescription."}`;
  }
  if (/workout|exercise|movement|active|fitness/.test(text)) {
    return `Try a ${profile.workout_days || 3}-day weekly rhythm suited to your ${String(profile.activity_level || "moderate").replaceAll("_", " ")} activity level and ${String(profile.experience_level || "beginner").replaceAll("_", " ")} experience: begin with a 5-minute easy warm-up, then 15-25 minutes of walking or comfortable ${String(profile.equipment || "bodyweight").replaceAll("_", " ")} movement. Leave rest or light-activity days between harder sessions. Start shorter if new, and stop if you feel pain, dizziness, or unusual shortness of breath.`;
  }
  if (/sleep|bedtime|tired/.test(text)) {
    return "Try keeping a steady wake time, getting daylight early, and making the last 30 minutes before bed calmer and dimmer. Keep caffeine earlier if it affects your sleep. If sleep problems persist, discuss them with a healthcare professional.";
  }
  if (/stress|anxious|anxiety|overwhelmed|relax/.test(text)) {
    return "Try a small reset: put both feet on the floor, relax your shoulders, and take a few slow, comfortable breaths. Then choose one manageable next step or contact someone you trust. If distress is intense or ongoing, reach out to a qualified professional.";
  }
  return "I can help with general ideas about meals, movement, sleep, stress, and habits. Choose one of the suggested questions below to get started.";
}

export async function offlineRequest(config: any) {
  const store = await load();
  const method = String(config.method || "get").toLowerCase();
  const path = String(config.url || "").split("?")[0];
  const body = typeof config.data === "string" ? JSON.parse(config.data || "{}") : config.data || {};
  const auth = config.headers?.Authorization || config.headers?.authorization || "";
  const emailFromToken = String(auth).replace(/^Bearer offline:/, "");
  const now = new Date().toISOString();
  const user = store.users[emailFromToken] || (store.activeEmail ? store.users[store.activeEmail] : null);
  let data: any;
  let status = 200;

  if (path === "/auth/register" && method === "post") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !body.password || !body.name) throw { response: { status: 422, data: { detail: "Enter your name, email and password." } } };
    if (store.users[email]) throw { response: { status: 409, data: { detail: "An account with this email already exists on this device." } } };
    const created = { id: `local-${Date.now()}`, name: String(body.name).trim(), email, password: String(body.password) };
    store.users[email] = created;
    store.activeEmail = email;
    await save(store);
    data = { access_token: `offline:${email}`, token_type: "bearer", user: { id: created.id, name: created.name, email } };
  } else if (path === "/auth/login" && method === "post") {
    const email = String(body.email || "").trim().toLowerCase();
    const existing = store.users[email];
    if (!existing || existing.password !== body.password) throw { response: { status: 401, data: { detail: "No matching offline account is saved on this device. Connect once to sign in online, or create an account while offline." } } };
    data = { access_token: `offline:${email}`, token_type: "bearer", user: { id: existing.id, name: existing.name, email } };
    store.activeEmail = email;
    await save(store);
  } else if (path === "/users/me" && method === "get") {
    const activeUser = user || (store.activeEmail ? store.users[store.activeEmail] : null);
    if (!activeUser) throw { response: { status: 401, data: { detail: "Offline session not found on this device." } } };
    data = { id: activeUser.id, name: activeUser.name, email: activeUser.email };
  } else if (!user) {
    throw { response: { status: 401, data: { detail: "Sign in to continue." } } };
  } else if (path === "/profile" && method === "get") {
    data = { ...store.profile, user_id: user.id };
  } else if (path === "/profile" && method === "put") {
    store.profile = { ...store.profile, ...body };
    await save(store);
    data = { ...store.profile, user_id: user.id };
  } else if (path === "/health/bmi" && method === "post") {
    const value = bmi(Number(store.profile.weight_kg), Number(store.profile.height_cm));
    const ageAware = Number(store.profile.age) < 18;
    const category = ageAware ? null : value < 18.5 ? "below typical adult range" : value < 25 ? "typical adult range" : value < 30 ? "above typical adult range" : "well above typical adult range";
    data = { bmi: value, category, age_aware: ageAware, interpretation: ageAware ? "BMI-for-age assessment requires age- and sex-specific growth references; this app does not assign a category for people under 18." : `This falls in the ${category} for adult BMI screening. BMI is a screening measure, not a diagnosis, and does not account for every aspect of health.` };
  } else if (path === "/gamification" && method === "get") {
    const xp = store.activities.reduce((total, event) => total + event.xp, 0);
    const activeDays = [...new Set(store.activities.map(event => event.event_date))].sort().reverse();
    let streak = 0;
    let cursor = new Date();
    if (activeDays[0] !== cursor.toISOString().slice(0, 10)) cursor.setDate(cursor.getDate() - 1);
    for (const activeDay of activeDays) {
      if (activeDay !== cursor.toISOString().slice(0, 10)) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    const badges = [];
    if (xp >= 50) badges.push("Getting Started");
    if (xp >= 200) badges.push("Consistency Builder");
    if (streak >= 3) badges.push("Three-day Rhythm");
    if (xp >= 500) badges.push("Wellness Champion");
    data = { xp, level: Math.floor(xp / 100) + 1, streak, badges, events_today: store.activities.filter(event => event.event_date === now.slice(0, 10)).length, next_milestone_xp: (Math.floor(xp / 100) + 1) * 100 };
  } else if (path.startsWith("/plans/") && method === "post") {
    const kind = path.split("/").pop() || "diet";
    const answer = kind === "diet"
      ? localReply("meal plan", store.profile)
      : localReply("workout plan", store.profile);
    store.plans[kind] = answer;
    await save(store);
    data = { plan: answer, demo_mode: true, created_at: now };
  } else if (path === "/assistant/chat" && method === "post") {
    const reply = localReply(String(body.message || ""), store.profile);
    store.chats.push({ role: "user", content: String(body.message || ""), created_at: now }, { role: "assistant", content: reply, created_at: now });
    await save(store);
    data = { reply, demo_mode: true };
  } else if (path === "/progress" && method === "get") {
    data = { weights: store.weights, activities: store.activities };
  } else if (path === "/progress/weight" && method === "post") {
    const weight = Number(body.weight_kg);
    const entry = { weight_kg: weight, bmi: bmi(weight, Number(store.profile.height_cm)), recorded_at: now };
    store.profile.weight_kg = weight;
    store.weights.push(entry);
    store.cachedGamification = null;
    await save(store);
    data = entry;
  } else if (path === "/gamification/events" && method === "post") {
    const points: Record<string, number> = { workout: 20, weight_log: 5, challenge: 15, streak: 10 };
    if (store.activities.some(event => event.event_key === body.event_key && event.event_date === now.slice(0, 10))) throw { response: { status: 409, data: { detail: "This activity has already earned points today." } } };
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);
    const todayKey = now.slice(0, 10);
    if (store.activities.some(event => event.event_date === yesterdayKey) && !store.activities.some(event => event.event_key === `daily-streak-${todayKey}` && event.event_date === todayKey)) {
      store.activities.push({ event_key: `daily-streak-${todayKey}`, xp: points.streak, event_date: todayKey });
    }
    const xp = points[body.event_type] || 0;
    store.activities.push({ event_key: body.event_key || body.event_type, xp, event_date: now.slice(0, 10) });
    store.cachedGamification = null;
    await save(store);
    data = { awarded_xp: xp, message: "Saved on this device." };
  } else if (path === "/account" && method === "delete") {
    delete store.users[user.email];
    const reset = initialStore();
    reset.users = store.users;
    await save(reset);
    data = { message: "Offline account data deleted." };
  } else {
    status = 404;
    data = { detail: "This feature is not available offline." };
  }

  return { data, status, statusText: "OK", headers: {}, config, request: {} };
}

export async function cacheOnlineUser(user: { id: string | number; name: string; email: string }) {
  const store = await load();
  const email = user.email.trim().toLowerCase();
  store.users[email] = { id: String(user.id), name: user.name, email, password: "" };
  store.activeEmail = email;
  await save(store);
}

export async function getOfflineUser() {
  const store = await load();
  return store.activeEmail ? store.users[store.activeEmail] || null : null;
}

export async function cacheOnlineResponse(url: string, method: string, data: any) {
  const store = await load();
  if (url === "/users/me" && method === "get" && data?.email) {
    const email = String(data.email).toLowerCase();
    store.users[email] = { id: String(data.id), name: data.name, email, password: "" };
    store.activeEmail = email;
  } else if (url === "/profile" && method === "get" && data) {
    store.profile = { ...store.profile, ...data };
  } else if (url === "/profile" && method === "put" && data) {
    store.profile = { ...store.profile, ...data };
  } else if (url === "/progress" && method === "get" && data) {
    store.weights = data.weights || store.weights;
    store.activities = data.activities || store.activities;
  } else if (url === "/gamification" && method === "get" && data) {
    store.cachedGamification = data;
  }
  await save(store);
}