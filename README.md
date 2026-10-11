# Stillroom

A cozy, single-user study workspace. Run locally with Python 3.11+:

```powershell
./start.ps1
```

Or install `requirements.txt` and run `python -m uvicorn app:app --host 127.0.0.1 --port 8000` from this directory. Visit http://127.0.0.1:8000.

## Implemented

- Responsive dashboard, library, calendar, focus room, analytics, settings, light/dark/system themes.
- Timestamp-based countdown that recovers on refresh, pause/resume, strict exit confirmation, immersive focus layout, custom duration, short breaks.
- Task completion, dated calendar events, folders, pinned notes, autosaving plain-text note editor, global search.
- Gentle musical tones and a warm harmonic drone, with working play/pause and volume. Add your own audio file for a real rain recording, music, or another ambience. The previous static-noise presets have been removed from the interface.
- Focus goal input accepts free text and suggests unfinished tasks; choose a subject alongside it. Empty task lists no longer leave an unusable dropdown.
- Library subject creation, renaming and removal, with contents moved safely to another subject. File upload, rename, subject reassignment, download, replacement and removal; direct editing for text files up to 1 MB. Attachment limit: 20 MB per file. Audio limit: 50 MB.
- Session history, seven-day chart, daily goal and consecutive-day streak. Streaks count one completed focus session per local calendar day. Unfinished sessions do not count; paused sessions retain time. No sample statistics.
- Browser-local persistence plus FastAPI/SQLite storage; workspace JSON export and deletion.
- LangGraph planner with an actual `interrupt()` approval step and SQLite checkpoints. Approval adds a task only after graph resume. By default, plans use a deterministic local template. Provider errors also fall back to a local plan with a visible source label. Set `STILLROOM_LLM=openai`, `OPENAI_API_KEY` and optionally `OPENAI_MODEL` in your environment for OpenAI-assisted plans. Keys never go to the frontend.
- Mock maintenance status at `/api/integrations`.
- Daily Wisdom: 50 searchable cards, theme filters, favorites, six motivational styles, daily rotation, optional quiet focus quotes, SVG quote-card downloads, and a chosen profile quote. Includes 48 clearly labeled original messages and two sourced Japanese/Chinese sayings with original text, translation, and context.
- Study Profile: lifetime, daily and monthly recorded hours, subject totals, average sessions, streak, nine milestone titles, earned profile frames, profile colors, and a downloadable profile card with hour/history privacy preferences.
- Studicons: five original vector companions, equip controls, per-character colors, previewable evolution stages at 0/1/10/50 hours, and an active-focus expression. Completion summaries show Flames and evolution progress.
- Flames Store: transparent earned currency, confirmed character purchases, persistent ownership, duplicate-session filtering and balance reconciliation. One Flame per five full minutes per completed session; ten bonus Flames per lifetime-hour milestone. No real-money transactions.
- Theme Studio: sixteen presets, including Obsidian Gold, Ember Orange, Arctic Cyan, Amethyst Night, Emerald Ink and Rose Noir. Live background/card/accent/surface colors, readable text adaptation, font/density/timer-shape controls, saved theme copies, validated JSON import/export, and reset. Black/gold is selected on the first load of this update; future choices are retained. Appearance changes immediately and switches palette surfaces to match the selected light/dark/system mode while keeping the accent.

## Scope and limitations

This is a working local MVP, not the entire production feature list. Calendar is month/day agenda only; recurring events, drag-and-drop, reminders, rich-text editing, folder reordering, streak freezes, custom widget layouts and sound mixing are not implemented. PDF and office file contents must be edited externally and replaced; the built-in file editor handles text only. Pinned notes are marked in the library; dashboard pinning is not implemented.

Uploaded files and audio are stored in browser IndexedDB, separate from the SQLite workspace. JSON export includes attachment metadata but not file contents. Download attachments separately and retain audio originals for backup. Files saved under localhost do not automatically transfer to a GitHub Pages origin. Removing a subject moves its files, notes, tasks, events and session labels to the selected remaining subject; historical focus totals stay intact.

For online publication, this package includes `.github/workflows/pages.yml`. See [GITHUB-PAGES.md](GITHUB-PAGES.md). GitHub Pages supports the browser edition with device-local storage; Python, LangGraph, SQLite and AI planning require a separate backend. No credentials or private database files belong in a public repository.

Community is an explicitly unavailable connection screen, not simulated friends or activity. Public profile URLs, friend privacy tiers, live rooms, gifting, trading, group goals, challenges and leaderboards need authenticated shared services and are not implemented. Downloaded cards can be shared manually; the app never sends them to friends. The store sells five companions only; separate outfits, wallpapers, seasonal items and community themes are future work. Theme Studio has one active custom palette and named saved copies, not automatic separate light/dark palettes. Background-image uploads, independent calendar colors, custom fonts, and animated ambient effects are not implemented. Daily wisdom contains a small sourced collection rather than an exhaustive historical quote database.

Progression uses locally recorded timer sessions, **not independently verified study activity**. Duplicate session IDs, manually marked records, break sessions, abandoned sessions and invalid durations do not count. A stable session ID prevents duplicate records from earning extra progression. Local storage and clocks remain user-editable; this is not a fraud-resistant public economy. New sessions record their selected task's subject; older sessions are grouped under General focus. Character unlocks are cosmetic. Reduced-motion preferences remain respected; evolution never triggers an active-session pop-up.

Run `node test_growth.cjs` to check progression eligibility, duplicate filtering, milestone thresholds, balance reconciliation, and monthly totals.

Google Calendar and Gmail are explicitly disconnected. A production connection needs registered Google OAuth credentials, redirect URLs, consent, token encryption, and per-user authorization. No Gmail is read or sent. Website blocking requires an installed browser extension or native companion; this app does not currently block websites or apps.

The backend is intentionally local and single-user. Do not expose it publicly: authentication, per-user storage, CSRF/origin validation, request limits, database migrations and a production secrets system are required first. Browser cache is unencrypted. The last browser to save wins; cross-device synchronization is not implemented. Use one tab to avoid concurrent timer duplication. Timer recovery uses the device clock and local timezone. Changes to clock/timezone can affect results.

## Architecture

The frontend is dependency-light HTML/CSS/JavaScript (your “simple web UI” option), FastAPI serves the API and static files, SQLite stores the workspace and LangGraph checkpoints. `agent.py` contains the planner/approval graph. Switch to React or Supabase after the core workflow is validated. Sites hosting runs JavaScript Workers, so this Python backend is delivered locally rather than deployed there.

## Files

- `app.py`: API, workspace persistence and agent endpoints.
- `agent.py`: LangGraph plan → interrupt approval workflow.
- `static/`: responsive application.
- `start.ps1`: Windows setup and local launch.

Database files are generated on first use. Back up both JSON exports and SQLite files before upgrading. Optional LLM calls incur your provider's API charges and send the entered study goal to OpenAI.
