window.RoboostCompose = (() => {
  const S = window.RoboostGmailSelectors;
  const U = window.RoboostUtils;
  const api = window.RoboostApi;
  const states = new WeakMap();

  const findRoot = (body) => {
    for (const selector of S.composeRoots) {
      const root = body.closest(selector);

      if (root) return root;
    }

    return body.parentElement;
  };

  const parseAddressList = (value) =>
    (value || '')
      .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const match = part.match(/^(.*)<([^>]+)>$/);

        return match
          ? { address: match[2].trim(), displayName: match[1].replace(/"/g, '').trim() || null }
          : { address: part, displayName: null };
      })
      .filter(({ address }) => address.includes('@'));

  const fieldOfChip = (chip) => {
    const named = chip.closest('[name="to"], [name="cc"], [name="bcc"]');

    if (named) return named.getAttribute('name');

    const row = chip.closest(S.recipientRow);
    const label = (row?.getAttribute('aria-label') || row?.textContent || '').trim().toLowerCase();

    if (label.startsWith('bcc')) return 'bcc';
    if (label.startsWith('cc')) return 'cc';

    return 'to';
  };

  const getRecipients = (root) => {
    const recipients = { to: [], cc: [], bcc: [] };
    const seen = new Set();
    const add = (field, recipient) => {
      const key = `${field}:${U.normalize(recipient.address)}`;

      if (!seen.has(key)) {
        seen.add(key);
        recipients[field].push(recipient);
      }
    };

    for (const [field, selector] of Object.entries(S.recipientFieldInputs)) {
      for (const input of root.querySelectorAll(selector)) {
        parseAddressList(input.value).forEach((recipient) => add(field, recipient));
      }
    }

    for (const chip of root.querySelectorAll(S.recipientChip)) {
      const address = chip.getAttribute('email') || chip.getAttribute('data-hovercard-id');

      if (address && address.includes('@')) {
        add(fieldOfChip(chip), {
          address,
          displayName: chip.getAttribute('name') || chip.textContent.trim() || null,
        });
      }
    }

    return recipients;
  };

  const allRecipients = (recipients) => [...recipients.to, ...recipients.cc, ...recipients.bcc];

  const getFrom = (root) => {
    const value = root.querySelector(S.fromInput)?.value;

    return parseAddressList(value)[0] || { address: U.accountEmail(), displayName: null };
  };

  const labelText = (state) => {
    const total = state.items.size;
    const selected = [...state.items.values()].filter((item) => item.selected).length;

    return `Log ${selected}/${total}`;
  };

  const itemKey = (group, id) => `${group}:${id}`;

  const addItem = (state, group, record, selected) => {
    const key = itemKey(group, record.id);

    if (!state.items.has(key)) {
      state.items.set(key, { group, record, selected });
    }
  };

  const loadSuggestions = async (root, state) => {
    const me = await api.me();
    const external = allRecipients(getRecipients(root))
      .map(({ address }) => U.normalize(address))
      .filter((address) => !U.isInternal(address, me?.internalDomains));
    const signature = external.sort().join(',');

    if (signature === state.suggestionsFor) return;

    state.suggestionsFor = signature;

    if (external.length === 0) return;

    const response = await api.lookup(external);

    if (!response.ok) {
      U.toast(response.error, true);

      return;
    }

    state.unknownAddresses = response.data.addresses
      .filter((row) => !row.contact && !row.isInternal)
      .map((row) => row.address);
    response.data.contacts.forEach((contact) => addItem(state, 'contacts', contact, true));
    response.data.companies.forEach((company) => addItem(state, 'companies', company, true));
    response.data.deals.forEach((deal) => addItem(state, 'deals', deal, true));
  };

  const renderDropdown = (state) => {
    const groups = [
      ['contacts', 'Contacts'],
      ['companies', 'Companies'],
      ['deals', 'Deals'],
    ];
    const list = U.el('div', { class: 'rcrm-picker-list' });

    for (const [group, title] of groups) {
      const items = [...state.items.values()].filter((item) => item.group === group);

      list.append(U.el('div', { class: 'rcrm-picker-group', text: `${title} (${items.length})` }));

      for (const item of items) {
        const checkbox = U.el('input', { type: 'checkbox' });

        checkbox.checked = item.selected;
        checkbox.addEventListener('change', () => {
          item.selected = checkbox.checked;
          state.logButton.textContent = labelText(state);
        });
        list.append(
          U.el('label', { class: 'rcrm-picker-item' }, [
            checkbox,
            U.el('span', { text: item.record.name || item.record.email || item.record.domain || item.record.id }),
            item.group === 'contacts' && item.record.companyName
              ? U.el('span', { class: 'rcrm-muted', text: item.record.companyName })
              : null,
          ]),
        );
      }
    }

    if (state.unknownAddresses?.length) {
      list.append(
        U.el('div', {
          class: 'rcrm-muted rcrm-picker-note',
          text: `New contacts will be created for: ${state.unknownAddresses.join(', ')}`,
        }),
      );
    }

    state.dropdownList.replaceChildren(...list.childNodes);
  };

  const openDropdown = async (root, state) => {
    if (state.dropdown.hidden === false) {
      state.dropdown.hidden = true;

      return;
    }

    state.dropdown.hidden = false;
    state.dropdownList.replaceChildren(U.el('div', { class: 'rcrm-muted', text: 'Loading…' }));
    await loadSuggestions(root, state);
    renderDropdown(state);
    state.logButton.textContent = labelText(state);
  };

  const onSearch = (state) => {
    clearTimeout(state.searchTimer);
    state.searchTimer = setTimeout(async () => {
      const query = state.searchInput.value.trim();

      if (query.length < 2) return;

      const response = await api.search(query);

      if (!response.ok) return;

      response.data.contacts.forEach((contact) => addItem(state, 'contacts', contact, false));
      response.data.companies.forEach((company) => addItem(state, 'companies', company, false));
      response.data.deals.forEach((deal) => addItem(state, 'deals', deal, false));
      renderDropdown(state);
      state.logButton.textContent = labelText(state);
    }, 300);
  };

  const selectedLinks = (state) => {
    const ids = (group) =>
      [...state.items.values()].filter((item) => item.group === group && item.selected).map((item) => item.record.id);

    return { personIds: ids('contacts'), companyIds: ids('companies'), opportunityIds: ids('deals') };
  };

  const addTracking = async (body) => {
    const anchors = [...body.querySelectorAll('a[href]')].filter((anchor) => /^https?:\/\//i.test(anchor.getAttribute('href')));
    const response = await api.trackingLinks(anchors.map((anchor) => anchor.getAttribute('href')));

    if (!response.ok) {
      U.toast(`Tracking not added: ${response.error}`, true);

      return null;
    }

    for (const anchor of anchors) {
      const tracked = response.data.clickUrls[anchor.getAttribute('href')];

      if (tracked) anchor.setAttribute('href', tracked);
    }

    const pixel = U.el('img', { src: response.data.openPixelUrl, width: '1', height: '1', alt: '', style: 'display:block;width:1px;height:1px;border:0' });

    body.append(pixel);

    return response.data.emailId;
  };

  const clickSend = (sendButton) => {
    for (const type of ['mousedown', 'mouseup', 'click']) {
      sendButton.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    }
  };

  const watchSentToast = (emailId) => {
    const deadline = Date.now() + 15000;
    const timer = setInterval(async () => {
      const link = document.querySelector(S.sentToastLink);
      const threadId = link?.getAttribute('param');

      if (threadId || Date.now() > deadline) {
        clearInterval(timer);

        if (threadId) await api.attachMessageIds(emailId, { gmailThreadId: threadId });
      }
    }, 500);
  };

  const sendWithCrm = async (root, state, sendButton) => {
    const body = root.querySelector(S.composeBody);
    const recipients = getRecipients(root);
    const from = getFrom(root);
    const me = await api.me();

    if (!me) {
      U.toast('Roboost CRM: not connected. Open the extension settings and paste your token.', true);
      state.bypass = true;
      clickSend(sendButton);

      return;
    }

    const participants = [from, ...allRecipients(recipients)].filter((participant) => participant.address);
    const isInternalOnly = participants.every(({ address }) => U.isInternal(address, me.internalDomains));

    if (isInternalOnly) {
      U.toast('Internal email: not logged or tracked.');
      state.bypass = true;
      clickSend(sendButton);

      return;
    }

    const subject = root.querySelector(S.subjectInput)?.value || null;
    const bodyHtml = body ? body.innerHTML : null;
    const emailId = state.track && body ? await addTracking(body) : null;

    if (state.log) await loadSuggestions(root, state);

    const payload = {
      ...(emailId ? { emailId } : {}),
      direction: 'OUTGOING',
      subject,
      bodyHtml,
      from,
      to: recipients.to,
      cc: recipients.cc,
      bcc: recipients.bcc,
      sentAt: new Date().toISOString(),
      trackEnabled: Boolean(emailId),
      // Track alone still needs a record to count on, but it doesn't create contacts or links
      createUnknownContacts: state.log,
      links: state.log ? selectedLinks(state) : { personIds: [], companyIds: [], opportunityIds: [] },
    };

    state.bypass = true;
    clickSend(sendButton);

    const response = await api.log(payload);

    if (!response.ok) {
      U.toast(`Roboost CRM: email sent but not logged (${response.error})`, true);

      return;
    }

    if (response.data.status === 'LOGGED' || response.data.status === 'ALREADY_LOGGED') {
      U.toast(state.log ? 'Logged to Roboost CRM' : 'Tracking on');
      watchSentToast(response.data.emailId);
    }
  };

  const attach = (body) => {
    const root = findRoot(body);

    if (!root || states.has(root)) return;

    const sendButton = root.querySelector(S.sendButton);

    if (!sendButton) return;

    const state = { log: false, track: false, items: new Map(), suggestionsFor: null, bypass: false };

    states.set(root, state);

    const logCheckbox = U.el('input', { type: 'checkbox', title: 'Log this email to Roboost CRM' });
    const trackCheckbox = U.el('input', { type: 'checkbox', title: 'Track opens and clicks' });

    state.logButton = U.el('button', { type: 'button', class: 'rcrm-log-button', text: 'Log 0/0' });
    state.searchInput = U.el('input', { type: 'search', class: 'rcrm-picker-search', placeholder: 'Search contacts, companies, deals' });
    state.dropdownList = U.el('div');
    state.dropdown = U.el('div', { class: 'rcrm-picker' }, [state.searchInput, state.dropdownList]);
    state.dropdown.hidden = true;

    logCheckbox.addEventListener('change', async () => {
      state.log = logCheckbox.checked;

      if (state.log) {
        await loadSuggestions(root, state);
        state.logButton.textContent = labelText(state);
      }
    });
    trackCheckbox.addEventListener('change', () => {
      state.track = trackCheckbox.checked;
    });
    state.logButton.addEventListener('click', () => openDropdown(root, state));
    state.searchInput.addEventListener('input', () => onSearch(state));

    const controls = U.el('div', { class: 'rcrm-compose-controls' }, [
      U.el('label', { class: 'rcrm-check' }, [logCheckbox, U.el('span', { text: 'Log' })]),
      state.logButton,
      U.el('label', { class: 'rcrm-check' }, [trackCheckbox, U.el('span', { text: 'Track' })]),
      state.dropdown,
    ]);

    const sendCell = sendButton.closest('td') || sendButton.parentElement;

    sendCell.after(controls);

    const intercept = (event) => {
      const button = event.target.closest?.(S.sendButton);
      const isShortcut = event.type === 'keydown' && event.key === 'Enter' && (event.ctrlKey || event.metaKey);

      if (!button && !isShortcut) return;

      if (state.bypass) {
        if (event.type === 'click') state.bypass = false;

        return;
      }

      if (!state.log && !state.track) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      if (event.type === 'mousedown' || event.type === 'keydown' || event.type === 'click') {
        if (!state.pending) {
          state.pending = true;
          sendWithCrm(root, state, root.querySelector(S.sendButton)).finally(() => {
            state.pending = false;
          });
        }
      }
    };

    for (const type of ['mousedown', 'mouseup', 'click', 'keydown']) {
      root.addEventListener(type, intercept, true);
    }
  };

  return { attach, getRecipients };
})();
