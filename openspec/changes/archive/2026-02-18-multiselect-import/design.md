## Context

ImportPortfolio.svelte currently accepts a single file via `<input type="file" accept=".ofx,.qfx">`. The CSV parser (`csvParser.ts`) exists but isn't wired into the UI. There's no way to anonymize portfolio data for demos.

## Goals / Non-Goals

**Goals:**
- Allow selecting multiple .ofx/.qfx/.csv files at once in the file picker
- Wire up csvParser alongside ofxParser based on file extension
- Add a "Randomize for Demo" button that scales balances and replaces owner names
- Keep import UX simple — all files parsed, all accounts shown in one modal

**Non-Goals:**
- Backend changes (import is entirely client-side)
- Persistent demo mode or startup flags
- Account-level randomization controls

## Decisions

**Multi-file import**: Add `multiple` attribute to `<input type="file">`. Loop over `input.files`, parse each file (OFX or CSV based on extension), aggregate all `ParsedAccount[]` into a single list shown in the modal. Errors per-file are collected and shown together.

**CSV integration**: Check file extension — `.csv` calls `parseCSV()`, `.ofx`/`.qfx` calls `parseOFX()`. Both return `ParsedAccount[]`.

**File type filter**: Change `accept` to `.ofx,.qfx,.csv`. Button text becomes "Import Accounts".

**Randomize for Demo**: A function in `stores.ts` that:
1. Multiplies each account balance by a random factor between 0.3 and 0.7
2. Rounds to nearest $1000
3. Replaces profile names with generic "Alex" / "Sam"
4. Triggered from a button in ProfileDrawer's Advanced section

## Risks / Trade-offs

- Multi-file: if user selects both an OFX and CSV from the same broker, duplicate accounts may appear. This is acceptable — user can delete duplicates in the editor.
- Randomization is destructive (replaces real values). Since the user already has save/load, they can reload their real data. A confirm dialog is sufficient.
