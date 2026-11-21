# Restore the original Twenty UI

The Roboost redesign only replaces the frontend. If it ever has to go, the original Twenty
frontend can be put back on top of the current backend.

## What it does

`scripts/restore-original-ui.sh --yes`:

1. Branches `restore/original-ui` from `origin/feature/activity-objects`.
2. Replaces `packages/twenty-front` and `packages/twenty-ui` with tag `twenty-ui-original`
   (the commit before the first redesign commit `e6b9acca24`). Files added since then in those
   two packages are removed.
3. Keeps everything else as it is now: `twenty-server`, `twenty-shared`, migrations, workers.
4. Builds and typechecks locally, pushes to `feature/activity-objects`, waits for the image and
   runs `sudo twenty-deploy <sha>` on the VPS.

Without `--yes` it only prints what it would do.

## Before you run it

- Take a backup the usual way (`/root/predeploy/pre-<sha>.dump`).
- Frontend features built after the tag for backend features (Forms settings, the activity
  pop-ups, boards) disappear with it; their data and APIs stay.
- A quicker way back for a single page is `?view=classic`, and turning off
  `IS_ROBOOST_UI_ENABLED` hides the new pages without a deploy.
