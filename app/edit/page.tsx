"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CvPreview from "@/components/CvPreview";
import Icon from "@/components/Icon";
import { checkCv, tipsSummary } from "@/lib/checks";
import { ACCENTS, blankItem, LIMITS, plainText, splitSkills, TEMPLATES, type Cv, type Item, type SectionKey, type Template } from "@/lib/cv";
import { saveCv, useCvs } from "@/lib/storage";
import type { PdfResult } from "@/lib/pdf";

/*
  /edit?id=…: the editor. The form is on the left and the live preview with the CV check on the
  right (on a phone, a switch at the top flips between them). Every change is saved on the device
  a moment after you stop typing. The PDF is built in the background too, so it can say whether
  the CV fits on one page before you download it. pdf-lib is only loaded on this page.
*/
export default function EditPage() {
  return (
    <Suspense>
      <Editor />
    </Suspense>
  );
}

function Editor() {
  const id = useSearchParams().get("id");
  const cvs = useCvs();
  const stored = cvs.find((c) => c.id === id) ?? null;
  const [cv, setCv] = useState<Cv | null>(null);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [pdf, setPdf] = useState<PdfResult | null>(null);
  const [saved, setSaved] = useState(true);
  const [copied, setCopied] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (stored && (!cv || cv.id !== stored.id)) setCv(stored);
  }, [stored, cv]);

  // Build the PDF a moment after the last change, to know how many pages it takes
  useEffect(() => {
    if (!cv) return;
    let live = true;
    const timer = setTimeout(async () => {
      const { makeCvPdf } = await import("@/lib/pdf");
      const result = await makeCvPdf(cv);
      if (live) setPdf(result);
    }, 700);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [cv]);

  if (!cv)
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-extrabold">{cvs.length || id ? "That CV isn't on this device" : "Opening…"}</h1>
        <p className="mt-2 text-ink-soft">CVs are saved in the browser where you made them. To move one, download a backup there and load it here.</p>
        <Link href="/" className="btn mt-6">
          Back to your CVs
        </Link>
      </div>
    );

  function change(next: Cv) {
    setCv(next);
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveCv(next);
      setSaved(true);
    }, 400);
  }
  const set = <K extends keyof Cv>(key: K, value: Cv[K]) => change({ ...cv, [key]: value });
  const setPerson = (key: keyof Cv["person"], value: string) => change({ ...cv, person: { ...cv.person, [key]: value } });

  async function download() {
    if (!cv) return;
    const { makeCvPdf, pdfFileName } = await import("@/lib/pdf");
    const result = await makeCvPdf(cv);
    const url = URL.createObjectURL(new Blob([result.bytes as BlobPart], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = pdfFileName(cv);
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyText() {
    if (!cv) return;
    try {
      await navigator.clipboard.writeText(plainText(cv));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  const tips = checkCv(cv);
  const fit = pdf ? (pdf.pages === 1 ? (pdf.shrunk ? `Fits on 1 page (text made slightly smaller, ${pdf.size}pt)` : "Fits on 1 page") : `Takes ${pdf.pages} pages. Try shorter points, or fewer skills or older roles.`) : "Checking the page…";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/" className="tool" aria-label="Back to your CVs">
          <Icon name="left" />
        </Link>
        <label className="min-w-0 flex-1">
          <span className="sr-only">This version&apos;s name</span>
          <input value={cv.name} onChange={(e) => set("name", e.target.value.slice(0, LIMITS.name))} placeholder="Name this version, e.g. Web developer" className="w-full rounded-lg bg-transparent px-2 py-1 text-2xl font-extrabold tracking-tight hover:bg-card focus:bg-card" />
        </label>
        <span role="status" className="w-full text-sm text-ink-soft sm:w-auto">
          {saved ? "Saved on this device" : "Saving…"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={download} className="btn">
          <Icon name="download" className="h-4 w-4" />
          Download PDF
        </button>
        <button type="button" onClick={copyText} className="btn-quiet">
          <Icon name="copy" className="h-4 w-4" />
          <span aria-live="polite">{copied ? "Copied!" : "Copy as text"}</span>
        </button>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${pdf && pdf.pages > 1 ? "bg-warn-soft text-warn" : "bg-pass-soft text-pass"}`} aria-live="polite">
          {fit}
        </span>
      </div>

      <div role="group" aria-label="Show" className="mt-4 flex rounded-xl border border-line bg-card p-1 lg:hidden">
        {(["edit", "preview"] as const).map((v) => (
          <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`flex-1 rounded-lg py-2 text-sm font-bold ${view === v ? "bg-accent text-on-accent" : "text-ink-soft"}`}>
            {v === "edit" ? "Edit" : `Preview and tips (${tips.length})`}
          </button>
        ))}
      </div>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1fr_minmax(0,0.95fr)]">
        <div className={`space-y-4 ${view === "edit" ? "" : "hidden lg:block"}`}>
          <Panel title="Look">
            <fieldset>
              <legend className="text-sm font-semibold">Template</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {(Object.keys(TEMPLATES) as Template[]).map((t) => (
                  <label key={t} className={`cursor-pointer rounded-xl border p-3 text-sm ${cv.template === t ? "border-accent bg-accent-soft" : "border-line"}`}>
                    <input type="radio" name="template" checked={cv.template === t} onChange={() => set("template", t)} className="sr-only" />
                    <span className="block font-bold">{TEMPLATES[t].label}</span>
                    <span className="text-xs text-ink-soft">{TEMPLATES[t].about}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {cv.template === "modern" && (
              <fieldset className="mt-4">
                <legend className="text-sm font-semibold">Colour</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ACCENTS.map((a) => (
                    <label key={a.hex} className={`flex cursor-pointer items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm ${cv.accent === a.hex ? "border-accent font-bold" : "border-line"}`}>
                      <input type="radio" name="accent" checked={cv.accent === a.hex} onChange={() => set("accent", a.hex)} className="sr-only" />
                      <span aria-hidden="true" className="h-6 w-6 rounded-full" style={{ background: a.hex }} />
                      {a.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </Panel>

          <Panel title="Your details">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" value={cv.person.name} max={LIMITS.name} onChange={(v) => setPerson("name", v)} autoComplete="name" />
              <Field label="Headline" value={cv.person.headline} max={LIMITS.headline} onChange={(v) => setPerson("headline", v)} placeholder="e.g. Junior web developer" />
              <Field label="Email" value={cv.person.email} max={LIMITS.contact} onChange={(v) => setPerson("email", v)} type="email" autoComplete="email" />
              <Field label="Phone" value={cv.person.phone} max={LIMITS.contact} onChange={(v) => setPerson("phone", v)} type="tel" autoComplete="tel" />
              <Field label="Town or city" value={cv.person.location} max={LIMITS.contact} onChange={(v) => setPerson("location", v)} placeholder="e.g. Johannesburg" />
            </div>
            <fieldset className="mt-3">
              <legend className="text-sm font-semibold">
                Links <span className="font-normal text-ink-soft">(GitHub, LinkedIn, portfolio; up to 3)</span>
              </legend>
              <div className="mt-1 grid gap-2">
                {[0, 1, 2].map((i) => (
                  <input
                    key={i}
                    value={cv.person.links[i] ?? ""}
                    aria-label={`Link ${i + 1}`}
                    onChange={(e) => {
                      const links = [0, 1, 2].map((j) => (j === i ? e.target.value.slice(0, LIMITS.contact) : cv.person.links[j] ?? ""));
                      change({ ...cv, person: { ...cv.person, links: links.filter((l, j) => l.trim() || j < i) } });
                    }}
                    placeholder={["github.com/your-name", "linkedin.com/in/your-name", "your-portfolio.vercel.app"][i]}
                    inputMode="url"
                    className="field"
                  />
                ))}
              </div>
            </fieldset>
          </Panel>

          <Panel title="Profile">
            <label className="block text-sm font-semibold">
              2 to 4 sentences about you and the job you want
              <textarea value={cv.summary} onChange={(e) => set("summary", e.target.value.slice(0, LIMITS.summary))} rows={4} className="field mt-1 font-normal" />
            </label>
          </Panel>

          <Items cv={cv} section="experience" title="Experience" labels={["Job title", "Company", "Town or city"]} add="Add a job" onChange={change} />
          <Items cv={cv} section="projects" title="Projects" labels={["Project name", "Built with, or for", "Link or place (optional)"]} add="Add a project" onChange={change} />
          <Items cv={cv} section="education" title="Education" labels={["Qualification", "School, college or university", "Town or city"]} add="Add a qualification" onChange={change} />

          <Panel title="Skills">
            <SkillsField skills={cv.skills} onChange={(skills) => set("skills", skills)} />
          </Panel>

          <Panel title="Certifications and references">
            <label className="block text-sm font-semibold">
              Certifications <span className="font-normal text-ink-soft">(one a line)</span>
              <textarea
                value={cv.certifications.join("\n")}
                onChange={(e) => set("certifications", e.target.value.split("\n").map((c) => c.slice(0, LIMITS.cert)).slice(0, LIMITS.certs))}
                rows={3}
                className="field mt-1 font-normal"
              />
            </label>
            <Field label="References" value={cv.references} max={LIMITS.references} onChange={(v) => set("references", v)} />
          </Panel>
        </div>

        <aside className={`space-y-4 lg:sticky lg:top-4 ${view === "preview" ? "" : "hidden lg:block"}`} aria-label="Preview and tips">
          <section aria-labelledby="check" className="rounded-2xl border border-line bg-card p-4">
            <h2 id="check" className="font-extrabold">
              CV check: {tipsSummary(tips)}
            </h2>
            {tips.length > 0 && (
              <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1 text-sm" tabIndex={0} aria-label="Tips">
                {tips.map((t) => (
                  <li key={t.id} className="flex gap-2">
                    <span className={`mt-0.5 shrink-0 rounded-full px-2 text-xs font-bold ${t.level === "fix" ? "bg-fail-soft text-fail" : "bg-warn-soft text-warn"}`}>{t.level === "fix" ? "Fix" : "Tip"}</span>
                    <span>{t.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div aria-label="Preview of your CV" role="region">
            <CvPreview cv={cv} size={pdf?.size ?? 10.5} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <h2 className="mb-3 text-lg font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, max, type = "text", placeholder, autoComplete }: { label: string; value: string; onChange: (v: string) => void; max: number; type?: string; placeholder?: string; autoComplete?: string }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value.slice(0, max))} placeholder={placeholder} autoComplete={autoComplete} className="field mt-1 font-normal" />
    </label>
  );
}

/** Skills are typed as a list ("React, Next.js, SQL") and kept as separate skills */
function SkillsField({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
  const [text, setText] = useState(skills.join(", "));
  return (
    <label className="block text-sm font-semibold">
      Separate them with commas <span className="font-normal text-ink-soft">({skills.length} of {LIMITS.skills})</span>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(splitSkills(e.target.value));
        }}
        rows={3}
        placeholder="e.g. JavaScript, React, SQL, Customer service"
        className="field mt-1 font-normal"
      />
    </label>
  );
}

function Items({ cv, section, title, labels, add, onChange }: { cv: Cv; section: SectionKey; title: string; labels: [string, string, string]; add: string; onChange: (cv: Cv) => void }) {
  const items = cv[section];
  const update = (id: string, change: Partial<Item>) => onChange({ ...cv, [section]: items.map((i) => (i.id === id ? { ...i, ...change } : i)) });
  return (
    <Panel title={title}>
      {items.length === 0 && <p className="text-sm text-ink-soft">Nothing yet.</p>}
      <ol className="space-y-4">
        {items.map((item, n) => (
          <li key={item.id} className="rounded-xl border border-line p-4">
            <div className="flex items-center gap-2">
              <p className="flex-1 text-sm font-bold text-ink-soft">
                {title} {n + 1}
              </p>
              <button type="button" onClick={() => confirm("Remove this?") && onChange({ ...cv, [section]: items.filter((i) => i.id !== item.id) })} className="tool hover:!text-fail" aria-label={`Remove ${item.title || `${title.toLowerCase()} ${n + 1}`}`}>
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <Field label={labels[0]} value={item.title} max={LIMITS.title} onChange={(v) => update(item.id, { title: v })} />
              <Field label={labels[1]} value={item.org} max={LIMITS.org} onChange={(v) => update(item.id, { org: v })} />
              <Field label={labels[2]} value={item.place} max={LIMITS.place} onChange={(v) => update(item.id, { place: v })} />
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm font-semibold">
                  From
                  <input type="month" value={item.from} onChange={(e) => update(item.id, { from: e.target.value })} className="field mt-1 px-2 font-normal" />
                </label>
                <label className="block text-sm font-semibold">
                  To
                  <input type="month" value={item.to} disabled={item.to === ""} onChange={(e) => update(item.id, { to: e.target.value })} className="field mt-1 px-2 font-normal" />
                </label>
              </div>
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={item.to === ""} onChange={(e) => update(item.id, { to: e.target.checked ? "" : item.from || new Date().toISOString().slice(0, 7) })} className="h-4 w-4 accent-[var(--color-accent)]" />
              {section === "education" ? "Still studying" : "I'm still doing this"}
            </label>
            <label className="mt-3 block text-sm font-semibold">
              What you did <span className="font-normal text-ink-soft">(one point a line, up to {LIMITS.bullets})</span>
              <textarea
                value={item.bullets.join("\n")}
                onChange={(e) => update(item.id, { bullets: e.target.value.split("\n").map((b) => b.slice(0, LIMITS.bullet)).slice(0, LIMITS.bullets) })}
                rows={3}
                placeholder="Start with a doing word: Built, Led, Fixed, Trained…"
                className="field mt-1 font-normal"
              />
            </label>
          </li>
        ))}
      </ol>
      {items.length < LIMITS.items && (
        <button type="button" onClick={() => onChange({ ...cv, [section]: [...items, blankItem()] })} className="btn-quiet mt-3 text-sm">
          <Icon name="plus" className="h-4 w-4" />
          {add}
        </button>
      )}
    </Panel>
  );
}
