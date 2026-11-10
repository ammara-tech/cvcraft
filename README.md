# CVcraft

**A CV that gets read.** Fill in the boxes, choose a look, and download a clear one-page PDF that job sites can
read, with tips as you type. Free, with no account, and nothing leaves your device.

**Live site:** add your Vercel address here once it's deployed

Built by Ammara Badat as part of my portfolio. It goes with HireTrack, my job-hunt tracker: HireTrack remembers
which CV you sent to each job, and CVcraft makes those CVs.

## Who it's for
Students, graduates and anyone applying for jobs, especially people making their first CV. Many South African
job seekers apply on their phones, through job sites whose CV readers (ATS) struggle with fancy layouts, and many
CV templates are paid or ask for an account. CVcraft is free, works on a phone, and makes PDFs those systems can read.

## What it does

**Your CVs**
- Start a **new CV**, or start from a **finished example** to see what a good one looks like.
- Keep **a version for each kind of job** (copy one and change it), and delete the ones you don't need.
- Everything is **saved on your device** as you type. **Download a backup** to move your CVs to another device or
  keep them safe, and **load a backup** to bring them back.

**The editor**
- Your details (with up to three links), a profile, experience, projects, education, skills, certifications and
  references. Dates can say "Present", and entries are put newest first automatically.
- **Three looks:** Classic (serif headings, centred name), Modern (a coloured name and headings, in five colours that
  all pass WCAG contrast on white) and Compact (smaller margins and inline skills).
- A **live preview** that matches the PDF, on a sheet of A4 paper.
- **Fits on one page:** it tells you whether the PDF fits on one A4 page. If it's a little too long, the text is made
  slightly smaller (down to 9pt) to fit; if it's still too long, it says so.

**The CV check** (tips as you type)
- Things to fix: a missing name, email or phone number, an email with a typo, and **personal details to leave out**
  (an ID number, date of birth, age or marital status), which employers don't need and which put you at risk of fraud.
- Tips: add a headline and a short profile, start points with what you did ("Built", not "Responsible for"), add
  numbers to show results, leave "I" out of your points, keep points short, list skills (but not too many), and
  add dates.

**Downloads**
- **Download PDF:** one A4 page with real, selectable text and clickable email and links, so job sites can read it.
- **Copy as text:** the whole CV as plain text, for pasting into job sites' forms.

**For everyone**
- **No account and nothing uploaded:** your CVs and the PDF are made on your device.
- **Works offline**, **installable** ("Add to Home screen"), light and dark mode, phones and laptops.

## Design
A tidy desk with paper on it: warm grey around, and the CV always on white paper, as it will be printed. One navy
accent for buttons. Tips are marked "Fix" (red) or "Tip" (amber) in words as well as colour.

## Tech stack
Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, pdf-lib (to make the PDF in the browser), Vitest,
GitHub Actions, Vercel. No database: CVs are saved in the browser's localStorage.

## Project structure
```
app/              Your CVs (/), the editor (/edit?id=…), the layout, the app manifest, icons and the light/dark script
components/       The live preview (CvPreview.tsx), the header, the logo, icons and the theme switch
lib/              What a CV is and its helpers (cv.ts), the CV check (checks.ts), saving and backups
                  (storage.ts) and making the PDF (pdf.ts)
tests/            Unit tests for lib/, including real PDFs read back
public/           The offline service worker and the app icons
```

## How the important parts work

**Saving on the device** (`lib/storage.ts`). CVs are kept in localStorage. Every page reads them through one small store
(`useSyncExternalStore`), so the list and the editor always agree, and a change in another tab shows up too. Anything
loaded (from storage or a backup file) goes through `readCv()`, which checks every field and its length, so a broken or
hand-edited file can never crash the app.

**The PDF** (`lib/pdf.ts`). pdf-lib draws the CV with the standard Helvetica and Times fonts, so the text is real text
that CV readers can pick out, and email and links get clickable link areas. `makeCvPdf()` draws it at 10.5pt; if that
takes more than one page, it tries 10, 9.5 and 9pt, and only then allows a second page. The editor builds it in the
background a moment after you stop typing (and pdf-lib only loads on the editor page), so the page count is always
up to date before you download.

**The preview** (`components/CvPreview.tsx`) uses the same sizes as the PDF, in container units (`cqw`: a percentage
of the sheet's width), so it shrinks to fit a phone and stays in proportion.

**The CV check** (`lib/checks.ts`) is plain pattern matching: a 13-digit number that looks like an ID number, words like
"marital status", points that start with "Responsible for", points with no numbers, and so on.

## Tests
`npm test` runs the unit tests in `tests/` with Vitest: dates ("Feb 2024 – Present"), newest-first order, splitting
skills, links, copying CVs and the plain-text version; the CV check (including spotting ID numbers and personal details);
saving and backups (reading them back exactly, and making broken data safe); and the PDF itself: the example CV is one
A4 page in every look, a long CV gets smaller text before a second page, the links are clickable, and characters the
fonts can't draw are swapped. GitHub runs them on every push (`.github/workflows/tests.yml`).

## Setup (run it yourself)
1. `npm install`, then `npm run dev`, and open http://localhost:3000.
2. **Deploy on Vercel:** import the GitHub repo and deploy. There are no settings or environment variables.

## Known gaps
- **CVs live in one browser.** There are no accounts, so moving CVs means downloading and loading a backup.
- **No photo.** Most South African recruiters don't need one, and a photo can confuse CV readers.
- **Standard fonts only** (Helvetica and Times), which can't draw some characters, like emoji. They're left out.
- **One column only**, on purpose: job sites read it most reliably.
- **English only.**

## Use of AI
I built CVcraft with Claude (by Anthropic) as my AI pair programmer:

1. **I chose what to build** from ideas we discussed, to go with HireTrack, my job-hunt tracker.
2. **Claude wrote the code**, starting from the PDF code in my portfolio (my own CV PDF), explained how it works, and
   made the app icons.
3. **I set up Vercel, added the code to my project**, ran it, tested it on my laptop and phone, committed it and
   deployed it, and reported anything that broke or looked wrong so we could fix it.
