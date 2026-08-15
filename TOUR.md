# 🗺️ Mahkama Intern Manager - Visual System Tour & Walkthrough (`TOUR.md`)
## نظام إدارة المتدربين - الدليل المصور للجولة التطبيقية

This document serves as the visual guided tour of the **Mahkama Intern Manager** application. It showcases the actual screens, interface components, workflows, and role-based views across the Admin, Manager, and Intern portals using high-resolution application screenshots.

---

## 📑 Table of Contents
1. [Admin Portal (مدير النظام) Tour](#1-admin-portal-مدير-النظام-tour)
   - [1. Executive Dashboard](#1-executive-dashboard-)
   - [2. Interns Directory & Search](#2-interns-directory--search-)
   - [3. Intern Profile & Evaluation Matrix](#3-intern-profile--evaluation-matrix-internsid)
   - [4. Form Builder Studio](#4-form-builder-studio-form-builder)
   - [5. Central Document Vault](#5-central-document-vault-vault)
   - [6. Daily Attendance Register](#6-daily-attendance-register-attendance)
   - [7. Timeline & Coverage Planner](#7-timeline--coverage-planner-timeline)
   - [8. Users & Permissions Manager](#8-users--permissions-manager-users)
   - [9. Global System Settings & Audit Logs](#9-global-system-settings--audit-logs-settings)
2. [Manager Portal (مدير قسم / مؤطر) Tour](#2-manager-portal-مدير-قسم--مؤطر-tour)
3. [Intern Self-Service Portal (بوابة المتدرب) Tour](#3-intern-self-service-portal-بوابة-المتدرب-tour)

---

## 1. Admin Portal (مدير النظام) Tour

### 1. Executive Dashboard (`/`)
The primary operational dashboard providing high-level KPIs, urgent application approvals, and intern distribution analytics.

![Admin Dashboard](docs/images/admin_dashboard.png)

* **Key Highlights:**
  * **Top Metric Cards:** Instant view of total interns, urgent actions, pending reviews, missing documents, and active status.
  * **Application Submissions Drawer:** Review incoming candidate requests with quick action buttons (Approve / Reject).
  * **Department Capacity Progress Bars:** Real-time visual density per court department.

---

### 2. Interns Directory & Search (`/interns`)
Central registry for searching, filtering, and exporting intern records.

![Admin Interns Directory](docs/images/admin_interns.png)

* **Key Highlights:**
  * **Status Pills:** Clean color-coded badges (`نشط`, `قيد المراجعة`, `مكتمل`).
  * **Instant Filter:** Live search by Name, CIN (National ID), Specialty, or University.
  * **Bulk Export Tools:** Export database selections to PDF summary reports or Excel files.

---

### 3. Intern Profile & Evaluation Matrix (`/interns/:id`)
Comprehensive 360-degree intern dossier with identity details, document queue, attendance record, and 5-criteria performance evaluation.

![Admin Intern Profile](docs/images/admin_intern_profile.png)

* **Key Highlights:**
  * **Identity Card:** Arabic & French names, CIN, contact info, assigned Encadrant.
  * **Document Lifecycle:** Uploaded CNI, Insurance, Training Agreement status.
  * **Evaluation Grid:** 5-criteria performance evaluation (Discipline, Technical Skills, Teamwork, Initiative, Quality) scored out of 20.

---

### 4. Form Builder Studio (`/form-builder`)
Studio for configuring custom application forms, generating public application links, and syncing with Google Forms.

![Admin Form Builder](docs/images/admin_form_builder.png)

* **Key Highlights:**
  * **Field Manager:** Configure required fields (Text, Select, File Uploads).
  * **Google Sync:** Auto-import form responses directly into the court database.

---

### 5. Central Document Vault (`/vault`)
Secure digital vault for storing official court document templates, intern CVs, signed agreements, and certificates.

![Admin Document Vault](docs/images/admin_document_vault.png)

* **Key Highlights:**
  * **Category Folders:** CVs, National IDs, Training Agreements, Certificates.
  * **Administrative Actions:** Instant document preview, download, and digital signing.

---

### 6. Daily Attendance Register (`/attendance`)
Interactive daily log for tracking intern presence, absence, and excused leaves.

![Admin Attendance Register](docs/images/admin_attendance.png)

* **Key Highlights:**
  * **Quick Status Toggle:** One-click attendance logging (`حاضر`, `غائب`, `معذور`).
  * **Monthly Roll Call:** Cumulative attendance history used for certificate issuance.

---

### 7. Timeline & Coverage Planner (`/timeline`)
Gantt-style visual timeline tracking active internship spans to prevent department overcrowding.

![Admin Timeline Planner](docs/images/admin_timeline.png)

* **Key Highlights:**
  * **Gantt Bars:** Visual representation of internship start and end dates.
  * **Capacity Warning:** Highlights peak months with high intern density.

---

### 8. Users & Permissions Manager (`/users`)
Role-Based Access Control (RBAC) panel for managing court staff accounts and permission grants.

![Admin Users & Permissions](docs/images/admin_users.png)

* **Key Highlights:**
  * **User Creation:** Create department manager accounts (`Manager` role).
  * **Permission Matrix:** Granular permission flags (`interns.view`, `attendance.view`, `vault.view`, `documents.manage`).

---

### 9. Global System Settings & Audit Logs (`/settings`)
Administrative settings for configuring Outlook SMTP email integration, Google API credentials, database backups, and security audit logs.

![Admin System Settings](docs/images/admin_settings.png)

* **Key Highlights:**
  * **Email Service:** Configure Microsoft Outlook / SMTP server settings.
  * **Audit Log:** Complete event log capturing system logins, approvals, and security updates.

---

## 2. Manager Portal (مدير قسم / مؤطر) Tour

When a Department Manager or Encadrant logs into the platform, the interface automatically adapts according to their assigned permissions.

![Manager Dashboard View](docs/images/manager_dashboard.png)

* **Key Highlights:**
  * **Scoped Access:** Managers only view interns assigned under their supervision.
  * **Restricted Navigation:** Administrative tabs (System Settings, Users) are hidden automatically.
  * **Direct Evaluation:** Supervisors can directly evaluate assigned interns.

---

## 3. Intern Self-Service Portal (بوابة المتدرب) Tour

When an intern logs into their dedicated portal, they see a personalized, clean dashboard tailored for their internship journey.

![Intern Portal Dashboard](docs/images/intern_dashboard.png)

* **Key Highlights:**
  * **Personal Status Card:** Live status tracking (Active, Pending Documents, Completed).
  * **Document Upload & Download:** Upload required identity files (CIN, Insurance) and download officially approved & signed internship certificates.
  * **Document Requests:** Track and fulfill custom document requests issued by administration.

---

*Tour Document generated on August 15, 2026.*
