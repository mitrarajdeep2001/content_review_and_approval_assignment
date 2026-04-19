# Content Review & Approval System

A robust, full-stack content management system designed for collaborative content creation, review, and approval workflows.

## 🚀 Architecture Overview

This project follows a modern **Client-Server architecture** with a clear separation of concerns:

- **Frontend**: A high-performance Single Page Application (SPA) built with **React** and **Vite**, styled with **Tailwind CSS** for a premium UI/UX.
- **Backend**: A modular **Node.js/Express** API following a layered architecture (**Routes -> Controllers -> Services**) for maintainability and scalability.
- **Database**: **PostgreSQL** for reliable data storage, managed through **Drizzle ORM** for type-safe database interactions and migrations.
- **Storage**: Local filesystem storage for seamless media upload and management.
- **Validation**: Strict runtime schema validation using **Zod** on the backend to ensure data integrity.

## 🛠️ Setup Instructions

The easiest way to run the entire application is using **Docker**.

### Prerequisites
- Docker & Docker Compose

### 🚀 Run the Application
1. **Clone the repository**:
   ```bash
   download the source-code zip from the mail or git clone https://github.com/mitrarajdeep2001/content_review_and_approval_assignment.git
   cd content_review_and_approval_assignment
   ```

2. **Configure Environment**:
   The root directory contains a `.env` file with defaults. You can modify it if needed, but the defaults are pre-configured to work with Docker.

3. **Start the services**:
   ```bash
   docker compose up --build -d
   ```
   This command will:
   - Start the PostgreSQL database
   - Start pgAdmin (accessible at `http://localhost:5050`)
   - Build and start the Backend API (accessible at `http://localhost:5000`)
   - Build and start the Frontend Web App (accessible at `http://localhost:5173`)
   - Automatically run database migrations and seeds.

### 📊 Accessing Services
- **Web App**: [http://localhost:5173](http://localhost:5173)
- **API Server**: [http://localhost:5000](http://localhost:5000)
- **pgAdmin**: [http://localhost:5050](http://localhost:5050)
  - *Login*: `admin@mail.com` / `admin123`
  - *Server*: Use `postgres` as the hostname, `5432` as port.

### 🔑 Demo Credentials
Use these accounts to test the different role-based workflows (Password for all: `password123`):

| Role | Email | Permissions |
| :--- | :--- | :--- |
| **Creator** | `alex@contentflow.io` | Create & edit content |
| **Reviewer L1** | `jordan@contentflow.io` | First level approval |
| **Reviewer L2** | `taylor@contentflow.io` | Final level approval |
| **Reader** | `sam@contentflow.io` | View approved content |

## 🔄 Workflow Design

The system implements a state-driven content lifecycle:

1. **Draft**: Content created by a **Creator**, visible only to them.
2. **In Review**: Content submitted for approval, visible to **Reviewers** (L1, L2).
3. **Approved**: Content successfully vetted and ready for public/reader consumption.
4. **Changes Requested**: Content sent back to the Creator with feedback for revisions.

**Role-Based Access Control (RBAC):**
- **CREATOR**: Can create, edit (in Draft/Changes Requested), and delete their content.
- **REVIEWER**: Can review pending content, add comments, and approve or request changes.
- **READER**: Can view approved content and track their reading progress.

## 📊 ER Diagram

The database schema is designed to support complex content hierarchies and audit trails.

![Entity Relationship Diagram](./ERD.png)

## 💡 Assumptions and Tradeoffs

- **Status-Driven Workflow**: Chose a flexible status-based state machine over rigid stage paths to allow for future expansion of review tiers.
- **Local Media Storage**: Opted for local filesystem storage to keep the system self-contained and simplify deployment for this assignment.
- **Drizzle ORM**: Selected for its "type-safe by design" approach which reduces runtime errors and provides excellent developer experience with TypeScript.
- **Global State Management**: Used TanStack Query for server state management to handle caching and synchronization efficiently.

## 🔮 Future Scope / Improvements

- **Real-time Notifications**: Implementing WebSockets for instant alerts on review status changes.
- **Version Control**: Tracking full history of content revisions.
- **Granular Permissions**: Fine-grained access control beyond basic roles.
- **Advanced Search**: Integrating Elasticsearch or PostgreSQL Full Text Search for better content discoverability.

## 🤖 AI Tools Usage

This project leveraged AI to accelerate development and ensure high code quality:

- **ChatGPT**: Used for planning the architecture of the app.
- **Antigravity**: Utilized extensively to build a nice UI/UX, used inline code suggestions and write README.md file.
