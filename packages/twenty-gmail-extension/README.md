# Roboost CRM for Gmail

Chrome extension (Manifest V3) that logs and tracks Gmail emails in the CRM and shows the CRM record of the people in an email. It talks only to the CRM, using a personal token; no third-party service.

## Build

```bash
node packages/twenty-gmail-extension/scripts/build.mjs
```

Writes `dist/roboost-crm-gmail-extension.zip`.

## Install (Load unpacked)

1. Unzip `roboost-crm-gmail-extension.zip` into a folder you keep (Chrome loads it from there).
2. Open `chrome://extensions`, turn on **Developer mode** (top right), click **Load unpacked** and pick that folder.
3. In the CRM: **Settings > Gmail extension > Create token**, copy the token.
4. Click the extension icon (puzzle piece > Roboost CRM), keep the CRM address `https://chai.roboost.app`, paste the token, **Save and test**. It should say "Connected as <your name>".
5. Reload Gmail.

## Where things are

- `src/selectors.js`: every Gmail DOM selector. When Gmail changes its markup, fix it here.
- `src/compose.js`: Log / Log N/N picker / Track in the compose window, and the send intercept.
- `src/reading.js`: "Log to CRM" on received and sent messages.
- `src/side-panel.js`: the CRM panel (toggle button on the right edge).
- `src/background.js`: all CRM calls (`/gmail-extension/*` with `Authorization: Bearer <token>`).
