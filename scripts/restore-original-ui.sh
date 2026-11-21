#!/usr/bin/env bash
# Puts the original Twenty frontend (tag twenty-ui-original) back on top of the current
# backend, then builds and deploys it to chai. See scripts/restore-original-ui.md.
set -euo pipefail

TAG="twenty-ui-original"
DEPLOY_BRANCH="feature/activity-objects"
VPS="deploy@72.62.212.212"
FRONT_PACKAGES=(packages/twenty-front packages/twenty-ui)

if [[ "${1:-}" != "--yes" ]]; then
  echo "This replaces ${FRONT_PACKAGES[*]} with ${TAG} and deploys to chai."
  echo "Run again with --yes to continue."
  exit 1
fi

cd "$(git rev-parse --show-toplevel)"

if [[ -n "$(git status --porcelain -- "${FRONT_PACKAGES[@]}")" ]]; then
  echo "Uncommitted frontend changes found; commit or stash them first." >&2
  exit 1
fi

git fetch origin "${DEPLOY_BRANCH}" --tags
git checkout -B restore/original-ui "origin/${DEPLOY_BRANCH}"

# Remove the redesigned frontend entirely, then bring back the tagged version
git rm -r -q "${FRONT_PACKAGES[@]}"
git checkout "${TAG}" -- "${FRONT_PACKAGES[@]}"

# Keep the flag enum the server still sends, so the old frontend reads it as an unknown flag
git checkout "origin/${DEPLOY_BRANCH}" -- packages/twenty-shared

git add -A "${FRONT_PACKAGES[@]}"
git commit -m "Restore the original Twenty frontend from ${TAG}"

yarn install --immutable
npx nx build twenty-shared --skip-nx-cache
npx nx build twenty-ui --skip-nx-cache
(cd packages/twenty-front && npx tsgo -p tsconfig.json --noEmit)

SHA="$(git rev-parse HEAD)"
git push origin "HEAD:${DEPLOY_BRANCH}"

echo "Waiting for the image ghcr.io/omarahmed-cell/twenty:${SHA}"
until ssh -o ConnectTimeout=20 "${VPS}" "docker manifest inspect ghcr.io/omarahmed-cell/twenty:${SHA} >/dev/null 2>&1"; do
  sleep 60
done

ssh -o ConnectTimeout=20 "${VPS}" "sudo /usr/local/sbin/twenty-deploy ${SHA}"
echo "Deployed ${SHA}. Check https://chai.roboost.app"
