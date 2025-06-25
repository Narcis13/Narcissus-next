# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NextProject is a Next.js 15.3.1 application with React 19, using TypeScript with strict mode. The application features a credential management system, custom flow automation engine, and Google integrations for now. In the future we will implement many integration for nodes of the workflow for AI model, social media platform interactions, etc. The core and the heart of the system is the agentic workflow system made to execute JSON format (serializable as string) workflows and automations designed from the ground up to be very AI friendly.This repo will serve as a template for other projects that will have in common this features.

## Standard Workflow
1. First, think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them.
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information. 

# VERY IMPORTANT

  At the very start of every coding sessiom read the following docs:
  - A succint presentation of the engine that power the agentic workflow management system located at: /src/lib/flow-engine/FLOWMANAGER_SYNTHESIS.md
  - PRD file located at: /PRD-lite.md
  - tasks/todo.md to evaluate the phase of the development we ar in
  
## Essential Commands

```bash
# Install dependencies
npm install

# Development (runs on port 3013)
npm run dev

# Build for production
npm run build

# Production server
npm start

# Linting
npm run lint

# Database operations
npm run db:generate    # Generate Drizzle migrations
npm run db:migrate     # Apply migrations
npm run db:push        # Push schema changes
npm run db:studio      # Open Drizzle Studio

# Flow engine
npm run generate-indexes  # Auto-runs before dev/build
```

## Architecture & Structure

### Technology Stack
- **Frontend**: Next.js 15.3.1 (App Router), React 19, TypeScript, Shadcn UI components
- **Styling**: Tailwind CSS v4, custom configuration with theme support
- **Database**: PostgreSQL with Drizzle ORM
- **Security**: Custom AES-256-GCM encryption for credentials

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/lib/` - Core utilities, database, and business logic
- `src/components/` - React components including flow engine UI
- `src/flow-engine/` - Custom workflow automation system
- `src/db/` - Database schema and configuration

### Important Patterns

#### Database Schema Organization
Schema is modularly organized in `src/db/schema/`:
- `auth.ts` - User authentication tables
- `credentials.ts` - Encrypted credential storage
- `flows.ts` - Flow automation definitions
- `google.ts` - Google OAuth tokens

#### Server Actions
Located in `src/lib/` with the pattern:
```typescript
"use server";
export async function actionName() {
  // Always uses userId: 1 (hardcoded - auth not implemented)
}
```

#### Flow Engine
Custom node-based workflow system in `src/flow-engine/`:
- Node types defined in `types/nodes.ts`
- Auto-generated indexes from `generate-node-indexes.js`
- Visual editor using React Flow

#### Security & Encryption
Credentials are encrypted using AES-256-GCM:
- Implementation: `src/lib/security/encryption.ts`
- Key derivation: PBKDF2 with 100,000 iterations
- Environment variable: `ENCRYPTION_KEY` (required)

### Environment Variables
Required in `.env.local`:
```
DATABASE_URL          # PostgreSQL connection
ENCRYPTION_KEY        # For credential encryption
GOOGLE_CLIENT_ID      # Google OAuth
GOOGLE_CLIENT_SECRET  # Google OAuth
```

### Current Limitations
- No testing framework configured
- Authentication incomplete (hardcoded userId: 1)
- WebSocket infrastructure present but unused
- No code formatter (Prettier) configured
- Server.ts file exists but is empty

### Path Aliases
- `@/*` maps to `./src/*`

## Working with This Codebase

When implementing features:
1. Check existing patterns in similar files first
2. Use Server Actions for data mutations
3. Follow the modular schema organization for database changes
4. Ensure proper encryption for any sensitive data storage
5. The project uses Next.js App Router, not Pages Router