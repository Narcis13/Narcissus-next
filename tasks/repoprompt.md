<file_map>
/Users/narcisbrindusescu/cod/nextproject
├── src
│   └── lib
│       ├── flow-engine
│       │   ├── core
│       │   │   ├── FlowHub.js
│       │   │   ├── FlowManager.js
│       │   │   ├── NodeRegistry.js
│       │   │   └── TriggerManager.js
│       │   ├── nodes
│       │   │   ├── text
│       │   │   │   ├── analyze-sentiment.node.js
│       │   │   │   └── string-uppercase.node.js
│       │   │   ├── utils
│       │   │   │   └── log
│       │   │   │       └── log-message.node.js
│       │   │   └── index.js
│       │   ├── triggers
│       │   │   └── types
│       │   │       ├── emailTriggerHandler.js
│       │   │       ├── eventTriggerHandler.js
│       │   │       └── timeTriggerHandler.js
│       │   ├── init.ts
│       │   └── singletons.ts
│       └── engine-loader.ts
├── tasks
│   └── todo.md
├── CLAUDE.md
└── PRD-lite.md

</file_map>

<file_contents>
File: /Users/narcisbrindusescu/cod/nextproject/tasks/todo.md
```md
# FlowForge AI MVP Implementation Plan

## Phase 1: Foundation & Infrastructure (Week 1)

### Environment Setup
- [ ] Configure environment variables structure
  - [ ] Create `.env.example` with all required vars
  - [ ] Document each environment variable in README
  - [ ] Set up local development `.env.local`
- [ ] Set up Vercel project
  - [ ] Connect GitHub repository
  - [ ] Configure production environment variables
  - [ ] Set up preview deployments
- [ ] Configure Supabase project
  - [ ] Create new Supabase project
  - [ ] Save connection strings
  - [ ] Enable Row Level Security (RLS)
- [ ] Set up Upstash Redis
  - [ ] Create Redis database
  - [ ] Configure connection for BullMQ
  - [ ] Set up connection pooling

### Database Schema ✓
- [x] Design and implement core tables
  - [x] Update users table with required fields (email, password_hash, email_verified, created_at, updated_at, last_login_at)
  - [x] Create workflows table (id, user_id, name, description, json_data, created_at, updated_at)
  - [x] Create workflow_executions table (id, workflow_id, status, started_at, completed_at, error, result)
  - [x] Create api_keys table (id, user_id, key_hash, name, last_used, created_at)
  - [x] Create workflow_schedules table (id, workflow_id, cron_expression, enabled, next_run, last_run)
- [x] Set up database migrations
  - [x] Create initial migration files
  - [x] Apply migrations to database
  - [ ] Test migration up/down
  - [ ] Add migration scripts to package.json
- [ ] Implement Row Level Security policies
  - [ ] Users can only see their own data
  - [ ] API keys properly scoped
  - [ ] Workflow access controls

### Authentication System ✓
- [x] Implement NextAuth.js
  - [x] Configure auth providers (email/password initially)
  - [x] Set up session management
  - [x] Create auth API routes
  - [x] Add middleware for protected routes
- [x] Create auth UI components
  - [x] Login page with form validation
  - [x] Signup page with password requirements
  - [ ] Password reset flow (optional for MVP)
  - [ ] Email verification (optional for MVP)
- [x] User profile management
  - [x] Profile page UI
  - [x] Update profile server action
  - [x] Change password functionality

## Phase 2: Core Workflow Engine (Week 2)

### Workflow Data Model ✓
- [x] Define TypeScript types
  - [x] Workflow interface with JSON schema
  - [x] Node interface with inputs/outputs
  - [x] Connection interface
  - [x] Execution context interface
- [x] Create workflow validation
  - [x] JSON schema validation
  - [x] Node connection validation
  - [x] Circular dependency detection
  - [x] Required field validation

### Execution Engine
- [ ] Set up BullMQ queue system
  - [ ] Configure Redis connection
  - [ ] Create workflow execution queue
  - [ ] Set up queue monitoring
  - [ ] Implement retry logic
- [ ] Build execution runtime
  - [ ] Node execution orchestrator
  - [ ] Context passing between nodes
  - [ ] Error handling and recovery
  - [ ] State persistence during execution
- [ ] Implement execution features
  - [ ] Parallel node execution
  - [ ] Sequential dependencies
  - [ ] Conditional branching
  - [ ] Loop handling with limits
- [ ] Add execution controls
  - [ ] Start/stop execution
  - [ ] Pause/resume (basic)
  - [ ] Execution timeout handling
  - [ ] Resource limits

### Core Node Implementation
- [ ] Create base node system
  - [ ] Abstract Node class/interface
  - [ ] Node registration system
  - [ ] Node validation framework
  - [ ] Input/output type system
- [ ] Implement logic nodes
  - [ ] If/Else node with condition evaluation
  - [ ] Delay node with configurable time
  - [ ] Loop node with iteration limits
- [ ] Implement data nodes
  - [ ] Transform node (JSONata or similar)
  - [ ] Merge node for combining data
  - [ ] Filter node for array operations
- [ ] Implement integration nodes
  - [ ] HTTP Request node (REST API calls)
  - [ ] Webhook trigger node
  - [ ] Webhook response node
- [ ] Implement AI nodes
  - [ ] OpenAI completion node
  - [ ] Anthropic Claude node
  - [ ] AI response parser node
- [ ] Implement utility nodes
  - [ ] Email send node (via Resend)
  - [ ] Database query node (PostgreSQL)
  - [ ] Log/Debug node

## Phase 3: User Interface (Week 3)

### Workflow Management UI
- [ ] Create workflow list page
  - [ ] Table with workflow name, status, last run
  - [ ] Search and filter functionality
  - [ ] Bulk actions (delete, duplicate)
  - [ ] Pagination
- [ ] Build workflow create/edit page
  - [ ] Workflow metadata form
  - [ ] JSON editor integration
  - [ ] Save/Update functionality
  - [ ] Version history (basic)

### JSON Editor Integration
- [ ] Integrate Monaco/CodeMirror
  - [ ] Set up editor component
  - [ ] Configure JSON syntax highlighting
  - [ ] Add JSON schema validation
  - [ ] Implement auto-completion
- [ ] Add editor features
  - [ ] Error highlighting with messages
  - [ ] Format/prettify button
  - [ ] Find/replace functionality
  - [ ] Undo/redo support
- [ ] Create workflow templates
  - [ ] Basic automation template
  - [ ] AI chat workflow template
  - [ ] Data processing template
  - [ ] Webhook handler template

### Workflow Visualization
- [ ] Implement React Flow viewer
  - [ ] Parse JSON to React Flow nodes
  - [ ] Auto-layout algorithm
  - [ ] Connection rendering
  - [ ] Node status indicators
- [ ] Add viewer features
  - [ ] Zoom/pan controls
  - [ ] Fit to screen button
  - [ ] Export as image
  - [ ] Execution path highlighting

### Execution Monitoring
- [ ] Create execution history page
  - [ ] List of all executions
  - [ ] Status badges (success/running/failed)
  - [ ] Execution duration
  - [ ] Filter by workflow/status/date
- [ ] Build execution detail view
  - [ ] Step-by-step execution log
  - [ ] Node input/output data
  - [ ] Error details and stack traces
  - [ ] Execution timeline
- [ ] Add real-time updates
  - [ ] WebSocket connection for live logs
  - [ ] Progress indicators
  - [ ] Live status updates

## Phase 4: AI Integration & API (Week 4)

### AI Workflow Creation
- [ ] Create AI assistant endpoint
  - [ ] Natural language to workflow parser
  - [ ] Implement with OpenAI/Anthropic
  - [ ] Response formatting
  - [ ] Error handling
- [ ] Build AI assistant UI
  - [ ] Chat-like interface
  - [ ] Workflow preview
  - [ ] Confirm and edit flow
  - [ ] Save generated workflow
- [ ] Implement workflow templates
  - [ ] AI can suggest templates
  - [ ] Template customization
  - [ ] Learning from user patterns

### REST API Development
- [ ] Design API structure
  - [ ] RESTful endpoints
  - [ ] API versioning (/api/v1)
  - [ ] Response format standardization
  - [ ] Error response format
- [ ] Implement core endpoints
  - [ ] GET /api/v1/workflows
  - [ ] POST /api/v1/workflows
  - [ ] GET /api/v1/workflows/:id
  - [ ] PUT /api/v1/workflows/:id
  - [ ] DELETE /api/v1/workflows/:id
  - [ ] POST /api/v1/workflows/:id/execute
  - [ ] GET /api/v1/executions
  - [ ] GET /api/v1/executions/:id
- [ ] Add API authentication
  - [ ] API key generation UI
  - [ ] API key validation middleware
  - [ ] Rate limiting per key
  - [ ] Usage tracking
- [ ] Create API documentation
  - [ ] OpenAPI/Swagger spec
  - [ ] Interactive API docs
  - [ ] Code examples
  - [ ] SDKs (at least cURL examples)

### Workflow Scheduling
- [ ] Implement cron scheduler
  - [ ] Cron expression parser
  - [ ] Schedule storage
  - [ ] Next run calculation
  - [ ] Schedule execution trigger
- [ ] Create scheduling UI
  - [ ] Schedule enable/disable
  - [ ] Cron expression builder
  - [ ] Next runs preview
  - [ ] Schedule history

## Phase 5: Payments & Subscriptions (Week 5)

### Stripe Integration
- [ ] Set up Stripe
  - [ ] Create Stripe account
  - [ ] Configure webhooks
  - [ ] Set up products and prices
  - [ ] Test mode configuration
- [ ] Implement subscription flow
  - [ ] Pricing page UI
  - [ ] Checkout session creation
  - [ ] Subscription management
  - [ ] Payment method updates
- [ ] Add usage tracking
  - [ ] Track workflow executions
  - [ ] Implement usage limits
  - [ ] Usage reset on billing cycle
  - [ ] Overage handling
- [ ] Create billing UI
  - [ ] Current plan display
  - [ ] Usage statistics
  - [ ] Invoice history
  - [ ] Plan upgrade/downgrade

### Admin Features
- [ ] Build admin dashboard
  - [ ] User management
  - [ ] System metrics
  - [ ] Error monitoring
  - [ ] Usage analytics
- [ ] Implement admin tools
  - [ ] Manual subscription adjustments
  - [ ] User impersonation (debug)
  - [ ] System announcements
  - [ ] Feature flags

## Phase 6: Testing & Polish (Week 6)

### Testing Implementation
- [ ] Unit tests for core logic
  - [ ] Node execution tests
  - [ ] Workflow validation tests
  - [ ] API endpoint tests
  - [ ] Utility function tests
- [ ] Integration tests
  - [ ] Full workflow execution
  - [ ] API integration tests
  - [ ] Database operations
  - [ ] Queue processing
- [ ] End-to-end tests
  - [ ] User signup flow
  - [ ] Workflow creation and execution
  - [ ] Subscription flow
  - [ ] API usage flow

### Performance Optimization
- [ ] Frontend optimization
  - [ ] Code splitting
  - [ ] Lazy loading
  - [ ] Image optimization
  - [ ] Bundle size analysis
- [ ] Backend optimization
  - [ ] Database query optimization
  - [ ] Caching strategy
  - [ ] Queue performance tuning
  - [ ] API response time optimization

### Security Hardening
- [ ] Security audit
  - [ ] Input validation review
  - [ ] SQL injection prevention
  - [ ] XSS prevention
  - [ ] CSRF protection
- [ ] API security
  - [ ] Rate limiting implementation
  - [ ] API key rotation
  - [ ] Request validation
  - [ ] Response sanitization

### Documentation
- [ ] User documentation
  - [ ] Getting started guide
  - [ ] Node reference
  - [ ] Workflow examples
  - [ ] Troubleshooting guide
- [ ] Developer documentation
  - [ ] API reference
  - [ ] Node development guide
  - [ ] Architecture overview
  - [ ] Deployment guide

## Phase 7: Launch Preparation (Week 7)

### Pre-launch Checklist
- [ ] Production environment
  - [ ] Environment variables verified
  - [ ] Database migrations run
  - [ ] Redis configured
  - [ ] Monitoring set up
- [ ] Error tracking
  - [ ] Sentry integration
  - [ ] Error alerting
  - [ ] Log aggregation
  - [ ] Performance monitoring
- [ ] Analytics setup
  - [ ] PostHog integration
  - [ ] Conversion tracking
  - [ ] User behavior tracking
  - [ ] Custom events
- [ ] Legal requirements
  - [ ] Terms of service
  - [ ] Privacy policy
  - [ ] Cookie policy
  - [ ] GDPR compliance basics

### Marketing Site
- [ ] Landing page
  - [ ] Hero section
  - [ ] Feature highlights
  - [ ] Pricing section
  - [ ] Testimonials (if any)
- [ ] Marketing pages
  - [ ] About page
  - [ ] Use cases
  - [ ] Comparison page
  - [ ] Blog (optional for MVP)
- [ ] SEO optimization
  - [ ] Meta tags
  - [ ] Sitemap
  - [ ] Robots.txt
  - [ ] OpenGraph tags

### Launch Activities
- [ ] Soft launch
  - [ ] Beta user onboarding
  - [ ] Feedback collection
  - [ ] Bug fixes
  - [ ] Performance monitoring
- [ ] Public launch
  - [ ] ProductHunt preparation
  - [ ] HackerNews submission
  - [ ] Social media announcements
  - [ ] Email campaign (if applicable)

## Post-Launch Priorities

### Week 8+
- [ ] User feedback implementation
- [ ] Additional node types based on demand
- [ ] Performance improvements
- [ ] Advanced AI features
- [ ] Mobile responsive improvements
- [ ] Additional integrations
- [ ] Community building
- [ ] Content marketing

## Success Metrics Tracking

### Technical Metrics
- [ ] API response time < 200ms
- [ ] Workflow execution start < 5s
- [ ] 99% uptime achieved
- [ ] Zero critical security issues

### Business Metrics
- [ ] 500 signups achieved
- [ ] 50 paying customers
- [ ] $2,500 MRR
- [ ] 40% weekly active users

### User Satisfaction
- [ ] NPS score > 40
- [ ] Support response time < 24h
- [ ] Feature request tracking
- [ ] Churn rate < 10%

---

## Notes

- Each week focuses on a major component
- Items can be worked on in parallel where possible
- Adjust timeline based on team size and expertise
- Prioritize security and reliability over features
- Get user feedback early and often

---

## Implementation Summary

### Authentication System Setup (Completed)

#### Main Steps Taken:

1. **Installed Dependencies**
   - NextAuth.js v5 (beta) for authentication
   - bcryptjs for password hashing
   - react-hook-form and zod for form validation
   - @hookform/resolvers for form schema validation

2. **Created Authentication Configuration**
   - Set up NextAuth.js with credentials provider in `src/auth.ts`
   - Configured JWT session strategy with 30-day expiration
   - Added custom session callbacks to include user ID

3. **Implemented Password Security**
   - Created password utilities in `src/lib/auth/password.ts`
   - Password requirements: 8+ chars, uppercase, lowercase, number, special char
   - Used bcrypt with 10 salt rounds for hashing

4. **Set Up Middleware**
   - Created middleware in `src/middleware.ts` for route protection
   - Redirects unauthenticated users to login page
   - Redirects authenticated users away from auth pages

5. **Created UI Components**
   - Login page with email/password validation
   - Signup page with password requirements display
   - Profile page with user info and forms
   - Dashboard page for authenticated users

6. **Implemented User Management**
   - Server actions for user creation and profile updates
   - Change password functionality with current password verification
   - Profile update capability

7. **Updated Layout**
   - Added SessionProvider wrapper
   - Dynamic navigation based on auth status
   - Sign out functionality in navigation

#### Key Files Created:
- `src/auth.ts` - NextAuth configuration
- `src/middleware.ts` - Route protection
- `src/app/api/auth/[...nextauth]/route.ts` - Auth API handler
- `src/lib/auth/password.ts` - Password utilities
- `src/lib/auth/signup.ts` - User creation logic
- `src/lib/auth/profile-actions.ts` - Profile management
- `src/app/login/page.tsx` - Login page
- `src/app/signup/page.tsx` - Signup page
- `src/app/profile/page.tsx` - Profile page
- `src/app/dashboard/page.tsx` - Dashboard page
- `src/components/auth/*` - Auth-related components

#### Environment Variables Added:
- `NEXTAUTH_SECRET` - For JWT encryption
- `NEXTAUTH_URL` - Base URL for callbacks

The authentication system is now fully functional with secure password handling, session management, and protected routes.

---

### Workflow Data Model Implementation (Completed)

#### What Was Implemented:

1. **TypeScript Type Definitions** (`src/lib/workflow/types/`)
   - **Base Types** (`base.ts`): Core enums and interfaces for data types, categories, statuses
   - **Node Types** (`node.ts`): Complete node system with inputs, outputs, edges, and execution
   - **Connection Types** (`connection.ts`): Connection definitions with validation support
   - **Workflow Types** (`workflow.ts`): Main workflow structure with config, triggers, and templates
   - **Execution Types** (`execution.ts`): Execution context and runtime services

2. **JSON Schema Validation** (`src/lib/workflow/schemas/`)
   - Created comprehensive JSON schema for workflow validation
   - Supports all workflow components: nodes, connections, variables, inputs/outputs, triggers
   - Includes nested definitions for complex structures

3. **Validation Implementation** (`src/lib/workflow/validation/`)
   - **WorkflowValidator**: Complete workflow validation with schema and business rules
   - **ConnectionValidator**: Connection-specific validation including:
     - Type compatibility checking
     - Circular dependency detection using DFS
     - Port validation
     - Required connection checking
   - Uses AJV for JSON schema validation

4. **Example Implementation** (`src/lib/workflow/examples/`)
   - Created example workflow demonstrating HTTP request, conditional logic, and data transformation
   - Shows how to define nodes and validate workflows
   - Includes programmatic workflow creation

#### Key Features:

- **Type Safety**: Full TypeScript support with comprehensive interfaces
- **Flexible Node System**: Supports multiple input/output ports, edges for branching, and custom validation
- **Connection Validation**: Type checking, circular dependency detection, and connection rules
- **Execution Context**: Rich context with state management, logging, events, and flow control
- **Extensible Design**: Easy to add new node types and validation rules
- **JSON Schema**: Industry-standard validation with AJV

#### Architecture Highlights:

1. **Modular Structure**: Types, validation, and schemas are separated for clarity
2. **Comprehensive Validation**: Both structural (JSON schema) and logical (business rules)
3. **AI-Friendly**: Nodes include AI prompt hints for better discovery
4. **Production Ready**: Includes retry policies, error handling, and resource limits

The workflow data model provides a solid foundation for building the execution engine and UI components.
```

File: /Users/narcisbrindusescu/cod/nextproject/PRD-lite.md
```md
# Product Requirements Document: FlowForge AI (MVP)

## Executive Summary

FlowForge AI MVP is a streamlined workflow automation platform that enables users to create and run AI-powered workflows. Built on the principle that "code is data," it provides a foundation for building self-aware workflows that can be modified by AI agents. This MVP focuses on delivering core automation capabilities with AI integration while serving as a production-ready boilerplate for developers.

## Vision Statement

To provide a lightweight, AI-friendly workflow automation platform that makes complex automation accessible while serving as a quick-to-market foundation for AI-powered applications.

## Core Value Propositions (MVP)

### 1. **AI-Native Workflows**
- Workflows stored as JSON for easy AI generation and modification
- Simple API for AI agents to create and modify workflows
- Basic self-inspection capabilities for debugging

### 2. **Developer-First Approach**
- Production-ready boilerplate with auth and basic infrastructure
- Extensible node system for custom integrations
- Clean architecture for rapid development

### 3. **Simple Automation**
- Essential nodes for common automation tasks
- Reliable execution engine with error handling
- Basic monitoring and logging

## Target Users (MVP)

### Primary Persona
**The AI Developer/Startup Founder**
- Building AI agents or autonomous systems
- Needs simple, reliable workflow orchestration
- Wants to get to market quickly
- Values: Simplicity, extensibility, time-to-market

### Secondary Persona
**The Automation Power User**
- Currently uses complex automations
- Wants AI integration capabilities
- Comfortable with JSON/code editing
- Values: Flexibility, AI features

## Core Features (MVP)

### 1. Simple Workflow Editor
**Priority: P0 - Critical**

- **JSON-based workflow editor** with syntax highlighting
- **Visual workflow viewer** (read-only React Flow visualization)
- **Live JSON validation** and error hints
- **Import/export** workflows as JSON
- **Basic templates** for common patterns

### 2. Essential Node Set
**Priority: P0 - Critical**

#### MVP Nodes (10-15 total)
- **Logic**: If/else, delay, loop
- **HTTP/API**: REST calls, webhooks
- **Data**: Transform, merge, filter
- **AI**: OpenAI, Anthropic integration
- **Communication**: Email, webhook notifications
- **Database**: Basic CRUD operations

### 3. Execution Engine
**Priority: P0 - Critical**

- **Reliable execution** with queue management
- **Error handling** with simple retry
- **State persistence** for workflow runs
- **Basic scheduling** (cron-like)
- **Execution logs** and status tracking

### 4. AI Integration
**Priority: P0 - Critical**

- **API endpoints** for AI workflow creation
- **Workflow modification** via API
- **Simple AI assistant** for workflow creation
- **Natural language to workflow** (basic)

### 5. Basic Monitoring
**Priority: P0 - Critical**

- **Execution history** with status
- **Simple metrics** (success/failure rates)
- **Basic error logs** and debugging
- **API usage tracking**

### 6. Authentication & Security
**Priority: P0 - Critical**

- **User authentication** (email/password)
- **API key management**
- **Encrypted credential storage**
- **Basic RBAC** (user/admin)

### 7. Developer Tools
**Priority: P1 - High**

- **REST API** for core operations
- **API documentation** (OpenAPI)
- **Example integrations**
- **Node development guide**

## Subscription Tiers (MVP)

### Free Tier
- 100 workflow executions/month
- 3 active workflows
- Community support

### Pro - $49/month
- 10,000 executions/month
- Unlimited workflows
- All nodes
- Email support
- API access

### Team - $149/month
- 100,000 executions/month
- Priority support
- 5 team members
- Advanced features

## Technical Architecture (MVP)

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI**: React 19 with TypeScript + Daisy UI components
- **Styling**: Tailwind CSS v4
- **State**: Zustand (simple)
- **Editor**: Monaco or CodeMirror for JSON

### Backend
- **API**: Next.js API routes
- **Database**: PostgreSQL with Drizzle ORM
- **Queue**: BullMQ with Redis
- **Authentication**: NextAuth.js (simple)

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase
- **Queue/Cache**: Upstash Redis
- **Email**: Resend

## Success Metrics (MVP)

### Launch Goals (First 3 Months)
- 500 signups
- 50 paying customers
- $2,500 MRR
- 10 active developers using boilerplate

### Engagement
- 40% weekly active users
- Average 3 workflows per user
- 500 executions per active user/month

### Technical
- 99% uptime
- <200ms API response time
- <5s workflow execution start

## Competitive Advantages (MVP)

1. **AI-First Design**: Built for AI modification from day one
2. **Developer Friendly**: Clean boilerplate for rapid development
3. **Simple but Powerful**: Essential features without complexity
4. **Quick to Market**: Launch-ready in weeks, not months

## Out of Scope for MVP

- Visual workflow designer (only viewer)
- Mobile app
- Advanced collaboration features
- Enterprise features (SSO, compliance)
- Marketplace
- 100+ integrations (start with 10-15)
- Advanced analytics
- White-label options
- Complex approval workflows
- Custom node builder UI

## Risk Mitigation (MVP)

### Technical Risks
- **Simplicity First**: Focus on core features that work well
- **Proven Stack**: Use battle-tested technologies

### Business Risks
- **Quick Launch**: Get to market fast and iterate
- **Clear Positioning**: AI-first automation for developers

## Conclusion

FlowForge AI MVP focuses on delivering a working AI-powered workflow automation platform that can go to market quickly. By trimming advanced features and focusing on core value propositions—AI-native design, developer experience, and essential automation—we can launch within 6-8 weeks and begin gathering user feedback for future iterations.
```

File: /Users/narcisbrindusescu/cod/nextproject/src/lib/flow-engine/core/FlowHub.js
```js
/**
 * FlowHub: A singleton manager for handling pause and resume operations
 * across all FlowManager instances. It allows workflows to request human intervention
 * and for an external UI layer (or any service) to respond and resume the flow.
 * This version uses a custom, environment-agnostic event bus and also handles
 * step events from FlowManager instances.
 */
const FlowHub = (function() {
    // _pausedFlows: Stores active pause states.
    // Key: pauseId (string)
    // Value: { resolve: Function (to resume the Promise), details: any, flowInstanceId: string }
    const _pausedFlows = new Map();

    // _listeners: Stores event listeners for the custom event bus.
    // Key: eventName (string)
    // Value: Array of callback functions
    const _listeners = {};

    let _pauseIdCounter = 0; // Simple counter for generating unique parts of pause IDs.

    /**
     * Generates a unique ID for a pause request.
     * @param {string} [prefix='pause'] - A prefix for the ID, often related to the flow instance.
     * @returns {string} A unique pause ID.
     */
    function generatePauseId(prefix = 'pause') {
        _pauseIdCounter++;
        return `${prefix}-${Date.now()}-${_pauseIdCounter}`;
    }

    return {
        /**
         * Emits an event to all registered listeners for that event type.
         * @param {string} eventName - The name of the event (e.g., 'flowPaused', 'flowManagerStep').
         * @param {object} eventData - The data to be passed to the listeners.
         */
        _emitEvent(eventName, eventData) {
            if (_listeners[eventName]) {
                _listeners[eventName].forEach((callback, index) => {
                    try {
                        // Pass the eventData object directly to the callback
                        callback(eventData);
                    } catch (e) {
                        // Silently handle errors
                    }
                });
            }
        },

        /**
         * Adds an event listener for events.
         * @param {string} eventName - Event to listen for ('flowPaused', 'flowResumed', 'resumeFailed', 'flowManagerStep', 'flowManagerNodeEvent').
         * @param {Function} callback - The function to call when the event occurs. The callback will receive the eventData object.
         */
        addEventListener(eventName, callback) {
            if (typeof callback !== 'function') {
                return;
            }
            if (!_listeners[eventName]) {
                _listeners[eventName] = [];
            }
            _listeners[eventName].push(callback);
        },

        /**
         * Removes an event listener.
         * @param {string} eventName - The event name.
         * @param {Function} callback - The callback to remove.
         */
        removeEventListener(eventName, callback) {
            if (_listeners[eventName]) {
                _listeners[eventName] = _listeners[eventName].filter(cb => cb !== callback);
            }
        },

        /**
         * Called by a FlowManager node (via `this.humanInput`) to pause execution.
         * @param {object} options - Pause options.
         * @param {string} [options.pauseId] - A user-suggested ID for this pause. If not unique or provided, one is generated.
         * @param {any} [options.details] - Data/details about the pause, to be sent to the UI/service.
         * @param {string} options.flowInstanceId - The ID of the FlowManager instance initiating the pause.
         * @returns {Promise<any>} A promise that resolves with data when `resume()` is called for this pause.
         */
        requestPause({ pauseId: customPauseId, details, flowInstanceId }) {
            return new Promise((resolve) => {
                const pauseId = customPauseId && !_pausedFlows.has(customPauseId) ? customPauseId : generatePauseId(flowInstanceId || 'flow');

                if (_pausedFlows.has(pauseId)) {
                }
                _pausedFlows.set(pauseId, { resolve, details, flowInstanceId });
                this._emitEvent('flowPaused', { pauseId, details, flowInstanceId });
            });
        },

        /**
         * Called by an external system (e.g., UI or another service) to resume a paused flow.
         * @param {string} pauseId - The ID of the pause to resume.
         * @param {any} resumeData - Data to be passed back to the awaiting `humanInput()` call in the flow.
         * @returns {boolean} True if resume was successful, false otherwise (e.g., pauseId not found).
         */
        resume(pauseId, resumeData) {
            if (_pausedFlows.has(pauseId)) {
                const { resolve, details, flowInstanceId } = _pausedFlows.get(pauseId);
                resolve(resumeData);
                _pausedFlows.delete(pauseId);
                this._emitEvent('flowResumed', { pauseId, resumeData, details, flowInstanceId });
                return true;
            } else {
                this._emitEvent('resumeFailed', { pauseId, reason: 'No active pause found' });
                return false;
            }
        },

        /**
         * Checks if a specific pause ID is currently active.
         * @param {string} pauseId - The pause ID to check.
         * @returns {boolean} True if the pauseId corresponds to an active pause.
         */
        isPaused(pauseId) {
            return _pausedFlows.has(pauseId);
        },

        /**
         * Gets details of all currently active pauses. Useful for a UI/service to display a list of pending actions.
         * @returns {Array<object>} An array of objects, each being { pauseId, details, flowInstanceId }.
         */
        getActivePauses() {
            const active = [];
            _pausedFlows.forEach(({ details, flowInstanceId }, pauseId) => {
                active.push({ pauseId, details, flowInstanceId });
            });
            return active;
        }
    };
})();

export default FlowHub;
```

File: /Users/narcisbrindusescu/cod/nextproject/src/lib/flow-engine/core/FlowManager.js
```js
// File: /Users/narcisbrindusescu/cod/Narcissus/agent/flow-engine/core/FlowManager.js

import FlowHub from './FlowHub.js';

/**
 * Helper function to emit events to both FlowHub and global event emitter
 * @param {string} eventName - The name of the event
 * @param {any} data - The event data
 */
function emitToAllChannels(eventName, data) {
  // Emit to FlowHub as usual
  FlowHub._emitEvent(eventName, data);
  
  // Also emit to global event emitter for cross-context communication
  try {
    if (typeof global !== 'undefined' && global.__flowEngineGlobalEmitter) {
      global.__flowEngineGlobalEmitter.emit(eventName, data);
    }
  } catch (error) {
    // Silently handle errors
  }
}

/**
 * FlowManager: A powerful and flexible engine for orchestrating complex workflows,
 * particularly well-suited for AI agentic systems. It allows workflows to be defined
 * as serializable JSON-like structures, enabling dynamic generation, persistence,
 * and execution of directed graphs of tasks and decisions.
 *
 * Each node's execution context (`this`) provides:
 * - `state`: Access to the FlowManager's StateManager (get, set, undo, redo, etc.).
 * - `steps`: An array of previously executed steps in the current flow (providing history).
 * - `nodes`: The full list of node definitions for the current FlowManager instance.
 * - `self`: The definition or structure of the current node being executed.
 *           - For nodes specified as strings (resolved via scope):
 *             - If resolved to a full NodeDefinition (e.g., from NodeRegistry), `self` is that NodeDefinition.
 *             - If resolved to a simple function in scope, `self` is a synthetic descriptor for that function.
 *             - If unresolved, `self` is a minimal object with the identifier.
 *           - For functions directly in the workflow array, `self` is a synthetic descriptor object.
 *           - For structural nodes (arrays for sub-flows/loops, objects for branches/parameterized calls), `self` is the structure itself.
 * - `input`: The output data from the previously executed node in the current sequence.
 *            This is typically derived from the `results` array of the previous node's processed output.
 *            - If `results` had one item, `input` is that item.
 *            - If `results` had multiple items, `input` is the array of items.
 *            - For the first node in a sequence, or if the previous node had no `results`, `input` is `null`.
 * - `flowInstanceId`: The unique ID of the current FlowManager instance.
 * - `humanInput(details, customPauseId)`: Function to request human input, pausing the flow.
 * - `emit(customEventName, data)`: Function to emit a custom event via FlowHub.
 * - `on(customEventName, nodeCallback)`: Function to listen for custom events on FlowHub.
 *
 * Emits a 'flowManagerStep' event via FlowHub after each step is executed.
 *
 * @param {object} config - Configuration for the FlowManager.
 * @param {object} [config.initialState={}] - The initial state for the workflow.
 * @param {Array} [config.nodes=[]] - An array defining the workflow's structure.
 * @param {string} [config.instanceId] - An optional ID for this FlowManager instance.
 * @param {object} [config.scope={}] - The scope object containing node implementations (functions or NodeDefinition objects).
 * @param {any} [config.initialInput=null] - The initial input for the first node in the flow.
 * @returns {object} An API to run and interact with the flow.
 */
export function FlowManager({
    initialState,
    nodes,
    instanceId,
    scope: providedScope,
    initialInput = null // <<< ADDED initialInput parameter
} = {
    initialState: {},
    nodes: [],
    instanceId: undefined,
    scope: {}, // This default applies if the whole config object is missing
    initialInput: null // <<< ADDED default for destructuring
}) {
  const steps = [];
  let currentNode = null; // Represents the node definition *currently being executed or focused on* by the engine. Used by emit/on.
  let currentIndex = 0; // Index for iterating through the `nodes` array of this FlowManager instance.
  const flowInstanceId = instanceId || `fm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const fmState = StateManager(initialState);
  let _resolveRunPromise = null;
  let _rejectRunPromise = null;
  
  const scope = providedScope || {}; // <<< MODIFIED: Ensure scope is always an object
  const _initialInput = initialInput; // <<< ADDED: Store initialInput for use later

  const _registeredHubListeners = [];

    /**
   * Recursively traverses an object or array, resolving string placeholders
   * of the format '${path.to.state}' with values from the state.
   * Supports array access like '${myArray[0].name}'.
   * @param {any} value - The value (object, array, string, etc.) to process.
   * @param {object} state - The StateManager instance.
   * @returns {any} The processed value with placeholders replaced.
   */
  function resolveStatePlaceholders(value, state) {
    // If it's a string, check if it's a state placeholder
    if (typeof value === 'string') {
        const match = value.match(/^\${([a-zA-Z0-9_.\[\]]+)}$/);
        if (match) {
            const path = match[1];

            // Helper to get value from a path with array access notation (e.g., 'items[0].name')
            const getValueFromPath = (obj, pathString) => {
                // Converts 'array[0].name' to 'array.0.name' then splits into parts
                const pathParts = pathString.replace(/\[(\d+)\]/g, '.$1').split('.');
                let current = obj;
                for (const part of pathParts) {
                    if (current === null || typeof current === 'undefined') {
                        return undefined;
                    }
                    current = current[part];
                }
                return current;
            };

            // Use the helper to get the value from the current state
            return getValueFromPath(state.getState(), path);
        }
        return value; // Return original string if it's not a placeholder
    }

    // If it's an array, process each item recursively
    if (Array.isArray(value)) {
        return value.map(item => resolveStatePlaceholders(item, state));
    }

    // If it's an object, process each value recursively
    if (typeof value === 'object' && value !== null) {
        const newObj = {};
        for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                newObj[key] = resolveStatePlaceholders(value[key], state);
            }
        }
        return newObj;
    }

    // For other types (number, boolean, null, etc.), return as is
    return value;
  }

  /**
   * Manages the state of the FlowManager instance, including history for undo/redo.
   * @param {object} [_initialState={}] - The initial state for the StateManager.
   * @returns {object} An API to interact with the state.
   */
  function StateManager(_initialState = {}) {
    const _currentState = JSON.parse(JSON.stringify(_initialState));
    const _history = [JSON.parse(JSON.stringify(_initialState))];
    let _historyCurrentIndex = 0;

    return {
      get(path) {
        if (!path) return undefined; // MODIFIED: Or perhaps return undefined/null for consistency if path is empty
        const keys = path.split('.');
        let result = _currentState;
        for (const key of keys) {
          if (result === undefined || result === null || !Object.prototype.hasOwnProperty.call(result, key)) {
            return undefined; // <<< MODIFIED: Return undefined if path not fully resolved
          }
          result = result[key];
        }
        return result; // <<< MODIFIED: Return the actual stored value (could be null, undefined, '', etc.)
      },
      set(path, value) {
        let targetObjectForReturn; // What the 'set' operation effectively targeted
    
        if (path === null || path === '') {
            // The intention is to replace the entire state.
            // _currentState should become a deep copy of 'value'.
            const newFullState = JSON.parse(JSON.stringify(value));
            
            // Clear out the old _currentState properties
            Object.keys(_currentState).forEach(key => delete _currentState[key]);
            // Assign new properties from newFullState to _currentState
            Object.assign(_currentState, newFullState);
            targetObjectForReturn = _currentState;
        } else {
            // Setting a specific path
            const keys = path.split('.');
            let current = _currentState; // Work directly on _currentState for path setting
    
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!current[key] || typeof current[key] !== 'object') {
                    current[key] = {}; // Create structure if it doesn't exist
                }
                current = current[key];
            }
            const lastKey = keys[keys.length - 1];
            current[lastKey] = JSON.parse(JSON.stringify(value)); // Ensure deep copy of value being set
            targetObjectForReturn = current[lastKey];
        }
    
        // FIXED: Remove any future history entries and add the new state
        _history.splice(_historyCurrentIndex + 1); // Remove future entries
        _history.push(JSON.parse(JSON.stringify(_currentState))); // Add current modified state
        _historyCurrentIndex = _history.length - 1; // Update index to point to the new entry
    
        return JSON.parse(JSON.stringify(targetObjectForReturn)); // Return a deep copy of what was set
    },

      getState() { return JSON.parse(JSON.stringify(_currentState)); },
      canUndo() { return _historyCurrentIndex > 0; },
      canRedo() { return _historyCurrentIndex < _history.length - 1; },
      undo() {
        if (this.canUndo()) {
          _historyCurrentIndex--;
          // Clear current state
          Object.keys(_currentState).forEach(key => delete _currentState[key]);
          // Assign the historical state
          Object.assign(_currentState, JSON.parse(JSON.stringify(_history[_historyCurrentIndex])));
      }
      return this.getState();
      },
      redo() {
        if (this.canRedo()) {
          _historyCurrentIndex++;
          // Clear current state
          Object.keys(_currentState).forEach(key => delete _currentState[key]);
          // Assign the historical state
          Object.assign(_currentState, JSON.parse(JSON.stringify(_history[_historyCurrentIndex])));
      }
      return this.getState();
      },
      goToState(index) {
        if (index >= 0 && index < _history.length) {
          _historyCurrentIndex = index;
          // Clear current state
          Object.keys(_currentState).forEach(key => delete _currentState[key]);
          // Assign the historical state
          Object.assign(_currentState, JSON.parse(JSON.stringify(_history[_historyCurrentIndex])));
      }
      return this.getState();
      },
      getHistory() { return _history.map(s => JSON.parse(JSON.stringify(s))); },
      getCurrentIndex() { return _historyCurrentIndex; }
    };
  }

  /**
   * The execution context provided to each node's implementation function (`this` context).
   * `self`, `input`, and `flowInstanceId` are dynamically set or are instance-specific.
   * `steps` and `nodes` provide broader flow context.
   * `state` provides state management capabilities.
   * `emit`/`on`/`humanInput` provide interaction capabilities.
   */
  const baseExecutionContext = {
      state: fmState,
      steps,
      nodes,
      self: null, // Dynamically set in _nextStepInternal before each node execution
      input: null, // Dynamically set in _nextStepInternal before each node execution
      flowInstanceId: flowInstanceId, // Set once for the FlowManager instance
      /**
       * Requests human input, pausing the flow execution until input is provided via FlowHub.
       * Uses `currentNode` and `currentIndex` from FlowManager's lexical scope to identify the calling node.
       * @param {object} details - Details about the required input (passed to UI/responder).
       * @param {string} [customPauseId] - A custom ID for this pause request.
       * @returns {Promise<any>} A promise that resolves with the human-provided data.
       */
      humanInput: async function(details, customPauseId) {
          const resumeData = await FlowHub.requestPause({
              pauseId: customPauseId,
              details,
              flowInstanceId: this.flowInstanceId
          });
          return resumeData;
      },
      /**
       * Emits a custom event globally via FlowHub.
       * Uses `currentNode` and `currentIndex` from FlowManager's lexical scope to identify the emitting node.
       * @param {string} customEventName - The custom name of the event.
       * @param {any} data - The payload for the event.
       */
      emit: async function(customEventName, data) {
          const emittingNodeMeta = {
              index: currentIndex - 1,
              definition: currentNode
          };
          
          // Handle case where definition is a function or can't be serialized
          let serializedDefinition;
          try {
              if (typeof emittingNodeMeta.definition === 'function') {
                  serializedDefinition = {
                      type: 'function',
                      name: emittingNodeMeta.definition.name || 'anonymous',
                      toString: emittingNodeMeta.definition.toString()
                  };
              } else {
                  serializedDefinition = JSON.parse(JSON.stringify(emittingNodeMeta.definition));
              }
          } catch (e) {
              serializedDefinition = { type: 'unserializable', error: e.message };
          }
          
          emitToAllChannels('flowManagerNodeEvent', {
              flowInstanceId: this.flowInstanceId,
              emittingNode: {
                  index: emittingNodeMeta.index,
                  definition: serializedDefinition
              },
              customEventName: customEventName,
              eventData: data,
              timestamp: Date.now()
          });
      },
      /**
       * Registers a listener on FlowHub for a custom node event.
       * Uses `currentNode` and `currentIndex` from FlowManager's lexical scope to identify the listening node.
       * The listener will be automatically cleaned up when this FlowManager instance is re-run.
       * @param {string} customEventName - The custom name of the event to listen for.
       * @param {Function} nodeCallback - The function to call when the event occurs.
       *                              It receives (data, meta) arguments.
       *                              'this' inside the callback is the `baseExecutionContext` of the listening node,
       *                              with 'self' and 'input' captured at the time of listener registration.
       */
      on: function(customEventName, nodeCallback) {
        if (typeof nodeCallback !== 'function') {
            return;
        }
    
        // Capture critical parts of the context AT THE TIME OF LISTENER REGISTRATION
        const capturedSelf = JSON.parse(JSON.stringify(this.self));
        const capturedInput = (typeof this.input === 'object' && this.input !== null)
                              ? JSON.parse(JSON.stringify(this.input))
                              : this.input;
        const flowInstanceId = this.flowInstanceId;
        const state = this.state;
        const emit = this.emit.bind(this);
        const humanInput = this.humanInput.bind(this);
        const steps = this.steps;
        const nodes = this.nodes;
    
        const listeningNodeMeta = {
            index: currentIndex - 1,
            definition: capturedSelf,
            flowInstanceId: flowInstanceId
        };
    
        const effectiveHubCallback = (flowHubEventData) => {
            if (flowHubEventData.customEventName === customEventName) {
                const meta = {
                    eventName: flowHubEventData.customEventName,
                    emittingNodeMeta: {
                        index: flowHubEventData.emittingNode.index,
                        definition: flowHubEventData.emittingNode.definition,
                        flowInstanceId: flowHubEventData.flowInstanceId
                    },
                    listeningNodeMeta: listeningNodeMeta
                };
    
                // Create a fresh context object with captured values
                const callbackThisContext = {
                    self: capturedSelf,
                    input: capturedInput,
                    flowInstanceId: flowInstanceId,
                    state: state,
                    emit: emit,
                    humanInput: humanInput,
                    steps: steps,
                    nodes: nodes,
                    on: function() {
                        // Cannot register new listeners from within an event callback
                    }
                };
    
                try {
                    nodeCallback.call(callbackThisContext, flowHubEventData.eventData, meta);
                } catch (e) {
                    // Silently handle errors in event listener callbacks
                }
            }
        };
    
        FlowHub.addEventListener('flowManagerNodeEvent', effectiveHubCallback);
        _registeredHubListeners.push({
            hubEventName: 'flowManagerNodeEvent',
            effectiveHubCallback: effectiveHubCallback
        });
    }
  };

  /**
   * Finds a full NodeDefinition object or a synthetic definition from the scope.
   * This is primarily used to populate `this.self` in the node execution context.
   * It prioritizes finding full NodeDefinitions (objects with an `id`, `name`, `implementation`, etc.).
   * If the identifier points to a simple function in scope, a synthetic definition is returned.
   * @param {string} nodeIdentifier - The string identifier for the node.
   * @returns {object | null} The NodeDefinition object, a synthetic definition, or null if not suitably found.
   */
  function findNodeDefinitionInScope(nodeIdentifier) {
    if (!scope || typeof nodeIdentifier !== 'string') {
      return null;
    }

    const directMatch = scope[nodeIdentifier];

    // Case 1: Direct match is a full NodeDefinition (e.g., "id:name" key from NodeRegistry.getScope())
    if (directMatch && typeof directMatch === 'object' && directMatch !== null && typeof directMatch.implementation === 'function') {
      return directMatch;
    }

    // Case 2: Resolve by ID from "id:name" keys (e.g., "text.analysis.sentiment")
    for (const key in scope) {
      if (Object.prototype.hasOwnProperty.call(scope, key) && key.startsWith(nodeIdentifier + ":")) {
        const entry = scope[key];
        // Check if it's a valid NodeDefinition structure
        if (entry && typeof entry === 'object' && typeof entry.implementation === 'function') {
          return entry;
        }
      }
    }

    // Case 3: Resolve by Name from "id:name" keys (e.g., "Sentiment Analyzer")
    for (const key in scope) {
      if (Object.prototype.hasOwnProperty.call(scope, key) && key.endsWith(":" + nodeIdentifier)) {
        const entry = scope[key];
        // Check if it's a valid NodeDefinition structure
        if (entry && typeof entry === 'object' && typeof entry.implementation === 'function') {
          return entry;
        }
      }
    }

    // Case 4: Direct match was a simple function (user-added function to scope)
    // Create a synthetic definition for `this.self`.
    if (directMatch && typeof directMatch === 'function') {
        return {
            id: nodeIdentifier, // The key used to find it in scope
            name: nodeIdentifier, // Use identifier as name
            description: 'A custom function provided directly in the FlowManager scope.',
            // The actual implementation is resolved separately by `resolveNodeFromScope`.
            // `self` is primarily metadata.
            _isScopeProvidedFunction: true
        };
    }

    // If not found as a full NodeDefinition or a direct function in scope
    return null;
  }

  /**
   * Resolves a node identifier string to its executable implementation function
   * using the FlowManager's 'scope' object.
   * (Original logic for resolving implementation remains unchanged)
   * @param {string} nodeIdentifier - The string identifier for the node.
   * @returns {Function | null} The executable function or null if not found.
   */
  function resolveNodeFromScope(nodeIdentifier) {
    if (!scope || typeof nodeIdentifier !== 'string') {
      return null;
    }
    const directMatch = scope[nodeIdentifier];
    if (directMatch) {
      if (typeof directMatch === 'function') {
        return directMatch;
      }
      if (typeof directMatch.implementation === 'function') {
        return directMatch.implementation;
      }
    }
    for (const key in scope) {
      if (Object.prototype.hasOwnProperty.call(scope, key) && key.startsWith(nodeIdentifier + ":")) {
        const entry = scope[key];
        if (entry && typeof entry.implementation === 'function') {
          return entry.implementation;
        }
      }
    }
    for (const key in scope) {
      if (Object.prototype.hasOwnProperty.call(scope, key) && key.endsWith(":" + nodeIdentifier)) {
        const entry = scope[key];
        if (entry && typeof entry.implementation === 'function') {
          return entry.implementation;
        }
      }
    }
    return null;
  }

  /**
   * Processes the value returned by a node's implementation into a standard output format.
   * (Original logic remains unchanged)
   * @param {any} returnedValue - The value returned by the node's implementation.
   * @param {object} context - The execution context (`baseExecutionContext`), enabling edge functions to use `this`.
   * @returns {Promise<object>} A promise that resolves to the standard output object {edges: string[], results?: any[]}.
   */
  async function processReturnedValue(returnedValue, context) {
    let output = null;
    if (Array.isArray(returnedValue)) {
      if (returnedValue.every(item => typeof item === 'string') && returnedValue.length > 0) {
        output = { edges: returnedValue };
      } else {
        output = { edges: ['pass'], results: [returnedValue] };
      }
    } else if (typeof returnedValue === 'object' && returnedValue !== null) {
      // Check if the object already has edges property (standard output format)
      if (Array.isArray(returnedValue.edges)) {
        output = returnedValue;
      } else {
        const edgeFunctions = {};
        const edgeNames = [];
        Object.keys(returnedValue).forEach(key => {
          if (typeof returnedValue[key] === 'function') {
            edgeNames.push(key);
            edgeFunctions[key] = returnedValue[key];
          }
        });

        if (edgeNames.length > 0) {
        const results = [];
        for (const k of edgeNames) {
          try {
            const edgeFn = edgeFunctions[k];
            // Pass the full context to edge functions, allowing them to use this.state, this.input etc.
            let result = await Promise.resolve(edgeFn.apply(context, []));
            results.push(result);
          } catch (e) {
            // Silently handle edge function execution errors
            results.push({ error: e.message });
          }
        }
        output = {
          edges: edgeNames,
          results: results
        };
        } else {
          output = { edges: ['pass'], results: [returnedValue] };
        }
      }
    } else if (typeof returnedValue === 'string') {
      output = { edges: [returnedValue], results: [returnedValue] }; // <<< MODIFIED to include results
    } else {
      output = { edges: ['pass'], results: [returnedValue] };
    }

    if (!output.edges || output.edges.length === 0) {
        output.edges = ['pass'];
    }
    return output;
  }

  /**
   * Manages the execution of a loop construct within the flow.
   * @param {Array} loopNodesConfig - The array defining the loop's controller and actions.
   * @param {any} loopInitialInput - The input to the loop construct for the first iteration.
   * @returns {Promise<object>} A promise resolving to { internalSteps: Array, finalOutput: object }.
   */
  async function loopManager(loopNodesConfig, loopInitialInput) { // <<< ADDED loopInitialInput
    const loopInternalSteps = [];
    if (!loopNodesConfig || loopNodesConfig.length === 0) {
      const passOutput = { edges: ['pass'] };
      return { internalSteps: [{ nodeDetail: "Empty Loop Body", output: passOutput }], finalOutput: passOutput };
    }
    const controllerNode = loopNodesConfig[0];
    const actionNodes = loopNodesConfig.slice(1);
    let maxIterations = 100;
    let iterationCount = 0;
    let lastLoopIterationOutput = { edges: ['pass'] };

    while (iterationCount < maxIterations) {
      iterationCount++;
      const loopIterationInstanceId = `${flowInstanceId}-loop${iterationCount}`;

      const controllerFM = FlowManager({
        initialState: fmState.getState(),
        nodes: [controllerNode],
        instanceId: `${loopIterationInstanceId}-ctrl`,
        scope: scope,
        initialInput: (iterationCount === 1) ? loopInitialInput : (lastLoopIterationOutput?.results ? lastLoopIterationOutput.results[0] : null) // <<< MODIFIED to use loopInitialInput
      });

      const controllerRunResult = await controllerFM.run();
      let controllerOutput;

      if (controllerRunResult && controllerRunResult.length > 0) {
        controllerOutput = controllerRunResult.at(-1).output;
        fmState.set(null, controllerFM.getStateManager().getState());
        loopInternalSteps.push({
          nodeDetail: `Loop Iter ${iterationCount}: Controller ${typeof controllerNode === 'string' ? controllerNode : 'Complex Controller'}`,
          outputFromController: controllerOutput,
          controllerSubSteps: controllerRunResult
        });
      } else {
        console.warn(`[FlowManager:${flowInstanceId}] Loop controller (iter ${iterationCount}) did not produce output. Defaulting to 'exit'.`);
        controllerOutput = { edges: ['exit'] };
        loopInternalSteps.push({
          nodeDetail: `Loop Iter ${iterationCount}: Controller Error or No Output`, outputFromController: controllerOutput,
        });
      }

      lastLoopIterationOutput = controllerOutput;

      // Check if the controller returned an exit edge
      // The actual return value is in results[0] if it's an object with edges
      let shouldExit = false;
      if (controllerOutput.edges && (controllerOutput.edges.includes('exit') || controllerOutput.edges.includes('exit_forced'))) {
        shouldExit = true;
      } else if (controllerOutput.results && controllerOutput.results.length > 0) {
        const controllerResult = controllerOutput.results[0];
        if (controllerResult && typeof controllerResult === 'object' && controllerResult.edges) {
          if (controllerResult.edges.includes('exit') || controllerResult.edges.includes('exit_forced')) {
            shouldExit = true;
          }
        }
      }

      if (shouldExit) {
        break;
      }

      if (actionNodes.length > 0) {
        const actionsFM = FlowManager({
          initialState: fmState.getState(),
          nodes: actionNodes,
          instanceId: `${loopIterationInstanceId}-actions`,
          scope: scope,
          initialInput: (controllerOutput?.results && controllerOutput.results.length > 0) ? controllerOutput.results[0] : null // <<< ADDED initialInput for actions
        });

        const actionsRunResult = await actionsFM.run();
        fmState.set(null, actionsFM.getStateManager().getState());

        if (actionsRunResult && actionsRunResult.length > 0) {
          lastLoopIterationOutput = actionsRunResult.at(-1).output;
          loopInternalSteps.push({
            nodeDetail: `Loop Iter ${iterationCount}: Actions`, outputFromActions: lastLoopIterationOutput, actionSubSteps: actionsRunResult
          });
        } else {
           loopInternalSteps.push({ nodeDetail: `Loop Iter ${iterationCount}: Actions (no output/steps)`, actionSubSteps: actionsRunResult || [] });
        }
      }

      if (iterationCount >= maxIterations) {
        console.warn(`[FlowManager:${flowInstanceId}] Loop reached max iterations (${maxIterations}). Forcing exit.`);
        lastLoopIterationOutput = { edges: ['exit_forced'] };
        loopInternalSteps.push({ nodeDetail: "Loop Max Iterations Reached", output: lastLoopIterationOutput });
        break;
      }
    }
    return { internalSteps: loopInternalSteps, finalOutput: lastLoopIterationOutput };
  }

  /**
   * Evaluates a single node in the workflow.
   * This function determines the node type and executes it accordingly.
   * It relies on `baseExecutionContext` (accessible via `this` in node implementations and edge functions)
   * having been pre-populated with `self` and `input` by `_nextStepInternal`.
   * @param {any} nodeDefinitionFromWorkflow - The node definition from the `nodes` array to evaluate.
   * @returns {Promise<void>}
   */
  async function evaluateNode(nodeDefinitionFromWorkflow) {
    let output = null;
    let returnedValue;
    const nodeToRecord = nodeDefinitionFromWorkflow;
    let subStepsToRecord = null;

    // Helper to execute a node's implementation function with the correct context and arguments.
    // `baseExecutionContext` is used as `this`, so it has `self`, `input`, `state`, etc.
    async function executeFunc(fn, context, ...args) {
        return await Promise.resolve(fn.apply(context, args));
    }

    if (typeof nodeDefinitionFromWorkflow === 'function') {
      returnedValue = await executeFunc(nodeDefinitionFromWorkflow, baseExecutionContext);
    } else if (typeof nodeDefinitionFromWorkflow === 'string') {
      const implementation = resolveNodeFromScope(nodeDefinitionFromWorkflow);
      if (implementation) {
        returnedValue = await executeFunc(implementation, baseExecutionContext);
      } else {
        console.error(`[FlowManager:${flowInstanceId}] Node/Function '${nodeDefinitionFromWorkflow}' not found in scope. Treating as error.`);
        output = { edges: ['error'], errorDetails: `Node/Function '${nodeDefinitionFromWorkflow}' not found in scope` };
      }
    } else if (Array.isArray(nodeDefinitionFromWorkflow)) {
      if (nodeDefinitionFromWorkflow.length === 1 && Array.isArray(nodeDefinitionFromWorkflow[0]) && nodeDefinitionFromWorkflow[0].length > 0) {
        // Loop construct: [[controller, ...actions]]
        const loopRun = await loopManager(nodeDefinitionFromWorkflow[0], baseExecutionContext.input); // <<< PASSED input to loopManager
        output = loopRun.finalOutput;
        subStepsToRecord = loopRun.internalSteps;
      } else if (nodeDefinitionFromWorkflow.length > 0) {
        // Sub-flow construct: [node1, node2, ...]
        // Each sub-FlowManager will manage its own `input` and `self` context for its nodes.
        const subflowFM = FlowManager({
          initialState: fmState.getState(),
          nodes: nodeDefinitionFromWorkflow,
          instanceId: `${flowInstanceId}-subflow-idx${currentIndex-1}`,
          scope: scope,
          initialInput: baseExecutionContext.input // <<< ADDED: Pass current input as initial for sub-flow
        });
        const subflowResultSteps = await subflowFM.run();
        fmState.set(null, subflowFM.getStateManager().getState());
        output = subflowResultSteps?.at(-1)?.output || { edges: ['pass'] };
        subStepsToRecord = subflowResultSteps;
      } else {
        // Empty array as a node: considered a pass-through
        output = {edges: ['pass']};
      }
    } else if (typeof nodeDefinitionFromWorkflow === 'object' && nodeDefinitionFromWorkflow !== null) {
      if (Object.keys(nodeDefinitionFromWorkflow).length === 0) {
        // Empty object as a node: considered a pass-through
        output = { edges: ['pass'] };
      } else {
        const nodeKey = Object.keys(nodeDefinitionFromWorkflow)[0];
        const nodeValue = nodeDefinitionFromWorkflow[nodeKey];

        const implementation = resolveNodeFromScope(nodeKey);

        if (implementation && Object.keys(nodeDefinitionFromWorkflow).length === 1 && ( (typeof nodeValue === 'object' && !Array.isArray(nodeValue)) || nodeValue === undefined) ) {
          // Case 1: Parameterized function call: { "nodeNameOrId": {param1: value1, ...} }
             const resolvedParams = resolveStatePlaceholders(nodeValue || {}, baseExecutionContext.state);
             returnedValue = await executeFunc(implementation, baseExecutionContext, resolvedParams);
        } else {
          // Case 2: Branching construct: { "edgeName1": nodeA, "edgeName2": nodeB, ... }
          const prevStepOutput = steps.at(-1)?.output; // Output of the node *before this branch object* in the current flow
          const prevEdges = (prevStepOutput && prevStepOutput.edges) ? prevStepOutput.edges : [];
          let branchTaken = false;

          for (const edgeKey of Object.keys(nodeDefinitionFromWorkflow)) {
            if (prevEdges.includes(edgeKey)) {
              const branchNodeDefinition = nodeDefinitionFromWorkflow[edgeKey];
              const branchFM = FlowManager({
                initialState: fmState.getState(),
                nodes: Array.isArray(branchNodeDefinition) ? branchNodeDefinition : [branchNodeDefinition],
                instanceId: `${flowInstanceId}-branch-${edgeKey}-idx${currentIndex-1}`,
                scope: scope,
                initialInput: baseExecutionContext.input // <<< ADDED: Pass current input (from node before branch)
              });
              const branchResultSteps = await branchFM.run();
              fmState.set(null, branchFM.getStateManager().getState());
              output = branchResultSteps?.at(-1)?.output || { edges: ['pass'] };
              subStepsToRecord = branchResultSteps || [];
              branchTaken = true;
              break;
            }
          }
          if (!branchTaken) {
            output = { edges: ['pass'] };
          }
        }
      }
    } else {
      console.warn(`[FlowManager:${flowInstanceId}] Unknown node type or unhandled case:`, nodeDefinitionFromWorkflow);
      output = { edges: ['error', 'pass'], errorDetails: 'Unknown node type' };
    }

    if (returnedValue !== undefined && output === null) {
      output = await processReturnedValue(returnedValue, baseExecutionContext);
    }

    if (!output || typeof output.edges === 'undefined' || !Array.isArray(output.edges) || output.edges.length === 0) {
      output = { ...(output || {}), edges: ['pass'] };
    }

    steps.push({ 
      node: nodeToRecord, 
      output, 
      ...(subStepsToRecord !== null && subStepsToRecord !== undefined ? { subSteps: subStepsToRecord } : {}) 
    });

    emitToAllChannels('flowManagerStep', {
      flowInstanceId: flowInstanceId,
      stepIndex: currentIndex - 1, // 0-based index of the node just processed (currentIndex was already incremented for the next step)
      stepData: JSON.parse(JSON.stringify(steps.at(-1))),
      currentState: fmState.getState()
    });
    console.log(`[FlowManager:${flowInstanceId}] *** EMITTED flowManagerStep EVENT *** Step ${currentIndex - 1}`);
  }

  /**
   * Internal recursive function to process the next node in the `nodes` array.
   * Crucially, it sets up `baseExecutionContext.input` and `baseExecutionContext.self`
   * before each call to `evaluateNode`.
   * @returns {Promise<void>}
   */
  async function _nextStepInternal() {
    if (currentIndex < nodes.length) {
      // `currentNode` (lexical scope) is set to the node definition that is *about to be processed*.
      // This is used by `emit`, `on`, `humanInput` in `baseExecutionContext` to identify their source.
      currentNode = nodes[currentIndex];
      const nodeToEvaluate = nodes[currentIndex]; // The actual node definition from the workflow `nodes` array.

      // 1. Set `baseExecutionContext.input` from the output of the previous step in *this* FlowManager instance
      //    OR from _initialInput if this is the first step.
      if (currentIndex === 0 && _initialInput !== null) { // <<< MODIFIED: Check _initialInput for the very first node
          baseExecutionContext.input = _initialInput;
      } else {
          const previousStep = steps.at(-1);
          if (previousStep && previousStep.output && Array.isArray(previousStep.output.results)) {
              if (previousStep.output.results.length === 1) {
                  baseExecutionContext.input = previousStep.output.results[0];
              } else if (previousStep.output.results.length > 0) {
                  baseExecutionContext.input = previousStep.output.results; // Pass array if multiple results
              } else {
                  baseExecutionContext.input = null; // Empty results array
              }
          } else {
              // No previous step, or previous step had no `results` array (e.g. only edges).
              baseExecutionContext.input = null;
          }
      }


      // 2. Set `baseExecutionContext.self` with the definition/structure of the current node.
      let nodeDefinitionForSelfContext;
      if (typeof nodeToEvaluate === 'string') {
        nodeDefinitionForSelfContext = findNodeDefinitionInScope(nodeToEvaluate);
        if (!nodeDefinitionForSelfContext) {
          // If string identifier isn't a known NodeDefinition or scoped function,
          // `self` becomes a minimal object representing this unresolved identifier.
          nodeDefinitionForSelfContext = {
            id: nodeToEvaluate,
            name: nodeToEvaluate,
            description: "An identifier for a node or function that could not be fully resolved from scope for the 'self' context.",
            source:scope[nodeToEvaluate] ? scope[nodeToEvaluate].toString() : '',
            _unresolvedIdentifier: true
          }
        } else if (scope[nodeToEvaluate] && typeof scope[nodeToEvaluate] === 'function' && !nodeDefinitionForSelfContext._isScopeProvidedFunction) {
             // This case handles if findNodeDefinitionInScope returns a full NodeDef, but the original string
             // was actually a direct function key in scope (e.g. "myDirectScopeFunc" instead of "myDirectScopeFunc:My Custom Function")
             // We still want `self` to reflect the direct function call in this case if findNodeDefinitionInScope didn't already mark it.
             nodeDefinitionForSelfContext = { // Overwrite/refine if necessary
                id: nodeToEvaluate,
                name: nodeToEvaluate,
                description: 'A custom function provided directly in the FlowManager scope.',
                source: scope[nodeToEvaluate].toString(),
                _isScopeProvidedFunction: true
            };
        } else if (nodeDefinitionForSelfContext && nodeDefinitionForSelfContext.implementation) {
            // Ensure source is correctly captured for resolved NodeDefinitions too.
            nodeDefinitionForSelfContext = {
                ...nodeDefinitionForSelfContext,
                source: nodeDefinitionForSelfContext.implementation.toString()
            };
        }

      } else if (typeof nodeToEvaluate === 'function') {
        // For a direct function in the nodes array, `self` is a synthetic definition.
        nodeDefinitionForSelfContext = {
          id: `workflow-function-${currentIndex}`,
          name: `Workflow-Defined Function @ index ${currentIndex}`,
          description: 'A function provided directly within the workflow nodes definition.',
          source: nodeToEvaluate.toString(), // Store the function source code for reference
          _isWorkflowProvidedFunction: true
        };
      } else if (typeof nodeToEvaluate === 'object' && nodeToEvaluate !== null && !Array.isArray(nodeToEvaluate)) {
        // OBJECT CASE: Could be a parameterized call, a branch structure, or an empty object.
        const keys = Object.keys(nodeToEvaluate);

        if (keys.length === 1) {
          const nodeIdentifier = keys[0];
          const nodeParams = nodeToEvaluate[nodeIdentifier];

          // Attempt to resolve the key as a function to see if it's a callable node.
          const implementation = resolveNodeFromScope(nodeIdentifier);

          // Check if the structure matches a parameterized call:
          // - An implementation function must exist for the identifier.
          // - The value associated with the identifier (nodeParams) must be an object (but not an array) or undefined.
          const isParameterizedCallStructure = implementation &&
                                               ((typeof nodeParams === 'object' && !Array.isArray(nodeParams) && nodeParams !== null) || nodeParams === undefined);

          if (isParameterizedCallStructure) {
            // This node is a parameterized function call.
            // Construct 'self' with details about the function being called.
            const selfDefCandidate = findNodeDefinitionInScope(nodeIdentifier);

            if (selfDefCandidate && typeof selfDefCandidate === 'object' && !selfDefCandidate._unresolvedIdentifier) {
                // A definition (full NodeDefinition or synthetic for a scope function) was found.
                // Use it as the base for 'self'.
                nodeDefinitionForSelfContext = {
                    ...selfDefCandidate, // Spread the properties of the found definition
                    description: selfDefCandidate.description || `A parameterized call to '${nodeIdentifier}'.`, // Ensure description exists
                    source: implementation.toString(), // Actual source code of the implementation
                    parametersProvided: nodeParams,    // Parameters passed in the workflow
                    _isParameterizedCall: true         // Flag indicating this type of 'self'
                    // _isScopeProvidedFunction will be preserved if selfDefCandidate had it.
                };
            } else {
                 // Fallback: Implementation was found, but findNodeDefinitionInScope didn't return a rich/resolved object.
                 // Create a more basic synthetic 'self'.
                 nodeDefinitionForSelfContext = {
                    id: nodeIdentifier,
                    name: nodeIdentifier, // Default name to the identifier
                    description: `A parameterized call to the function '${nodeIdentifier}'.`,
                    source: implementation.toString(),
                    parametersProvided: nodeParams,
                    _isParameterizedCall: true
                };
            }
          } else {
            // Not a parameterized call (e.g., implementation not found for the key,
            // or the value 'nodeParams' is an array, suggesting a branch).
            // 'self' is the object structure itself (e.g., for a branch).
            nodeDefinitionForSelfContext = nodeToEvaluate;
          }
        } else {
          // Object with multiple keys (likely a branch) or an empty object (pass-through).
          // 'self' is the object structure itself.
          nodeDefinitionForSelfContext = nodeToEvaluate;
        }
      } else if (Array.isArray(nodeToEvaluate)) {
        // ARRAY CASE: This is a sub-flow or a loop construct.
        // 'self' is the array structure itself as defined in the workflow.
        nodeDefinitionForSelfContext = nodeToEvaluate;
      } else {
        // FALLBACK: For any other unexpected node types.
        console.warn(`[FlowManager:${flowInstanceId}] Unhandled node type for 'self' context construction:`, nodeToEvaluate);
        // Default to setting 'self' as the node itself, though its handling might be undefined.
        nodeDefinitionForSelfContext = nodeToEvaluate;
      }

      baseExecutionContext.self = nodeDefinitionForSelfContext;

      // Increment `currentIndex` *before* calling `evaluateNode` for the current node.
      // This means `currentIndex` in the lexical scope (used by emit/on) will point to the *next* node's slot,
      // so `currentIndex - 1` correctly refers to the 0-based index of the node currently being evaluated.
      currentIndex++;

      await evaluateNode(nodeToEvaluate); // Pass the original node definition from the `nodes` array

      await _nextStepInternal(); // Recurse for the next step
    } else {
      // All nodes in this FlowManager instance processed
      if (_resolveRunPromise) {
        _resolveRunPromise(JSON.parse(JSON.stringify(steps)));
        _resolveRunPromise = null; _rejectRunPromise = null;
      }
    }
  }

  // Public API for the FlowManager instance
  return {
    /**
     * Starts or re-runs the flow execution from the beginning.
     * @returns {Promise<Array>} A promise that resolves with an array of all executed steps.
     */
    async run() {
      currentIndex = 0;
      steps.length = 0;

      _registeredHubListeners.forEach(listenerRegistration => {
          FlowHub.removeEventListener(listenerRegistration.hubEventName, listenerRegistration.effectiveHubCallback);
      });
      _registeredHubListeners.length = 0;

      return new Promise(async (resolve, reject) => {
        _resolveRunPromise = resolve;
        _rejectRunPromise = reject;

        if (!nodes || nodes.length === 0) {
        //  console.log(`[FlowManager:${flowInstanceId}] No nodes to execute.`);
          resolve([]);
          _resolveRunPromise = null; _rejectRunPromise = null;
          return;
        }
        emitToAllChannels('flowManagerStart', {
          flowInstanceId: flowInstanceId,
          currentState: fmState.getState()
        });
        console.log(`[FlowManager:${flowInstanceId}] *** EMITTED flowManagerStart EVENT ***`);
        try {
          console.log(`[FlowManager:${flowInstanceId}] Starting execution. Total nodes: ${nodes.length}. Scope keys: ${Object.keys(scope).length}`);
          await _nextStepInternal();
          emitToAllChannels('flowManagerEnd', {
            flowInstanceId: flowInstanceId,
            summary:`[FlowManager:${flowInstanceId}] Execution finished. Total steps executed: ${steps.length}.`,
            currentState: fmState.getState()
          });
          console.log(`[FlowManager:${flowInstanceId}] *** EMITTED flowManagerEnd EVENT ***`);
          console.log(`[FlowManager:${flowInstanceId}] Execution finished. Total steps executed: ${steps.length}.`);
        } catch (error) {
          console.error(`[FlowManager:${flowInstanceId}] Error during flow execution:`, error);
          if(_rejectRunPromise) _rejectRunPromise(error);
          _resolveRunPromise = null; _rejectRunPromise = null;
        }
      });
    },
    /**
     * Retrieves a deep copy of all steps executed so far in the current or last run.
     * @returns {Array} An array of step objects.
     */
    getSteps: () => JSON.parse(JSON.stringify(steps)),
    /**
     * Retrieves the StateManager instance for this FlowManager.
     * @returns {object} The StateManager instance.
     */
    getStateManager: () => fmState,
    /**
     * Retrieves the unique instance ID of this FlowManager.
     * @returns {string} The instance ID.
     */
    getInstanceId: () => flowInstanceId
  };
}
```

File: /Users/narcisbrindusescu/cod/nextproject/src/lib/flow-engine/core/NodeRegistry.js
```js
// src/flow-engine/core/NodeRegistry.js

const _nodes = new Map(); // Key: nodeId (string), Value: NodeDefinition

export const NodeRegistry = {
    /**
     * Registers a node definition.
     * @param {import('../types/flow-types.jsdoc.js').NodeDefinition} nodeDefinition - The node definition object.
     * @returns {boolean} True if registration was successful, false otherwise.
     */
    register(nodeDefinition) {
        if (!nodeDefinition || !nodeDefinition.id || typeof nodeDefinition.implementation !== 'function' || !nodeDefinition.description) {
            console.error("[NodeRegistry] Invalid node definition: Requires id, implementation, and description.", nodeDefinition);
            return false;
        }
        if (_nodes.has(nodeDefinition.id)) {
            console.warn(`[NodeRegistry] Node with id '${nodeDefinition.id}' (from ${nodeDefinition._sourcePath || 'unknown'}) is being re-registered. Overwriting previous (from ${_nodes.get(nodeDefinition.id)?._sourcePath || 'unknown'}).`);
        }
        _nodes.set(nodeDefinition.id, nodeDefinition);
        return true;
    },

    /**
     * Retrieves a node definition by its ID.
     * @param {string} nodeId - The ID of the node to retrieve.
     * @returns {import('../types/flow-types.jsdoc.js').NodeDefinition | undefined} The node definition or undefined if not found.
     */
    get(nodeId) {
        return _nodes.get(nodeId);
    },

    /**
     * Finds nodes based on specified criteria.
     * AI agents will heavily use this for tool discovery.
     * @param {object} criteria - The search criteria.
     * @param {string} [criteria.text] - Free-text search across name, description, tags, AI hints.
     * @param {string[]} [criteria.categories] - An array of categories to match (AND logic).
     * @param {string[]} [criteria.tags] - An array of tags to match (AND logic).
     * @param {string} [criteria.inputNeeds] - A description of an input the agent has/needs to provide.
     * @param {string} [criteria.outputProvides] - A description of an output the agent is looking for.
     * @returns {import('../types/flow-types.jsdoc.js').NodeDefinition[]} An array of matching node definitions.
     */
    find({ text, categories, tags, inputNeeds, outputProvides }) {
        let results = Array.from(_nodes.values());

        if (text) {
            const lowerText = text.toLowerCase();
            results = results.filter(node =>
                (node.name && node.name.toLowerCase().includes(lowerText)) || // Added check for node.name existence
                node.description.toLowerCase().includes(lowerText) ||
                (node.tags && node.tags.some(tag => tag.toLowerCase().includes(lowerText))) ||
                (node.aiPromptHints && (
                    (node.aiPromptHints.summary && node.aiPromptHints.summary.toLowerCase().includes(lowerText)) ||
                    (node.aiPromptHints.useCase && node.aiPromptHints.useCase.toLowerCase().includes(lowerText)) ||
                    (node.aiPromptHints.toolName && node.aiPromptHints.toolName.toLowerCase().includes(lowerText))
                ))
            );
        }
        if (categories && categories.length) {
            results = results.filter(node => node.categories && categories.every(cat => node.categories.includes(cat)));
        }
        if (tags && tags.length) {
            results = results.filter(node => node.tags && tags.every(tag => node.tags.includes(tag)));
        }

        // Basic conceptual search for input/output needs (can be made more sophisticated with NLP/embeddings)
        if (inputNeeds) {
            const lowerInputNeeds = inputNeeds.toLowerCase();
            results = results.filter(node =>
                node.inputs && node.inputs.some(input => input.description.toLowerCase().includes(lowerInputNeeds))
            );
        }
        if (outputProvides) {
            const lowerOutputProvides = outputProvides.toLowerCase();
            results = results.filter(node =>
                (node.outputs && node.outputs.some(output => output.description.toLowerCase().includes(lowerOutputProvides))) ||
                (node.edges && node.edges.some(edge => edge.description.toLowerCase().includes(lowerOutputProvides)))
            );
        }
        return results;
    },

    /**
     * Retrieves all registered node definitions.
     * @returns {import('../types/flow-types.jsdoc.js').NodeDefinition[]} An array of all node definitions.
     */
    getAll() {
        return Array.from(_nodes.values());
    },

    /**
     * Retrieves a scope object containing full node definitions, keyed by "id:name".
     * The keys are in the format "node.id:node.name" (e.g., "text.transform.toUpperCase:Convert to Uppercase").
     * The values are the full node definition objects.
     * This scope can be augmented and then used by FlowManager (e.g., by assigning to globalThis.scope)
     * to execute nodes.
     * @returns {Object.<string, import('../types/flow-types.jsdoc.js').NodeDefinition>} 
     *          An object mapping "id:name" strings to their full node definitions.
     *          User-added functions will be directly functions, not NodeDefinition objects.
     */
    getScope() {
        const scopeObject = {};
        for (const [nodeId, nodeDefinition] of _nodes) {
            // Ensure essential properties for forming the key and for the definition to be useful
            if (nodeDefinition && nodeDefinition.id && nodeDefinition.name && typeof nodeDefinition.implementation === 'function') {
                const qualifiedKey = `${nodeDefinition.id}:${nodeDefinition.name}`;
                scopeObject[qualifiedKey] = nodeDefinition; // Store the whole definition
            } else {
                console.warn(`[NodeRegistry.getScope] Skipping node due to missing id, name, or implementation:`, nodeDefinition.id || nodeDefinition);
            }
        }
        return scopeObject;
    }
};
```

File: /Users/narcisbrindusescu/cod/nextproject/src/lib/flow-engine/core/TriggerManager.js
```js
import FlowHub from './FlowHub.js';
import { FlowManager } from './FlowManager.js'; // Assuming FlowManager is a named export


/**
 * TriggerManager: Manages the registration, activation, and execution of workflows
 * based on external triggers.
 *
 * @param {object} options
 * @param {NodeRegistryType} options.nodeRegistry - The NodeRegistry instance.
 * @returns {object} An API to manage triggers.
 */
export function TriggerManager({ nodeRegistry }) {
    if (!nodeRegistry) {
        throw new Error("[TriggerManager] NodeRegistry instance is required.");
    }

    /** @type {Map<string, TriggerDefinition>} */
    const _triggers = new Map();
    /** @type {Map<string, TriggerTypeHandler>} */
    const _triggerTypeHandlers = new Map();
    /** @type {Map<string, any>} */ // Stores context returned by handler's activate (e.g., interval IDs)
    const _activeListeners = new Map();
    const _nodeRegistryInstance = nodeRegistry; // Store the provided NodeRegistry

    console.log("[TriggerManager] Initialized.");

    /**
     * Handles an event fired by an active trigger.
     * This is an internal helper function.
     * @param {string} triggerId - The ID of the trigger that fired.
     * @param {any} eventData - The data associated with the event.
     */
    async function _handleTriggerEvent(triggerId, eventData) {
        const triggerDef = _triggers.get(triggerId);
        if (!triggerDef) {
            console.error(`[TriggerManager] Received event for unknown triggerId '${triggerId}'.`);
            return;
        }

        console.log(`[TriggerManager] Trigger '${triggerId}' fired. Event data:`, eventData);

        let initialState = {};
        if (typeof triggerDef.initialStateFunction === 'function') {
            try {
                initialState = triggerDef.initialStateFunction(eventData) || {};
            } catch (e) {
                console.error(`[TriggerManager] Error executing initialStateFunction for trigger '${triggerId}':`, e);
                FlowHub._emitEvent('trigger:error', { triggerId, error: e.message, type: 'initialStateFunction', eventData, timestamp: Date.now() });
                // Potentially abort or proceed with empty/default state
            }
        } else {
            initialState = { triggerEvent: eventData }; // Default behavior
        }
        
        const currentScope = _nodeRegistryInstance.getScope(); // Get fresh scope
        const flowInstanceId = `fm-trigger-${triggerId}-${Date.now()}`;

        FlowHub._emitEvent('trigger:fired', {
            triggerId,
            eventData,
            initialStatePrepared: initialState,
            flowInstanceIdToRun: flowInstanceId,
            timestamp: Date.now()
        });
        
        const fm = FlowManager({
            initialState,
            nodes: triggerDef.workflowNodes,
            instanceId: flowInstanceId,
            scope: currentScope
        });

        console.log(`[TriggerManager] Starting workflow for trigger '${triggerId}' with FlowManager ID: ${flowInstanceId}`);
        FlowHub._emitEvent('workflow:startedByTrigger', {
            triggerId,
            flowInstanceId,
            workflowNodes: triggerDef.workflowNodes,
            initialState,
            timestamp: Date.now()
        });

        try {
            const results = await fm.run();
            console.log(`[TriggerManager] Workflow for trigger '${triggerId}' (FM: ${flowInstanceId}) completed. Steps: ${results.length}`);
            FlowHub._emitEvent('workflow:completedByTrigger', {
                triggerId,
                flowInstanceId,
                results,
                finalState: fm.getStateManager().getState(),
                timestamp: Date.now()
            });
        } catch (error) {
            console.error(`[TriggerManager] Workflow for trigger '${triggerId}' (FM: ${flowInstanceId}) failed:`, error);
            FlowHub._emitEvent('workflow:failedByTrigger', {
                triggerId,
                flowInstanceId,
                error: error.message, // Use error.message to avoid complex objects in event
                timestamp: Date.now()
            });
        }
    }

    // Public API
    return {
        /**
         * Adds a handler for a specific trigger type.
         * @param {string} type - The trigger type (e.g., "email").
         * @param {TriggerTypeHandler} handler - The handler object.
         */
        addTriggerTypeHandler(type, handler) {
            if (_triggerTypeHandlers.has(type)) {
                console.warn(`[TriggerManager] Trigger type handler for '${type}' is being replaced.`);
            }
            if (typeof handler.activate !== 'function' || typeof handler.deactivate !== 'function') {
                console.error(`[TriggerManager] Invalid handler for type '${type}'. Must have 'activate' and 'deactivate' methods.`);
                return;
            }
            _triggerTypeHandlers.set(type, handler);
            console.log(`[TriggerManager] Added handler for trigger type: ${type}`);
        },

        /**
         * Registers a trigger definition.
         * @param {TriggerDefinition} triggerDefinition - The trigger definition.
         * @returns {boolean} True if registration was successful.
         */
        register(triggerDefinition) {
            if (!triggerDefinition || !triggerDefinition.triggerId || !triggerDefinition.type || !triggerDefinition.workflowNodes) {
                console.error("[TriggerManager] Invalid trigger definition.", triggerDefinition);
                return false;
            }
            if (!_triggerTypeHandlers.has(triggerDefinition.type)) {
                console.error(`[TriggerManager] No handler registered for trigger type '${triggerDefinition.type}' (for triggerId '${triggerDefinition.triggerId}'). Register a handler first.`);
                return false;
            }
            _triggers.set(triggerDefinition.triggerId, triggerDefinition);
            FlowHub._emitEvent('trigger:registered', {
                triggerId: triggerDefinition.triggerId,
                type: triggerDefinition.type,
                config: triggerDefinition.config,
                timestamp: Date.now()
            });
            console.log(`[TriggerManager] Registered trigger: ${triggerDefinition.triggerId} (type: ${triggerDefinition.type})`);
            return true;
        },

        /**
         * Activates a registered trigger, making it listen for events.
         * @param {string} triggerId - The ID of the trigger to activate.
         * @returns {Promise<boolean>} True if activation was successful.
         */
        async activate(triggerId) {
            if (_activeListeners.has(triggerId)) {
                console.warn(`[TriggerManager] Trigger '${triggerId}' is already active.`);
                return true;
            }
            const triggerDef = _triggers.get(triggerId);
            if (!triggerDef) {
                console.error(`[TriggerManager] Trigger '${triggerId}' not found for activation.`);
                return false;
            }
            const handler = _triggerTypeHandlers.get(triggerDef.type);
            if (!handler) {
                console.error(`[TriggerManager] No handler for trigger type '${triggerDef.type}' (triggerId '${triggerId}').`);
                return false;
            }

            try {
                console.log(`[TriggerManager] Activating trigger: ${triggerId}`);
                const onTriggerFired = async (eventData) => {
                    // Call the internal _handleTriggerEvent
                    await _handleTriggerEvent(triggerId, eventData);
                };

                const activationContext = await handler.activate(triggerDef.config, onTriggerFired, triggerId, FlowHub);
                _activeListeners.set(triggerId, activationContext);
                FlowHub._emitEvent('trigger:activated', { triggerId, timestamp: Date.now() });
                console.log(`[TriggerManager] Activated trigger: ${triggerId}`);
                return true;
            } catch (error) {
                console.error(`[TriggerManager] Error activating trigger '${triggerId}':`, error);
                FlowHub._emitEvent('trigger:error', { triggerId, error: error.message, type: 'activation', timestamp: Date.now() });
                return false;
            }
        },

        /**
         * Deactivates an active trigger.
         * @param {string} triggerId - The ID of the trigger to deactivate.
         * @returns {Promise<boolean>} True if deactivation was successful.
         */
        async deactivate(triggerId) {
            const triggerDef = _triggers.get(triggerId);
            const activationContext = _activeListeners.get(triggerId);

            if (!triggerDef || !_activeListeners.has(triggerId)) {
                console.warn(`[TriggerManager] Trigger '${triggerId}' not found or not active for deactivation.`);
                return false;
            }
            const handler = _triggerTypeHandlers.get(triggerDef.type);
            if (!handler) {
                console.error(`[TriggerManager] No handler for trigger type '${triggerDef.type}' (triggerId '${triggerId}') during deactivation.`);
                return false;
            }

            try {
                console.log(`[TriggerManager] Deactivating trigger: ${triggerId}`);
                await handler.deactivate(activationContext, triggerDef.config, triggerId, FlowHub);
                _activeListeners.delete(triggerId);
                FlowHub._emitEvent('trigger:deactivated', { triggerId, timestamp: Date.now() });
                console.log(`[TriggerManager] Deactivated trigger: ${triggerId}`);
                return true;
            } catch (error) {
                console.error(`[TriggerManager] Error deactivating trigger '${triggerId}':`, error);
                FlowHub._emitEvent('trigger:error', { triggerId, error: error.message, type: 'deactivation', timestamp: Date.now() });
                return false;
            }
        },

        /**
         * Gets a list of all registered trigger definitions.
         * @returns {TriggerDefinition[]}
         */
        getAllTriggers() {
            return Array.from(_triggers.values());
        },

        /**
         * Gets a list of IDs of all active triggers.
         * @returns {string[]}
         */
        getActiveTriggerIds() {
            return Array.from(_activeListeners.keys());
        }
    };
}
```

File: /Users/narcisbrindusescu/cod/nextproject/src/lib/flow-engine/nodes/text/analyze-sentiment.node.js
```js
/** @type {import('../../types/flow-types.jsdoc.js').NodeDefinition} */
export default {
    id: "text.analysis.sentiment",
    version: "1.0.0",
    name: "Sentiment Analyzer",
    description: "Analyzes the sentiment of a given text string and determines if it's positive, negative, or neutral. Useful for understanding user feedback or social media comments.",
    categories: ["Text Processing", "AI", "NLP"],
    tags: ["sentiment", "text analysis", "nlp"],
    inputs: [
        {
            name: "text",
            type: "string",
            description: "The text content to analyze for sentiment.",
            required: true,
            example: "I love this product, it's amazing!"
        },
        {
            name: "language",
            type: "string",
            description: "The language of the text (e.g., 'en', 'es'). Default is 'en'.",
            required: false,
            defaultValue: "en",
            example: "en"
        }
    ],
    outputs: [
        { name: "analyzedSentiment", type: "string", description: "The detected sentiment: 'positive', 'negative', or 'neutral'."},
        { name: "sentimentConfidence", type: "number", description: "A confidence score (0-1) for the detected sentiment, if available from the underlying engine."}
    ],
    edges: [
        { name: "positive", description: "The text has a positive sentiment." },
        { name: "negative", description: "The text has a negative sentiment." },
        { name: "neutral", description: "The text has a neutral sentiment." },
        { name: "error", description: "An error occurred during sentiment analysis." }
    ],
    implementation: async function(params) {
        // 'this' provides: this.state, this.humanInput, this.emit, this.on
        // In a real scenario, this would call an NLP library or API
        console.log("Analyzing sentiment for text:", params.text,this.self,this.input);
        const text = String(params.text || "").toLowerCase();
        if (text.includes("error")) return { error: () => "Simulated analysis error." };

        let sentiment = "neutral";
        if (text.includes("love") || text.includes("amazing") || text.includes("great")) sentiment = "positive";
        else if (text.includes("hate") || text.includes("terrible") || text.includes("bad")) sentiment = "negative";

        this.state.set('lastSentimentAnalysis', { text: params.text, sentiment: sentiment, confidence: 0.9 });
        return { [sentiment]: () => sentiment }; // Dynamically use edge name
    },
    aiPromptHints: {
        toolName: "sentiment_analyzer",
        summary: "Detects if text is positive, negative, or neutral.",
        useCase: "Use this tool when you need to understand the emotional tone of a piece of text. For example, to analyze customer reviews or social media posts.",
        expectedInputFormat: "Provide the 'text' input as the string to analyze. 'language' is optional, defaults to 'en'.",
        outputDescription: "Returns an edge named 'positive', 'negative', or 'neutral' indicating the sentiment. Sets 'lastSentimentAnalysis' in state."
    }
};
```

File: /Users/narcisbrindusescu/cod/nextproject/src/lib/flow-engine/nodes/text/string-uppercase.node.js
```js
/** @type {import('../../types/flow-types.jsdoc.js').NodeDefinition} */
export default {
    id: "text.transform.toUpperCase",
    version: "1.0.0",
    name: "Convert to Uppercase",
    description: "Converts a given string to all uppercase letters.",
    categories: ["Text Processing", "Utilities"],
    tags: ["string", "transform", "case"],
    inputs: [
        { name: "inputValue", type: "string", description: "The string to convert.", required: true, example: "hello world" }
    ],
    outputs: [
        { name: "uppercasedValue", type: "string", description: "The input string converted to uppercase." }
    ],
    edges: [
        { name: "success", description: "String successfully converted to uppercase.", outputType: "string" }
    ],
    implementation: async function(params) {
        const result = String(params.inputValue || "").toUpperCase();
        this.state.set('lastUppercasedString', result);
        return { success: () => result };
    },
    aiPromptHints: {
        toolName: "string_to_uppercase",
        summary: "Changes text to all capital letters.",
        useCase: "Use this when you need to standardize text to uppercase, for example, before a comparison or for display purposes.",
        expectedInputFormat: "Provide 'inputValue' as the string.",
        outputDescription: "Returns 'success' edge with the uppercased string. Sets 'lastUppercasedString' in state."
    }
};
```

File: /Users/narcisbrindusescu/cod/nextproject/src/lib/flow-engine/nodes/utils/log/log-message.node.js
```js
/** @type {import('../../types/flow-types.jsdoc.js').NodeDefinition} */
export default {
    id: "utils.debug.logMessage",
    version: "1.0.0",
    name: "Log Message",
    description: "Logs a message to the console. Useful for debugging workflows.",
    categories: ["Utilities", "Debugging"],
    tags: ["log", "print", "debug"],
    inputs: [
        { name: "message", type: "any", description: "The message or data to log.", required: true, example: "Current step completed." },
        { name: "level", type: "string", description: "Log level (e.g., 'info', 'warn', 'error', 'debug').", defaultValue: "info", enum: ["info", "warn", "error", "debug"], example: "info" }
    ],
    edges: [
        { name: "pass", description: "Message logged successfully." }
    ],
    implementation: async function(params) {
        const level = params.level || "info";
        const message = params.message;
        const flowInstanceId = this.flowInstanceId || 'N/A'; // Assuming flowInstanceId is added to 'this' context

        switch(level) {
            case "warn": console.warn(`[FlowLog FW:${flowInstanceId}]:`, message); break;
            case "error": console.error(`[FlowLog FW:${flowInstanceId}]:`, message); break;
            case "debug": console.debug(`[FlowLog FW:${flowInstanceId}]:`, message); break;
            default: console.log(`[FlowLog FW:${flowInstanceId}]:`, message);
        }
        return "pass"; // Simple string return implies { edges: ["pass"] }
    },
    aiPromptHints: {
        toolName: "log_message_to_console",
        summary: "Prints a message to the system console.",
        useCase: "Use this for debugging or to output informational messages during flow execution. It does not affect the flow's state or primary output.",
        expectedInputFormat: "Provide 'message' with the content to log. 'level' is optional (info, warn, error, debug).",
        outputDescription: "Returns a 'pass' edge. The message is printed to the console."
    }
};
```

File: /Users/narcisbrindusescu/cod/nextproject/src/lib/flow-engine/nodes/index.js
```js
// This file is auto-generated by scripts/generate-indexes.mjs. Do not edit.

import node0 from './text/string-uppercase.node.js';
import node1 from './text/analyze-sentiment.node.js';
import node2 from './utils/log/log-message.node.js';
import node3 from './google/gmail/listEmails.node.js';
import node4 from './google/gmail/connect.node.js';
import node5 from './google/gdrive/uploadFile.node.js';
import node6 from './google/gdrive/listFiles.node.js';
import node7 from './google/gdrive/downloadFile.node.js';

const allNodes = [
    node0,
    node1,
    node2,
    node3,
    node4,
    node5,
    node6,
    node7,
];

export default allNodes;

```

File: /Users/narcisbrindusescu/cod/nextproject/src/lib/flow-engine/triggers/types/emailTriggerHandler.js
```js
/**
 * @typedef {import('../../types/flow-types.jsdoc.js').TriggerHandlerCallback} TriggerHandlerCallback
 * @typedef {typeof import('../../core/FlowHub.js').default} FlowHubType
 */

/**
 * Mock Email Trigger Handler.
 * In a real scenario, this would connect to an email service.
 * @type {import('../../types/flow-types.jsdoc.js').TriggerTypeHandler}
 */
const emailTriggerHandler = {
    /**
     * @param {object} triggerConfig - Config for this email trigger (e.g., { account, folder, checkIntervalSeconds }).
     * @param {TriggerHandlerCallback} callback - Function to call when a "new email" is detected.
     * @param {string} triggerId - The ID of the trigger being activated.
     * @param {FlowHubType} flowHub - Instance of FlowHub for emitting events.
     * @returns {Promise<{intervalId: number}>} Returns context for deactivation.
     */
    async activate(triggerConfig, callback, triggerId, flowHub) {
        const { account, folder, checkIntervalSeconds = 20 } = triggerConfig;
        console.log(`[EmailTriggerHandler:${triggerId}] Activating for account '${account}', folder '${folder}'. Checking every ${checkIntervalSeconds}s.`);

        // Mock: Simulate checking for emails periodically
        const intervalId = setInterval(() => {
            // Simulate finding a new email
            const shouldSimulateNewEmail = Math.random() < 0.6; // 10% chance per interval
            if (shouldSimulateNewEmail) {
                const mockEmail = {
                    id: `email-${Date.now()}`,
                    from: "sender@example.com",
                    to: account,
                    subject: `Mock Email Subject ${Math.floor(Math.random() * 100)}`,
                    body: "This is the body of a new mock email.",
                    receivedAt: new Date().toISOString(),
                    folder: folder
                };
                console.log(`[EmailTriggerHandler:${triggerId}] Simulated new email:`, mockEmail.subject);
                flowHub._emitEvent('trigger:handler:event', {
                    triggerId,
                    handlerType: 'email',
                    message: 'Simulated new email detected',
                    emailId: mockEmail.id,
                    timestamp: Date.now()
                });
                callback(mockEmail); // Pass the mock email data to the TriggerManager
            } else {
                // console.debug(`[EmailTriggerHandler:${triggerId}] No new emails (simulated).`);
            }
        }, checkIntervalSeconds * 1000);

        return { intervalId }; // Return intervalId so it can be cleared in deactivate
    },

    /**
     * @param {{intervalId: number}} activationContext - The context returned by activate.
     * @param {object} triggerConfig - The trigger's configuration.
     * @param {string} triggerId - The ID of the trigger being deactivated.
     * @param {FlowHubType} flowHub - Instance of FlowHub.
     * @returns {Promise<void>}
     */
    async deactivate(activationContext, triggerConfig, triggerId, flowHub) {
        if (activationContext && activationContext.intervalId) {
            clearInterval(activationContext.intervalId);
            console.log(`[EmailTriggerHandler:${triggerId}] Deactivated polling for account '${triggerConfig.account}'.`);
            flowHub._emitEvent('trigger:handler:event', {
                triggerId,
                handlerType: 'email',
                message: 'Polling deactivated',
                timestamp: Date.now()
            });
        }
    }
};

export default emailTriggerHandler;
```

File: /Users/narcisbrindusescu/cod/nextproject/src/lib/flow-engine/triggers/types/eventTriggerHandler.js
```js

const eventTriggerHandler = {
    async activate(triggerConfig, callback, triggerId, flowHub) {
        const { eventName = 'start_the_flow' } = triggerConfig;
        
        console.log(`[EVENT TriggerHandler:${triggerId}] Listening for event: ${eventName}`);
        
        // Create event listener
        const listener = (event) => {
            console.log(`[EVENT TriggerHandler:${triggerId}] Event '${eventName}' received:`, event);
            flowHub._emitEvent('trigger:handler:event', {
                triggerId,
                handlerType: 'event',
                message: `Event '${eventName}' detected`,
                eventData: event,
                timestamp: Date.now()
            });
            callback(event); // Pass the event data to the TriggerManager
        };
        
        // Add listener
        flowHub.addEventListener(eventName, listener);
        
        // Return listener reference for deactivation
        return { eventName, listener };
    },

    async deactivate(activationContext, triggerConfig, triggerId, flowHub) {
        if (activationContext && activationContext.listener) {
            flowHub.removeEventListener(activationContext.eventName, activationContext.listener);
            console.log(`[EVENT TriggerHandler:${triggerId}] Stopped listening for event: ${activationContext.eventName}`);
            
            flowHub._emitEvent('trigger:handler:event', {
                triggerId,
                handlerType: 'event',
                message: `Stopped listening for '${activationContext.eventName}'`,
                timestamp: Date.now()
            });
        }
    }
};

export default eventTriggerHandler;
```

File: /Users/narcisbrindusescu/cod/nextproject/src/lib/flow-engine/triggers/types/timeTriggerHandler.js
```js
/**
 * @typedef {import('../../types/flow-types.jsdoc.js').TriggerHandlerCallback} TriggerHandlerCallback
 * @typedef {typeof import('../../core/FlowHub.js').default} FlowHubType
 */

/**
 * Time-based Trigger Handler for scheduled workflows.
 * Supports cron-like scheduling and interval-based execution.
 * @type {import('../../types/flow-types.jsdoc.js').TriggerTypeHandler}
 */
const timeTriggerHandler = {
    /**
     * @param {object} triggerConfig - Config for this time trigger.
     * @param {number} [triggerConfig.intervalMs] - Interval in milliseconds for periodic execution.
     * @param {string} [triggerConfig.cronPattern] - Cron pattern for scheduled execution (simplified).
     * @param {Date} [triggerConfig.runAt] - Specific date/time to run once.
     * @param {number} [triggerConfig.maxRuns] - Maximum number of times to run (for interval triggers).
     * @param {TriggerHandlerCallback} callback - Function to call when the trigger fires.
     * @param {string} triggerId - The ID of the trigger being activated.
     * @param {FlowHubType} flowHub - Instance of FlowHub for emitting events.
     * @returns {Promise<{intervalId?: number, timeoutId?: number, runCount: number}>} Returns context for deactivation.
     */
    async activate(triggerConfig, callback, triggerId, flowHub) {
        const { intervalMs, cronPattern, runAt, maxRuns } = triggerConfig;
        let runCount = 0;
        const context = { runCount };

        console.log(`[TimeTriggerHandler:${triggerId}] Activating with config:`, triggerConfig);

        // One-time scheduled execution
        if (runAt) {
            const delay = new Date(runAt).getTime() - Date.now();
            if (delay > 0) {
                context.timeoutId = setTimeout(() => {
                    console.log(`[TimeTriggerHandler:${triggerId}] Scheduled time reached`);
                    flowHub._emitEvent('trigger:handler:event', {
                        triggerId,
                        handlerType: 'time',
                        message: 'Scheduled time reached',
                        timestamp: Date.now()
                    });
                    callback({ 
                        triggerType: 'scheduled',
                        scheduledTime: runAt,
                        executedAt: new Date().toISOString()
                    });
                }, delay);
            } else {
                console.warn(`[TimeTriggerHandler:${triggerId}] Scheduled time is in the past`);
            }
        }

        // Interval-based execution
        else if (intervalMs) {
            const executeInterval = () => {
                runCount++;
                context.runCount = runCount;

                const shouldContinue = !maxRuns || runCount <= maxRuns;
                
                if (shouldContinue) {
                    console.log(`[TimeTriggerHandler:${triggerId}] Interval fired (run ${runCount}${maxRuns ? `/${maxRuns}` : ''})`);
                    flowHub._emitEvent('trigger:handler:event', {
                        triggerId,
                        handlerType: 'time',
                        message: `Interval fired (run ${runCount})`,
                        runCount,
                        timestamp: Date.now()
                    });
                    callback({
                        triggerType: 'interval',
                        intervalMs,
                        runNumber: runCount,
                        timestamp: new Date().toISOString()
                    });
                }

                if (maxRuns && runCount >= maxRuns) {
                    clearInterval(context.intervalId);
                    console.log(`[TimeTriggerHandler:${triggerId}] Max runs (${maxRuns}) reached, stopping`);
                    flowHub._emitEvent('trigger:handler:event', {
                        triggerId,
                        handlerType: 'time',
                        message: 'Max runs reached',
                        finalRunCount: runCount,
                        timestamp: Date.now()
                    });
                }
            };

            context.intervalId = setInterval(executeInterval, intervalMs);
        }

        // Simple cron pattern support (for demonstration)
        else if (cronPattern) {
            // Simplified cron: "*/5 * * * *" means every 5 minutes
            const match = cronPattern.match(/^\*\/(\d+) \* \* \* \*$/);
            if (match) {
                const minutes = parseInt(match[1]);
                const intervalMs = minutes * 60 * 1000;
                
                context.intervalId = setInterval(() => {
                    runCount++;
                    context.runCount = runCount;
                    
                    console.log(`[TimeTriggerHandler:${triggerId}] Cron pattern fired (every ${minutes} minutes)`);
                    flowHub._emitEvent('trigger:handler:event', {
                        triggerId,
                        handlerType: 'time',
                        message: `Cron pattern fired`,
                        cronPattern,
                        timestamp: Date.now()
                    });
                    callback({
                        triggerType: 'cron',
                        cronPattern,
                        executedAt: new Date().toISOString()
                    });
                }, intervalMs);
            } else {
                console.error(`[TimeTriggerHandler:${triggerId}] Unsupported cron pattern: ${cronPattern}`);
            }
        }

        return context;
    },

    /**
     * @param {{intervalId?: number, timeoutId?: number, runCount: number}} activationContext - The context returned by activate.
     * @param {object} triggerConfig - The trigger's configuration.
     * @param {string} triggerId - The ID of the trigger being deactivated.
     * @param {FlowHubType} flowHub - Instance of FlowHub.
     * @returns {Promise<void>}
     */
    async deactivate(activationContext, triggerConfig, triggerId, flowHub) {
        if (activationContext) {
            if (activationContext.intervalId) {
                clearInterval(activationContext.intervalId);
                console.log(`[TimeTriggerHandler:${triggerId}] Deactivated interval timer`);
            }
            if (activationContext.timeoutId) {
                clearTimeout(activationContext.timeoutId);
                console.log(`[TimeTriggerHandler:${triggerId}] Deactivated scheduled timer`);
            }
            
            flowHub._emitEvent('trigger:handler:event', {
                triggerId,
                handlerType: 'time',
                message: 'Timer deactivated',
                finalRunCount: activationContext.runCount,
                timestamp: Date.now()
            });
        }
    }
};

export default timeTriggerHandler;
```

File: /Users/narcisbrindusescu/cod/nextproject/src/lib/flow-engine/singletons.ts
```ts
import { NodeRegistry } from './core/NodeRegistry.js';
import { TriggerManager } from './core/TriggerManager.js';
import FlowHub from './core/FlowHub.js';
import { EventEmitter } from 'events';

// Global process-level event emitter for cross-context communication
declare global {
  var __flowEngineGlobalEmitter: EventEmitter | undefined;
  var __flowEngineNodeRegistry: any | undefined;
  var __flowEngineFlowHub: any | undefined;
  var __flowEngineTriggerManager: any | undefined;
}

// Initialize global event emitter
if (!global.__flowEngineGlobalEmitter) {
  global.__flowEngineGlobalEmitter = new EventEmitter();
  global.__flowEngineGlobalEmitter.setMaxListeners(0); // Unlimited listeners
  console.log('[Flow Engine] Global EventEmitter created');
}

// Initialize singletons
if (!global.__flowEngineNodeRegistry) {
  global.__flowEngineNodeRegistry = NodeRegistry;
  console.log('[Flow Engine] NodeRegistry singleton created');
}

if (!global.__flowEngineFlowHub) {
  global.__flowEngineFlowHub = FlowHub;
  console.log('[Flow Engine] FlowHub singleton created');
}

if (!global.__flowEngineTriggerManager) {
  global.__flowEngineTriggerManager = TriggerManager({ nodeRegistry: global.__flowEngineNodeRegistry });
  console.log('[Flow Engine] TriggerManager singleton created');
}

export const globalEventEmitter = global.__flowEngineGlobalEmitter;
export const nodeRegistry = global.__flowEngineNodeRegistry;
export const flowHub = global.__flowEngineFlowHub;
export const triggerManager = global.__flowEngineTriggerManager;

console.log('[Flow Engine] All singletons initialized.');
```

File: /Users/narcisbrindusescu/cod/nextproject/src/lib/flow-engine/init.ts
```ts
// src/lib/flow-engine/init.ts

import { nodeRegistry, triggerManager } from './singletons';

// --- 1. Statically import all nodes and triggers from our index files ---
import allNodes from './nodes/index.js';
import allTriggers from './automations/index.js';

// --- 2. Statically import trigger handlers ---
import emailTriggerHandler from './triggers/types/emailTriggerHandler.js';
import eventTriggerHandler from './triggers/types/eventTriggerHandler.js';

let isInitialized = false;

export const initializeFlowEngine = async () => {
    // This check ensures the logic runs only once per server instance.
    if (isInitialized) {
        return;
    }

    console.log('[Flow Engine] Initializing...');

    // --- 1. Register all Nodes ---
    for (const nodeModule of allNodes) {
        if (nodeModule) {
            nodeRegistry.register(nodeModule);
        }
    }
    console.log(`[Flow Engine] Registered ${nodeRegistry.getAll().length} nodes.`);

    // --- 2. Register Trigger Handlers ---
    triggerManager.addTriggerTypeHandler('email', emailTriggerHandler);
    triggerManager.addTriggerTypeHandler('event', eventTriggerHandler);
    console.log('[Flow Engine] Registered trigger handlers.');

    // --- 3. Register and Activate Triggers ---
    for (const triggerModule of allTriggers) {
        if (triggerModule) {
            triggerManager.register(triggerModule);
            // Automatically activate registered triggers on startup
            // Note: You might want to control this more granularly later.
          //  await triggerManager.activate(triggerModule.triggerId);
        }
    }
    console.log(`[Flow Engine] Registered and activated ${triggerManager.getActiveTriggerIds().length} triggers.`);

    console.log('[Flow Engine] Initialization complete.');
    isInitialized = true;
};
```

File: /Users/narcisbrindusescu/cod/nextproject/src/lib/engine-loader.ts
```ts
// src/lib/engine-loader.ts
// This module's purpose is to trigger the flow engine initialization and WebSocket server.
// It should only be imported for its side effects, once, in the root layout.

import { initializeFlowEngine } from '@/lib/flow-engine/init';
import { setupWebSocket } from './websocket';

// Use a global flag to prevent multiple initializations
const GlobalInit = Symbol.for('nextjs.engine.initialized');

interface Global {
  [GlobalInit]: boolean;
}

// Only initialize once
if (typeof window === 'undefined' && !(global as unknown as Global)[GlobalInit]) {
  // The top-level await here is fine in modern bundlers.
  // This promise is created and executed only when this module is first imported.
  initializeFlowEngine();
  
  // Start WebSocket server alongside the flow engine
  setupWebSocket();
  
  // Mark as initialized
  (global as unknown as Global)[GlobalInit] = true;
}
```

File: /Users/narcisbrindusescu/cod/nextproject/CLAUDE.md
```md
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
- **Frontend**: Next.js 15.3.1 (App Router), React 19, TypeScript
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
```
</file_contents>
