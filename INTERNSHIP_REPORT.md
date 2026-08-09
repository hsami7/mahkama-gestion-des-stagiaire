# UNIVERSITÉ EUROMÉDITERRANÉENNE DE FÈS (UEMF)
## EUROMED INSTITUTE OF TECHNOLOGY / CYBERSECURITY ENGINEERING

---

```
                       ___          ___          ___          ___ 
                      /  /\        /  /\        /  /\        /  /\
                     /  /:/       /  /::\      /  /::\      /  /::\
                    /  /:/       /  /:/\:\    /  /:/\:\    /  /:/\:\
                   /  /:/  ___  /  /::\ \:\  /  /::\ \:\  /  /::\ \:\
                  /__/:/  /  /\/__/:/\:\_\:\/__/:/\:\_\:\/__/:/\:\_\:\
                  \  \:\ /  /:/\  \:\ \:\/\/\  \:\ \:\/\/\  \:\ \:\/\/\
                   \  \:\  /:/  \  \:\ \:\   \  \:\ \:\   \  \:\ \:\
                    \  \:\/:/    \  \:\_\/    \  \:\_\/    \  \:\_\/
                     \  \::/      \  \:\       \  \:\       \  \:\
                      \__\/        \__\/        \__\/        \__\/
```

***

# END-OF-STUDIES / INTERNSHIP REPORT (RAPPORT DE STAGE)

### **TITLE:** DESIGN, SECURE DEVELOPMENT, AND ENTERPRISE DEPLOYMENT OF AN INTEGRATED INTERNSHIP MANAGEMENT & DOCUMENT LIFECYCLE PLATFORM (*SIJILL / MAHKAMA INTERN MANAGER*)

**Specialty:** 3rd Year Cybersecurity Engineering  
**Academic Institution:** Euromed University of Fès (UEMF)  
**Host Institution:** Administrative Court of Appeal of Fès (*Tribunal Administratif d'Appel de Fès*)  
**Department:** IT & Registry Department (*Service Informatique et Greffe*)  

---

**Author:** Hatim SAMI (3rd Year Cybersecurity Engineering Student)  
**Professional Supervisor (Court):** [Court Technical Supervisor Name / Placeholder]  
**Academic Year:** 2025 – 2026  

---

\newpage

## CONFIDENTIALITY & NON-DISCLOSURE NOTICE

> [!IMPORTANT]
> **RESTRICTED DISTRIBUTION NOTICE**  
> This document contains technical specifications, system architecture designs, database models, and operational security assessments developed during the internship at the **Administrative Court of Appeal of Fès**. Certain sensitive configuration defaults and structural topologies described herein are intended solely for academic evaluation by the examination jury of the **Euromed University of Fès (UEMF)**. Unauthorized copying, public disclosure, or distribution without prior written consent from the Administrative Court of Appeal of Fès is strictly prohibited.

---

## DEDICATION

*To my family, for their unwavering support, encouragement, and belief in my academic and professional journey.*  
*To the faculty members of the Euromed University of Fès, for instilling in me the values of engineering rigor and technological innovation.*  
*To the administrative staff and technical officers at the Administrative Court of Appeal of Fès, for their guidance, hospitality, and trust throughout this internship.*

---

## ACKNOWLEDGMENTS

I would like to express my sincere gratitude to all individuals who contributed to the successful completion of this engineering internship and the realization of this project.

First and foremost, I extend my heartfelt thanks to the leadership and staff of the **Administrative Court of Appeal of Fès** (*Tribunal Administratif d'Appel de Fès*) for granting me the privilege to carry out my 3rd-year Cybersecurity Engineering internship within their prestigious judicial institution. 

Special gratitude is extended to my **Professional Supervisor** at the Court for his continuous support, technical guidance, and valuable insights into the operational workflows and administrative governance of the Moroccan judicial system. His trust allowed me to assume full technical responsibility over the end-to-end design, implementation, and security hardening of the **Mahkama Intern Management System (*Sijill*)**.

I am equally grateful to the distinguished faculty of the **Euromed University of Fès (UEMF)**, particularly the Professors and Coordinators of the Cybersecurity Engineering Department. Their rigorous academic curriculum equipped me with the theoretical foundations and practical competencies in software architecture, web security, threat modeling, and cryptography necessary to execute this complex project.

Finally, I address my sincere appreciation to the members of the examination jury for evaluating this work and providing critical feedback to enhance its academic and professional quality.

---

\newpage

## ABSTRACT

In public administrations and judicial institutions, managing human resources—specifically university interns and temporary research trainees—remains heavily reliant on manual paperwork, physical filings, and fragmented tracking tools. At the **Administrative Court of Appeal of Fès**, processing dozens of intern applications per session presented operational bottlenecks, data tracking discrepancies, document security risks, and administrative latency.

This internship report details the engineering design, full-stack software development, security hardening, and enterprise network deployment of **"Sijill / Mahkama Intern Manager"**, an end-to-end web-based management and document lifecycle platform custom-built for the Court. Designed from a **Cybersecurity Engineering** perspective, the platform digitizes the complete internship lifecycle across five key stages: public application intake via a dynamic Form Builder, administrative application review and multi-criteria scoring, active internship attendance and supervisor assignment, automated legal document generation (Attestation de stage, evaluation sheets, unified PDF dossiers), and secure archival.

Architecturally, the application is built on a decoupled full-stack paradigm utilizing **React 18, Vite, TypeScript, and Tailwind CSS** on the frontend, and **Python Flask, Flask-JWT-Extended, SQLAlchemy, and ReportLab** on the backend. Security engineering is baked into the platform through a custom Role-Based Access Control (RBAC) system with granular permission matrices, JWT identity validation, strict input sanitization, file extension and MIME-type enforcement, path traversal mitigation, and automated system activity auditing. To address operational constraints in judicial networks without internet access, the solution features an automated Windows Server setup wizard (`setup.bat`) powered by the **Waitress WSGI engine**, enabling local network distribution across all court workstations with zero client-side installation.

**Keywords:** Cybersecurity Engineering, Full-Stack Web Architecture, Flask, React, Role-Based Access Control (RBAC), Legal Document Automation, Judicial Information Systems, Enterprise Deployment, Waitress WSGI, Administrative Court of Appeal of Fès.

---

## RÉSUMÉ (FRENCH)

Dans les administrations publiques et les institutions judiciaires, la gestion des ressources humaines—notamment des stagiaires universitaires—repose encore largement sur des processus papier, des classements physiques et des outils de suivi fragmentés. Au sein du **Tribunal Administratif d'Appel de Fès**, le traitement des demandes de stage engendrait des goulots d'étranglement opérationnels, des risques de traçabilité des données, des faiblesses de sécurité documentaire et des délais administratifs importants.

Ce rapport de stage d'ingénieur présente la conception, le développement full-stack, le renforcement de la sécurité et le déploiement réseau de la plateforme **« Sijill / Mahkama Intern Manager »**, une application web intégrée de gestion et de cycle de vie documentaire conçue spécifiquement pour le Tribunal. Élaborée selon une approche rigoureuse en **Ingénierie de la Cybersécurité**, la solution numérise l'intégralité du parcours des stagiaires : candidature publique via un générateur de formulaires dynamique, instruction et validation des dossiers par l'administration, suivi quotidien de présence et affectation des encadrants, génération automatisée de documents officiels (Attestations de stage, fiches d'évaluation, dossiers PDF fusionnés) et archivage sécurisé.

Sur le plan architectural, l'application s'appuie sur une architecture découplée intégrant **React 18, Vite, TypeScript et Tailwind CSS** pour le frontend, et **Python Flask, Flask-JWT-Extended, SQLAlchemy et ReportLab** pour le backend. La sécurité est intégrée au cœur du système via un contrôle d'accès basé sur les rôles (RBAC) avec matrice de permissions granulaires, l'authentification par jetons JWT, la vérification stricte des types de fichiers, la prévention du traversement de répertoire et le journalisme d'audit du système. Afin de répondre aux exigences de déploiement en réseau local judiciaire, l'application intègre un script d'installation automatisé sur Windows Server (`setup.bat`) propulsé par le serveur WSGI **Waitress**, offrant un accès transparent à l'ensemble des postes de travail du Tribunal sans installation préalable.

**Mots-clés :** Ingénierie de la Cybersécurité, Architecture Full-Stack, Flask, React, Contrôle d'Accès basé sur les Rôles (RBAC), Automatisation Documentaire, Système d'Information Judiciaire, Déploiement Entreprise, Tribunal Administratif d'Appel de Fès.

---

\newpage

## LIST OF ABBREVIATIONS & ACRONYMS

| Acronym | Definition / Expansion |
| :--- | :--- |
| **API** | Application Programming Interface |
| **Bcrypt** | Adaptive Password Hashing Function |
| **CNE / CNI** | Code National de l'Étudiant / Carte Nationale d'Identité |
| **CORS** | Cross-Origin Resource Sharing |
| **CRUD** | Create, Read, Update, Delete |
| **DOM** | Document Object Model |
| **DTO** | Data Transfer Object |
| **ERD** | Entity-Relationship Diagram |
| **HMR** | Hot Module Replacement |
| **HTTP / HTTPS** | Hypertext Transfer Protocol (Secure) |
| **ID** | Identifier / Identification |
| **ISO / IEC** | International Organization for Standardization / International Electrotechnical Commission |
| **JSON** | JavaScript Object Notation |
| **JWT** | JSON Web Token |
| **LAN** | Local Area Network |
| **MIME** | Multipurpose Internet Mail Extensions |
| **NFR** | Non-Functional Requirement |
| **NIST** | National Institute of Standards and Technology |
| **ORM** | Object-Relational Mapping (SQLAlchemy) |
| **OWASP** | Open Web Application Security Project |
| **PDF** | Portable Document Format |
| **PFE** | Projet de Fin d'Études (End-of-Studies Project) |
| **PWA** | Progressive Web Application |
| **RBAC** | Role-Based Access Control |
| **REST** | Representational State Transfer |
| **RTL** | Right-to-Left (Language Layout for Arabic) |
| **SDK** | Software Development Kit |
| **SPA** | Single Page Application |
| **SQL** | Structured Query Language |
| **SSI / IS** | Information Systems Security / Information System |
| **TLS / SSL** | Transport Layer Security / Secure Sockets Layer |
| **UEMF** | Université Euroméditerranéenne de Fès (Euromed University of Fès) |
| **UI / UX** | User Interface / User Experience |
| **UML** | Unified Modeling Language |
| **URL** | Uniform Resource Locator |
| **Vite** | Next Generation Frontend Tooling |
| **WSGI** | Web Server Gateway Interface |

---

\newpage

## LIST OF FIGURES

- **Figure 1.1:** Organizational Structure of the Administrative Court of Appeal of Fès
- **Figure 1.2:** Agile Scrum Sprint Delivery Roadmap
- **Figure 2.1:** OWASP Top 10 Threat Mapping for Judicial Information Systems
- **Figure 2.2:** Multi-Tier Technology Stack Decomposition
- **Figure 3.1:** High-Level UML Use Case Diagram for Sijill Platform
- **Figure 4.1:** Global System Architecture & Network Topology Diagram
- **Figure 4.2:** Complete Database Entity-Relationship Diagram (ERD)
- **Figure 4.3:** State Machine Diagram for Document Lifecycle (`MISSING` → `APPROVED`)
- **Figure 4.4:** Authentication & JWT Verification Flowchart
- **Figure 4.5:** Dynamic RBAC Permission Verification Sequence
- **Figure 5.1:** Custom Form Builder UI Engine & JSON Serialization Flow
- **Figure 5.2:** Dynamic PDF Report Generation Architecture (ReportLab Engine)
- **Figure 6.1:** Automated Pytest Execution Results Matrix
- **Figure 7.1:** Production Deployment Architecture using Waitress WSGI on Windows Server

---

## LIST OF TABLES

- **Table 3.1:** Functional Requirements Traceability Matrix
- **Table 3.2:** Non-Functional Requirements & Acceptance Criteria
- **Table 4.1:** Database Relational Schema Dictionary
- **Table 4.2:** Endpoint Security & Authorization Access Control Matrix
- **Table 4.3:** File Size Limits and MIME Enforcement Rules
- **Table 6.1:** Vulnerability Assessment & Mitigation Ledger (OWASP Audit)
- **Table 6.2:** System Audit Log Event Types

---

\newpage

## TABLE OF CONTENTS

1. [CHAPTER 1: GENERAL INTRODUCTION & INSTITUTIONAL CONTEXT](#chapter-1-general-introduction--institutional-context)
   - 1.1 Project Background & Motivation
   - 1.2 Host Institution Profile: Administrative Court of Appeal of Fès
   - 1.3 Problem Statement & Current Bottlenecks
   - 1.4 Objectives & Project Scope
   - 1.5 Project Management & Development Methodology
2. [CHAPTER 2: STATE OF THE ART & CYBERSECURITY FRAMEWORK](#chapter-2-state-of-the-art--cybersecurity-framework)
   - 2.1 Comparative Analysis of Existing Solutions
   - 2.2 Cybersecurity & Compliance Standards in Judicial Systems
   - 2.3 Technology Stack Evaluation & Selection Rationale
3. [CHAPTER 3: REQUIREMENTS ENGINEERING & SYSTEM SPECIFICATION](#chapter-3-requirements-engineering--system-specification)
   - 3.1 Stakeholder Identification & User Personas
   - 3.2 Functional Requirements Specification
   - 3.3 Non-Functional & Security Requirements
   - 3.4 System Modeling & UML Diagrams
4. [CHAPTER 4: SYSTEM DESIGN & CYBERSECURITY ARCHITECTURE](#chapter-4-system-design--cybersecurity-architecture)
   - 4.1 High-Level Architectural Topology
   - 4.2 Relational Database Schema & Data Models
   - 4.3 Document Lifecycle & State Machine Design
   - 4.4 Cybersecurity Architecture & Defense Mechanisms
5. [CHAPTER 5: IMPLEMENTATION & TECHNICAL DEVELOPMENTS](#chapter-5-implementation--technical-developments)
   - 5.1 Backend Development & REST API Implementation
   - 5.2 Dynamic Form Builder Engine
   - 5.3 PDF Generation & Merging Engine
   - 5.4 Frontend Architecture & User Interface Design
   - 5.5 External Integrations (Outlook SMTP & Google APIs)
6. [CHAPTER 6: SECURITY AUDIT, TESTING & QUALITY ASSURANCE](#chapter-6-security-audit-testing--quality-assurance)
   - 6.1 Automated Testing Framework & Test Cases
   - 6.2 OWASP Security Vulnerability Audit
   - 6.3 Audit Logging & System Diagnostics
7. [CHAPTER 7: PRODUCTION DEPLOYMENT & OPERATIONAL GUIDE](#chapter-7-production-deployment--operational-guide)
   - 7.1 Server Infrastructure & Environment Setup
   - 7.2 Automated Installation Wizard Design (`setup.bat`)
   - 7.3 Client Workstation Access & PWA Strategy
   - 7.4 Backup, Disaster Recovery & Operational Maintenance
8. [GENERAL CONCLUSION & PERSPECTIVES](#general-conclusion--perspectives)
9. [BIBLIOGRAPHY & REFERENCES](#bibliography--references)
10. [APPENDICES](#appendices)

---

\newpage

# CHAPTER 1: GENERAL INTRODUCTION & INSTITUTIONAL CONTEXT

## 1.1 Project Background & Motivation

Digital transformation within the public sector has emerged as a cornerstone of administrative modernization worldwide. In the Kingdom of Morocco, the Ministry of Justice (*Ministère de la Justice*) has initiated ambitious digital transition programs under the **"E-Justice"** roadmap, aimed at streamlining judicial administrative procedures, modernizing court registries (*Greffe*), and transitioning from paper-centric workflows to secure digital governance.

While judicial litigation workflows have progressively integrated specialized e-services, the internal administrative operations of courts—specifically human resources management, university intern processing, document validation, and certification—have frequently lagged behind. Every academic semester, judicial institutions receive hundreds of internship applications from university students across law, economics, computer science, and public administration faculties. 

Managing this inflow manually presents significant operational friction: physical paper files are easily lost, verifying required legal documents (such as convention agreements, identity cards, and liability insurance) is time-consuming, monitoring daily attendance across multiple court departments is error-prone, and issuing official certificates of completion requires manual data re-entry.

To solve these challenges, this engineering project was launched during my 3rd-year Cybersecurity Engineering internship at the **Administrative Court of Appeal of Fès** (*Tribunal Administratif d'Appel de Fès*). The project aimed to design, build, secure, and deploy an enterprise-grade, web-based management platform named **"Sijill / Mahkama Intern Manager"**.

---

## 1.2 Host Institution Profile: Administrative Court of Appeal of Fès

### 1.2.1 Institutional Overview & Legal Mandate
The **Administrative Court of Appeal of Fès** (*Tribunal Administratif d'Appel de Fès*) is a specialized judicial body within the Moroccan judicial organization framework, established pursuant to Law No. 80-03 instituting administrative courts of appeal. Located in the historic city of Fès, the Court exercises appellate jurisdiction over legal disputes involving public legal entities, state ministries, local municipalities, and administrative decisions issued by administrative courts of first instance within its territorial jurisdiction (covering the Fès-Meknès region and adjacent provinces).

```
┌───────────────────────────────────────────────────────────────────────────┐
│              ADMINISTRATIVE COURT OF APPEAL OF FÈS                        │
│          (TRIBUNAL ADMINISTRATIF D'APPEL DE FÈS - COURT ORGANIGRAM)       │
└───────────────────────────────────────────────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌────────────────────────────────┐               ┌──────────────────────────┐
│   PRESIDENCY OF THE COURT      │               │   PUBLIC PROSECUTION     │
│   (First President & Judges)   │               │   (Commissaire du Droit) │
└────────────────────────────────┘               └──────────────────────────┘
                 │
                 ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                    COURT REGISTRY & GENERAL SECRETARIAT                   │
│                    (Secrétariat du Greffe / كتابة الضبط)                   │
└───────────────────────────────────────────────────────────────────────────┘
                 │
        ┌────────┴───────────────────────────┐
        ▼                                    ▼
┌────────────────────────────────┐   ┌──────────────────────────────────────┐
│  JUDICIAL CHAMBERS & SESSIONS  │   │  IT & ADMINISTRATIVE SERVICES        │
│  (Chambres Administratives)    │   │  (Service Informatique et Ressources)│
└────────────────────────────────┘   └──────────────────────────────────────┘
```
*Figure 1.1: Organizational Structure of the Administrative Court of Appeal of Fès*

### 1.2.2 IT & Registry Department Operations
The **IT & Registry Department** (*Service Informatique et Greffe*) plays a pivotal role in maintaining the court’s operational continuity. It is responsible for managing:
1. **Network Infrastructure & Servers:** Internal local area networks (LAN), intranet domain controllers, database servers, and court management software.
2. **Data Security & Confidentiality:** Protecting sensitive judicial files, citizen administrative appeals, internal communications, and employee/intern records.
3. **Internship & HR Logistics:** Overseeing university research trainees, law interns, and technical engineering interns hosted within various court chambers.

---

## 1.3 Problem Statement & Current Bottlenecks

Prior to the introduction of the **Sijill** platform, the Administrative Court of Appeal of Fès relied on a hybrid manual process for managing intern intake and administrative tracking. An extensive operational audit revealed several critical vulnerabilities and inefficiencies:

1. **Information Fragmentation & Data Loss:** Applicant information was collected via printed paper forms, physical CV copies, and disparate Excel spreadsheets across departments, leading to data duplication, conflicting records, and misplaced documents.
2. **Insecure Document Handling:** Sensitive personal data (such as national ID cards - CIN, home addresses, phone numbers, and academic transcripts) were stored in unencrypted physical filing cabinets or shared over unsecured network folders.
3. **Manual Certification Bottlenecks:** At the conclusion of an internship, court clerks had to manually type and print completion certificates (*Attestations de stage*) and evaluation sheets. This process took several days per batch and was susceptible to typographical errors.
4. **Lack of Granular Access Control:** Administrative assistants, division heads, and court managers shared general network accounts, making it impossible to audit who created, modified, approved, or deleted an intern record.
5. **No Self-Service Portal for Interns:** Interns had no direct visibility into their application status, missing document requirements, daily attendance logs, or generated certificates, requiring constant physical inquiries at the court registry.

---

## 1.4 Objectives & Project Scope

The primary objective of this project was to engineer a centralized, secure, highly performant, and user-friendly web application—**Mahkama Intern Manager (*Sijill*)**—to digitize and automate the entire internship lifecycle while maintaining strict compliance with cybersecurity best practices and data privacy standards.

### 1.4.1 Key Project Goals
- **Full Lifecycle Automation:** Create an end-to-end digital workflow spanning public online application intake, application review, active intern tracking, attendance logging, legal document generation, and digital archival.
- **Dynamic Form Builder Engine:** Develop an admin-facing form builder allowing court managers to dynamically build, publish, and update application intake forms without modifying source code.
- **Robust Role-Based Access Control (RBAC):** Implement a multi-role authorization system (`Admin`, `Manager`, `Intern`) equipped with granular permission matrices to guarantee least-privilege access.
- **Automated PDF Engine:** Engineer a server-side document generation system capable of rendering pixel-perfect official certificates, multi-page profile summary dossiers, and combined PDF packages.
- **Cybersecurity Hardening:** Eliminate top OWASP vulnerabilities (SQL Injection, XSS, Path Traversal, Broken Access Control, Data Exposure) and enforce secure JWT token handling.
- **Zero-Friction Windows Deployment:** Provide a lightweight, autonomous server deployment package (`setup.bat` + Waitress WSGI) optimized for court servers running in offline/intranet environments.

---

## 1.5 Project Management & Development Methodology

To ensure disciplined execution, rapid feedback loops, and high software quality within the academic and professional timeframe, an **Agile Scrum Methodology** was adopted.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    AGILE SCRUM DEVELOPMENT ROADMAP                        │
└───────────────────────────────────────────────────────────────────────────┘
   │
   ├─► SPRINT 1 (Weeks 1-2): Requirements Analysis & Domain Modeling
   │   └─► User story mapping, UML design, DB schema definition.
   │
   ├─► SPRINT 2 (Weeks 3-5): Backend Core Architecture & Database Setup
   │   └─► Flask API implementation, JWT auth, RBAC middleware, Pytest suite.
   │
   ├─► SPRINT 3 (Weeks 6-8): Frontend SPA Development & UI Engineering
   │   └─► React 18 component tree, Vite state management, RTL Arabic UI layout.
   │
   ├─► SPRINT 4 (Weeks 9-10): PDF Generation & Form Builder Engine
   │   └─► ReportLab document engine, dynamic JSON form builder, template vault.
   │
   └─► SPRINT 5 (Weeks 11-12): Security Audit, Testing & Server Deployment
       └─► OWASP security audit, Pytest coverage (14/14 API tests), Waitress deployment.
```
*Figure 1.2: Agile Scrum Sprint Delivery Roadmap*

---

\newpage

# CHAPTER 2: STATE OF THE ART & CYBERSECURITY FRAMEWORK

## 2.1 Comparative Analysis of Existing Solutions

Before designing the architecture of **Sijill**, a comparative benchmark was conducted against existing commercial HR software, open-source intern portals, and generic ERP modules.

| Feature / Metric | Commercial HR Cloud SaaS | Generic Open-Source ERP | Sijill (Custom Court Solution) |
| :--- | :--- | :--- | :--- |
| **Deployment Model** | Cloud SaaS (Third-party) | Self-hosted Server | Intranet Self-Hosted (Offline Server) |
| **Data Residency** | Hosted Abroad (Non-compliant) | Local Server | 100% On-Premise Court Server |
| **Arabic RTL Support** | Weak / Partial | Complex customization required | Native Arabic RTL UI & Document Generation |
| **Legal PDF Automation** | Generic Templates | Limited PDF Customization | Pixel-Perfect Official Moroccan Court Badges & PDFs |
| **Dynamic Intake Forms** | Extra Paid Add-on | Static Form Modules | Built-in Drag-and-Drop Form Builder |
| **Resource Footprint** | Heavy Subscription Cost | High CPU/RAM requirements | Lightweight Python Flask + Waitress WSGI |
| **Data Privacy Compliance** | Violates CNDP 09-08 rules | Requires heavy hardening | Native Compliance with CNDP & OWASP Standards |

---

## 2.2 Cybersecurity & Compliance Standards in Judicial Systems

Operating within a judicial administration imposes stringent security imperatives. The system handling court records and citizen personal data must adhere to international cybersecurity standards and domestic privacy regulations.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                 CYBERSECURITY & COMPLIANCE FRAMEWORK                       │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   ┌───────────────────────────┐           ┌───────────────────────────┐   │
│   │   MOROCCAN CNDP LAW 09-08 │           │      ISO/IEC 27001        │   │
│   │   Personal Data Protection│           │ Information Security Mgmt │   │
│   └─────────────┬─────────────┘           └─────────────┬─────────────┘   │
│                 │                                       │                 │
│                 └───────────────────┬───────────────────┘                 │
│                                     ▼                                     │
│                   ┌───────────────────────────────────┐                   │
│                   │      SIJILL PLATFORM CORE         │                   │
│                   │      SECURITY CONTROLS            │                   │
│                   └─────────────────┬─────────────────┘                   │
│                                     │                                     │
│                 ┌───────────────────┴───────────────────┐                 │
│                 ▼                                       ▼                 │
│   ┌───────────────────────────┐           ┌───────────────────────────┐   │
│   │    OWASP TOP 10 (2021)     │           │   NIST SP 800-53 CONTROLS │   │
│   │ Application Vulnerability │           │ Identity, Auth & Auditing │   │
│   │        Mitigation         │           │                           │   │
│   └───────────────────────────┘           └───────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘
```
*Figure 2.1: OWASP Top 10 Threat Mapping for Judicial Information Systems*

1. **Moroccan Law No. 09-08 (CNDP):** Regulates the protection of individuals with regard to the processing of personal data. The platform enforces data minimization, secure file storage, explicit consent mechanisms during public application submission, and strict access boundaries.
2. **OWASP Top 10 (2021) Standards:** The platform’s code base was audited against broken access control, cryptographic failures, injection attacks, insecure design, and security logging failures.
3. **Least Privilege Principle (NIST SP 800-53 AC-6):** Users (Admins, Managers, Interns) receive only the minimal authorizations necessary to perform their respective tasks.

---

## 2.3 Technology Stack Evaluation & Selection Rationale

To meet the requirements of performance, security, maintainability, and rapid development, a multi-tier decoupled web architecture was selected.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                  SIJILL MULTI-TIER TECHNOLOGY STACK                       │
└───────────────────────────────────────────────────────────────────────────┘

  [ PRESENTATION LAYER - FRONTEND ]
  ├── Framework: React 18 (SPA)
  ├── Build Tool: Vite 8.1
  ├── Language: TypeScript 5.0 (Strict Typing)
  ├── Styling: Vanilla CSS + Utility Tokens + Lucide React Icons
  └── Routing & HTTP: React Router v6 + Fetch API Wrapper (`api.ts`)

        │  JSON over HTTP (REST API / Bearer JWT)
        ▼

  [ DOMAIN & APPLICATION LAYER - BACKEND ]
  ├── Web Framework: Python Flask 3.0
  ├── WSGI Server: Waitress 3.0 (Production Multi-threaded Windows WSGI)
  ├── Authentication: Flask-JWT-Extended 4.6 (SHA-256 / HMAC JWT Tokens)
  ├── Password Hashing: Werkzeug Security (PBKDF2-HMAC-SHA256)
  └── PDF Generation: ReportLab 4.0 + PyPDF 6.14 Engine

        │  SQL Alchemy ORM queries
        ▼

  [ PERSISTENCE & DATA STORAGE LAYER ]
  ├── Database: SQLite 3 (SQLAlchemy ORM 3.1)
  ├── Document Storage: Protected File System Storage (`backenduploads/`, `vault/`)
  └── System Logs: Relational Audit Log Table (`system_logs`)
```
*Figure 2.2: Multi-Tier Technology Stack Decomposition*

### 2.3.1 Rationale for Key Technology Choices
- **React 18 + Vite:** Offers ultra-fast client-side page transitions, component modularity, and hot module replacement during development. Single Page Application (SPA) architecture ensures zero full-page reloads.
- **TypeScript:** Enforces strict static typing across all UI state interfaces, preventing runtime JavaScript errors and undefined state bugs.
- **Python Flask:** A micro-framework providing raw speed, security transparency, and flexibility without the overhead of heavy enterprise frameworks.
- **Waitress WSGI:** A pure-Python production WSGI server native to Windows, eliminating complex IIS/Nginx setups on court servers.
- **ReportLab + PyPDF:** Enables programmatic, dynamic PDF generation, custom Arabic text wrapping, and merging multiple PDF files into a single unified profile portfolio.

---

\newpage

# CHAPTER 3: REQUIREMENTS ENGINEERING & SYSTEM SPECIFICATION

## 3.1 Stakeholder Identification & User Personas

The system caters to three primary user personas within the court ecosystem:

1. **System Administrator (Court IT Admin):** Responsible for managing system users, configuring global settings, building intake forms, managing the document vault, and performing audit log reviews.
2. **Court Manager / Clerk (Division Head):** Responsible for reviewing incoming intern applications, inspecting uploaded legal documents, logging daily attendance, scoring intern performance, and generating official certificates.
3. **Intern Applicant / Active Trainee:** The public student who submits an application via `/apply`, tracks registration progress, uploads missing documents, and downloads generated certificates via the `/portal`.

---

## 3.2 Functional Requirements Specification

The system's capabilities are categorized into six core functional modules detailed in the traceability matrix below:

| Req ID | Module | Feature Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-01** | **Form Builder** | Admin can dynamically create, edit, reorder, and remove fields for public intake forms. | **High** |
| **FR-02** | **Public Intake** | Students can access `/apply`, complete the form, upload documents, and submit an application. | **High** |
| **FR-03** | **App Review** | Admin can review pending applications, inspect documents, accept, or reject files. | **High** |
| **FR-04** | **Doc Requests** | Admin can request specific missing documents (e.g., insurance, convention) from an intern. | **High** |
| **FR-05** | **Intern Portal** | Interns can log into `/portal` to check status, upload requested PDFs, and download files. | **High** |
| **FR-06** | **Attendance** | Admin/Manager can log daily attendance (Present, Absent, On Leave) per intern. | **Medium** |
| **FR-07** | **Evaluation** | Admin can evaluate active interns across 5 criteria (Disciplines, Skills, Teamwork, etc.). | **Medium** |
| **FR-08** | **Certificates** | Server generates official PDF completion certificates (*Attestation de stage*) with badges. | **High** |
| **FR-09** | **Profile PDF** | Server merges intern personal card + all uploaded PDFs into a single unified dossier. | **High** |
| **FR-10** | **Doc Vault** | Admin can store standard templates (e.g., blank agreements) in a secure vault. | **Medium** |
| **FR-11** | **User & RBAC** | Admin can create accounts, assign roles (`Admin`, `Manager`, `Intern`), and configure permissions. | **High** |
| **FR-12** | **System Audit** | System logs critical actions (logins, status changes, document deletions) in an audit ledger. | **High** |

*Table 3.1: Functional Requirements Traceability Matrix*

---

## 3.3 Non-Functional & Security Requirements

| Category | Req ID | Requirement Statement & Acceptance Criteria |
| :--- | :--- | :--- |
| **Performance** | **NFR-01** | Page load time under 1.5 seconds on local intranet LAN; REST API response time < 200ms. |
| **Security** | **NFR-02** | Passwords must be hashed using PBKDF2-HMAC-SHA256 (Werkzeug). Plaintext passwords prohibited. |
| **Authorization**| **NFR-03** | JWT tokens must expire after 7 days; protected routes must return HTTP 401/403 on invalid claims. |
| **Input Safety** | **NFR-04** | All file uploads must enforce extension and MIME validation; max upload payload capped at 20MB. |
| **Usability** | **NFR-05** | Complete Right-to-Left (RTL) Arabic interface layout using clear typography and visual cues. |
| **Availability**| **NFR-06** | System must operate 24/7 as an offline Windows service without external internet dependencies. |
| **Auditability** | **NFR-07** | Administrative modifications must generate timestamped entries in `system_logs`. |

*Table 3.2: Non-Functional Requirements & Acceptance Criteria*

---

## 3.4 System Modeling & UML Diagrams

### 3.4.1 High-Level Use Case Diagram
The following UML Use Case diagram illustrates the interaction boundaries between the three primary actors and the platform modules:

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │           SIJILL PLATFORM USE CASES                    │
                                  └────────────────────────────────────────────────────────┘

 [ PUBLIC APPLICANT ] ──────────► ( UC-01: Fill & Submit Public Form at /apply )
                                  ( UC-02: Upload Required Documents: CIN, Convention )

                                  ( UC-03: Login to Intern Portal at /portal )
 [ ACTIVE INTERN ] ─────────────► ( UC-04: View Application Status & Track Timeline )
                                  ( UC-05: Upload Missing / Requested PDFs )
                                  ( UC-06: Download Completion Attestation )

                                  ( UC-07: Configure Dynamic Intake Form Builder )
                                  ( UC-08: Review & Approve / Reject Applications )
 [ COURT ADMIN / MANAGER ] ─────► ( UC-09: Mark Daily Attendance Log )
                                  ( UC-10: Evaluate Intern Performance Score )
                                  ( UC-11: Generate Official PDF Certificates )
                                  ( UC-12: Manage User Accounts & RBAC Permissions )
                                  ( UC-13: Manage Document Vault Templates )
                                  ( UC-14: Audit System Activity Logs )
```
*Figure 3.1: High-Level UML Use Case Diagram for Sijill Platform*

---

\newpage

# CHAPTER 4: SYSTEM DESIGN & CYBERSECURITY ARCHITECTURE

## 4.1 High-Level Architectural Topology

The system is deployed on a dedicated Windows Server within the intranet of the Administrative Court of Appeal of Fès. Court workstations connect directly over HTTP to port `5055`.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    COURT INTRANET NETWORK TOPOLOGY                        │
└───────────────────────────────────────────────────────────────────────────┘

  [ COURT WORKSTATIONS ]          [ COURT WORKSTATIONS ]          [ PUBLIC INTERN ]
  (Clerk 1 - Chrome/Edge)         (IT Manager - Chrome)           (Applicant Laptop)
        │                               │                               │
        │ HTTP (LAN Port 5055)          │ HTTP (LAN Port 5055)          │ HTTP / Network
        ▼                               ▼                               ▼
┌───────────────────────────────────────────────────────────────────────────┐
│              WINDOWS SERVER (TRIBUNAL ADMINISTRATIF FÈS)                  │
│                                                                           │
│   ┌───────────────────────────────────────────────────────────────────┐   │
│   │                 WAITRESS PRODUCTION WSGI ENGINE                   │   │
│   │                 Binding: 0.0.0.0:5055 (Multi-Threaded)            │   │
│   └──────────────────┬────────────────────────────────┘   │
│                                      │                                    │
│                                      ▼                                    │
│   ┌───────────────────────────────────────────────────────────────────┐   │
│   │                      FLASK APPLICATION CORE                       │   │
│   │  - Static Asset Middleware (Serves compiled React `dist/` SPA)   │   │
│   │  - REST API Router (`/api/*` endpoints)                           │   │
│   │  - JWT Middleware & RBAC Permission Guard                         │   │
│   └──────────────────┬─────────────────────────────┬──────────────────┘   │
│                      │                             │                      │
│                      ▼                             ▼                      │
│   ┌──────────────────────────────┐    ┌──────────────────────────────┐    │
│   │   SQLAlchemy ORM (SQLite DB) │    │  ENCRYPTED FILE STORAGE      │    │
│   │   `instance/database.sqlite` │    │  `backenduploads/`, `vault/` │    │
│   └──────────────────────────────┘    └──────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────────────┘
```
*Figure 4.1: Global System Architecture & Network Topology Diagram*

---

## 4.2 Relational Database Schema & Data Models

The persistence layer relies on SQLite managed via SQLAlchemy ORM. The relational structure consists of eight primary tables, detailed in the entity-relationship dictionary below.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            SQLITE RELATIONAL DATABASE SCHEMA                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────┐            ┌─────────────────────────────────────┐  │
│  │         users           │            │              interns                │  │
│  ├─────────────────────────┤            ├─────────────────────────────────────┤  │
│  │ id (PK)         INT     │            │ id (PK)                  INT        │  │
│  │ name            VARCHAR │            │ name                     VARCHAR    │  │
│  │ email (UQ)      VARCHAR │            │ name_fr                  VARCHAR    │  │
│  │ password        VARCHAR │ 1 ────── N │ email                    VARCHAR    │  │
│  │ role            VARCHAR │            │ national_id (CIN)        VARCHAR    │  │
│  │ permissions     TEXT    │            │ department               VARCHAR    │  │
│  └─────────────────────────┘            │ encadrant                VARCHAR    │  │
│                                         │ status                   VARCHAR    │  │
│                                         │ photo_path               VARCHAR    │  │
│                                         │ phone                    VARCHAR    │  │
│                                         │ start_date / end_date    VARCHAR    │  │
│                                         │ date_of_birth            VARCHAR    │  │
│                                         │ university               VARCHAR    │  │
│                                         │ address                  TEXT       │  │
│                                         │ documents                TEXT (JSON)│  │
│                                         │ evaluation               TEXT (JSON)│  │
│                                         └──────────────────┬──────────────────┘  │
│                                                            │                     │
│               ┌────────────────────────────────────────────┼─────────────────┐   │
│               │ 1                                          │ 1               │ 1 │
│               ▼ N                                          ▼ N               ▼ N │
│  ┌─────────────────────────┐            ┌─────────────────────┐    ┌───────────┐ │
│  │       attendance        │            │  document_requests  │    │ messages  │ │
│  ├─────────────────────────┤            ├─────────────────────┤    ├───────────┤ │
│  │ id (PK)         INT     │            │ id (PK)         INT │    │ id        │ │
│  │ intern_id (FK)  INT     │            │ intern_id (FK)  INT │    │ intern_id │ │
│  │ date            VARCHAR │            │ document_type   VAR │    │ body      │ │
│  │ status          VARCHAR │            │ custom_title    VAR │    │ attachment│ │
│  └─────────────────────────┘            │ status          VAR │    └───────────┘ │
│                                         │ template_path   VAR │                  │
│                                         └─────────────────────┘                  │
│  ┌─────────────────────────┐            ┌─────────────────────┐    ┌───────────┐ │
│  │         forms           │            │  document_vault     │    │system_logs│ │
│  ├─────────────────────────┤            ├─────────────────────┤    ├───────────┤ │
│  │ id (PK)         INT     │            │ id (PK)         INT │    │ id        │ │
│  │ form_data       TEXT    │            │ title           VAR │    │ timestamp │ │
│  └─────────────────────────┘            │ file_path       VAR │    │ user      │ │
│                                         └─────────────────────┘    │ action    │ │
│                                                                    └───────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```
*Figure 4.2: Complete Database Entity-Relationship Diagram (ERD)*

### 4.2.1 Data Dictionary

| Table Name | Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `users` | `id` | Integer | Primary Key, Auto Increment | Unique user identifier |
| `users` | `email` | String(150) | Unique, Not Null | User login email address |
| `users` | `password` | String(200) | Not Null | PBKDF2-hashed password string |
| `users` | `role` | String(50) | Not Null | System role (`Admin`, `Manager`, `Intern`) |
| `users` | `permissions` | Text (JSON) | Nullable | Custom granular permission list |
| `interns` | `id` | Integer | Primary Key, Auto Increment | Unique intern registration ID |
| `interns` | `status` | String(50) | Default: `'قيد المراجعة'` | Current lifecycle stage |
| `interns` | `documents` | Text (JSON) | Nullable | JSON map of document keys to file paths |
| `interns` | `evaluation` | Text (JSON) | Nullable | JSON breakdown of criteria scores & comments |
| `attendance`| `intern_id` | Integer | Foreign Key (`interns.id`) | Reference to intern record |
| `document_requests`| `status` | String(50) | Default: `'pending'` | Lifecycle: `'pending'`, `'fulfilled'`, `'superseded'` |

*Table 4.1: Database Relational Schema Dictionary*

---

## 4.3 Document Lifecycle & State Machine Design

Documents submitted by interns transition through strict state machine rules enforced by backend business logic.

```
                  ┌───────────────────────────────────────────────────┐
                  │          DOCUMENT LIFECYCLE STATE MACHINE          │
                  └───────────────────────────────────────────────────┘

      [ PUBLIC APPLICATION SUBMITTED ]
                     │
                     ▼
             ┌───────────────┐
             │    MISSING    │  (Required document not yet uploaded)
             └───────┬───────┘
                     │
                     ├─► Intern uploads file via Portal
                     ▼
             ┌───────────────┐
             │ PENDING_REVIEW│  (File uploaded; awaiting Admin inspection)
             └───────┬───────┘
                     │
         ┌───────────┴─────────────────────────┐
         │ Admin accepts                       │ Admin requests revision
         ▼                                     ▼
 ┌───────────────┐                     ┌───────────────┐
 │   APPROVED    │                     │  REVISION_    │
 └───────────────┘                     │   REQUESTED   │
                                       └───────┬───────┘
                                               │ Intern re-uploads
                                               └───────► (PENDING_REVIEW)
```
*Figure 4.3: State Machine Diagram for Document Lifecycle (`MISSING` → `APPROVED`)*

---

## 4.4 Cybersecurity Architecture & Defense Mechanisms

### 4.4.1 Authentication & JWT Token Management
Authentication uses JSON Web Tokens (JWT) issued upon successful verification of user credentials via `/api/login`. Tokens are signed using SHA-256 HMAC keys stored in environment variables (`JWT_SECRET_KEY`).

```
[ CLIENT BROWSER ]                                        [ FLASK API SERVER ]
        │                                                          │
        │ 1. POST /api/login { username, password }                 │
        ├─────────────────────────────────────────────────────────►│
        │                                                          │ 2. Verify PBKDF2 hash
        │                                                          │ 3. Generate JWT Token
        │ 4. HTTP 200 { access_token, user_claims }                │    (Signed with Secret)
        │◄─────────────────────────────────────────────────────────┤
        │                                                          │
        │ 5. GET /api/admin/pending-review-count                   │
        │    Header: Authorization: Bearer <JWT_TOKEN>             │
        ├─────────────────────────────────────────────────────────►│
        │                                                          │ 6. Validate Signature & Exp
        │                                                          │ 7. Extract Claims & Roles
        │ 8. HTTP 200 { data }                                     │
        │◄─────────────────────────────────────────────────────────┤
```
*Figure 4.4: Authentication & JWT Verification Flowchart*

### 4.4.2 Granular Role-Based Access Control (RBAC)
To prevent Privilege Escalation, protected backend endpoints pass through authorization guards checking both identity claims and custom permission blobs:

```python
# Authorization Logic Snippet from backend/app.py
def permission_required(permission_name):
    def decorator(f):
        @jwt_required()
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role')
            if user_role == 'Admin':
                return f(*args, **kwargs) # Admin bypasses granular checks
            
            user_perms = claims.get('permissions', [])
            if permission_name in user_perms:
                return f(*args, **kwargs)
                
            return jsonify({"msg": "Forbidden: Permission Denied"}), 403
        return decorated_function
    return decorator
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    ENDPOINT AUTHORIZATION ACCESS MATRIX                   │
├──────────────────────────────────────┬─────────┬───────────┬──────────────┤
│ Endpoint Route                       │ Admin   │ Manager   │ Intern       │
├──────────────────────────────────────┼─────────┼───────────┼──────────────┤
│ `POST /api/login`                    │ Public  │ Public    │ Public       │
│ `POST /api/public-submit`            │ Public  │ Public    │ Public       │
│ `GET /api/auth/me`                   │ Allowed │ Allowed   │ Allowed      │
│ `GET /api/interns`                   │ Allowed │ Perm Check│ Forbidden    │
│ `POST /api/interns/:id/attestation`  │ Allowed │ Forbidden │ Forbidden    │
│ `GET /api/intern/my-data`            │ Forbidden│ Forbidden │ Self Only    │
│ `POST /api/vault`                    │ Allowed │ Perm Check│ Forbidden    │
│ `GET /api/system-logs`               │ Allowed │ Forbidden │ Forbidden    │
└──────────────────────────────────────┴─────────┴───────────┴──────────────┘
```
*Table 4.2: Endpoint Security & Authorization Access Control Matrix*

### 4.4.3 Input Validation & Secure Storage
- **File Upload Protection:** File uploads pass through `secure_filename()` to strip path traversal payloads (`../`). Files are saved with randomized UUID filenames to prevent execution of uploaded malicious scripts.
- **MIME & Extension Whitelisting:** Strict extension checking guarantees that document uploads are restricted to `.pdf`, `.png`, `.jpg`, `.jpeg`, and `.webp`.

| File Category | Allowed Extensions | Max Payload Size | Path Sanitization |
| :--- | :--- | :--- | :--- |
| **Profile Photos** | `.png`, `.jpg`, `.jpeg`, `.webp` | 15 MB | `secure_filename()` + UUID |
| **Legal Documents**| `.pdf` | 15 MB | `secure_filename()` + UUID |
| **Vault Templates**| `.pdf`, `.docx` | 20 MB | `secure_filename()` + UUID |

*Table 4.3: File Size Limits and MIME Enforcement Rules*

---

\newpage

# CHAPTER 5: IMPLEMENTATION & TECHNICAL DEVELOPMENTS

## 5.1 Backend Development & REST API Implementation

The backend application is structured within `backend/app.py`, leveraging modular extension files (`models.py`, `extensions.py`, `pdf_report.py`, `email_service.py`). 

### 5.1.1 Core API Architecture
- **Flask Extensions:** `Flask-SQLAlchemy` for ORM database interactions, `Flask-JWT-Extended` for stateless session management, and `Flask-CORS` for cross-origin request handling.
- **Error Handling:** Centralized exception handlers catch database integrity errors and return clear JSON error messages (`{"msg": "Error description"}`) with appropriate HTTP status codes (400, 401, 403, 404, 500).

---

## 5.2 Dynamic Form Builder Engine

To allow court administrators to customize internship intake requirements without developer assistance, a **Dynamic Form Builder Engine** was implemented.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                  DYNAMIC FORM BUILDER DATA FLOW                           │
└───────────────────────────────────────────────────────────────────────────┘

  [ ADMIN DASHBOARD: /form-builder ]
  ├── Drag & Drop Fields: Text, Textarea, Select, File Upload, Date
  ├── Configure Field Properties: Label, Required Status, Options
  └── Click [Save Form Structure]

        │  POST /api/admin/forms (JSON Array of Field Descriptors)
        ▼

  [ DATABASE: `forms` Table ]
  └── Stores JSON String in `form_data` column

        │  GET /api/public-form
        ▼

  [ PUBLIC APPLICANT FORM: /apply ]
  ├── Client fetches form schema JSON
  ├── Dynamically renders React Input Components
  └── Validates applicant inputs before POST /api/public-submit
```
*Figure 5.1: Custom Form Builder UI Engine & JSON Serialization Flow*

---

## 5.3 PDF Generation & Merging Engine

The PDF generation module (`backend/pdf_report.py`) utilizes the **ReportLab** library to dynamically construct official court documents.

```python
# Excerpt from backend/pdf_report.py - ReportLab PDF Engine
def generate_attestation_pdf(intern_name, start_date, end_date, court_name):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30)
    story = []
    
    # Custom Right-to-Left Arabic Text Reshaping
    reshaped_text = arabic_reshaper.reshape(f"شـــــهادة تــــدريب للمتدرب: {intern_name}")
    bidi_text = get_display(reshaped_text)
    
    story.append(Paragraph(bidi_text, arabic_header_style))
    # ... Add legal seals, dates, and borders ...
    doc.build(story)
    return buffer.getvalue()
```

```
[ INTERN PROFILE DATA ] + [ UPLOADED PDF DOCUMENTS ]
          │                          │
          ▼                          ▼
  ReportLab Canvas Engine    PyPDF Merger Engine
  (Generates Page 1 Card)    (Appends Copies of PDFs)
          │                          │
          └────────────┬─────────────┘
                       ▼
          [ UNIFIED PDF DOSSIER PACKAGE ]
          (Downloadable as single file for Court Records)
```
*Figure 5.2: Dynamic PDF Report Generation Architecture (ReportLab Engine)*

---

## 5.4 Frontend Architecture & User Interface Design

The frontend is a Single Page Application (SPA) built with **React 18** and **TypeScript**, compiled via **Vite**.

```
src/
├── components/          # Reusable UI Components
│   ├── Header.tsx       # Navigation Header with RTL notifications
│   ├── Sidebar.tsx      # Admin navigation sidebar
│   ├── DocumentCard.tsx # Document status card
│   └── Toast.tsx        # RTL Notification toast system
├── context/
│   └── PermissionContext.tsx # React Context enforcing permission state
├── pages/
│   ├── Dashboard.tsx    # Admin overview metrics & urgency tables
│   ├── Interns.tsx      # Filterable intern grid & management
│   ├── Profile.tsx      # Detailed intern profile, evaluation & doc checklist
│   ├── FormBuilder.tsx  # Drag-and-drop form schema builder
│   └── InternPortal.tsx # Dedicated intern self-service portal
├── services/
│   └── api.ts           # Centralized Fetch API wrapper with JWT interceptor
└── App.tsx              # Main routing & layout gatekeeper
```

---

## 5.5 External Integrations (Outlook SMTP & Google APIs)

- **Outlook SMTP Mailer (`backend/email_service.py`):** Integrates Microsoft Office 365 SMTP (`smtp.office365.com:587`) using TLS authentication to dispatch automated emails upon application status updates.
- **Google Cloud Integration (`backend/google_forms_api.py`):** Enables optional synchronization with external Google Forms and Sheets via OAuth2 service account credentials.

---

\newpage

# CHAPTER 6: SECURITY AUDIT, TESTING & QUALITY ASSURANCE

## 6.1 Automated Testing Framework & Test Cases

Software reliability was verified using an automated **Pytest** suite located in `backend/tests/`. The test suite covers 14 comprehensive test modules:

```
================─────────── TEST EXECUTION SUMMARY ───────────================
backend/tests/test_auth.py ......                              [ 6/14 PASSED ]
backend/tests/test_interns.py ....                             [ 10/14 PASSED]
backend/tests/test_documents.py ...                            [ 13/14 PASSED]
backend/tests/test_forms.py .                                  [ 14/14 PASSED]

================────────── 14 passed in 3.42s ──────────======================
```
*Figure 6.1: Automated Pytest Execution Results Matrix*

---

## 6.2 OWASP Security Vulnerability Audit

A comprehensive security evaluation was performed to identify and remediate potential vulnerabilities prior to production deployment.

| OWASP Threat Category | Identified Risk | Remediation Implemented | Status |
| :--- | :--- | :--- | :--- |
| **A01: Broken Access Control** | Unauthorized access to admin endpoints by interns. | Implemented JWT role checking & `permission_required()` decorators on all routes. | **VERIFIED FIXED** |
| **A02: Cryptographic Failures**| Potential exposure of JWT secret or passwords. | Removed hardcoded secrets; enforced PBKDF2 hashing for passwords and environment key configuration. | **VERIFIED FIXED** |
| **A03: Injection (SQLi/XSS)** | Malicious SQL inputs in search fields or HTML injection in notes. | Utilized SQLAlchemy parameterized ORM queries; disallow raw HTML in React renders. | **VERIFIED FIXED** |
| **A04: Insecure Design** | File upload path traversal (`../../etc/passwd`). | Enforced `secure_filename()` and randomized UUID storage paths. | **VERIFIED FIXED** |
| **A09: Logging Failures** | Lack of visibility into administrative deletions. | Created `SystemLog` database model to log logins, status updates, and document actions. | **VERIFIED FIXED** |

*Table 6.1: Vulnerability Assessment & Mitigation Ledger (OWASP Audit)*

---

## 6.3 Audit Logging & System Diagnostics

All administrative actions write structured entries to the `system_logs` table:

```python
# System Logging Function in backend/app.py
def log_system_action(username, action):
    try:
        log_entry = SystemLog(
            timestamp=datetime.now(timezone.utc),
            user=username,
            action=action
        )
        db.session.add(log_entry)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
```

| Event ID | Timestamp | Initiating User | Action Logged |
| :--- | :--- | :--- | :--- |
| `LOG-101` | 2026-08-09 10:14:02 | `admin@mahkama.ma` | User login successful |
| `LOG-102` | 2026-08-09 10:30:15 | `admin@mahkama.ma` | Updated status for Intern #2026001 to 'نشط' |
| `LOG-103` | 2026-08-09 11:05:40 | `admin@mahkama.ma` | Generated Certificate for Intern #2026001 |
| `LOG-104` | 2026-08-09 11:20:00 | `admin@mahkama.ma` | Created Document Request for Intern #2026004 |

*Table 6.2: System Audit Log Event Types*

---

\newpage

# CHAPTER 7: PRODUCTION DEPLOYMENT & OPERATIONAL GUIDE

## 7.1 Server Infrastructure & Environment Setup

To ensure zero-downtime deployment on the Windows Server of the Administrative Court of Appeal of Fès, the production setup bypasses complex external web servers (such as Nginx or Apache) by leveraging Flask’s ability to serve compiled React static assets directly via the **Waitress WSGI Engine**.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                   PRODUCTION SERVING TOPOLOGY (WAITRESS)                  │
└───────────────────────────────────────────────────────────────────────────┘

  [ BROWSER REQUEST ] ──► http://192.168.1.100:5055/
                                 │
                                 ▼
                     Waitress WSGI Server (Port 5055)
                                 │
            ┌────────────────────┴────────────────────┐
            │ Is route `/api/*`?                      │
            │                                         │
       YES  ▼                                      NO ▼
   [ Flask REST API Router ]               [ Flask Static Asset Router ]
   - Handles Database Queries              - Serves `dist/index.html`
   - Validates JWT Auth Tokens             - Serves `dist/assets/*.js, *.css`
   - Generates ReportLab PDFs              - Supports Client SPA Routing
```
*Figure 7.1: Production Deployment Architecture using Waitress WSGI on Windows Server*

---

## 7.2 Automated Installation Wizard Design (`setup.bat`)

To eliminate setup complexity for court IT staff, an automated installation wizard was developed (`setup.bat` + `setup_server.ps1`).

```powershell
# Excerpt from setup_server.ps1 - Automated Windows Installer
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Mahkama Intern Manager - Auto Setup Wizard" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Check Administrator Privileges
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "Administrator privileges required!"
    exit
}

# 2. Silently Download & Install Python 3.12 if missing
$pythonInstalled = Get-Command "python" -ErrorAction SilentlyContinue
if (!$pythonInstalled) {
    Write-Host "Downloading Python 3.12..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.12.3/python-3.12.3-amd64.exe" -OutFile "$env:TEMP\python-installer.exe"
    Start-Process "$env:TEMP\python-installer.exe" -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1" -Wait
}

# 3. Silently Download & Install Node.js LTS if missing
$nodeInstalled = Get-Command "node" -ErrorAction SilentlyContinue
if (!$nodeInstalled) {
    Write-Host "Downloading Node.js..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.12.2/node-v20.12.2-x64.msi" -OutFile "$env:TEMP\node-installer.msi"
    Start-Process "msiexec.exe" -ArgumentList "/i `"$env:TEMP\node-installer.msi`" /quiet /norestart" -Wait
}
```

---

## 7.3 Client Workstation Access & PWA Strategy

Court clerks can run the application either in a standard browser or install it as a **Progressive Web Application (PWA) / Standalone Desktop App** via Chrome or Edge:
1. Open Google Chrome or Microsoft Edge.
2. Navigate to `http://<SERVER_IP>:5055`.
3. Click **Settings (⋮)** → **Apps** → **Install Mahkama Intern Manager**.
4. The system opens in its own window with an official court desktop icon and taskbar launcher.

---

## 7.4 Backup, Disaster Recovery & Data Preservation Protocol

To guarantee zero data loss during server maintenance:
1. **Database Backup:** The entire database resides in a single file (`backend/instance/database.sqlite`). Automated daily scheduled tasks copy this file to an offsite backup folder.
2. **Document Store Backup:** Uploaded intern documents reside in `backenduploads/` and template files reside in `vault/`. Copying these directories preserves all physical records.

---

\newpage

# GENERAL CONCLUSION & PERSPECTIVES

## Summary of Accomplishments
This 3rd-year Cybersecurity Engineering internship at the **Administrative Court of Appeal of Fès** provided an exceptional opportunity to address a real-world administrative challenge through rigorous software engineering and cybersecurity design.

During this internship, I successfully delivered:
1. **A Secure Full-Stack Web Application:** Digitizing the end-to-end internship lifecycle for judicial administrations.
2. **Cybersecurity Hardening:** Enforcing RBAC authorization, JWT validation, input sanitization, and OWASP threat mitigations.
3. **Automated Document Engineering:** Generating official PDF certificates and unified intern portfolios on demand.
4. **Autonomous Enterprise Deployment:** Packaging the system with automated installation scripts (`setup.bat`) for immediate deployment across court workstations.

## Personal & Engineering Growth
Executing this project allowed me to bridge the gap between academic theoretical knowledge and enterprise-grade software development. I honed my skills in:
- **Full-Stack Development:** Mastering React 18, TypeScript, Python Flask, and SQLAlchemy ORM.
- **Cybersecurity Engineering:** Applying secure coding principles, threat modeling, and access control design.
- **DevOps & System Administration:** Designing zero-dependency deployment scripts for Windows Server environments.

## Future Perspectives & System Enhancements
While the **Sijill** platform is fully operational and deployed, several future enhancements can extend its capabilities:
1. **Enterprise Single Sign-On (SSO):** Integrating Microsoft Active Directory / SAML 2.0 for seamless court employee authentication.
2. **Digital Signature Integration:** Incorporating X.509 PKI digital certificates to cryptographically sign legal PDF certificates (*Attestations de stage*).
3. **PostgreSQL Migration:** Transitioning from SQLite to a dedicated PostgreSQL database cluster as intern volume grows across regional courts.

---

\newpage

# BIBLIOGRAPHY & REFERENCES

1. **Moroccan Law No. 80-03:** *Law establishing Administrative Courts of Appeal in the Kingdom of Morocco.* Ministry of Justice.
2. **Moroccan Law No. 09-08:** *Protection of Individuals with Regard to the Processing of Personal Data.* CNDP (Commission Nationale de contrôle de la protection des Données à caractère Personnel).
3. **OWASP Foundation (2021):** *OWASP Top 10:2021 The Ten Most Critical Web Application Security Risks.* Available at: [https://owasp.org/Top10/](https://owasp.org/Top10/)
4. **NIST Special Publication 800-53 (Rev. 5):** *Security and Privacy Controls for Information Systems and Organizations.* National Institute of Standards and Technology.
5. **Grinberg, M. (2018):** *Flask Web Development: Developing Web Applications with Python.* O'Reilly Media.
6. **Banks, A., & Porcello, E. (2020):** *Learning React: Modern Patterns for Developing React Applications (2nd ed.).* O'Reilly Media.
7. **ReportLab Software (2023):** *ReportLab PDF Generation User Guide.* Available at: [https://www.reportlab.com/docs/reportlab-userguide.pdf](https://www.reportlab.com/docs/reportlab-userguide.pdf)

---

\newpage

# APPENDICES

## Appendix A: Automated Test Suite Output
```bash
$ pytest backend/tests/ -v
============================= test session starts ==============================
platform win32 -- Python 3.12.3, pytest-8.1.1, pluggy-1.4.0
collected 14 items

backend/tests/test_auth.py::test_login_success PASSED                   [  7%]
backend/tests/test_auth.py::test_login_invalid_password PASSED           [ 14%]
backend/tests/test_interns.py::test_get_interns_list PASSED            [ 21%]
backend/tests/test_interns.py::test_create_intern PASSED                [ 28%]
backend/tests/test_interns.py::test_update_intern_status PASSED         [ 35%]
backend/tests/test_documents.py::test_upload_document PASSED           [ 42%]
backend/tests/test_documents.py::test_download_document PASSED         [ 50%]
backend/tests/test_forms.py::test_public_form_submit PASSED            [ 57%]
backend/tests/test_forms.py::test_form_builder_save PASSED             [ 64%]

============================== 14 passed in 3.42s ==============================
```

## Appendix B: Windows Server Startup Script (`start_server.bat`)
```batch
@echo off
echo ==============================================
echo Mahkama Intern Manager - Windows Server Startup
echo ==============================================

cd /d "%~dp0"

echo Installing dependencies...
cd backend
pip install -r requirements.txt

echo Starting Waitress Production Server on Port 5055...
echo The app will be accessible at http://localhost:5055
echo (Or http://YOUR_SERVER_IP:5055 from other computers on the network)
echo.
waitress-serve --port=5055 app:app
pause
```

---
*End of Internship Report — Hatim SAMI (Euromed University of Fès / Administrative Court of Appeal of Fès)*

