window.RoboostSidePanel = (() => {
  const S = window.RoboostGmailSelectors;
  const U = window.RoboostUtils;
  const api = window.RoboostApi;
  let panel = null;
  let body = null;
  let lastSignature = null;

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');

  const humanize = (value) =>
    value ? value.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase()) : '-';

  const participantsOnScreen = (internalDomains) => {
    const addresses = new Map();

    for (const element of document.querySelectorAll(`${S.messageSender}, ${S.messageRecipients}`)) {
      const address = U.normalize(element.getAttribute('email'));

      if (address && !U.isInternal(address, internalDomains) && !addresses.has(address)) {
        addresses.set(address, element.getAttribute('name') || element.textContent.trim());
      }
    }

    return addresses;
  };

  const row = (label, value) =>
    U.el('div', { class: 'rcrm-row' }, [U.el('span', { class: 'rcrm-muted', text: label }), U.el('span', { text: value || '-' })]);

  const contactCard = (lookupRow) => {
    const { contact, openDeals } = lookupRow;

    return U.el('div', { class: 'rcrm-card' }, [
      U.el('div', { class: 'rcrm-card-title', text: contact.name }),
      U.el('div', { class: 'rcrm-muted', text: lookupRow.address }),
      row('Company', contact.companyName),
      row('Owner', contact.ownerName),
      row('Lifecycle stage', humanize(contact.lifecycleStage)),
      row('Lead status', humanize(contact.leadStatus)),
      row('Last activity', formatDate(contact.lastActivityDate)),
      U.el('div', { class: 'rcrm-muted rcrm-deals-title', text: `Open deals (${openDeals.length})` }),
      ...openDeals.map((deal) =>
        U.el('a', { class: 'rcrm-deal', href: deal.url, target: '_blank', rel: 'noopener', text: `${deal.name} · ${humanize(deal.stage)}` }),
      ),
      U.el('a', { class: 'rcrm-open', href: contact.url, target: '_blank', rel: 'noopener', text: 'Open in CRM' }),
    ]);
  };

  const unknownCard = (address, displayName) => {
    const button = U.el('button', { type: 'button', class: 'rcrm-add', text: 'Add to CRM' });

    button.addEventListener('click', async () => {
      button.disabled = true;

      const response = await api.addContact(address, displayName);

      if (response.ok) {
        lastSignature = null;
        refresh();
      } else {
        button.disabled = false;
        U.toast(`Not added: ${response.error}`, true);
      }
    });

    return U.el('div', { class: 'rcrm-card' }, [
      U.el('div', { class: 'rcrm-card-title', text: displayName || address }),
      U.el('div', { class: 'rcrm-muted', text: `${address} is not in the CRM` }),
      button,
    ]);
  };

  const refresh = async () => {
    if (!panel || panel.hidden) return;

    const me = await api.me();

    if (!me) {
      body.replaceChildren(U.el('div', { class: 'rcrm-muted', text: 'Not connected. Open the extension settings (puzzle icon > Roboost CRM) and paste your token.' }));

      return;
    }

    const participants = participantsOnScreen(me.internalDomains);
    const signature = [...participants.keys()].sort().join(',');

    if (signature === lastSignature) return;

    lastSignature = signature;

    if (participants.size === 0) {
      body.replaceChildren(U.el('div', { class: 'rcrm-muted', text: 'Open an email to see its people in the CRM.' }));

      return;
    }

    body.replaceChildren(U.el('div', { class: 'rcrm-muted', text: 'Loading…' }));

    const response = await api.lookup([...participants.keys()]);

    if (!response.ok) {
      body.replaceChildren(U.el('div', { class: 'rcrm-muted', text: response.error }));

      return;
    }

    body.replaceChildren(
      ...response.data.addresses
        .filter((lookupRow) => !lookupRow.isInternal)
        .map((lookupRow) =>
          lookupRow.contact ? contactCard(lookupRow) : unknownCard(lookupRow.address, participants.get(lookupRow.address)),
        ),
    );
  };

  const mount = () => {
    if (panel) return;

    body = U.el('div', { class: 'rcrm-panel-body' });
    const mark = () => U.el('img', { class: 'rcrm-mark', src: chrome.runtime.getURL('icons/roboost-mark.svg'), alt: '' });

    panel = U.el('div', { class: 'rcrm-panel' }, [
      U.el('div', { class: 'rcrm-panel-header' }, [mark(), U.el('span', { text: 'Roboost CRM' })]),
      body,
    ]);
    panel.hidden = true;

    const toggle = U.el('button', { type: 'button', class: 'rcrm-panel-toggle', title: 'Roboost CRM', 'aria-label': 'Roboost CRM' }, [mark()]);

    toggle.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
      lastSignature = null;
      refresh();
    });
    document.body.append(toggle, panel);
  };

  return { mount, refresh };
})();
