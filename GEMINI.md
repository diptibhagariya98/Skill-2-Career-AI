# Project Coding Standards & Guidelines

## 1. Strict Typing Policy (Zero `any`)

- Never use the `any` type (`any`, `as any`, `Record<string, any>`, or `catch (e: any)`).
- Use `unknown` with type guards, custom interfaces, or schema validators.
- Always use typed errors: `catch (error: unknown)` with `error instanceof Error ? error.message : ...`.

## 2. Mandatory Enums for States, Modes & Identifiers

- Never use raw hardcoded string literals in conditions, comparisons, or state transitions (`=== "login"`, `=== "PASSWORD_RESET"`, `=== "ACTIVE"` are forbidden).
- Define and use TypeScript `enum`s for all discrete states, tabs, auth modes, verification purposes, and account statuses.

## 3. No Hardcoded Checking or Validation Logic

- Never hardcode validation regex, error messages, magic numbers, or status strings inline inside components or route handlers.
- All validation patterns, field constraints, error strings, and thresholds must be centralized in dedicated constants/validators (e.g., `src/constants/validation.ts` or domain type definitions).
- See full rule specification in [strict_types_and_enums.md](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/Skill-2-Career-AI-1/.agents/rules/strict_types_and_enums.md).
