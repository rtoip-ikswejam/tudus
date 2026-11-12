# Tuduś

A small, offline-first daily task planner you install on your phone. No account, no server, no tracking: everything lives in your phone's browser storage.

It is built around one idea: **do today's tasks, then look back at how it went.**

> The interface is currently in Polish. English UI is planned.

## Features

- **Three views per list:** *Do zrobienia* (backlog), *Dzisiaj* (today's plan), *Zrobione* (done), plus *Statystyki*.
- **Separate lists (areas):** e.g. Private and Work, each with its own tasks, history and statistics, and its own colour. Add more in Settings.
- **Tasks** have a short title, an optional long description (expands on tap), an optional time, an *important* flag and optional repetition (daily or chosen weekdays).
- **Daily counters:** a task such as "Drink water" with a target of 8 becomes one card with a +1 button and a progress bar.
- **Priorities by order:** move tasks up/down or to the top of today's list. Important tasks enter the list below the other important ones.
- **Failures with reasons:** mark a task as failed and pick a reason from your own list (sorted by how often you use each). See your most common reasons in *Statystyki*.
- **Progress:** weekly done count, comparison with the same days of the previous week, and an 8-week chart.
- **Undo:** a *Cofnij* (undo) toast after every completed task.
- **Works offline** after the first load, and **backup/restore** of all data to a JSON file.

## Install (Android)

1. Put the files of this repository in a **public** GitHub repository (files in the root, not in a subfolder).
2. In the repository open **Settings → Pages**, set **Source: Deploy from a branch**, **Branch: main**, folder **/ (root)**, then **Save**.
3. After a minute or two the page is available at `https://<your-login>.github.io/<repository-name>/`.
4. Open that address in **Chrome** on your phone, tap **⋮ → Install app** (or *Add to Home screen*).
5. Always start the app from the home screen icon.
6. Optional check: open the app once with a connection, enable airplane mode, open it again. It should work.

**iPhone:** open the address in Safari, tap *Share → Add to Home Screen*.

Do not rename the repository after installing: a new address is a new, empty app for the phone.

## Using the app

| Where | What you do |
|---|---|
| **Do zrobienia** | Add tasks, tap a task to expand it, tap **Do dzisiaj** to move it to today. |
| **Dzisiaj** | Tap **✓** when done. Tap a task to reveal *Porażka* (failed), *Odłóż* (postpone back to the backlog) and *Edytuj* (edit). |
| **Zrobione** | Review this week, compare with earlier weeks, undo a completed task. |
| **Statystyki** | Most frequent failure reasons from the last 30 days. |
| **⚙ Settings** | Lists and colours, failure reasons, archive, backup and restore. |

Tips:

- Unfinished tasks stay on today's list until you finish, fail or postpone them. Tasks with a counter, or with *stays on the list* switched off, expire at midnight and are recorded as a failure.
- You can add a task fast from the field at the bottom of *Dzisiaj* or *Do zrobienia*; use **więcej** for the full form.
- The list switcher at the top always opens *Dzisiaj*.

## Your data

Data is stored only in the browser storage of the installed app, on that one device.

- Use **Settings → Zapisz kopię danych** (save backup) from time to time. The app reminds you after 14 days.
- Back up **before** changing phones, clearing browser data, uninstalling the app or changing the site address.
- **Wczytaj kopię danych** (restore) replaces all current data with the backup file.
- Clearing Chrome's site data deletes your tasks.

## Updating

Upload the new files over the old ones (same names) and commit. Next time you open the app, it shows a *new version available* banner; tap **Odśwież** (refresh). Your data is kept.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole app (HTML, CSS, JavaScript) |
| `sw.js` | Service worker: offline cache, update handling |
| `manifest.json` | Install metadata (name, icons) |
| `icon-180.png`, `icon-192.png`, `icon-512.png` | App icons |

## Versioning

The version is set in two places that must always match: the `V` constant in `index.html` and the cache name in `sw.js`. Data has its own schema version (stored in the backup file) so that older backups can be migrated. Tag each release on GitHub (`v1.3.3`, ...).

## Local development

Service workers need `localhost` or HTTPS, so do not open `index.html` by double-clicking. Run a static server in the project folder:

```
python -m http.server
```

then open `http://localhost:8000` and use the browser's device toolbar (Ctrl+Shift+M in Chrome) to preview a phone screen.

## Privacy

No network requests are made, no analytics, no accounts. The only thing leaving your phone is a backup file that you choose to save and share.
