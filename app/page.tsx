"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { blankCv, cvTitle, duplicateCv, exampleCv, TEMPLATES } from "@/lib/cv";
import { backupText, canSave, deleteCv, mergeCvs, readCvs, saveCv, setCvs, useCvs } from "@/lib/storage";

/*
  Home: your CVs. Start a new one (blank or from an example), open, copy or delete one, and
  back them all up to a file or load a backup. Keeping a different version for each kind of job
  is the point: the same person might send a "web developer" CV and an "IT support" CV.
*/
export default function Home() {
  const cvs = useCvs();
  const router = useRouter();
  const file = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);

  function start(cv = blankCv()) {
    saveCv(cv);
    router.push(`/edit?id=${cv.id}`);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([backupText(cvs)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `cvcraft-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function load(f: File | undefined) {
    if (!f) return;
    const incoming = readCvs(await f.text());
    if (!incoming.length) return setNote("That file isn't a CVcraft backup, or it's empty.");
    setCvs(mergeCvs(cvs, incoming));
    setNote(`Loaded ${incoming.length} CV${incoming.length === 1 ? "" : "s"} from the backup.`);
  }

  return (
    <div>
      <section className="grid items-center gap-8 py-4 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">A CV that gets read.</h1>
          <p className="mt-4 max-w-xl text-lg text-ink-soft">
            Fill in the boxes, choose a look, and download a clear one-page PDF that job sites can read. Tips appear as you type, like a careers adviser looking over your shoulder.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => start()} className="btn">
              <Icon name="plus" className="h-4 w-4" />
              New CV
            </button>
            <button type="button" onClick={() => start(exampleCv())} className="btn-quiet">
              Start from an example
            </button>
          </div>
          <p className="mt-4 text-sm text-ink-soft">Free, with no account. Your CVs are saved only on this device.</p>
        </div>
        {/* On a phone, once you have CVs, these are hidden so your CVs are on the first screen */}
        <ul className={`gap-3 text-sm sm:grid sm:grid-cols-2 ${cvs.length ? "hidden" : "grid"}`} aria-label="What CVcraft does">
          {[
            ["One page, as a PDF", "It fits your CV to one A4 page, with real text and clickable links."],
            ["Tips as you type", "Missing details, weak openings, no numbers, and personal details to leave out."],
            ["Three clean looks", "Classic, Modern and Compact: one column, which job sites read best."],
            ["A version for each job", "Copy a CV and change it for each kind of job you apply for."],
          ].map(([title, text]) => (
            <li key={title} className="rounded-2xl border border-line bg-card p-4">
              <p className="font-bold">{title}</p>
              <p className="mt-1 text-ink-soft">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="yours" className="mt-10">
        <h2 id="yours" className="text-2xl font-extrabold">
          Your CVs
        </h2>
        {!canSave() && <p className="mt-2 rounded-xl bg-warn-soft p-3 text-sm text-warn">This browser isn&apos;t letting CVcraft save (private browsing?). Your CVs will be lost when you close it, so download a backup or the PDF.</p>}
        {cvs.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">No CVs yet. Press New CV, or start from the example to see a finished one.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cvs.map((cv) => (
              <li key={cv.id} className="flex flex-col rounded-2xl border border-line bg-card p-4">
                <Link href={`/edit?id=${cv.id}`} className="group flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Icon name="file" className="h-6 w-6" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold group-hover:underline">{cvTitle(cv)}</span>
                    <span className="block text-sm text-ink-soft">
                      {cv.person.name || "No name yet"} · {TEMPLATES[cv.template].label}
                    </span>
                    <span className="block text-xs text-ink-soft">Changed {new Date(cv.updatedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </span>
                </Link>
                <div className="mt-4 flex gap-2">
                  <Link href={`/edit?id=${cv.id}`} className="btn flex-1 py-2 text-sm">
                    Open
                  </Link>
                  <button type="button" onClick={() => saveCv(duplicateCv(cv))} className="btn-quiet py-2 text-sm" aria-label={`Make a copy of ${cvTitle(cv)}`}>
                    <Icon name="copy" className="h-4 w-4" />
                    Copy
                  </button>
                  <button type="button" onClick={() => confirm(`Delete "${cvTitle(cv)}"? This can't be undone.`) && deleteCv(cv.id)} className="btn-quiet py-2 text-sm hover:!border-fail hover:!text-fail" aria-label={`Delete ${cvTitle(cv)}`}>
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="backup" className="mt-10 rounded-2xl border border-line bg-card p-5">
        <h2 id="backup" className="text-xl font-extrabold">
          Backups
        </h2>
        <p className="mt-1 text-sm text-ink-soft">Your CVs live in this browser. Download a backup to keep them safe, or to move them to another phone or laptop.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={download} disabled={!cvs.length} className="btn-quiet text-sm disabled:opacity-50">
            <Icon name="download" className="h-4 w-4" />
            Download a backup
          </button>
          <button type="button" onClick={() => file.current?.click()} className="btn-quiet text-sm">
            <Icon name="upload" className="h-4 w-4" />
            Load a backup
          </button>
          <input ref={file} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => load(e.target.files?.[0])} />
        </div>
        {note && (
          <p role="status" className="mt-2 text-sm font-semibold">
            {note}
          </p>
        )}
      </section>
    </div>
  );
}
