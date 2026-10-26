# EGOIST ARCHIVE

Dark, cold, Blue Lock-inspired portfolio with a server-backed admin panel. The public site contains **Texts / Programming / About**, editable project cards, social links, a quote, and a portrait image slot for an image you have permission to use.

## Run locally

Requirements: Node.js 20 or newer.

1. Copy `.env.example` to `.env`.
2. Set a unique `ADMIN_PASSWORD` (at least 12 characters) and a random `SESSION_SECRET` (at least 32 characters). Example secret generator: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
3. Install and run:

   ```sh
   npm install
   npm start
   ```
4. Open `http://localhost:3000` and click **ADMIN LOGIN**.
5. Enter `ADMIN_PASSWORD`. Edit the intro, image URL, quote, About text, project cards and links, then click **Save changes**.

The content is stored in `data/egoist.sqlite`, not in the visitor's browser. Once the app is deployed, saves are served to every visitor.

## Deploying publicly

Deploy this as a **Node.js web service**, not as a static-only site. The host must support Node.js and persistent disk storage for the SQLite database. Configure these environment variables in the host dashboard:

- `NODE_ENV=production`
- `SESSION_SECRET` — long random secret, 32+ characters
- `ADMIN_PASSWORD` — long unique password, 12+ characters
- `DATABASE_PATH` — optional path on the host's persistent disk, e.g. `/var/data/egoist.sqlite`
- `PORT` is normally supplied by the host

Attach a persistent disk and set `DATABASE_PATH` to a path on that disk, or database changes may be lost on redeploy/restart. Use HTTPS in production; secure session cookies are enabled when `NODE_ENV=production`. Do not commit `.env` or the database file to Git.

## Security notes

- Admin login uses server-side sessions with `HttpOnly`, `SameSite=Strict` cookies; cookies are `Secure` in production.
- Login is rate-limited; headers are hardened with Helmet; writes require an authenticated session and same-origin request.
- Sessions are stored in a separate SQLite file (`data/sessions.sqlite`) so admin logins survive a server restart. For multi-instance or high-availability deployments, use a shared production session store (for example Redis) and a managed database instead of SQLite.
- Back up `data/egoist.sqlite` regularly.
- The server sanitizes fields and accepts only `http`, `https`, `mailto`, or local `#anchor` URLs. It does not permit arbitrary HTML in text fields.
- The image field expects an image URL. Use an image you own or have permission to display; the template does not bundle copyrighted anime artwork.

## Project structure

- `server.js` — Express API, session-based admin authentication, SQLite storage
- `public/index.html` — responsive visual portfolio and admin dialogs
- `public/app.js` — rendering, login, editing and save requests
- `.env.example` — environment variable template
