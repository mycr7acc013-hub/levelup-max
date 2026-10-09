export type Guide = {
  slug: string;
  title: string;
  area: "Face" | "Body" | "Skin" | "Hair" | "Style" | "Mind";
  minutes: number;
  weeks: string;
  pro?: boolean;
  intro: string;
  steps: { name: string; how: string; time: string }[];
};

export const GUIDES: Guide[] = [
  {
    slug: "mewing", title: "Mewing & Tongue Posture", area: "Face", minutes: 5, weeks: "Habit forms in 3–6 weeks; visible change, if any, takes months to years",
    intro: "Proper tongue posture keeps your whole tongue on the roof of your mouth. It mainly helps posture and side-profile appearance, and works best alongside fat loss and neck posture.",
    steps: [
      { name: "Find the spot", how: "Say 'sing' and hold the 'ng'. That's where the back of your tongue goes.", time: "1 min" },
      { name: "Flatten the whole tongue", how: "Press the full tongue (tip just behind front teeth) gently onto the palate.", time: "Hold all day" },
      { name: "Lips sealed, teeth lightly touching", how: "Breathe through your nose. No clenching.", time: "All day" },
      { name: "Hourly check-ins", how: "Set a phone reminder every hour to reset posture.", time: "10 sec/hr" },
    ],
  },
  {
    slug: "jawline", title: "Jawline Definition", area: "Face", minutes: 20, weeks: "4–12 weeks",
    intro: "The fastest real jawline upgrade is lower body fat. Add chewing work, neck training and less salt/alcohol to reduce puffiness.",
    steps: [
      { name: "Lower body fat", how: "Eat in a 300–500 kcal deficit with high protein (1.6–2.2 g/kg).", time: "Daily" },
      { name: "Chew mastic or hard gum", how: "Chew evenly on both sides. Stop if your jaw clicks or hurts.", time: "10–20 min/day" },
      { name: "Neck curls & extensions", how: "3 sets of 15 lying on a bench, slow and controlled.", time: "8 min, 3x/week" },
      { name: "De-bloat", how: "Drink 2–3 L water, cut sodium and alcohol, sleep 8h.", time: "Daily" },
    ],
  },
  {
    slug: "skincare", title: "Glass-Skin Routine", area: "Skin", minutes: 10, weeks: "Clearer skin in 4–8 weeks",
    intro: "A simple, consistent routine beats a 12-step one. Sunscreen is the single biggest anti-aging step.",
    steps: [
      { name: "AM: Gentle cleanser", how: "Lukewarm water, 30 seconds.", time: "1 min" },
      { name: "AM: Moisturiser + SPF 30–50", how: "Two finger lengths of sunscreen for face and neck.", time: "2 min" },
      { name: "PM: Cleanse", how: "Double cleanse if you wore sunscreen.", time: "2 min" },
      { name: "PM: Active (alternate nights)", how: "Retinoid or adapalene 3x/week; niacinamide or azelaic on other nights.", time: "1 min" },
      { name: "Weekly: Gentle exfoliation", how: "BHA (salicylic acid) once a week for congestion.", time: "5 min" },
    ],
  },
  {
    slug: "posture", title: "Posture Reset", area: "Body", minutes: 15, weeks: "2–8 weeks",
    intro: "Standing tall with a neutral neck instantly adds presence and improves how your jawline and chest look.",
    steps: [
      { name: "Chin tucks", how: "Glide your head straight back, hold 5s. 3x10.", time: "3 min" },
      { name: "Wall angels", how: "Back flat on wall, slide arms up and down. 3x12.", time: "4 min" },
      { name: "Face pulls / band pull-aparts", how: "3x15 to fix rounded shoulders.", time: "5 min" },
      { name: "Hip flexor stretch", how: "30s each side, twice.", time: "3 min" },
    ],
  },
  {
    slug: "physique", title: "V-Taper Physique", area: "Body", minutes: 60, weeks: "Noticeable in 8–16 weeks", pro: true,
    intro: "Broad shoulders and a narrow waist are the core of a strong frame. Train with progressive overload 3–5 days a week.",
    steps: [
      { name: "Lateral raises", how: "4x12–20, controlled. The #1 width builder.", time: "10 min" },
      { name: "Pull-ups / lat pulldown", how: "4x6–12 for back width.", time: "12 min" },
      { name: "Overhead press", how: "3x6–10.", time: "10 min" },
      { name: "Compounds", how: "Squat, bench, row, deadlift variations across the week.", time: "25 min" },
      { name: "Cardio + steps", how: "8–10k steps daily to stay lean.", time: "Daily" },
    ],
  },
  {
    slug: "hair", title: "Hair Max", area: "Hair", minutes: 10, weeks: "4–12 weeks", pro: true,
    intro: "The right cut for your face shape gives one of the biggest instant upgrades. Healthy hair comes from scalp care.",
    steps: [
      { name: "Find your face shape", how: "Oval: most styles. Round: volume on top, short sides. Square: textured crop.", time: "Once" },
      { name: "Barber every 3–5 weeks", how: "Bring reference photos.", time: "Monthly" },
      { name: "Shampoo 2–3x/week", how: "Condition every wash. Use ketoconazole shampoo for dandruff.", time: "5 min" },
      { name: "Hair loss check", how: "Thinning? See a dermatologist early. Treatments work best when started early.", time: "Once" },
    ],
  },
  {
    slug: "style", title: "Style & Fit", area: "Style", minutes: 15, weeks: "Instant", pro: true,
    intro: "Clothes that fit beat expensive clothes. Build a capsule wardrobe in neutral colours.",
    steps: [
      { name: "Fit first", how: "Shoulder seams on your shoulder bone, tapered trousers.", time: "Once" },
      { name: "Capsule basics", how: "White/black tees, dark jeans, an overshirt, clean white sneakers.", time: "Once" },
      { name: "Colour season", how: "Match colours to your skin undertone (warm vs cool).", time: "Once" },
      { name: "Fragrance & grooming", how: "Trim brows lightly, keep nails and beard line clean.", time: "Weekly" },
    ],
  },
  {
    slug: "sleep", title: "Sleep & Recovery", area: "Mind", minutes: 480, weeks: "1–2 weeks",
    intro: "Sleep reduces puffiness and dark circles, supports testosterone and growth hormone, and keeps your skin clear.",
    steps: [
      { name: "Fixed schedule", how: "Same bed/wake time every day, 7.5–9h.", time: "Nightly" },
      { name: "Cool, dark room", how: "18–20°C, blackout, phone outside the bedroom.", time: "Nightly" },
      { name: "Back sleeping", how: "Reduces face creasing and asymmetry from pillow pressure.", time: "Nightly" },
    ],
  },
  {
    slug: "confidence", title: "Mindset & Confidence", area: "Mind", minutes: 10, weeks: "Ongoing",
    intro: "Looks open doors, but confidence, kindness and eye contact are what people remember. Don't compare yourself to filtered photos.",
    steps: [
      { name: "Daily wins journal", how: "Write 3 things you did well.", time: "3 min" },
      { name: "Eye contact & voice", how: "Hold eye contact and speak slower and lower.", time: "Daily" },
      { name: "Limit comparison", how: "Mute accounts that make you feel worse.", time: "Once" },
    ],
  },
];

export const SAFETY_NOTE = "LevelUp does not teach 'bone smashing' or hitting your face. It can cause fractures, nerve damage and permanent asymmetry. Every method here is safe, and the results come from consistency.";

export type Tier = { name: string; min: number; color: string };
export const TIERS: Tier[] = [
  { name: "Starter", min: 0, color: "text-muted-foreground" },
  { name: "Rising", min: 45, color: "text-accent" },
  { name: "HTN", min: 58, color: "text-accent" },
  { name: "Chadlite", min: 70, color: "text-primary" },
  { name: "Chad", min: 82, color: "text-gold" },
  { name: "Elite", min: 92, color: "text-gold" },
];
export const tierFor = (score: number) => [...TIERS].reverse().find((t) => score >= t.min)!;

export const ASSESS_FIELDS: { key: string; label: string; options: { label: string; v: number }[] }[] = [
  { key: "jaw", label: "Jawline definition", options: [{ label: "Soft / hidden", v: 40 }, { label: "Some definition", v: 60 }, { label: "Defined", v: 78 }, { label: "Sharp & chiseled", v: 92 }] },
  { key: "skin", label: "Skin clarity", options: [{ label: "Frequent breakouts", v: 40 }, { label: "Some spots", v: 60 }, { label: "Mostly clear", v: 78 }, { label: "Clear & even", v: 92 }] },
  { key: "eyes", label: "Eye area", options: [{ label: "Dark circles / puffy", v: 45 }, { label: "Average", v: 62 }, { label: "Bright & rested", v: 80 }, { label: "Striking / hunter eyes", v: 92 }] },
  { key: "hair", label: "Hair", options: [{ label: "Thinning / unstyled", v: 45 }, { label: "Average", v: 62 }, { label: "Healthy & styled", v: 80 }, { label: "Thick, perfect cut", v: 92 }] },
  { key: "bodyfat", label: "Body fat", options: [{ label: "High (25%+)", v: 40 }, { label: "Average (18–25%)", v: 60 }, { label: "Lean (12–18%)", v: 80 }, { label: "Very lean (<12%)", v: 90 }] },
  { key: "physique", label: "Muscle / frame", options: [{ label: "Untrained", v: 45 }, { label: "Some training", v: 62 }, { label: "Athletic", v: 80 }, { label: "Aesthetic V-taper", v: 92 }] },
  { key: "posture", label: "Posture", options: [{ label: "Slouched / forward head", v: 45 }, { label: "Okay", v: 65 }, { label: "Upright", v: 82 }, { label: "Perfect", v: 92 }] },
  { key: "style", label: "Style & grooming", options: [{ label: "Don't think about it", v: 45 }, { label: "Basic", v: 62 }, { label: "Put together", v: 80 }, { label: "Sharp dresser", v: 92 }] },
];

export const SCORE_LABELS: Record<string, string> = {
  jaw: "Jawline", skin: "Skin", eyes: "Eyes", hair: "Hair", bodyfat: "Leanness", physique: "Physique", posture: "Posture", style: "Style", symmetry: "Symmetry", harmony: "Facial harmony",
};

export type Task = { id: string; label: string; minutes: number; guide?: string };
export const TASK_POOL: Record<string, Task[]> = {
  jaw: [{ id: "mew", label: "Mewing posture check-ins", minutes: 5, guide: "mewing" }, { id: "chew", label: "Hard-gum chewing", minutes: 15, guide: "jawline" }, { id: "neck", label: "Neck curls", minutes: 8, guide: "jawline" }],
  skin: [{ id: "am", label: "AM skincare + SPF", minutes: 3, guide: "skincare" }, { id: "pm", label: "PM skincare", minutes: 4, guide: "skincare" }],
  eyes: [{ id: "sleep", label: "8h sleep, on your back", minutes: 480, guide: "sleep" }, { id: "cold", label: "Cold-water face splash", minutes: 2 }],
  hair: [{ id: "hairc", label: "Hair care / style", minutes: 5, guide: "hair" }],
  bodyfat: [{ id: "steps", label: "10k steps", minutes: 60 }, { id: "protein", label: "Hit protein target", minutes: 0 }, { id: "water", label: "3 L water", minutes: 0 }],
  physique: [{ id: "lift", label: "Gym session", minutes: 60, guide: "physique" }, { id: "lats", label: "Lateral raises 4x15", minutes: 10, guide: "physique" }],
  posture: [{ id: "chin", label: "Chin tucks + wall angels", minutes: 7, guide: "posture" }],
  style: [{ id: "groom", label: "Grooming check (brows, beard, nails)", minutes: 5, guide: "style" }],
};

export function buildSchedule(scores: Record<string, number>, minutesPerDay: number) {
  const ordered = Object.entries(scores).filter(([k]) => TASK_POOL[k]).sort((a, b) => a[1] - b[1]);
  const tasks: Task[] = [{ id: "journal", label: "Wins journal", minutes: 3, guide: "confidence" }];
  let budget = minutesPerDay;
  for (const [k] of ordered) {
    for (const t of TASK_POOL[k] ?? []) {
      if (tasks.find((x) => x.id === t.id)) continue;
      if (t.minutes > 120 || t.minutes <= budget) { tasks.push(t); if (t.minutes <= 120) budget -= t.minutes; }
    }
  }
  return tasks;
}

export type Quiz = { slug: string; title: string; pro?: boolean; questions: { q: string; a: string[]; correct: number; why: string }[] };
export const QUIZZES: Quiz[] = [
  {
    slug: "basics", title: "Lookmaxing Basics",
    questions: [
      { q: "What's the fastest way to reveal a sharper jawline?", a: ["Bone smashing", "Lowering body fat", "Chewing 5 hours a day", "Face yoga only"], correct: 1, why: "Lower body fat reveals bone structure. Bone smashing is dangerous." },
      { q: "Where should your tongue rest when mewing?", a: ["Behind bottom teeth", "Floating", "Flat on the roof of the mouth", "Between the teeth"], correct: 2, why: "The whole tongue should rest on the palate, tip behind the front teeth." },
      { q: "Most important anti-aging skincare step?", a: ["Toner", "Sunscreen", "Face masks", "Scrubs"], correct: 1, why: "UV exposure causes most visible skin aging." },
      { q: "How many hours of sleep is ideal for recovery?", a: ["4–5", "5–6", "7.5–9", "11+"], correct: 2, why: "7.5–9h reduces puffiness and supports hormones." },
      { q: "Which exercise builds shoulder width the most?", a: ["Bicep curls", "Lateral raises", "Crunches", "Calf raises"], correct: 1, why: "Side delts give the V-taper look." },
    ],
  },
  {
    slug: "skin", title: "Skin Science",
    questions: [
      { q: "Retinoids should be introduced…", a: ["Daily at max strength", "Slowly, 2–3x a week", "Only in the morning", "Never with moisturiser"], correct: 1, why: "Start slow to avoid irritation and use them at night." },
      { q: "BHA (salicylic acid) is best for…", a: ["Dry skin", "Clogged pores", "Sunburn", "Hair growth"], correct: 1, why: "It's oil-soluble and clears pores." },
      { q: "How much sunscreen for face & neck?", a: ["A pea", "Two finger lengths", "A drop", "None if cloudy"], correct: 1, why: "Most people under-apply. UV still gets through on cloudy days." },
      { q: "Niacinamide helps with…", a: ["Oil & redness", "Hair loss", "Height", "Teeth"], correct: 0, why: "It regulates sebum and calms redness." },
    ],
  },
  {
    slug: "advanced", title: "Advanced Aesthetics", pro: true,
    questions: [
      { q: "Ideal waist-to-shoulder ratio for a V-taper?", a: ["1:1", "1:1.618", "1:3", "2:1"], correct: 1, why: "The golden ratio (≈1.6) is the classic target." },
      { q: "Canthal tilt refers to…", a: ["Nose angle", "Eye corner angle", "Jaw width", "Lip size"], correct: 1, why: "The angle between the inner and outer eye corners." },
      { q: "Forward head posture affects…", a: ["Only the back", "How the neck and jaw look", "Hair colour", "Nothing"], correct: 1, why: "It softens how the jaw and neck look." },
      { q: "Safe weekly fat loss rate?", a: ["0.5–1% bodyweight", "5% bodyweight", "10 kg", "No limit"], correct: 0, why: "This keeps muscle and hormones healthy." },
      { q: "Facial thirds measure…", a: ["Teeth", "Vertical facial balance", "Ear size", "Neck length"], correct: 1, why: "Forehead, midface and lower face proportions." },
    ],
  },
];

export const TIPS = [
  "Drink a glass of water now. Hydration reduces facial puffiness.",
  "Check your tongue posture. Is it on the roof of your mouth?",
  "Shoulders back, chin tucked. You instantly look taller.",
  "Sunscreen today, even if it's cloudy.",
  "Your rate of progress beats your starting point. Keep showing up.",
  "Protein at every meal keeps you lean while you lose fat.",
];
