# Latest update: branch managers swapped (October 2026)

The branch managers are now:

- Aminullah Zafari — **شعبه مرکزی**
- Sharif Wafa — **شعبه قلعه نو**
- Barat Ebrahimi — **شعبه سرپل**

When the sync server starts, it moves these three managers to these
branches **once**, even if the previous update already gave them other
branches. After that, a shareholder's change in «پرسنل و مدرسان» stays.

## Steps

1. Merge the pull request into `main`.
2. Back up the data:
   `sudo cp -a /var/www/hadaf-data /var/www/hadaf-data.backup-$(date +%Y%m%d-%H%M)`
3. Pull `main` and copy `index.html` and `js/` into the web root (only
   `js/branch-scope.js` and `index.html` changed).
4. **Restart the sync server** (e.g. `sudo systemctl restart hadaf-sync`).
   The reassignment runs at start; `server/server.js` itself is unchanged
   but loads the updated `js/branch-scope.js` from the `js/` folder next to
   `server/` (copy it there too if the service runs from a separate folder).
5. Check:
   - the server log shows `updated branch names / branch managers in stored data`;
   - `curl -s https://SITE/ | grep -o 'js/branch-scope.js?v=[0-9.]*'` prints `js/branch-scope.js?v=1.1`;
   - the managers' branches:
     `sudo node -e 'const d=require("/var/www/hadaf-data/db.json");d.teachers.filter(t=>t.role==="مدیریت").forEach(t=>console.log(t.name,"=>",t.branch||"(none)"))'`
     must show Aminullah Zafari => شعبه مرکزی, Sharif Wafa => شعبه قلعه نو,
     Barat Ebrahimi => شعبه سرپل. If a name is spelled so it isn't
     matched, a shareholder sets the branch in the dashboard.
6. Managers who are logged in see their new branch after reloading the page.

---

# Latest update: branches and branch managers (October 2026)

What changes:

- Branches are renamed: شعبه ۲ → **شعبه قلعه نو**, شعبه ۳ → **شعبه سرپل**
  (شعبه مرکزی stays). Existing data is renamed automatically.
- Each branch manager sees and changes only their own branch: classes,
  their students and attendance, expenses, book purchases, other income
  and seminars (plus online seminars). The **server** enforces this: it
  sends a manager only their branch, and ignores any change they send for
  another branch. Shareholders still see everything.
- The managers get their branch automatically when the server starts:
  Sharif Wafa → شعبه مرکزی, Aminullah Zafari → شعبه قلعه نو,
  Barat Ibrahimi → شعبه سرپل (matched by name, Persian or English
  spelling, only for personnel with role «مدیریت»). Anyone else, or a name
  spelled differently, is set by a shareholder in «پرسنل و مدرسان» ›
  edit › «شعبه». A manager without a branch sees no branch data and gets
  a notice saying so.
- The class list in student registration now also shows the teacher(s)
  and the start date of each class.

## Steps

1. Merge the pull request into `main`.
2. Back up the data:
   `sudo cp -a /var/www/hadaf-data /var/www/hadaf-data.backup-$(date +%Y%m%d-%H%M)`
3. Pull `main` and copy `index.html`, `css/` and `js/` into the web root as
   in earlier deploys. **`js/` now has a new file, `js/branch-scope.js`.**
4. **`server/server.js` changed: restart the sync server** (e.g.
   `sudo systemctl restart hadaf-sync`), same environment as before. The
   server loads `../js/branch-scope.js` relative to `server/server.js`, so
   the `js/` folder must sit next to the `server/` folder the service runs
   from (it does in the standard layout `/var/www/hadaf/server/server.js` +
   `/var/www/hadaf/js/`). If it's missing, the server stops at start with
   "Cannot find module" — copy `js/branch-scope.js` there and restart.
   nginx needs no change.
5. Check:
   - `sudo journalctl -u hadaf-sync -n 20` (or the pm2 log) shows
     `updated branch names / branch managers in stored data` once.
   - `curl -s https://SITE/api/health` returns `{"ok":true,...}`.
   - `curl -s https://SITE/ | grep -o 'js/app.js?v=[0-9.]*'` prints
     `js/app.js?v=5.3`.
   - Make sure every manager got a branch:
     `sudo node -e 'const d=require("/var/www/hadaf-data/db.json");d.teachers.filter(t=>t.role==="مدیریت").forEach(t=>console.log(t.name,"=>",t.branch||"(none)"))'`
     If one shows `(none)`, a shareholder sets it in the dashboard.
   - In a browser, log in as a branch manager: a blue line under the header
     names their branch, and classes/expenses show only that branch.
6. Staff reload every open dashboard tab.

Rolling back: deploy the previous `main` commit (static files and
`server/server.js`), restart the server. The renamed branches and the
managers' `branch` field stay in the data; the old code shows the new
names and ignores the field.

---

# Deploying the September 2026 update (PR #1)

This file is for whoever updates the HADAF server (a person or a Claude
session with access to it). It takes the server from the version it runs
now, commit `d3c8146` ("Add 80mm thermal receipt…", 25 Sep 2026), to the
latest commit of pull request #1:
https://github.com/mohammaddrboy-rgb/hadaf-dashboard/pull/1
(branch `claude/focused-pascal-v68b13`).

The update changes both the **website files** and the **sync server**
(`server/server.js`). Deploy both together. If you deploy only one, logins
or saving will fail.

## What changes for users

- Everyone must log in once more after the update. Passwords are now
  checked by the server, and every data request needs the session it gives.
- Staff must **reload every open dashboard tab** after the update. A tab
  still running the old code cannot save, because the server now refuses
  requests without a login. Nothing on the server is lost, but edits made
  in such a tab stay in that browser until it is reloaded.
- New features: server login, merging of simultaneous edits, 80 mm
  receipts, class sessions (Sat–Thu), five salary types, two-teacher
  classes, and the Afghan calendar in salaries and reports. See the pull
  request description for details.

## Steps

### 1. Merge the pull request

On GitHub, merge PR #1 into `main`; it merges cleanly. If `main` is not
to be touched yet, deploy branch `claude/focused-pascal-v68b13` instead
and use that branch name wherever these steps say `main`.

### 2. Back up the live data first

The shared data lives in `HADAF_DATA_DIR` (default `/var/www/hadaf-data`):
`db.json` and `meta.json`.

```bash
sudo cp -a /var/www/hadaf-data /var/www/hadaf-data.backup-$(date +%Y%m%d-%H%M)
```

### 3. Update the code

Pull `main` (or the branch) into the checkout the server is deployed
from. Then copy or sync the static files into the web root the same way
as previous deploys: `index.html`, `css/`, `js/`, `assets/`, and — since
the October 2026 redesign — the new `vendor/` (GSAP) and `fonts/`
(Vazirmatn) folders. nginx serves `.woff2` as `font/woff2` with its
default `mime.types`. The old
`js/seed.js` contained real passwords; the new one does not, so make sure
it is replaced.

### 4. Restart the sync server

`server/server.js` changed (new login, sessions and per-role data). It
must be restarted to take effect. Use whatever runs it today (for example
`sudo systemctl restart hadaf-sync`, or pm2), with the same environment:

- `PORT` (default 8791)
- `HOST` (default 127.0.0.1)
- `HADAF_DATA_DIR` (default /var/www/hadaf-data)

The server now also writes `sessions.json` in `HADAF_DATA_DIR`, so the
server process must be able to write there (it already writes `db.json`).
The existing `db.json` is used as is; no conversion step is needed.

### 5. nginx

In the `location /api/` block, make sure these are present, then run
`sudo nginx -t && sudo systemctl reload nginx`:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8791;
    proxy_set_header X-Real-IP $remote_addr;          # needed for login throttling
    proxy_set_header Authorization $http_authorization;
}
client_max_body_size 30m;   # in the server block
```

Serve the site over **HTTPS**. Passwords and session tokens travel in
every request.

### 6. Check that it works

Replace `https://SITE` with the dashboard's address:

```bash
curl -s https://SITE/api/health            # {"ok":true,"version":N}
curl -s -o /dev/null -w "%{http_code}\n" https://SITE/api/db   # must print 401 (was 200 before: data was public)
curl -s https://SITE/api/directory | head -c 300   # names for the login screen, no passwords
curl -s https://SITE/ | grep -o 'js/app.js?v=[0-9.]*'   # js/app.js?v=4.9 or newer
```

Then, in a browser:

1. Open the site and log in as a shareholder with an existing password.
   The badge at the top should read «همگام با سرور ✓».
2. Log in on a second device as a manager and add a test expense on both
   devices at the same time. Both expenses must remain after about 15
   seconds.
3. Print a student receipt on the Xprinter: vertical and horizontal
   (Settings › تنظیمات چاپ رسید). In the print dialog, set Margins to
   "None" and Scale to "Default".

### 7. After deploying

- **Change every password.** The current passwords were publicly
  readable (in `js/seed.js` and via `/api/db`) and remain in git history.
  A shareholder can do this with the «تولید رمز جدید» button in each
  person's profile.
- In the personnel list, anyone without a salary type (e.g. teachers added
  quickly from the class form with «+ مدرس») is marked red «تعیین نشده»;
  choose one of the five salary types for them.

## Rolling back

1. Deploy commit `d3c8146` again (static files + `server/server.js`) and
   restart the sync server.
2. Restore the data backup only if something went wrong with the data
   itself.

The old code ignores the new fields the update adds, so the current data
also works with the old version.
