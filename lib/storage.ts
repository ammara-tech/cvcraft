"use client";

import { useSyncExternalStore } from "react";
import { ACCENTS, blankCv, LIMITS, newId, TEMPLATES, type Cv, type Item } from "@/lib/cv";

/*
  Your CVs, saved in this browser's localStorage: there are no accounts, so nothing leaves your
  device. A backup file (Download a backup) moves them to another device or keeps them safe if the
  browser is cleared. readCvs() checks everything it loads, so a broken or hand-edited backup can
  never crash the app. Tested in tests/storage.test.ts.
*/

const KEY = "cvcraft:cvs";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const month = (v: unknown) => (typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : "");
const list = (v: unknown) => (Array.isArray(v) ? v : []);

function readItem(v: unknown): Item {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const bullets = list(o.bullets).map((b) => str(b, LIMITS.bullet)).slice(0, LIMITS.bullets);
  return { id: str(o.id, 40) || newId(), title: str(o.title, LIMITS.title), org: str(o.org, LIMITS.org), place: str(o.place, LIMITS.place), from: month(o.from), to: month(o.to), bullets: bullets.length ? bullets : [""] };
}

/** One CV from storage or a backup file, made safe */
export function readCv(v: unknown): Cv | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const base = blankCv();
  const person = (o.person && typeof o.person === "object" ? o.person : {}) as Record<string, unknown>;
  return {
    id: str(o.id, 40) || newId(),
    name: str(o.name, LIMITS.name),
    updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : Date.now(),
    template: typeof o.template === "string" && o.template in TEMPLATES ? (o.template as Cv["template"]) : base.template,
    accent: ACCENTS.some((a) => a.hex === o.accent) ? String(o.accent) : base.accent,
    person: {
      name: str(person.name, LIMITS.name),
      headline: str(person.headline, LIMITS.headline),
      email: str(person.email, LIMITS.contact),
      phone: str(person.phone, LIMITS.contact),
      location: str(person.location, LIMITS.contact),
      links: list(person.links).map((l) => str(l, LIMITS.contact)).slice(0, LIMITS.links),
    },
    summary: str(o.summary, LIMITS.summary),
    experience: list(o.experience).slice(0, LIMITS.items).map(readItem),
    education: list(o.education).slice(0, LIMITS.items).map(readItem),
    projects: list(o.projects).slice(0, LIMITS.items).map(readItem),
    skills: list(o.skills).map((s) => str(s, LIMITS.skill)).filter(Boolean).slice(0, LIMITS.skills),
    certifications: list(o.certifications).map((s) => str(s, LIMITS.cert)).slice(0, LIMITS.certs),
    references: typeof o.references === "string" ? o.references.slice(0, LIMITS.references) : base.references,
  };
}

/** A list of CVs from text (storage or a backup file), newest first; [] if it isn't one */
export function readCvs(raw: string | null): Cv[] {
  try {
    const data = JSON.parse(raw ?? "[]");
    const items = Array.isArray(data) ? data : data && typeof data === "object" && Array.isArray(data.cvs) ? data.cvs : [];
    return items
      .map(readCv)
      .filter((c: Cv | null): c is Cv => c !== null)
      .slice(0, 30)
      .sort((a: Cv, b: Cv) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

/** The backup file's contents */
export const backupText = (cvs: Cv[]) => JSON.stringify({ app: "CVcraft", version: 1, savedAt: new Date().toISOString(), cvs }, null, 2);

/** Joins imported CVs with the ones already here: an imported CV with the same id replaces the old one */
export function mergeCvs(existing: Cv[], incoming: Cv[]) {
  const byId = new Map(existing.map((c) => [c.id, c]));
  for (const c of incoming) byId.set(c.id, c);
  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 30);
}

// ---------- The live list, shared by every page ----------

let cvs: Cv[] | null = null;
let storageWorks = true;
const listeners = new Set<() => void>();

function load() {
  if (cvs === null) {
    try {
      cvs = readCvs(localStorage.getItem(KEY));
    } catch {
      storageWorks = false;
      cvs = [];
    }
  }
  return cvs;
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cvs));
    storageWorks = true;
  } catch {
    storageWorks = false; // private browsing or full: kept for this visit only
  }
  listeners.forEach((l) => l());
}

export function setCvs(next: Cv[]) {
  cvs = next;
  persist();
}

/** Saves one CV (adding it if it's new), marking it as just changed */
export function saveCv(cv: Cv) {
  const all = load();
  const updated = { ...cv, updatedAt: Date.now() };
  setCvs([updated, ...all.filter((c) => c.id !== cv.id)]);
}

export function deleteCv(id: string) {
  setCvs(load().filter((c) => c.id !== id));
}

export const canSave = () => storageWorks;

const subscribe = (l: () => void) => {
  listeners.add(l);
  // Another tab changed the CVs: reload them
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cvs = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};
const EMPTY: Cv[] = [];

/** All your CVs, newest first. Empty while the page is first drawn on the server. */
export const useCvs = () => useSyncExternalStore(subscribe, load, () => EMPTY);
