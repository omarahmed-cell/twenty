const crmUrlInput = document.getElementById('crmUrl');
const tokenInput = document.getElementById('token');
const status = document.getElementById('status');

const showStatus = (text) => {
  status.textContent = text;
};

chrome.storage.local.get(['crmUrl', 'token']).then(({ crmUrl, token }) => {
  crmUrlInput.value = crmUrl || 'https://chai.roboost.app';
  showStatus(token ? 'A token is saved.' : 'No token saved yet.');
});

document.getElementById('save').addEventListener('click', async () => {
  const crmUrl = crmUrlInput.value.trim().replace(/\/+$/, '');
  const token = tokenInput.value.trim();

  await chrome.storage.local.set({ crmUrl, ...(token ? { token } : {}) });
  showStatus('Testing…');

  chrome.runtime.sendMessage({ type: 'crm', method: 'GET', path: '/me' }, (response) => {
    showStatus(
      response?.ok
        ? `Connected as ${response.data.name}. Reload Gmail to start.`
        : `Not connected: ${response?.error || 'no answer'}`,
    );
  });
  tokenInput.value = '';
});

document.getElementById('signOut').addEventListener('click', async () => {
  await chrome.storage.local.remove('token');
  showStatus('Token removed.');
});
