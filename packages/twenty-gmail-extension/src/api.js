window.RoboostApi = (() => {
  const call = (method, path, body) =>
    new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'crm', method, path, body }, (response) =>
        resolve(response || { ok: false, error: 'No answer from the extension' }),
      );
    });

  let me = null;

  return {
    async me() {
      if (!me) {
        const response = await call('GET', '/me');

        me = response.ok ? response.data : null;
      }

      return me;
    },
    lookup: (addresses) =>
      call('GET', `/lookup?emails=${encodeURIComponent(addresses.join(','))}`),
    search: (query) => call('GET', `/search?q=${encodeURIComponent(query)}`),
    addContact: (address, displayName) =>
      call('POST', '/contacts', { address, displayName }),
    trackingLinks: (urls) => call('POST', '/tracking-links', { urls }),
    log: (payload) => call('POST', '/log', payload),
    attachMessageIds: (emailId, ids) => call('PATCH', `/log/${emailId}`, ids),
  };
})();

window.RoboostUtils = {
  normalize: (address) => (address || '').trim().toLowerCase(),
  isInternal(address, internalDomains) {
    const domain = (address.split('@')[1] || '').toLowerCase();

    return (internalDomains || []).some(
      (internal) => domain === internal || domain.endsWith(`.${internal}`),
    );
  },
  accountEmail() {
    const match = document.title.match(window.RoboostGmailSelectors.accountEmailFromTitle);

    return match ? match[1].toLowerCase() : null;
  },
  el(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'class') element.className = value;
      else if (key === 'text') element.textContent = value;
      else if (key.startsWith('on')) element.addEventListener(key.slice(2), value);
      else if (value !== undefined && value !== null && value !== false) element.setAttribute(key, value);
    }

    for (const child of [].concat(children)) {
      if (child) element.append(child);
    }

    return element;
  },
  toast(text, isError = false) {
    const toast = window.RoboostUtils.el('div', { class: `rcrm-toast${isError ? ' rcrm-toast-error' : ''}`, text });

    document.body.append(toast);
    setTimeout(() => toast.remove(), 5000);
  },
};
