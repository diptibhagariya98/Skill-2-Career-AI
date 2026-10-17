---
description: Rule enforcing centralized API endpoints and routes across client and server
globs: "**/*.{ts,tsx,js,jsx}"
---

# Centralized Endpoints Rule

## Requirement

NEVER hardcode API endpoints, URLs, or internal route paths as raw string literals anywhere in components, hooks, utilities, or API route handlers.

## Standard

All internal API paths, application page routes, and external API URLs must be imported from the centralized configuration file:

- File: `src/constants/endpoints.ts`

### Usage Examples

```typescript
// Client-side API fetch
import { API_ROUTES } from "@/constants/endpoints";
const response = await fetch(API_ROUTES.GEMINI, { ... });

// Client-side Navigation
import { APP_ROUTES } from "@/constants/endpoints";
router.replace(APP_ROUTES.DASHBOARD);
<Link href={APP_ROUTES.AUTH}>Sign In</Link>

// Server-side External APIs
import { EXTERNAL_API } from "@/constants/endpoints";
const url = EXTERNAL_API.getGeminiUrl(apiKey);
```
