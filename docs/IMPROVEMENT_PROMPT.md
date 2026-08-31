# Improvement Prompt — Intern Management Web App

Repo: https://github.com/hsami7/mahkama-gestion-des-stagiaire

## Current architecture (verified)
- Backend: Flask in `backend/app.py`, SQLAlchemy, SQLite at `backend/instance/database.sqlite`.
- Frontend: React + TypeScript + Vite under `src/`, wrapped in Electron (`npm run electron:full`).
- Backend serves on port 5055.
- Existing models in `backend/app.py`: `User`, `Intern`, `Attendance`, `DocumentRequest`, `Form`, `FormSubmission`, `Message`, `SystemLog`, `DocumentLifecycle`.
- `DocumentLifecycle` status enum: `MISSING`, `PENDING_REVIEW`, `REVISION_REQUESTED`, `APPROVED_AND_SIGNED`. Fields: `file_path`, `uploaded_by` (INTERN/ADMIN), `rejection_reason`, `is_visible_to_intern`, `requires_return`, `returned_file_path`.

## Hard language constraints (apply to EVERY change)
1. **All user-facing strings in the app UI must be Modern Standard Arabic (MSA) only. Do NOT use any Moroccan Darija words anywhere — labels, buttons, error messages, notifications, generated PDFs.**
2. **All numeric and date inputs/displays must use Latin digits (0–9), never Eastern Arabic numerals (٠–٩).**
3. Keep the layout RTL. Reuse existing Arabic terms already present in the app for consistency.
4. The attestation PDF is currently generated in **French** (`backend/app.py` `/attestation` route) — rewrite it to **Arabic** to comply with the above rule.
5. Enum/status values stay in English in code (`MISSING`, `PENDING_REVIEW`, …); translate to Arabic only in the UI layer.

## Goal
Apply the improvements below WITHOUT breaking existing data (the DB already contains records, so new columns must be nullable or have defaults, and added via the existing `init_db` migration pattern using `ALTER TABLE` inside `try/except`).

---

## 1. Database (Schema)

1. **New `Notification` table:**
   - `id` (PK)
   - `intern_id` (FK → `interns.id`)
   - `type` (string: `REJECTION`, `REASSIGNMENT`, `REQUEST`, `STAGE_COMPLETE`, `GENERIC`)
   - `title` (string)
   - `body` (string)
   - `related_doc_id` (nullable)
   - `is_read` (boolean, default `False`)
   - `created_at` (DateTime)

2. **New `AuditEvent` table** (structured audit instead of free-text `SystemLog`):
   - `id`, `actor_user_id` (nullable), `actor_role` (string), `action` (string), `doc_id` (nullable), `from_status` (nullable), `to_status` (nullable), `note` (nullable), `created_at` (DateTime).
   (Keep `SystemLog` for backward compatibility, but record structural events in `AuditEvent`.)

3. **Extend `DocumentLifecycle`** with columns:
   - `lifecycle_type` (string, default `'SIGN'`; values: `STATIC`, `FILL`, `SIGN`, `FILL_SIGN`)
   - `form_schema` (text/JSON, nullable) — definition of form fields to fill.
   - `form_data` (text/JSON, nullable) — values the user entered.
   - `assigned_to_intern_id` (nullable FK → `interns.id`) — hand the doc to another intern to fill/sign.
   - `signed_by` (string, nullable) — who signed (`INTERN`, `ADMIN`, or both).
   - `correction_round` (integer, default `0`) — count of reject/re-upload cycles.
   - `parent_id` (nullable self-FK) — link a certificate to its training report.

4. **Convert date fields from string to real types:**
   - `Intern.start_date`, `end_date`, `date_of_birth` → `Date`.
   - `DocumentLifecycle.created_at`, `updated_at` → `DateTime`.
   (Migration should parse existing string values to dates where possible; leave null otherwise.)

5. **Merge `DocumentRequest` with `DocumentLifecycle`:** when a manager requests a document, also create a `DocumentLifecycle` row with status `MISSING` plus a `Notification` for the intern. Prefer adding a `lifecycle_id` FK on `DocumentRequest` instead of duplicating state.

---

## 2. Backend logic (`backend/app.py`)

1. **On document reject** (`/api/interns/<id>/documents/<doc_id>/reject`): set `REVISION_REQUESTED`, increment `correction_round`, store `rejection_reason`, and **create a `Notification` of type `REJECTION` for the intern** so they are alerted and can re-upload (this alert is currently missing).

2. **On intern re-upload** (after reject, via `/return-upload` or normal upload): reset to `PENDING_REVIEW`, clear `rejection_reason`, and record an `AuditEvent`.

3. **Assign to another intern:** add `POST /api/interns/<id>/documents/<doc_id>/assign` (Admin/Manager). Sets `assigned_to_intern_id` and creates a `REASSIGNMENT` `Notification` for that intern so it appears in their inbox and they can fill/sign.

4. **Stage completion + certificate:** add `POST /api/interns/<id>/complete-stage` (Admin/Manager):
   - Verify all required documents are `APPROVED_AND_SIGNED`.
   - Generate the certificate PDF (reuse existing `/attestation` logic, **output in Arabic**).
   - Create a `DocumentLifecycle` row (`lifecycle_type=SIGN`, `parent_id` = training report if present).
   - Create a `STAGE_COMPLETE` `Notification` so the intern can download the certificate.

5. **Notification + audit endpoints:**
   - `GET /api/intern/notifications` → current intern's notifications (unread first).
   - `POST /api/intern/notifications/<nid>/read` → mark read.
   - `GET /api/interns/<id>/audit` → `AuditEvent` ordered by time.

6. **Handle `lifecycle_type` in upload/sign endpoints:**
   - `FILL`/`FILL_SIGN`: accept `form_data` (JSON) in addition to / instead of a file.
   - `SIGN` only: do not require the intern to upload a file.
   - Track `signed_by` on every signature.

7. Preserve current role permissions (Admin/Manager/Intern).

---

## 3. Frontend UI (`src/`)

1. **Intern portal** (`InternPortal` and related): redesign the home as **inbox-first**:
   - Header with a notification bell + unread-count badge.
   - Section "الإجراءات المطلوبة منك الآن" (pending: sign / re-upload after rejection / fill form / assigned-to-you) and a "المكتملة" section.
   - Per-document card showing the correct CTA by state:
     - `REVISION_REQUESTED` → red card "تم رفض المستند، يرجى إعادة الرفع" with the `rejection_reason` shown.
     - `requires_return` + `PENDING_REVIEW` → "يرجى رفع النسخة المعبأة".
     - `FILL`/`FILL_SIGN` without a file → render form fields from `form_schema` instead of a bare upload button.
     - `APPROVED_AND_SIGNED` + visible → "تحميل".
   - Notification panel with mark-as-read.

2. **Admin dashboard** (`Dashboard` / intern detail): redesign as a **queue board**:
   - Columns: "بانتظار المراجعة" (`PENDING_REVIEW`), "مرفوض — يتطلب تصحيحًا" (`REVISION_REQUESTED`, red), "مكتمل" (`APPROVED_AND_SIGNED`).
   - Approve/Reject buttons; reject opens a modal that requires a reason (which generates a `Notification`).
   - Add an "تعيين لمتدرب آخر" (assign to another intern) action.

3. **Stage completion:** a "إنهاء التدريب" button on the intern detail calls `complete-stage`, generates the certificate, and alerts the intern.

4. **Mandatory text rules:**
   - Every user-visible string = MSA Arabic only, no Darija.
   - All numeric/date inputs use Latin digits (0–9).
   - Keep RTL layout.
   - Reuse existing Arabic terms in the app for consistency.

---

## 4. General requirements
- Do not break the `init_db` migration pattern (new columns via `ALTER TABLE` inside `try/except`).
- Stay compatible with existing data (new columns nullable or defaulted).
- Keep Electron build working (`npm run electron:full`) and backend on port 5055.
- Keep status enum names in English in code; translate to Arabic only in the UI.
