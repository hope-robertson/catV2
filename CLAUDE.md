# Ride-On Catalogue (catV2) - AI Assistant Guide

Use this document as the absolute source of truth for stack choices, architecture rules, and development workflows. Do not deviate from these specifications.

* **Context Reference:** Refer to `codebase-structure.txt` for the current layout map up to 3 folders deep. Do not attempt to read node_modules or dist folders.

## 1. System Commands & Workflow
*   **Run Development Environment:** `npm run dev` (Runs concurrently for client and server)
*   **Build Project:** `npm run build`
*   **Database Migrations:** `npx knex migrate:latest`
*   **Database Seeds:** `npx knex seed:run`

## 2. Tech Stack Reference
### Backend (Server)
*   **Runtime/Language:** Node.js + TypeScript (`"type": "module"`, `NodeNext`)
*   **Framework:** Express.js (`express`)
*   **Execution:** `tsx` for local execution
*   **Database/ORM:** SQLite3 (`sqlite3`) via Knex.js (`knex` v3.1.0)
*   **Auth:** Auth0 via `express-oauth2-jwt-bearer` middleware
*   **File/Data Intake:** `multer`, `exceljs`, `csv-parser`

### Frontend (Client)
*   **Framework/Bundler:** React 18 + Vite (`@tailwindcss/vite` plugin)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS v4 (Configured natively via `client/src/index.css` using `@theme`. **Do not look for or create a tailwind.config.js**).
*   **Routing:** React Router v6 (`react-router-dom`)
*   **Data Fetching:** React Query v4 (`@tanstack/react-query`)
*   **HTTP Client:** Superagent (`superagent`)
*   **Auth:** Auth0 (`@auth0/auth0-react`)

## 3. Strict Code & Architecture Rules
*   **CRITICAL ESM IMPORTS:** Because of `moduleResolution: "NodeNext"`, **all relative local backend file imports MUST explicitly include the `.js` extension**. 
    *   *Correct:* `import { foo } from './foo.js';`
    *   *Incorrect:* `import { foo } from './foo';`
*   **Data Fetching Layer:** Prefer writing or migrating logic into React Query custom hooks inside `client/src/hooks/` rather than raw functions inside `client/src/apis/`.
*   **Type Enforcement:** Use strict TypeScript declarations. Avoid using `any`. Maintain and reference models located in `client/src/models/`.
*   **No Global Refactors:** Keep code edits localized exclusively to the subsystem or file explicitly asked for by the user.

## 4. Directory Map
*   `client/src/apis/` - Legacy api logic (migrate to hooks where applicable).
*   `client/src/components/` - React presentation and container components.
*   `client/src/hooks/` - React Query custom hooks (`useStaff`, `useCustomers`, etc.).
*   `client/src/models/` - Client-side TypeScript interfaces.
*   `server/auth0/` - Authentication guards & role enforcement.
*   `server/dataHandlers/` - Distributor CSV/XLSX ETL data-cleansing scripts.
*   `server/db/` - Database schemas, Knex configurations, migrations, and seeds.
*   `server/routes/` - Express endpoint routing mechanisms.


