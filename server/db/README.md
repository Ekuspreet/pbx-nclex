# Database

This server uses PostgreSQL through `pg` and Drizzle ORM.

## Environment

Create `server/.env` from `.env.example` and set:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=pbx_nursing
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

## Schema

The Drizzle schema models live in:

```txt
models/
```

Each model is defined in its own file. `models/index.js` imports all model files and re-exports them, so other server modules can import schema objects directly from `../models`.

The current schema keeps reusable question-bank data in a single table:

- `questions`

The `questions` table stores structured question-bank data in JSONB columns:

- `choices`
- `taxonomy`
- `standards`
- `exhibits`
- `references`

It intentionally does not include source-platform test attempt fields such as timers, selected answers, visited question, submitted state, or external score state.

## Commands

Install the migration CLI if it is not already installed:

```bash
npm install -D drizzle-kit
```

Generate a migration after editing `models/`:

```bash
npm run db:generate
```

Apply migrations:

```bash
npm run db:migrate
```

During early development, push the schema directly:

```bash
npm run db:push
```

Open Drizzle Studio:

```bash
npm run db:studio
```
