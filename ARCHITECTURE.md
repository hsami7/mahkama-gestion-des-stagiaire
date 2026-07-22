# سِجِلّ (Sijill) — Intern Management System Architecture

---

## 1. DOCUMENT & INTERNSHIP LIFECYCLE (End-to-End Workflow)

```
[ PHASE 1: APPLICATION ]
  Public applicant fills Form Builder form at /apply
       |  via POST /api/public-submit
       v
  Intern created with status = 'قيد المراجعة'
  User account created automatically (password = 'password123')
  All form fields stored in intern.documents (JSON blob)
       |
       v
[ PHASE 2: REVIEW & SIGNING ]
  Admin sees 'قيد المراجعة' badge on Dashboard table
       |  Admin navigates to Profile page (/interns/:id)
       v
  Admin inspects uploaded documents (id, convention, demande, insurance, resume)
       |  Admin clicks [قبول الطلب] or [رفض الطلب]
       v
  If missing required docs: status remains 'مستندات ناقصة', Admin can create Document Requests
       |  POST /api/interns/:id/requests
       v
  Intern receives requests via InternPortal -> 'مستنداتي' tab
       |  Intern uploads requested PDFs -> status becomes 'fulfilled'
       v
  Admin can [قبول الطلب] -> Approval Modal appears
       |  Admin sets start_date, end_date
       v
  Intern status updated to 'نشط'
       |
       v
[ PHASE 3: ACTIVE INTERNSHIP ]
  Intern gains full portal access:
    - 'مستنداتي': upload unrequested documents (resume, insurance, etc.)
    - 'التنزيلات': download attestation, profile PDF/MD
    - 'ملفي الشخصي': view personal info
       |
  Admin manages active intern via Profile page:
    - Mark daily attendance (حاضر / غائب / إجازة)
    - Assign/change encadrant (supervisor)
    - Full evaluation modal (5 criteria × 4 points = 20 max)
       |
       v
[ PHASE 4: SUBMISSION & CLOSURE ]
  Intern nearing end date (30 days remaining):
    - Dashboard cards sorted by remaining days ascending
    - Quick-action buttons: [تقييم], [شهادة], [ملفات]
       |
  Admin generates certificate (Attestation de stage):
    POST /api/interns/:id/attestation
       |
  Admin exports full profile PDF (بصيغة PDF):
    GET /api/interns/:id/profile-pdf?mode=full
    - Page 1: formal profile card with photo, personal info, doc checklist
    - Pages 2+: all uploaded documents merged back-to-back
       |
  Status changed to 'منتهي' manually by Admin
       |
       v
[ PHASE 5: ARCHIVAL ]
  Intern account persists but status = 'منتهي'
  Documents remain in interns.documents JSON
  Document Vault (خزنة المستندات) holds standard templates/admin docs
     - Separate storage backend/vault/
     - Admin-only access, no intern visibility
  System Logs archived in system_logs table (last 50 shown in UI)
```

---

## 2. UI/UX WIREFRAMES (ASCII Layouts)

### A. Admin View — Sidebar Navigation

```
┌─────────────────────────────────────────────────────────────────────┐
│  [سـ]  سِجِلّ                                                       │
│        مدير النظام                                                   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ◧  لوحة القيادة                                              │   │
│  │ ┃  المتدربين                                                 │   │
│  │ ≡  منشئ النماذج                                              │   │
│  │ □  خزنة المستندات                                             │   │
│  │ ☰  سجل الحضور اليومي                                          │   │
│  │ ⬟  مخطط التغطية                                              │   │
│  │ ◎  المستخدمين والصلاحيات                                      │   │
│  │ ⚙  الإعدادات                                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [⛔ تسجيل الخروج]                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### B. Admin View — Dashboard (لوحة القيادة)

```
┌───────────────────────────────────────────────────────────────────────────┐
│  لوحة التحكم                                              [خزنة الوثائق]  │
│  نظرة عامة على حالة المتدربين اليوم                        [+ متدرب جديد] │
├───────────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│ │ ⚠ عاجل   │ │          │ │          │ │          │                       │
│ │    2     │ │    1     │ │    3     │ │    6     │                       │
│ │قيد المراجعة│ │مستندات  │ │متدربون   │ │إجمالي    │                       │
│ │          │ │ناقصة    │ │نشطون    │ │المتدربين│                       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘                       │
│                                                                           │
│  أحدث المتدربين                                                          │
│ ┌──────────────────────────────────────────────────────────────────────┐  │
│ │ المتدرب            │ تاريخ البدء والانتهاء      │ الحالة   │ الإجراء  │  │
│ ├────────────────────┼───────────────────────────┼─────────┼──────────┤  │
│ │ [img] متدرب تجريبي │ 01/01/2026 إلى 01/03/2026 │ 🟢 نشط  │ [عرض]   │  │
│ │       test@...     │                           │         │          │  │
│ │ [img] متدرب تجريبي │ 16/02/2026 إلى 20/03/2026 │ 🟡 قيد ال│ [عرض]   │  │
│ │       test@...     │                           │   مراجعة│          │  │
│ │ [img] متدرب تجريبي │ 15/02/2026 إلى 01/07/2026 │ 🟡 قيد ال│ [عرض]   │  │
│ │       test@...     │                           │   مراجعة│          │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

### C. Admin View — Intern Card Grid (المتدربين)

```
┌───────────────────────────────────────────────────────────────────────┐
│  إدارة المتدربين                                     [+ إضافة متدرب]  │
│                                                                       │
│  [🔍 ابحث بالاسم أو الرقم...]   [فلترة: كل الحالات ▼]  [تطبيق] [مسح] │
│                                                                       │
│ ┌─────────────────────┐ ┌─────────────────────┐ ┌────────────────────┐│
│ │ 🟢 نشط              │ │ 🟡 قيد المراجعة      │ │ 🟡 قيد المراجعة    ││
│ │                     │ │                     │ │                    ││
│ │ [img]               │ │ [img]               │ │ [img]              ││
│ │ متدرب تجريبي        │ │ متدرب تجريبي        │ │ متدرب تجريبي       ││
│ │ متدرب               │ │ متدرب               │ │ متدرب              ││
│ │ ID: 2026001         │ │ ID: 2026004         │ │ ID: 2026003        ││
│ │ باقي 30 يوم         │ │                     │ │                    ││
│ │ ─────────────────── │ │                     │ │                    ││
│ │ [📋 تقييم][شهادة]   │ │                     │ │                    ││
│ │ [📁 ملفات]          │ │                     │ │                    ││
│ └─────────────────────┘ └─────────────────────┘ └────────────────────┘│
└───────────────────────────────────────────────────────────────────────┘
```

### D. Admin View — Intern Profile (عرض الملف الشخصي)

```
┌───────────────────────────────────────────────────────────────────────┐
│  [← عودة للقائمة]                                                     │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ [img]  |  متدرب تجريبي                            [شهادة] [Excel] │   │
│  │        |  Test Intern                              [PDF] [تعديل]  │   │
│  │        |  متدرب                                    [حذف]          │   │
│  │        |  🟢 نشط                                                   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────┐ ┌─────────────────────┐                      │
│  │ المعلومات الشخصية    │ │ أيام الحضور          │                      │
│  │ رقم الهوية: AB123456 │ │ [حاضر] [غائب] [إجازة]│                      │
│  │ المؤطر: أحمد علي     │ │ اليوم: 20/07/2026    │                      │
│  │ البريد: test@...     │ │ ──────────────────   │                      │
│  │ الهاتف: 0600000000   │ │ آخر 7 أيام:          │                      │
│  │ العنوان: ...         │ │ ح ح ح ح ح ح ح         │                      │
│  │ ──────────────────   │ │                      │                      │
│  │ تاريخ البدء: 01/01   │ │                      │                      │
│  │ تاريخ الانتهاء:01/03 │ │                      │                      │
│  │ الجامعة: ...         │ │                      │                      │
│  │ القسم: ...           │ │                      │                      │
│  └─────────────────────┘ └─────────────────────┘                      │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ طلبات المستندات                         [طلب مستند] [طلب إعادة] │   │
│  │ ● بطاقة التعريف الوطنية:  مرفوعة ✓                              │   │
│  │ ● اتفاقية التدريب:        مرفوعة ✓                              │   │
│  │ ● التأمين:                مرفوعة ✓                              │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ تقييم وإتمام التدريب                             [تقييم المتدرب]│   │
│  │ الانضباط: ████░░░░ 8/10                                         │   │
│  │ المهارات: ████░░░░ 7/10                                         │   │
│  │ العمل الجماعي: █████░░░ 9/10                                    │   │
│  │ المبادرة: ███░░░░░ 6/10                                         │   │
│  │ الجودة: ████░░░░ 8/10                                           │   │
│  │ المجموع: 38/50                                                  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ القرار النهائي للملف          [✕ رفض الطلب]  [✓ قبول الطلب]   │   │
│  └────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
```

### E. Admin View — Document Vault (خزنة المستندات)

```
┌───────────────────────────────────────────────────────────────────────┐
│  خزنة المستندات                                                        │
│  النماذج والمستندات القياسية الجاهزة للمتدربين                        │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │ رفع مستند جديد للخزنة                                          │    │
│  │ [اسم المستند_____________________________________________]     │    │
│  │ [اختر ملف...]  [📤 رفع الملف]                                 │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │ [🗑]         │  │ [🗑]         │  │ [🗑]         │                │
│  │              │  │              │  │              │                │
│  │    [PDF]     │  │    [PDF]     │  │    [PDF]     │                │
│  │              │  │              │  │              │                │
│  │ طلب التدريب  │  │ شهادة        │  │ مطبوعات     │                │
│  │ 150.2 KB     │  │ 89.1 KB      │  │ 210.5 KB    │                │
│  │ [عرض][تحميل] │  │ [عرض][تحميل] │  │ [عرض][تحميل] │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
└───────────────────────────────────────────────────────────────────────┘
```

### F. Intern View — Portal (بوابة المتدرب)

```
┌───────────────────────────────────────────────────────────────────────┐
│  [سـ]  سِجِلّ                              حالة الطلب | 20/07/2026  │
│        بوابة المتدرب                                                 │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ ◎  حالة الطلب                                                 │   │
│  │ □  مستنداتي                                                   │   │
│  │ ⬇  التنزيلات                                                  │   │
│  │ ┃  ملفي الشخصي                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  حالة الطلب                                                     │   │
│  │                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │  خط سير طلب التسجيل                                     │    │   │
│  │  │  [✓] تقديم الطلب → [✓] مراجعة المستندات → [○] القبول    │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │                                                                 │   │
│  │  [!] طلبات إعادة رفع المستندات (في حال وجودها)                  │   │
│  │  ● اتفاقية التدريب  —  [تحميل النموذج]  [اختر ملف...] [رفع]    │   │
│  │  ● التأمين           —  [تحميل النموذج]  [اختر ملف...] [رفع]    │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  [⚪ الحالة] [📄 مستنداتي] [⬇ تنزيلات] [👤 ملفي]                     │
│  ────────────────────────────────  ──── موبايل بوتوم ناف  ──────────  │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 3. DATABASE SCHEMA & BACKEND FILE STORAGE LOGIC

### A. Local Storage Folder Layout

```
backend/
├── app.py                        # Flask application (all routes)
├── pdf_report.py                 # PDF generation engine (ReportLab + pypdf)
├── requirements.txt              # Python dependencies
│
├── uploads/                      # ⬅ All uploaded files (photos, docs, templates)
│   ├── IMG_0859.JPG              # Intern photo (landscape/portrait)
│   ├── test.pdf                  # Intern documents (convention, cin, etc.)
│   ├── 2026.pdf
│   ├── Releve_de_note_arije_attar_S5.pdf
│   ├── tpl_<uuid>.pdf            # Template file uploaded by Admin with a DocumentRequest
│   ├── req_<uuid>.pdf            # Uploaded by intern in response to a request
│   ├── doc_<uuid>.pdf            # Uploaded by admin when creating/editing intern
│   └── msg_<uuid>.pdf            # (legacy) Message attachment files
│
├── vault/                        # ⬅ Document Vault (separate from intern docs)
│   └── طلب التدريب.pdf           # Admin-uploaded standard templates
│
├── instance/
│   └── database.sqlite           # ⬅ SQLite database (all tables)
│
└── templates/                    # (not used - all HTML is in frontend)
```

### B. Relational Database Tables Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATABASE: database.sqlite                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  users                                                           │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │  id          INTEGER  PK  AUTO_INCREMENT                         │   │
│  │  name        VARCHAR(150)  NOT NULL                              │   │
│  │  email       VARCHAR(150)  UNIQUE  NOT NULL                      │   │
│  │  password    VARCHAR(200)  NOT NULL  (werkzeug hash)              │   │
│  │  role        VARCHAR(50)   NOT NULL  ('Admin'/'Intern'/'Manager') │   │
│  │  permissions TEXT          NULL      (JSON permissions blob)      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │ 1:N via email                            │
│                              ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  interns                                                        │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │  id          INTEGER  PK  AUTO_INCREMENT                         │   │
│  │  name        VARCHAR(150)  NOT NULL   (Arabic full name)          │   │
│  │  name_fr     VARCHAR(150)  NULL       (French/Latin name)         │   │
│  │  email       VARCHAR(150)  NULL                                   │   │
│  │  national_id VARCHAR(50)   NULL       (CIN)                       │   │
│  │  department  VARCHAR(100)  NULL                                   │   │
│  │  encadrant   VARCHAR(150)  NULL       (supervisor)                │   │
│  │  status      VARCHAR(50)   DEFAULT 'قيد المراجعة'                  │   │
│  │  photo_path  VARCHAR(255)  NULL       (URL or /api/uploads/ path) │   │
│  │  phone       VARCHAR(50)   NULL                                   │   │
│  │  start_date  VARCHAR(50)   NULL       (DD/MM/YYYY)               │   │
│  │  end_date    VARCHAR(50)   NULL                                   │   │
│  │  date_of_birth VARCHAR(50) NULL                                   │   │
│  │  university  VARCHAR(150)  NULL                                   │   │
│  │  address     TEXT          NULL                                   │   │
│  │  documents   TEXT          NULL       (JSON: {type: url, ...})    │   │
│  │  evaluation  TEXT          NULL       (JSON: criteria, comments)  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │ 1:N via intern_id                        │
│              ┌───────────────┼─────────────────────┐                    │
│              ▼               ▼                     ▼                    │
│  ┌──────────────────┐  ┌─────────────┐  ┌──────────────────────┐       │
│  │  attendance       │  │ document_   │  │  messages            │       │
│  │                   │  │ requests    │  │                      │       │
│  ├──────────────────┤  ├─────────────┤  ├──────────────────────┤       │
│  │ id INTEGER PK    │  │ id INTEGER  │  │ id INTEGER PK        │       │
│  │ intern_id FK     │  │   PK        │  │ intern_id FK         │       │
│  │ date VARCHAR(20) │  │ intern_id   │  │ sender_role VARCHAR  │       │
│  │ status VARCHAR   │  │   FK        │  │ sender_name VARCHAR  │       │
│  │   (حاضر/غائب     │  │ document_   │  │ body TEXT            │       │
│  │    /إجازة)       │  │   type      │  │ attachment_path      │       │
│  └──────────────────┘  │   VARCHAR   │  │ attachment_name      │       │
│                        │ custom_title│  │ waiting_for_reply BOOL│       │
│                        │ note TEXT   │  │ expected_format      │       │
│                        │ status      │  │ replied BOOL         │       │
│                        │   VARCHAR   │  │ created_at VARCHAR   │       │
│                        │   ('pending'│  └──────────────────────┘       │
│                        │    /'fulfil-│                                  │
│                        │    led'/'sup│  ┌──────────────────────┐       │
│                        │    erseded')│  │  system_logs         │       │
│                        │ created_at  │  ├──────────────────────┤       │
│                        │ template_   │  │ id INTEGER PK        │       │
│                        │   path      │  │ timestamp DATETIME   │       │
│                        └─────────────┘  │ user VARCHAR(150)    │       │
│                                          │ action TEXT          │       │
│  ┌──────────────────────┐               └──────────────────────┘       │
│  │  forms               │                                              │
│  ├──────────────────────┤                                              │
│  │ id INTEGER PK        │                                              │
│  │ form_data TEXT       │  (JSON array of form fields for /apply)      │
│  └──────────────────────┘                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### C. Documents JSON Schema (stored in `interns.documents`)

```json
{
  "id": "/api/uploads/cin.pdf",
  "convention": "/api/uploads/convention.pdf",
  "demande": "/api/uploads/demande.pdf",
  "insurance": "/api/uploads/insurance.pdf",
  "resume": "/api/uploads/resume.pdf",
  "photo": "/api/uploads/photo.jpg",
  "others": [
    {"name": "شهادة طبية", "file": "/api/uploads/medical.pdf"},
    {"name": "كشف نقط", "file": "/api/uploads/grades.pdf"}
  ]
}
```

### D. Evaluation JSON Schema (stored in `interns.evaluation`)

```json
{
  "criteria": {
    "discipline": 3,
    "skills": 4,
    "teamwork": 2,
    "initiative": 3,
    "quality": 4
  },
  "comments": "متدرب مجتهد ويستحق التقدير",
  "total": 16,
  "max": 20,
  "evaluator": "مدير النظام",
  "date": "2026-07-20 14:30"
}
```

### E. Data Access Control Logic

**No row-level visibility filters exist.** Access control is purely route-level:

| Role | API Access | Notes |
|------|-----------|-------|
| `Admin` | All endpoints | JWT `role` claim checked at each route |
| `Manager` | Configurable via `permissions` JSON field | `interns.view` / `attendance.view` / `forms.view` / `vault.view` |
| `Intern` | Own data only | Identified by matching `User.email` → `Intern.email`; no `intern_id` FK on `User` |

Admin vs Intern routing is decided **at the app entry level** (`src/App.tsx:46-69`):
- If `role === 'Intern'` → renders `<InternPortal />`
- Otherwise → renders `<Layout>` with sidebar + admin pages

File serving:
- `GET /api/uploads/<filename>` — **no auth required** (public). Used for profile photos in UI.
- `GET /api/vault/<filename>` — **no auth required** (public). Vault is admin-only by UI access.
- `GET /api/documents/<filename>` — **no auth required** (public).

---

## 4. DEPLOYMENT & NETWORK CONFIGURATION

### Local Development

```
Backend (Flask):
  Host: 127.0.0.1
  Port: 5055
  Protocol: HTTP (no HTTPS)
  Auth: JWT (7-day token, passed via Authorization: Bearer or ?token= query param)
  Database: SQLite (file-based, no separate DB server)
  CORS: Enabled for all origins

Frontend (Vite):
  Host: 127.0.0.1
  Port: 5173  (Vite default, configured in vite.config.ts)
  Proxy: /api → http://127.0.0.1:5055 (configured in vite.config.ts)

Production Build:
  Output: dist/ (Vite build output, served as static files)
  Backend: Flask serves static dist/ in production
```

### Configuration Constants

```python
# backend/app.py
app.config['JWT_SECRET_KEY'] = 'mahkama-secret-key-2026'       # ⚠ Hardcoded
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 7 days
app.config['MAX_CONTENT_LENGTH'] = 20 MB                        # Flask-level limit
app.config['UPLOAD_FOLDER'] = './uploads'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/database.sqlite'
```

### File Size Limits by Endpoint

| Endpoint | Size Limit | Type(s) |
|----------|-----------|---------|
| `/api/upload_photo` | 15 MB | png, jpg, jpeg, webp |
| `/api/documents` | 5 MB | PDF only |
| `/api/vault` | 5 MB | PDF only |
| `/api/public-upload` | 15 MB | any extension |
| `/api/intern/requests/:id/upload` | 15 MB | PDF only |
| `/api/intern/upload_unrequested` | 15 MB | PDF only |
| Global (Flask) | 20 MB | all |

### Security Weaknesses (from audit)

1. **Hardcoded JWT secret** in source code (`mahkama-secret-key-2026`)
2. **Public file upload endpoints** (`/api/uploads/<path>` and `/api/vault/<path>`) serve files without authentication
3. **Default passwords** for new interns (`password123`) — no force-reset on first login
4. **No HTTPS** — all traffic in plaintext over HTTP
5. **No rate limiting** on login or upload endpoints
6. **JWT token exposed in query string** (`?token=`) for window.open compatibility — logged in server logs, browser history
7. **SQLite in production** — no connection pooling, no replication, file-level locking
