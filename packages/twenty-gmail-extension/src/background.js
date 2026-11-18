// Calls to the CRM go through the service worker: it holds the host permission, so Gmail's page CSP and CORS don't apply
const DEFAULT_CRM_URL = 'https://chai.roboost.app';

const getSettings = async () => {
  const { crmUrl, token } = await chrome.storage.local.get(['crmUrl', 'token']);

  return { crmUrl: (crmUrl || DEFAULT_CRM_URL).replace(/\/+$/, ''), token };
};

const callCrm = async ({ method, path, body }) => {
  const { crmUrl, token } = await getSettings();

  if (!token) {
    return { ok: false, status: 401, error: 'No token. Open the extension settings and paste your token.' };
  }

  try {
    const response = await fetch(`${crmUrl}/gmail-extension${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    return response.ok
      ? { ok: true, status: response.status, data }
      : { ok: false, status: response.status, error: data?.message || `CRM answered ${response.status}` };
  } catch (error) {
    return { ok: false, status: 0, error: `Cannot reach the CRM: ${error.message}` };
  }
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'crm') {
    callCrm(message).then(sendResponse);

    return true;
  }

  if (message?.type === 'settings') {
    getSettings().then(({ crmUrl, token }) => sendResponse({ crmUrl, hasToken: Boolean(token) }));

    return true;
  }

  return false;
});
