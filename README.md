# Content Review & Approval System

A robust, full-stack content management system designed for collaborative content creation, review, and approval workflows.

## 🚀 Architecture Overview

This project follows a modern **Client-Server architecture** with a clear separation of concerns:

- **Frontend**: A high-performance Single Page Application (SPA) built with **React** and **Vite**, styled with **Tailwind CSS** for a premium UI/UX.
- **Backend**: A modular **Node.js/Express** API following a layered architecture (**Routes -> Controllers -> Services**) for maintainability and scalability.
- **Database**: **PostgreSQL** for reliable data storage, managed through **Drizzle ORM** for type-safe database interactions and migrations.
- **Storage**: **Cloudinary** integration for seamless media upload and management.
- **Validation**: Strict runtime schema validation using **Zod** on the backend to ensure data integrity.

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- npm or yarn

### 1. Database Setup
Start the PostgreSQL database and pgAdmin using Docker:
```bash
docker-compose up -d
```
*Port 5432 for Postgres and 5050 for pgAdmin (default).*

### 2. Backend Configuration
1. Navigate to the `server` directory: `cd server`
2. Create a `.env` file from the sample: `cp .env.sample .env`
3. Fill in the required environment variables:
   - `DATABASE_URL`: `postgresql://admin:admin123@localhost:5432/content_db`
   - `SESSION_SECRET`: A secure random string
   - `CLOUDINARY_` credentials for image uploads.
4. Install dependencies: `npm install`
5. Run migrations and seeds:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```
6. Start the dev server: `npm run dev`

### 3. Frontend Configuration
1. Navigate to the `client` directory: `cd client`
2. Create a `.env` file from the sample: `cp .env.sample .env`
3. Set `VITE_API_BASE_URL=http://localhost:3000` (or your server port).
4. Install dependencies: `npm install`
5. Start the dev server: `npm run dev`

## 🌐 Deployment

### Frontend (Vercel)
To deploy the frontend to Vercel:
1. Set the **Root Directory** to `client`.
2. Vercel will auto-detect **Vite** as the framework.
3. Ensure the environment variable `VITE_API_BASE_URL` is set to your production backend URL.

### Fix for 404 on Refresh
If you experience `404: NOT_FOUND` when refreshing pages on Vercel, a `vercel.json` has been added to the `client` directory to handle SPA routing by rewriting all requests to `index.html`.

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
- **Cloudinary for Media**: Opted for a cloud-based CDN for image management to ensure fast delivery and reduce server storage overhead.
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
- **Antigravity**: Utilized extensively to build a nice UI/UX, some complex frontend logic, provide real-time inline code suggestions and write README.md file.
