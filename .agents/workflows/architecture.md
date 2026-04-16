---
description: Content Review & Approval System
---

# 🏗️ Architecture.md

**Content Review & Approval System**

---

# 1. 📌 Overview

This application is a **workflow-driven content management system** that enables:

* Content creation
* Multi-stage approval workflow
* Rejection → edit → re-submission cycle
* Final approval → locked & optionally published content

The system is designed with **clear separation of concerns**, **RBAC**, and **state-driven workflow transitions**.

---

# 2. ⚙️ Tech Stack

## Frontend

* React (Vite + TypeScript)
* Tailwind CSS v4
* React Router
* React Context API (state management)
* React Hot Toast (notifications)
* Optional: ShadCN UI (for components)

---

## Backend

* Node.js + Express.js (TypeScript)
* PostgreSQL
* Drizzle ORM
* Zod (validation)
* Cookie-based authentication (Simple)

---

## Architecture Style

* Modular Monolith
* Layered architecture:

  * Controllers
  * Services
  * Routes
  * Database

---

# 3. 👥 Roles & Access Control (RBAC)

### Roles:

* `CREATOR`
* `REVIEWER_L1`
* `REVIEWER_L2`

### Responsibility:

| Role             | Responsibility                         |
| ---------------- | -------------------------------------- |
| Creator          | Create, edit (after rejection), submit |
| Reviewer L1      | Approve/reject stage 1                 |
| Reviewer L2      | Approve/reject stage 2                 |

---

# 4. 🔄 Workflow Design

## Content Lifecycle

```txt
DRAFT → IN_REVIEW (Stage 1) → IN_REVIEW (Stage 2) → APPROVED
                  ↓
           CHANGES_REQUESTED → EDIT → RESUBMIT → Stage 1
```

---

## Rules

* Content starts as `DRAFT` or `IN_REVIEW`
* Submission in `IN_REVIEW` moves content to **Stage 1**
* Each stage requires approval by correct reviewer
* Rejection:

  * moves to `CHANGES_REQUESTED`
  * unlocks content
  * resets stage
* Editing allowed only after rejection
* Approved content:

  * becomes **locked**
  * cannot be edited

---

# 5. 🧩 Core Features

## 5.1 Content Management

* Create content (title, description, image)
* Edit content (only after rejection)
* View content list & detail

---

## 5.2 Approval Workflow

* Multi-stage approval (min 2 stages)
* Stage-specific reviewers
* Approve / Reject actions
* Restart workflow after rejection

---

## 5.3 RBAC Enforcement

* Role-based UI rendering
* Role-based API authorization
* Stage validation per role

---

## 5.4 State Validation

* Prevent invalid transitions:

  * Skip stages ❌
  * Edit approved content ❌
  * Wrong role approval ❌

---

## 5.5 Audit Trail (Approval History)

* Track:

  * reviewer
  * action (approve/reject)
  * comments
  * timestamp

---

## 5.6 UI/UX

* Status badges (Draft, Review, Rejected, Approved)
* Conditional actions based on role/state
* Toast notifications for feedback
* Clear workflow visibility

---

# 6. ⭐ Optional / Bonus Features

## 6.1 Sub-Content

* Parent → child content relationship
* Independent approval per sub-content
* Optional rule:

  * parent approved only if all children approved

---

## 6.2 Versioning

* Store previous versions on re-submission
* Maintain version history

---

## 6.3 Public Publishing

* Approved content becomes publicly visible (read-only)
* Separate public view endpoint/page

---

## 6.4 Filtering & Search

* Filter by:

  * status
  * stage
* Search by title/content

---

## 6.5 Advanced Workflow (Optional)

* Parallel approvals
* Multi-reviewer stages
* Configurable workflows

---

## 6.6 Admin Capabilities (Optional)

* Override approvals
* Force approve/reject
* Unlock content

---

# 7. 🗄️ Database Design (High-Level)

## Tables:

### Content

* id
* title
* description
* image
* status
* current_review_stage
* is_locked
* created_by
* created_at
* updated_at

---

### Approval Logs

* id
* content_id
* stage
* reviewer_id
* action (APPROVED / REJECTED)
* comment
* created_at

---

### Users

* id
* name
* role

---

### (Optional) Content Versions

* id
* content_id
* version_number
* data snapshot
* created_at

---

### (Optional) Sub Content

* id
* parent_content_id
* title
* description
* status

---

# 8. 🧠 Backend Architecture

## Folder Structure

```bash
backend/
│
├── src/
│   ├── routes/
│   │   ├── index.ts
│   │   ├── content.routes.ts
│   │   └── workflow.routes.ts
│   │
│   ├── controllers/
│   │   ├── content.controller.ts
│   │   └── workflow.controller.ts
│   │
│   ├── services/
│   │   ├── content.service.ts
│   │   └── workflow.service.ts
│   │
│   ├── db/
│   │   ├── schema/
│   │   │   ├── content.schema.ts
│   │   │   ├── approval.schema.ts
│   │   │   └── user.schema.ts
│   │   └── index.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── rbac.middleware.ts
│   │
│   ├── utils/
│   ├── types/
│   └── app.ts
│
├── drizzle.config.ts
└── package.json
```

---

# 9. 🎨 Frontend Architecture

## Folder Structure

```bash
frontend/
│
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── content/
│   │   └── layout/
│   │
│   ├── pages/
│   │   ├── ContentList.tsx
│   │   ├── ContentDetail.tsx
│   │   ├── CreateContent.tsx
│   │   ├── EditContent.tsx
│   │   └── Login.tsx
│   │
│   ├── context/
│   │   └── AppContext.tsx
│   │
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   └── main.tsx
│
└── package.json
```

---

# 10. 🔌 API Design (High-Level)

## Content

* `POST /content`
* `GET /content`
* `GET /content/:id`
* `PUT /content/:id`

---

## Workflow

* `POST /content/:id/submit`
* `POST /content/:id/approve`
* `POST /content/:id/reject`

---

# 11. ⚠️ Key Constraints

* No skipping workflow stages
* No editing after approval
* Only correct reviewer can approve stage
* Rejection resets workflow

---

# 13. 🧾 Design Philosophy

This system is designed as a:

```txt
State Machine + RBAC + Relational Data Model
```

Key principles:

* Strong data integrity
* Explicit workflow transitions
* Separation of concerns
* Scalable architecture

---

# ✅ Summary

This architecture ensures:

* Clean workflow enforcement
* Scalable backend design
* Maintainable frontend structure
* Strong alignment with real-world CMS systems