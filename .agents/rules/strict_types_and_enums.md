---
description: Rule enforcing strict TypeScript types (no "any"), domain Enums, and prohibiting hardcoded values/text in condition checking and validation
globs: "**/*.{ts,tsx,js,jsx}"
---

# Strict Typing, Enums & Zero Hardcoded Values Rule

## 1. Zero Tolerance for the `any` Type

### Requirements for Typing

1. **Never use `any`**: The use of `any`, `Record<string, any>`, `(param: any)`, `as any`, or `catch (err: any)` is strictly prohibited across all code.
2. **Use `unknown` with Type Narrowing**: For external API responses, dynamic payloads, or uncertain values, use `unknown` and narrow the type with type guards, `typeof`, `instanceof`, or Zod/schema parsers.
3. **Catch Clauses**: Catch clauses must use `catch (error: unknown)`:

   ```typescript
   // ❌ FORBIDDEN
   } catch (error: any) {
     toast.error(error.message);
   }

   // ✅ REQUIRED
   } catch (error: unknown) {
     const message = error instanceof Error ? error.message : "An unexpected error occurred.";
     toast.error(message);
   }
   ```

4. **Dictionary/Map Types**: Use strongly typed maps (e.g., `Record<string, string>`, `Record<string, unknown>`, or an explicit interface), never `Record<string, any>`.

---

## 2. Mandatory Enums for States, Modes, and Purposes

### Requirements for Enums

1. **No Raw String Literals in Logic**: Never use raw string literals for states, page/tab IDs, user roles, authentication modes, API purposes, or operation types in conditionals.
2. **Define Centralized Enums**: Every discrete set of values MUST be defined as a TypeScript `enum` (or a strictly typed `as const` object) in a dedicated types/constants file.
3. **Usage in Conditionals**: Conditionals and switch statements must always compare against Enum members.

```typescript
// ❌ FORBIDDEN: Hardcoded string comparisons
if (purpose === "PASSWORD_RESET") { ... }
if (mode === "login") { ... }
if (status === "ACTIVE") { ... }
if (activePage === "resume") { ... }

// ✅ REQUIRED: Strict Enums
export enum AuthPurpose {
  EMAIL_VERIFY = "EMAIL_VERIFY",
  PASSWORD_RESET = "PASSWORD_RESET",
}

export enum AuthMode {
  LOGIN = "login",
  REGISTER = "register",
  OTP = "otp",
  FORGOT = "forgot",
  VERIFY_RESET_OTP = "verify_reset_otp",
  SET_NEW_PASSWORD = "set_new_password",
}

if (purpose === AuthPurpose.PASSWORD_RESET) { ... }
if (mode === AuthMode.LOGIN) { ... }
```

---

## 3. No Hardcoded Checking or Validation Logic

### Requirements for Validation

1. **Centralize Validation Rules & Regex**: Regex patterns, character limits, security requirements, and validation messages must never be written inline inside component functions.
2. **Centralize Validation Messages**: Error strings must not be hardcoded in component handlers. Store them in domain constants or validation dictionaries.
3. **Domain Validator Functions**: Abstract inline checks into typed validator functions:

   ```typescript
   // ❌ FORBIDDEN: Hardcoded inline validation & magic strings
   if (!cleanUserId || cleanUserId.includes("@")) { ... }
   if (field === "email") {
     if (!/^[a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) {
       error = "Please enter a valid email address";
     }
   }

   // ✅ REQUIRED: Centralized Typed Validators
   export const VALIDATION_PATTERNS = {
     EMAIL: /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
     LETTERS_AND_SPACES: /^[a-zA-Z\s]+$/,
     UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
   } as const;

   export const AUTH_VALIDATION_MESSAGES = {
     EMAIL_INVALID: "Please enter a valid email address.",
     PASSWORD_REQUIREMENTS: "Password must meet all complexity requirements.",
     PASSWORDS_MISMATCH: "New passwords do not match.",
     NAME_INVALID: "Letters and spaces only, no special characters.",
     REQUIRED: "This field is required.",
   } as const;

   export function isEmail(val: string): boolean {
     return VALIDATION_PATTERNS.EMAIL.test(val.trim());
   }

   export function isUuid(val: string): boolean {
     return VALIDATION_PATTERNS.UUID.test(val.trim());
   }
   ```

4. **Magic Numbers and Thresholds**: Never use raw numbers directly in conditionals (e.g., `> 140`, `< 4`, `60`). Store them in named constants (e.g., `MIN_PASSWORD_STRENGTH_SCORE = 4`, `OTP_COOLDOWN_SECONDS = 60`, `KEYBOARD_THRESHOLD_PX = 140`).

---

## 4. Acceptance Checklist for Code Changes

- [ ] Zero occurrences of `: any`, `as any`, or `catch (err: any)`.
- [ ] All status, mode, purpose, and tab variables use TypeScript `enum`.
- [ ] No inline strings in `if (...)`, `switch (...)`, or ternary checks.
- [ ] All validation patterns, messages, and numeric thresholds are imported from centralized constants or schemas.
