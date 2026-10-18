# Black-Box Controller & End-to-End Method Testing Rules

**Status:** Mandatory | **Scope:** Verification scripts, endpoint behavior validation, integration proofs, and hardcore black-box testing

When verifying backend features and bug fixes beyond unit tests, you must write standalone executable verification scripts that test the **actual hardcore black-box behavior** of the system from the top level down to the database.

---

## 0. Dedicated Location & File Organization

- **Mandatory Root Directory & Domain Subdirectories:** All black-box testing files MUST be created inside versioned domain subdirectories:
  ```text
  blackbox-testing/v<version>/<domain>/
  ```
  Example: `blackbox-testing/v1/moderation/`, `blackbox-testing/v1/auth/`, `blackbox-testing/v1/user/`
- **File Naming Convention:**
  - `verify_<domain>_<feature>_blackbox.ts` (e.g. `verify_moderation_appeal_blackbox.ts`, `verify_user_report_blackbox.ts`)
- **Execution Convention:** Every black-box script must be standalone and executable directly from the repository root:
  ```bash
  node --import tsx/esm blackbox-testing/v1/<domain>/verify_<domain>_<feature>_blackbox.ts
  ```

---

## 1. Top-Level Entry Points Only (No Internal "Cheating")

- **Never bypass the controller:** Testing must invoke the **Controller method** (e.g. `controller.submitAppeal(dto, req)`) or an HTTP client (e.g. `curl.exe` or `fetch`/`supertest`).
- **Never manipulate internal state directly:** Do not directly call internal service helper methods or repository functions to fake success.
- **Never execute dynamic DDL schema alters in test scripts:** Under no circumstances run raw `ALTER TABLE`, dropping columns, or modifying database constraints in verification scripts. The script must execute against the production schema structure.

---

## 2. Inversify DI Container Resolution

- Resolve controllers and dependencies cleanly from the central Inversify container:
  ```typescript
  import { container } from '#src/container/container.js';
  const controller = container.get<MyController>(MyController);
  ```
- This guarantees that dependency injection, repository bindings, and service lifecycles operate exactly as they do in the running application.

---

## 3. Real DTOs & Validation Pipeline

- Construct and pass the actual **DTO instances** (`plainToInstance(MyActionDto, payload)` or `new MyActionDto()`) populated with realistic payload properties.
- When validating input constraints, pass the DTO through `validate(dto)` or let the controller pipeline execute to prove invalid payloads fail validation before reaching business logic.

---

## 4. Realistic Request Contexts (Auth & Headers)

- Simulate realistic HTTP request contexts:
  - **Authenticated User:** Authenticated request object containing real database user IDs and roles (`req.user = { userId, role, email, sessionId }`).
  - **Unauthenticated:** Request object with `req.user = undefined` to verify `HttpUnauthorized` (401).
  - **Forbidden / Role mismatch:** Request object with an unauthorized role (e.g., standard `USER` calling an `ADMIN` endpoint) to verify `HttpForbidden` (403).

---

## 5. Mandatory Test Matrix for Every Endpoint

Every black-box verification script must test all of the following branches:

1. **Happy Path (200 / 201):**
   - Returns the exact specified contract envelope: `{ success: true, data: { ... } }`.
   - Data types and field names strictly match the OpenAPI specification and DTO response definition.
2. **Missing / Non-Existent Target (404 Not Found):**
   - Provide a random/non-existent entity ID; assert `HttpNotFound` is thrown with the exact domain error constant.
3. **Mismatched / Malformed Payloads (400 Bad Request):**
   - Provide mismatched fields, conflicting polymorphic foreign keys, or invalid enum values.
   - Assert `HttpBadRequest` is thrown.
4. **Duplicate Actions / State Conflicts (409 Conflict):**
   - Execute the action twice in succession (e.g., submitting duplicate appeals, repeated claims).
   - Assert the second call throws `HttpConflict`.
5. **Multi-User Concurrency & Independence:**
   - Execute the same action from a second user account to verify state isolation (e.g., User B can appeal their own content without interference from User A).
6. **Database State & Side-Effect Verification:**
   - Inspect the actual database tables after the call:
     - Verify records were inserted or updated with server-derived values (e.g. `userId` resolved from auth token, initial status set to correct lifecycle enum).
     - Verify downstream queues or audit records were created.
7. **Downstream Integration (Admin / Read flows):**
   - Fetch the created item through dependent controllers (e.g. Admin queue, status checks) to prove the end-to-end data lifecycle works.

---

## 6. Real HTTP / Execution Environment & Mandatory Request/Response Logging

- Scripts must be runnable via:
  ```bash
  node --import tsx/esm blackbox-testing/<script_name>.ts
  ```
- **Node Asynchrony:** When running child processes in test scripts, never use synchronous `execSync` against a locally running server in the same Node event loop (causes deadlock); always use asynchronous execution or direct DI invocation.
- **Mandatory Request & Response Logging:**
  - **Incoming Request Logging:** Always log the incoming request before calling the controller:
    - Target HTTP Method and Path/Route
    - Path and Query Parameters
    - Request Body DTO payload (if applicable)
    - Caller Context (Authenticated user ID, role, permissions)
  - **Controller Response Logging:** Always output the full controller response payload or caught exception details formatted via `JSON.stringify(response, null, 2)` to the console for complete execution auditability.
- Output clear audit markers (`✓ PASS`) for each test case verifying the contract.

---

## 7. Zero Residual Test Pollution

- Use dedicated fixtures with unique hashes/IDs.
- Clean up test-created records at the start or end of the script using deterministic filters (e.g., cleaning up created events, users, and appeal rows) to guarantee repeatability across multiple runs.
- Always call `closeDatabaseConnections()` upon script completion so the Node process terminates cleanly.
