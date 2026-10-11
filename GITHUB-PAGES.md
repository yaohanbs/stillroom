# Publish the browser edition on GitHub Pages

1. Create or choose a GitHub repository. Put the **contents** of the `stillroom` folder in the repository root, including the hidden `.github` folder. Do not upload database files, `.env`, `.venv`, or your personal exports.
2. Push to the `main` branch. If your default branch has another name, edit `branches: [main]` in `.github/workflows/pages.yml`.
3. In the repository, open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Run **Actions → Publish Stillroom on GitHub Pages → Run workflow**, or push another commit. The successful deployment provides your site URL, usually `https://YOUR-USERNAME.github.io/REPOSITORY/`.

This package includes the publishing workflow. It uploads **only `static/`**, never your Python databases or private files. All CSS and script links work from a repository subpath.

## What works on Pages

Timers, notes, tasks, subject management, calendar, progress, Studicons, Flames, themes, synthesized music and your uploaded files/audio work in the browser. Your data is stored on that device in localStorage and IndexedDB; another person opening the site gets their own empty workspace. Files are not committed to GitHub or sent to a server. Use your own audio or audio you have permission to use.

The planner is clearly unavailable on this static edition. FastAPI, SQLite, LangGraph approval, accounts and cross-device sync need a separately hosted backend. Never put OpenAI keys into static JavaScript. The current single-user backend needs authentication and per-user isolation before public deployment; exposing it as-is would share one workspace.

Your localhost data and your GitHub Pages data have different browser origins. They do not transfer automatically. Download your files and export your workspace before changing hosts. A workspace export contains attachment metadata, **not the file/audio contents**. Keep those originals separately. Browser storage can be cleared or evicted; keep backups of important material.

Official guidance: [GitHub Pages site creation](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site), [About GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
