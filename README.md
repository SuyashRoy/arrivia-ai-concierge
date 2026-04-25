# Arrivia Agentic Travel Recommendations API

A proof-of-concept **Agentic Travel Recommendations API** that generates personalized travel recommendations for loyalty program members. Built for arrivia's multi-tenant, white-label travel platform where partner-specific configuration, branding, and pricing rules coexist on a shared infrastructure.

The service exposes both a REST API and an MCP (Model Context Protocol) server, enabling AI agents to fetch member profiles and request contextual travel recommendations that respect partner-specific business rules.

## Quick Start

```bash
# 1. Clone and install
git clone <repository-url>
cd arrivia-travel-recommendations
npm install

# 2. Start the API server
npm run dev        # Starts on http://localhost:3000

# 3. Run the CLI demo
npm run demo -- --member mem_001    # Specific member
npm run demo -- --interactive       # Interactive mode
npm run demo -- --list              # List all members

# 4. Run the test suite
npm test

# 5. Start the MCP server (stdio transport)
npm run mcp
```

### Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with tsx |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run demo` | Run the CLI demo tool |
| `npm run mcp` | Start MCP server (stdio) |
| `npm test` | Run all tests with coverage |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check with version and uptime |
| GET | `/api/members/:memberId` | Fetch member profile |
| POST | `/api/recommendations` | Generate personalized recommendations |

**Example request:**
```bash
curl -X POST http://localhost:3000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{"memberId": "mem_001"}'
```

---

## Section A — Architecture & Trade-offs

### Architecture Overview

```
                    ┌──────────────────────────┐
                    │   CLI / AI Agent Client   │
                    └─────────┬────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │    REST API      │             │   MCP Server     │
    │  (Express.js)    │             │  (stdio / SDK)   │
    └────────┬────────┘             └────────┬────────┘
             │                               │
             └───────────┬───────────────────┘
                         ▼
              ┌─────────────────────┐
              │ Recommendation      │
              │ Engine              │
              │ (rule-based scoring)│
              └────────┬────────────┘
                       ▼
              ┌─────────────────────┐
              │   Rule Enforcer     │
              │ (partner filtering) │
              └───┬──────────┬──────┘
                  │          │
        ┌─────── ▼──┐   ┌───▼──────────────┐
        │  Member    │   │  Partner Config   │
        │  Service   │   │  Service          │
        │  (read)    │   │  (READ-ONLY)      │
        └────────────┘   └──────────────────┘
```

> **Partner Config is read-only.** Our service reads partner configuration on each request and enforces whatever rules it receives. We never modify, update, or override partner config. If a partner changes their recommendation cap or adds a booking type exclusion, they update it through the partner config team's own service — our service reads the new config on the next request and automatically enforces it. For production, a short-TTL Redis/ElastiCache cache would prevent hitting the partner config service on every request while still picking up changes within minutes.

### Design Trade-offs

**1. Rule-based recommendations vs. ML-based scoring**

We chose a rule-based weighted scoring model (region match, booking type, seasonality, tier pricing, novelty) over ML-based recommendations. This was driven by:

- **Debuggability at 2am** (Constraint 4: On-Call Ownership): When a partner calls at 2am saying a member got wrong recommendations, we can trace exactly which scoring factors produced which scores. Every recommendation includes a `reasoning` string explaining why it scored well. ML models are opaque — "the model said so" is not an acceptable answer during an incident.
- **Four-week scope** (Constraint 3): Training, validating, and deploying an ML model alongside the API is not feasible for one engineer in four weeks. A rule-based engine ships reliably and can be enhanced with ML scoring in a future iteration.
- **Partner rule enforcement**: Partner rules (booking type exclusions, region restrictions, recommendation caps) are hard business constraints, not suggestions. A rule-based system makes it trivially verifiable that these constraints are always enforced.

**2. In-process mock services vs. separate mock microservices**

We chose in-process mock implementations behind clean interfaces (`IMemberService`, `IPartnerConfigService`) over running separate mock HTTP services. Both approaches work within existing infrastructure (Constraint 1). The trade-offs:

- **In-process mocks** (chosen): Zero deployment complexity for the POC, single `npm run dev` starts everything, tests run fast with no external dependencies. The interfaces are identical to what a real HTTP client would implement, so swapping to real services is a one-file change per service.
- **Separate mock services**: More realistic network behavior, can test timeout/retry logic under real conditions. Better for load testing. Adds deployment complexity that is unnecessary for a POC.

The clean interface boundary means the migration path is straightforward: implement `IMemberService` with a real HTTP client, inject it instead of `MockMemberService`, done.

---

## Section B — Production Readiness & Incident Response

### Observability

Every request gets a unique `requestId` that flows through the entire lifecycle. All logs are structured JSON written to stdout, ready for CloudWatch or any log aggregator.

**What gets logged at INFO:**
- Every incoming request and outgoing response (with timing)
- Every partner rule enforcement decision (which rules applied, how many recommendations removed)
- Recommendation generation stats (inventory size, scored count, timing)

**What gets logged at ERROR:**
- Upstream service failures (member service, partner config) with full context
- Unhandled exceptions with stack traces (server-side only — never leaked to clients)

**Example structured log line:**
```json
{
  "timestamp": "2026-04-24T10:30:00.123Z",
  "level": "info",
  "message": "Partner rules applied",
  "requestId": "req_abc123",
  "memberId": "mem_001",
  "partnerId": "partner_luxbank",
  "rulesApplied": ["excluded_booking_types: removed 3 of types [cruise]", "capped_at_5"],
  "recommendationsBefore": 28,
  "recommendationsAfter": 5,
  "durationMs": 45
}
```

### Incident Runbook: "Partner says cruises are showing up when they should be excluded"

**Scenario:** Partner B (ValueMiles Club) has cruise exclusions configured but a member is seeing cruise recommendations.

**Step 1 — Find the request in logs**
```
Search structured logs for the affected member's requestId:
  Filter: memberId="mem_007" AND partnerId="partner_valuemiles"
  Look at: the "Partner rules applied" log entry
  Check: the "rulesApplied" array — does it include "excluded_booking_types"?
  Check: "excludedTypes" — does it list "cruise"?
```

**Step 2 — Verify partner config**
```
Call the partner config service directly:
  GET /partners/partner_valuemiles
Check the response:
  - Does excludedBookingTypes include "cruise"?
  - If NO: the partner config doesn't have the exclusion.
    This is NOT our bug — escalate to the partner config team.
    We do NOT modify partner config ourselves (Constraint 2).
  - If YES: continue to Step 3.
```

**Step 3 — Check rule enforcer execution**
```
Look at the structured logs for this requestId:
  Filter: requestId="req_xxx" AND message="Booking type exclusion applied"
  Check: "excludedTypes" should show ["cruise"]
  Check: "removedCount" should be > 0 if cruises existed in the raw results
  If this log entry is MISSING: the rule enforcer didn't run, or the partner
  config didn't have exclusions when we read it.
```

**Step 4 — Check the API response**
```
Look at the response body's metadata:
  metadata.appliedRules — does it mention "excluded_booking_types"?
  Scan recommendations[] — are any bookingType === "cruise"?
```

**Step 5 — Identify root cause**

| Finding | Root Cause | Resolution |
|---------|-----------|------------|
| Partner config doesn't have cruise exclusion | Partner config data issue | Escalate to partner config team. We do NOT modify their config (Constraint 2). |
| Partner config has exclusion but rule enforcer log is missing | Bug in our service — rule enforcer wasn't called or partner config wasn't fetched | Fix in our code, deploy. |
| Rule enforcer ran but cruises still in output | Bug in our filtering logic (possible case mismatch: "Cruise" vs "cruise") | Fix the comparison logic, add regression test, deploy. |
| Stale cached partner config (future: when Redis cache is added) | Cache TTL hasn't expired yet | Wait for cache refresh, or flush the cache key for this partner. Consider reducing TTL. |

**Step 6 — Resolution**
- If it's our bug: fix, add a regression test, deploy.
- If it's partner config data: escalate to partner config team. Do NOT modify partner config ourselves (Constraint 2).

---

## Section C — AI Usage Log

### AI Tools Used
- **Claude Opus 4.6 Extended** — used throughout the project for:
  - **Code generation** — scaffolding services, types, middleware, and test suites
  - **Debugging** — identifying TypeScript type errors (e.g., Express v5 `Request` param generics) and fixing test failures
  - **Design review** — validating architectural decisions against the four hard constraints
  - **Documentation** — drafting the README structure, architecture diagrams, and incident runbook

### Specific AI Interactions
- **Dockerfile design**: The Dockerfile was entirely AI-generated, including the multi-stage pattern with `npm ci --only=production`, the `HEALTHCHECK` directive, and the Alpine base image selection.
- **API endpoint modifications**: Several AI-generated route handlers were reviewed and rejected or modified during development — particularly around request parameter typing and response shaping in the members and recommendations endpoints. Human judgment was applied to ensure the API contract matched real-world usage patterns.
- **AI-generated code (kept largely as-is)**: The `get_member_profile` MCP tool handler and the member service mock were generated by AI and retained with minimal changes.
- **Human-written code**: The CLI demo (`cli/demo.ts`) was substantially rewritten by hand to match the desired output formatting and interactive flow.

### Reflection
- **What worked well with AI assistance**: Scaffolding the initial project structure, generating comprehensive type definitions, writing boilerplate test cases, and producing the structured logging patterns. AI significantly accelerated the "blank page to working prototype" phase.
- **What required human judgment/correction**: The mock data required manual curation to ensure member personas were realistic and meaningfully differentiated. API endpoints were manually tested and adjusted to ensure correct error handling and response shapes. The recommendation engine scoring weights were tuned by hand after reviewing demo output.
- **How AI usage affected development speed and quality**: AI reduced the time to a working prototype significantly — boilerplate code, test scaffolding, and documentation that would normally take hours were produced in minutes. Code quality benefited from consistent patterns (structured logging, error handling) being applied uniformly. The main risk was over-reliance on generated code without verifying edge cases, which was mitigated by thorough manual testing of each API endpoint.

---

## What Ships First vs. What Comes Later

### Ships in 4 Weeks (MVP — One Engineer)

- Rule-based recommendation engine with weighted scoring (region, booking type, seasonality, pricing, novelty)
- Partner rule enforcement (booking type exclusions, region restrictions, recommendation caps, tier benefits)
- MCP server with 3 tools (`get_member_profile`, `get_travel_recommendations`, `list_available_members`)
- Mock services with clean interfaces (`IMemberService`, `IPartnerConfigService`) — ready for real service swap
- REST API with Express.js (health check, member profiles, recommendations)
- CLI demo tool with interactive mode
- Unit tests (recommendation engine, rule enforcer, partner config) + integration tests (API endpoints)
- Structured JSON logging with requestId, memberId, partnerId on every log line
- Health check endpoint with version, uptime, and timestamp
- Dockerfile for containerized deployment
- Complete README with architecture, trade-offs, incident runbook, and scope boundaries

### Deferred (v2 / Future Work — Out of Scope for 4-Week MVP)

- **Redis/ElastiCache caching** for partner configs — short-TTL cache to reduce upstream calls while still picking up config changes within minutes
- **Real upstream service integration** — replace mock implementations with HTTP clients calling actual member and partner config services
- **Rate limiting** — per-partner request throttling using API Gateway or application-level middleware
- **ML-based scoring model** — train on actual booking conversion data, deploy alongside rule-based engine for A/B comparison
- **A/B testing framework** — compare recommendation strategies using CloudWatch metrics
- **CloudWatch metrics dashboards** — recommendation success rates, partner rule hit rates, latency percentiles
- **Session-based recommendation cap tracking** — persist session state in DynamoDB to enforce caps across multiple requests in the same session
- **CI/CD pipeline** — automated testing, linting, and deployment via AWS CodePipeline or Azure DevOps
- **Authentication/authorization** — API key validation, partner-scoped access control
- **WebSocket support** — real-time recommendation updates for interactive frontends

> All deferred items reference only AWS/Azure services that a mid-size SaaS company would plausibly already have in their stack (Constraint 1: Existing Infrastructure Only).

---

## Project Structure

```
arrivia-travel-recommendations/
├── src/
│   ├── server.ts                    # Express app entry point
│   ├── mcp/
│   │   ├── mcp-server.ts            # MCP server setup and tool registration
│   │   └── tool-definitions.ts      # MCP tool schemas and descriptions
│   ├── api/
│   │   ├── routes/
│   │   │   ├── recommendations.ts   # POST /api/recommendations
│   │   │   ├── members.ts           # GET /api/members/:memberId
│   │   │   └── health.ts            # GET /health
│   │   └── middleware/
│   │       ├── error-handler.ts     # Global error handling middleware
│   │       ├── request-logger.ts    # Structured request logging
│   │       └── validate.ts          # Input validation middleware (Zod)
│   ├── services/
│   │   ├── recommendation-engine.ts # Core rule-based recommendation logic
│   │   ├── member-service.ts        # IMemberService interface + mock
│   │   ├── partner-config-service.ts# IPartnerConfigService (READ-ONLY) + mock
│   │   └── rule-enforcer.ts         # Partner rule enforcement
│   ├── mocks/
│   │   ├── member-data.ts           # 10 realistic mock members
│   │   ├── partner-config-data.ts   # 4 partner configs with different rules
│   │   └── travel-inventory.ts      # 30 travel inventory items
│   ├── types/
│   │   └── index.ts                 # All TypeScript interfaces and types
│   └── utils/
│       ├── logger.ts                # Structured JSON logger
│       └── config.ts                # App configuration (env vars, defaults)
├── tests/
│   ├── unit/
│   │   ├── recommendation-engine.test.ts
│   │   ├── rule-enforcer.test.ts
│   │   └── partner-config.test.ts
│   └── integration/
│       └── api.test.ts
├── cli/
│   └── demo.ts                      # CLI demo tool
├── package.json
├── tsconfig.json
├── jest.config.js
├── .env.example
├── Dockerfile
└── README.md
```

---

## Mock Data Overview

### Partners (4 configs with different rules)

| Partner | Max Recs | Excluded Types | Region Restriction |
|---------|----------|---------------|--------------------|
| LuxBank Travel | 5 | none | all |
| ValueMiles Club | 3 | cruise | all |
| Global Explorer Card | unlimited | rental_car | all |
| Coastal Credit Union | 4 | cruise, package | US Domestic only |

### Members (10 across different personas)

| ID | Tier | Partner | Persona |
|----|------|---------|---------|
| mem_001 | Gold | LuxBank | Beach lover (Caribbean) |
| mem_002 | Platinum | LuxBank | Business traveler |
| mem_003 | Gold | ValueMiles | Family vacationer |
| mem_004 | Platinum | Global Explorer | Luxury traveler |
| mem_005 | Silver | ValueMiles | Budget explorer |
| mem_006 | Gold | Global Explorer | Adventure seeker |
| mem_007 | Gold | ValueMiles | Cruise enthusiast (tests exclusion) |
| mem_008 | Silver | Coastal CU | Sparse history (1 booking) |
| mem_009 | Gold | Coastal CU | Domestic road-tripper |
| mem_010 | Platinum | LuxBank | New member (2 bookings) |
