# frontend-totp

A secure, privacy-first TOTP (Time-based One-Time Password) authenticator that runs entirely in the browser. No backend, no storage — everything lives in memory only.

## Quick Start (No Build Tools Required)

You can run this app with any static HTTP server — no `npm`, no build step needed.

**Python:**
```bash
python3 -m http.server 8000
```

**Node.js (npx):**
```bash
npx serve .
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

> **Note:** The app uses ES modules and the Web Crypto API, so it must be served over HTTP (or HTTPS) — opening `index.html` directly via `file://` won't work due to browser security restrictions on modules.

## Development (with Vite)

If you prefer using Vite for hot-reloading during development:

```bash
npm install
npm run dev
```