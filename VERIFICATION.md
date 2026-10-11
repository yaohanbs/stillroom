# Verification

Verified locally on October 11, 2026:

- Python source compiles; frontend JavaScript syntax check passes.
- FastAPI serves the UI successfully.
- SQLite workspace save/read/delete round-trip passes.
- Invalid planner durations are rejected.
- LangGraph pauses at an actual interrupt, resumes after approval or rejection, and rejects duplicate approval.
- Pending approval survives rebuilding the graph from its SQLite checkpoint database.
- In-browser focus timer starts, pauses, and recovers its remaining time after refresh.
- In-browser local planner shows the approval screen; declining leaves the task list unchanged.
- Growth update: progression tests pass for eligible-session filtering, duplicate IDs, milestone rewards, evolution boundaries, repeated purchases, insufficient funds and monthly totals.
- Browser-tested collection/profile navigation, locked rewards, multilingual wisdom search, live theme switching, and theme recovery after refresh.
- Profile mobile width checked at 390 px without horizontal overflow; collection visually checked at 1280 px. These are browser viewport checks, not physical device tests.

OpenAI live generation could not be verified because the available API account returned insufficient quota. The app now opts into OpenAI only when `STILLROOM_LLM=openai` and a key are configured, and labels its local fallback if provider calls fail.

Refinement checks: typed custom focus goal and subject are retained in the running session. Browser file upload, filename/content editing, refresh recovery, and removal passed using a temporary text file. Subject creation, rename and removal passed using a temporary subject. JavaScript syntax and progression tests pass. Musical audio play controls were exercised, but sound quality was not verified by listening. GitHub Pages workflow is prepared, not deployed or verified on GitHub.

Google integrations, real device blocking, and the advanced features listed in README.md remain unavailable.

Dark-theme fix: browser computed styles confirm black/gold background `#08090b`, cards `#141518`, gold `#e2bb63`; switching to light and back updates the surfaces. Ember Orange applies its orange accent and black background. Black/gold survives refresh. `node test_themes.cjs` passes mode precedence, accent preservation, system-mode selection and minimum 4.5:1 foreground contrast for the six new palettes. This contrast check covers palette foreground/background pairs, not a complete accessibility audit.
