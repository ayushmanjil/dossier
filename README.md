# Sahityika Recruitment Archive

A CSV-driven recruitment dashboard for Sahityika. Upload one cleaned CSV
export of Google Form responses and the site organizes it into a
department-by-department, applicant-by-applicant dossier archive.

**There is no Google Sheets integration and no backend server.** The
workflow this app expects is:

```
Google Form → Google Sheet → clean/remove sensitive columns → export CSV → upload here
```

## Architecture

```
GitHub → Render (static site) → Firebase (Firestore + Auth)
```

This is a plain static frontend (Vite + React). It talks to Firebase
directly from the browser using the client SDK — there is no Express
server, no separate API layer, nothing else to deploy. It's built to sit
inside a larger existing static-site-on-Render project; the recruitment
module lives entirely under its own routes/files and doesn't touch
anything else.

- **Frontend**: React + React Router, Vite build, Tailwind v4 (CSS-first
  theme, see `src/index.css`)
- **CSV parsing**: 100% client-side, via PapaParse (`src/lib/csvImporter.js`)
- **Persistence**: Firestore when configured (`src/lib/firebase.js` +
  `src/lib/store.js`); falls back to `localStorage` automatically if no
  Firebase project keys are supplied, so the module is fully demoable on
  its own before being wired into your real project
- **Auth**: Firebase Auth email/password gate on the upload page
  (`src/components/AdminGate.jsx`), also optional/graceful — if Auth isn't
  configured the upload page just runs open, with a visible notice

## Running it

```bash
npm install
cp .env.example .env      # fill in your Firebase web config, or leave blank for demo mode
npm run dev
```

Then visit the printed local URL. With `.env` left blank, the app runs in
local/demo mode — everything persists to `localStorage` in your browser
instead of Firestore, and the upload page has no sign-in requirement.

A ready-to-use sample CSV matching every column described in the brief
(including a couple of intentionally messy rows — an unrecognized
department value and a row missing a name) lives at
`public/sample-data/sample-applications.csv`. Upload it from `/admin/upload`
to see the whole flow work end to end.

### Deploying

Point Render's static site build at `npm run build`, publish directory
`dist`. Set the `VITE_FIREBASE_*` env vars in Render's dashboard so the
production build talks to your real Firestore project instead of falling
back to `localStorage`.

## How the CSV becomes the dashboard

```
CSV
 → PapaParse (raw rows + headers)
 → header matching against recruitmentConfig.js (fuzzy: case/whitespace/
   punctuation-insensitive)
 → one Application object per row
 → grouped by department (client-side, from the data — never hard-coded)
 → written to Firestore (or localStorage) as the new source of truth
 → Dashboard / Department / Applicant pages all just read from that store
```

Nothing downstream of the importer knows anything about CSV columns. The
applicant dossier page, for example, just receives an `Application` object
shaped like:

```js
{
  applicantId,        // stable, derived from roll number (or name+row as fallback)
  name,
  rollNumber,
  department,          // slug, e.g. "creative-designing"
  departmentLabel,     // "Creative Designing"
  timestamp,
  commonAnswers: { degree, level, gender, house, homeState, ... },
  departmentAnswers: [
    { key, label, type, prose, links, rawAnswer }, // only this applicant's department's questions
  ],
  links: [ { url, label, sourceQuestion } ],
}
```

## Adding or changing departments/questions

Everything lives in **`src/config/recruitmentConfig.js`**. This is the
only file you should need to touch to:

- Add a new department → add an entry to the `DEPARTMENTS` array with a
  `slug`, `label`, `match` (accepted spellings from the raw CSV
  department column), and a `questions` array.
- Add/remove/reorder a question within a department → edit that
  department's `questions` array. Each question needs `key`, `label`,
  `match` (accepted header spellings), and a `type`:
  - `"short"` — brief inline answer
  - `"long"` — paragraph answer, gets manuscript-style typography
  - `"feature"` — a long answer that should stand out (used for the two
    creative-writing articles and the PR plan) — rendered with an accent
    border and a "Featured Response" tag
  - `"url"` — answer is treated as one or more links and rendered as
    buttons instead of raw text (used for portfolios/best-works)
  - `"resume"` — same as `url` but labeled specifically as a résumé
- Retire a question → delete it, or move it into `PENDING_QUESTIONS` if
  it's still showing up in exports but doesn't belong anywhere yet.

**No UI code needs to change for any of this.** The dashboard,
department roster, and applicant dossier are all generic renderers driven
by this config plus whatever's in the uploaded CSV.

### Handling form evolution

The brief's CSV had three columns near the end that don't belong to any
current department (a declaration checkbox, a video-editing-experience
question, a social-media-audit question). These are listed in
`PENDING_QUESTIONS` in the config. The importer recognizes them (so they
don't show up as noisy "unmapped" warnings) but deliberately does **not**
display them anywhere until a human decides where they belong — at which
point, move the entry into the right department's `questions` array.

Any column the importer doesn't recognize at all (typos, a genuinely new
question, a leftover blank column) shows up in the import summary under
"Unmapped columns" so nothing is ever silently dropped without you seeing
it.

## Data model & the future interviewer system

`src/lib/store.js` already separates **application data** (from the CSV)
from **evaluation data** (interviewer ratings/comments), even though the
interviewer system itself isn't built yet:

```js
// today, from the CSV:
applications/{applicantId}

// not wired into the UI yet, but the shape and functions already exist:
evaluations/{applicantId}_{interviewerId}  →  { applicantId, interviewerId, rating, comments, updatedAt }
```

`saveEvaluation()` and `getEvaluationsForApplicant()` are implemented
(Firestore + localStorage fallback) but not called from any page yet.
When the interviewer system is built, it can attach ratings to an
applicant purely by `applicantId` — no changes to the CSV import or the
applicant data model are needed.

## Project structure

```
src/
  config/recruitmentConfig.js   ← the single source of truth (departments, questions)
  lib/
    csvImporter.js               CSV → validated Application[] + import summary
    normalize.js                 header/string normalization for fuzzy matching
    links.js                     URL detection & link-button labeling
    firebase.js                  Firebase client init (guarded, optional)
    store.js                     persistence: Firestore or localStorage, + evaluations stub
  context/ApplicationsContext.jsx  app-wide data store (applications, uploadCsv())
  hooks/useRecruitmentData.js      derived selectors (department summaries, applicant lookup)
  components/                      DepartmentCard, ApplicantCard, AnswerBlock, LinkButton,
                                    UploadDropzone, AdminGate, Layout, MetaField, EmptyState
  pages/
    Dashboard.jsx                  department cards + live counts
    DepartmentView.jsx             applicant roster: search/sort/filter
    ApplicantView.jsx              applicant dossier
    UploadAdmin.jsx                CSV upload + import summary
```
