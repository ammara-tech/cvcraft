import { bulletsOf, hasContent, type Cv } from "@/lib/cv";

/*
  The CV check: friendly tips, the kind a careers adviser would give, worked out as you type.
  "fix" tips are things recruiters or job sites trip over; "tip" ones make a good CV better.
  Nothing is sent anywhere. Tested in tests/checks.test.ts.
*/

export type Tip = { id: string; level: "fix" | "tip"; text: string };

// Weak openings that say what you were meant to do, not what you did
const WEAK = /^(responsible for|helped( with)?|worked on|in charge of|duties included|tasked with|assisted( with)?)\b/i;
// A South African ID number: 13 digits (spaces allowed between groups)
const ID_NUMBER = /\b\d{6}\s?\d{4}\s?\d{2}\s?\d\b/;
const PERSONAL = /\b(date of birth|d\.?o\.?b\.?|marital status|married|single|divorced|religion|id number|identity number|age:)/i;
const FIRST_PERSON = /(^|[\s(])(I|my|me)(?=[\s,.'’)])/;

function allText(cv: Cv) {
  const items = [...cv.experience, ...cv.education, ...cv.projects];
  return [cv.person.headline, cv.summary, ...items.flatMap((i) => [i.title, i.org, ...i.bullets]), ...cv.certifications, cv.references].join("\n");
}

export function checkCv(cv: Cv): Tip[] {
  const tips: Tip[] = [];
  const add = (id: string, level: Tip["level"], text: string) => tips.push({ id, level, text });
  const p = cv.person;
  const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
  const experience = cv.experience.filter(hasContent);
  const bullets = [...cv.experience, ...cv.projects].flatMap(bulletsOf);

  if (!p.name.trim()) add("name", "fix", "Add your name at the top.");
  if (!p.email.trim()) add("email", "fix", "Add your email address, so they can reach you.");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) add("email-shape", "fix", "Your email address doesn't look right. Check for a typo.");
  if (!p.phone.trim()) add("phone", "fix", "Add a phone number: many recruiters in South Africa call first.");
  if (!p.headline.trim()) add("headline", "tip", "Add a headline under your name, like \"Junior web developer\", so they know what you're applying as.");

  const text = allText(cv) + "\n" + [p.name, p.email, p.phone, p.location].join(" ");
  if (ID_NUMBER.test(text) || PERSONAL.test(text))
    add("personal", "fix", "Leave out your ID number, date of birth, age and marital status. Employers don't need them before an offer, and it protects you from fraud and unfair treatment.");

  if (!cv.summary.trim()) add("summary", "tip", "Add a short profile (2 to 4 sentences): who you are, what you're good at, and the job you want.");
  else if (words(cv.summary) > 80) add("summary-long", "tip", `Your profile is ${words(cv.summary)} words. Recruiters skim: try to keep it under 80.`);

  if (experience.length === 0 && cv.projects.filter(hasContent).length === 0)
    add("experience", "tip", "Add some experience or projects. Part-time jobs, volunteering and your own projects all count.");

  const weak = bullets.filter((b) => WEAK.test(b));
  if (weak.length) add("weak", "tip", `Start points with what you did, not "${weak[0].split(" ").slice(0, 2).join(" ")}…". Try "Built", "Led", "Cut", "Trained" or "Fixed".`);
  if (bullets.length >= 3 && !bullets.some((b) => /\d/.test(b))) add("numbers", "tip", "Add a number to some points (\"for 80 staff\", \"cut set-up time by half\"): results stand out.");
  if (FIRST_PERSON.test(bullets.join("\n"))) add("first-person", "tip", "Leave \"I\" and \"my\" out of your points: \"Built a booking page\" reads better than \"I built my booking page\".");
  const long = bullets.find((b) => words(b) > 30);
  if (long) add("long-bullet", "tip", "Some points are over 30 words. Keep each one to a line or two.");

  if (cv.skills.length === 0) add("skills", "tip", "List your skills: job sites search for them.");
  else if (cv.skills.length > 20) add("skills-many", "tip", `You list ${cv.skills.length} skills. Keep the 12 to 15 that matter most for this job.`);

  const undated = experience.filter((i) => !i.from);
  if (undated.length) add("dates", "tip", `Add dates to "${undated[0].title || undated[0].org}": gaps and dates are the first thing many recruiters check.`);
  return tips;
}

/** "2 things to fix, 3 tips" */
export function tipsSummary(tips: Tip[]) {
  const fix = tips.filter((t) => t.level === "fix").length;
  const tip = tips.length - fix;
  if (!tips.length) return "Looking good: nothing to fix";
  const parts = [fix ? `${fix} thing${fix === 1 ? "" : "s"} to fix` : "", tip ? `${tip} tip${tip === 1 ? "" : "s"}` : ""].filter(Boolean);
  return parts.join(", ");
}
