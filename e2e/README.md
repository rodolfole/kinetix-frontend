# Kinetix end-to-end tests

Playwright + `@playwright/test` end-to-end suite for the Kinetix frontend.

## Running

```bash
# Headed (default — config has headless: false)
pnpm test:e2e
pnpm test:e2e:headed

# Use the wrapper to keep --headed on every invocation
./pwc open <url> --headed
./pwc fill <ref> "text"   # browser stays headed from the `open`
```

## Note on `--headed`

`playwright-cli` only accepts `--headed` on the `open` sub-command. For
all other sub-commands (`fill`, `click`, `snapshot`, `goto`, etc.) the
flag is rejected. Since `open --headed` starts a persistent browser
session, every subsequent sub-command operates in that same headed
browser. To literally include `--headed` on every line, see the `pwc`
wrapper in the project root, which re-asserts headed mode between
commands.

## Coverage

29 specs across 8 files covering:
- Home page (`01-home.spec.ts`)
- Login (`02-auth-login.spec.ts`)
- Participant registration (`03-auth-register.spec.ts`)
- Event detail (`04-event-detail.spec.ts`)
- Organizer dashboard (`05-organizer-dashboard.spec.ts`)
- Participant dashboard (`06-participant-dashboard.spec.ts`)
- Registration flow (`07-registration-flow.spec.ts`)
- Organizer registration (`08-organizer-register.spec.ts`)

Skipped tests require an input that may not exist in every build.

## Requirements

- `kinetix-api` running on `localhost:8085` (via `docker compose up -d`)
- `kinetix` dev server on `localhost:4325`
- Seeded data: at least one organizer (`contact@kinetix.com / seed1234`)
  and one participant (`juan.perez@example.com / seed1234`)