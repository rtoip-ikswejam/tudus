<p align="center"><img src="icon-512.png" alt="Tuduś" width="110"></p>

<h1 align="center">Tuduś</h1>

<p align="center"><b>plan, do, done.</b></p>

<p align="center"><i>Pronounced <b>TOO-doosh</b> (Polish: /ˈtu.duɕ/). It sounds like “to-do”, plus an affectionate Polish ending.</i></p>

A small, offline-first daily task planner you install on your phone. No account, no server, no tracking: everything lives in your phone's browser storage.

It is built around one idea: **do today's tasks, then look back at how it went.**

> The interface is available in **Polish and English**. On first launch the app asks which language to use (it suggests your phone's language), and you can change it later in Settings. Your own data (task titles, list names, reasons) is never translated. This README uses the English labels.

## Features

- **Four views per list:** *To do* (backlog), *Today* (the day's plan), *Done* and *Statistics*.
- **Separate lists:** for example Private and Work, each with its own tasks, history and statistics, and its own colour. Add, reorder, rename, recolour or delete lists in Settings (deleting asks for confirmation and removes the list's data). The list switcher at the top always opens *Today* and shows how many tasks are open in each list.
- **Tasks** have a short title, an optional long description (expands on tap), an optional time, an *important* flag and optional repetition (daily or chosen weekdays).
- **Scheduled tasks:** a one-off task can have a date from which it moves to *Today* by itself. Until then the date is shown on the task in *To do*. It is not a deadline: nothing is highlighted or overdue.
- **Steps / shopping lists:** a task can have steps, for example a shopping list or the stages of a job. Tick them off, add or rename them, and set their order (ticked steps sink to the bottom). Coins and history count the whole task once. A repeating task keeps its steps as a template and every day starts with a fresh, unticked copy.
- **Ideas:** a notepad next to the backlog for things you are only thinking about. Switch between **Tasks** and **Ideas** at the top of *To do*. An idea is a task in a resting state: it keeps all its fields (description, steps, repetition...) but does nothing until you move it to *To do*; you can also move a task back to ideas. Ideas are kept per list and never affect coins or statistics.
- **Data cleanup (optional):** *Settings → Data cleanup* lets you keep full detail for only the last 2, 3 or 4 weeks. Older entries become weekly statistics per list (done, failed, postponed, coins, and failures grouped by reason and task title), and finished tasks that no longer have a history entry are removed. The 8-week chart and *Statistics* look the same before and after, and the database stops growing (in a simulation of two heavy years: about 3.6 MB down to about 0.15 MB). Cleanup is off by default. The first time you turn it on you see a preview and a backup file is saved first; afterwards it runs automatically once a day. Failures without a reason stay open for you to fill in for 8 weeks, then they move to *No reason chosen* in the statistics. Cleanup cannot be undone, but the backup can be restored. The data schema is now 3 (older backups still load).
- **Pause (holiday, illness, a trip):** *Settings → Pause* sets a date range, for all lists or only some. During a pause repeating tasks and dated tasks are not added to *Today*, and expiring tasks no longer cost coins (one-off tasks carry over to the next day, daily copies of repeating tasks just disappear). Right after you save a pause you get a list of the dated tasks that fall inside it, and for each one you can leave it, change its date, remove the date or cancel it (to the archive). Tasks you leave land in *Today* after the pause marked “overdue · date”. A pause can be ended early with *End now*. Weeks with pause days show as a dashed bar in *Done* and are not compared with the previous week. You can still send a repeating task to *Today* by hand during a pause.
- **Doodle of the day:** once a day, right after the start screen (and after the “you lose coins” window, if there is one), a small isometric voxel scene appears: someone at work (miner, blacksmith, archaeologist, angler, reading owl, treasure dwarf, clerk with a stamp, postman, builder with a jackhammer, sweeping snowman) on a spring, summer, autumn or winter island with its own weather, plus one motivating line built from your own numbers. It disappears after a few seconds or on a tap, and you can see it again in *Settings → Doodle of the day* (the same scene and text for the whole day). The line is picked at random from what is true: yesterday better than the day before, last week better than the week before, or a nudge that says how many more tasks (1–3) would bring you back to your average. During a pause it says to rest. Everything lives in the `doodle/` folder (engine, backgrounds, characters, weather, texts) and is listed in `doodle/manifest.json`, so a new character is one new file plus one line in the manifest. It can be turned off in Settings.
- **List balance:** when you have two or more lists, the top of *Done* shows one bar cut into the colours of your lists. Each slice is how a list is doing compared with **its own** usual pace (the last 7 days against its average over the 4 full weeks before that), so a small list is not beaten by a big one just for having fewer tasks. The text says which list is doing best, or that everything is even (within 10 points). A list that is on a pause, or has fewer than 3 tasks a week in its usual pace, gets a small “pause” / “not enough data” tag instead of a percentage, and with fewer than two comparable lists the bar is replaced by a calm note.
- **Settings in groups:** *Settings* is split into six collapsible groups: *Lists and reasons*, *Coins and shop*, *Pause*, *Appearance and language* (theme, language, doodle and its animation speed together), *Data* (backup, restore and data cleanup together) and *App and diagnostics*. Each group shows a one-line summary while collapsed (for example the age of your last backup, or whether a pause is running), and a group you opened stays open while you change things inside it.
- **Diagnostics:** *Settings → Diagnostics* shows what is installed (app, offline files, server), whether an update is pending or was rejected, storage use, a data consistency check and a recent event log. A dot on the ⚙ icon appears when something needs attention. The log never contains task titles or notes.
- **Daily counters:** a task such as “Drink water” with a target of 8 becomes one card with a **+1** button and a progress bar.
- **Priorities by order:** move tasks up or down, or to the top, in today's list. Important tasks enter the list below the other important ones. In *To do*, new one-off tasks go to the top and repeating or scheduled ones to the bottom; rearrange them freely with **order**.
- **Failures with reasons:** mark a task as a failure and pick a reason from your own list. You choose the order of the reasons and can rename or delete them in Settings. See your most common reasons in *Statistics* for the last 4 weeks, 13 weeks or a year, and tap a reason to see which tasks you fail or postpone because of it.
- **Quick add:** a field at the bottom of *To do* and *Today* adds a task with just a title; **more** opens the full form.
- **Coins and a shop:** every completed task earns coins (+2 by default) and every failure costs one (−1). Postponing and cancelling cost nothing, and the balance never drops below zero. A small spinning-coin animation (the round logo) celebrates each reward, and a grey coin marks each loss. Spend coins on rewards you define yourself (a cinema evening, a restaurant...) in the shop, with no credit. Rates and rewards are set in Settings, and rewards are always listed from the cheapest.
- **Undo:** a toast with **Undo** appears after every completed task.
- **Progress:** weekly done count, comparison with the same days of the previous week, and an 8-week chart.
- **Works offline** after the first load, with **backup and restore** of all data to a JSON file.

## Install (Android)

1. Put the files of this repository in a **public** GitHub repository (files in the root, not in a subfolder; the `lang` folder stays a folder).
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
| **To do** | Add tasks, tap a task to expand it, tap **To today** to move it to today, use **order** to rearrange the list. Switch to **Ideas** for things you may or may not do; **To ideas** and **To do** move items between the two. |
| **Today** | Tap **✓ done** when finished. Tap a task to reveal **Failure**, **Postpone to “To do”** and **Edit**. |
| **Done** | Review this week, compare with earlier weeks, **Undo** a completed task, see your coin balance and open the **Shop**. |
| **Statistics** | Most frequent failure reasons for the chosen period (4 weeks, 13 weeks or a year; periods are whole calendar weeks starting on Monday). Tap a reason to see the tasks behind it: how many times, whether postponed (↩) or failed (✗), and when last. |
| **⚙ Settings** | Lists (colour, order, rename, delete), failure reasons (order, rename, delete), coin rates and shop rewards, archive, language, backup and restore. Tap a row to reveal its actions. |

Tips:

- Unfinished tasks stay on today's list until you finish, fail or postpone them. Tasks with a counter, or with *Stays on the list if not done that day* switched off, expire at midnight and are recorded as a failure.
- Add a task fast from the field at the bottom of *Today* or *To do*, and use **more** for the full form.
- Tap a task's title to read its description.
- **Postponing** a task from *Today* asks until when. No date is the default; pick tomorrow, in 2 days, in a week or any date, and the task returns to *Today* on that day (it waits in *To do* with its date shown).
- When tasks expire at midnight, the next time you open the app you get a short summary of what expired and how many coins it cost, with an **OK** button.

## Your data

Data is stored only in the browser storage of the installed app, on that one device.

- Use **Settings → Save a backup** from time to time. The app reminds you after 14 days.
- Back up **before** changing phones, clearing browser data, uninstalling the app or changing the site address.
- **Restore a backup** replaces all current data with the backup file.
- Clearing Chrome's site data deletes your tasks.

## Updating

Upload the new files over the old ones (same names) and commit. Next time you open the app, it shows **New version available**; tap **Refresh**. Your data is kept.

If an update does not arrive, open **Settings → Diagnostics → Check for updates**. It compares the app, the offline files and the server. **Clear offline files and download again** repairs a stale install without touching your tasks, and **Copy report** gives you a privacy-safe text (no titles, no notes) to share when you ask for help.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole app (HTML, CSS, JavaScript) |
| `sw.js` | Service worker: offline cache, update handling |
| `manifest.json` | Install metadata (name, icons) |
| `lang/pl.js`, `lang/en.js` | Interface texts, one file per language (keep the `lang` folder) |
| `icon-180.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | App icons (the maskable one is a full-bleed version for Android) |

## Versioning

The version is set in two places that must always match: the `V` constant in `index.html` and the cache name in `sw.js`. Data has its own schema version (stored in the backup file) so that older backups can be migrated. Tag each release on GitHub (`v1.14.1`, ...).

## Languages

Interface texts live in `lang/pl.js` and `lang/en.js`: each file maps a source text (written in Polish) to the text shown in that language. The app uses one language at a time; the choice is stored on the device and is not part of the backup file. To add a language, copy `lang/en.js` to `lang/xx.js`, translate the values, add a `<script src="lang/xx.js">` line next to the others in `index.html`, add the file to the list in `sw.js` and add an option to the language selector (`id=lg`) in the settings view.

## Local development

Service workers need `localhost` or HTTPS, so do not open `index.html` by double-clicking. Run a static server in the project folder:

```
python -m http.server
```

then open `http://localhost:8000` and use the browser's device toolbar (Ctrl+Shift+M in Chrome) to preview a phone screen.

## Privacy

No network requests are made, no analytics, no accounts. The only thing leaving your phone is a backup file that you choose to save and share.
