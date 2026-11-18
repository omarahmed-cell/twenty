window.RoboostReading = (() => {
  const S = window.RoboostGmailSelectors;
  const U = window.RoboostUtils;
  const api = window.RoboostApi;
  const attached = new WeakSet();

  const person = (element) => ({
    address: element.getAttribute('email'),
    displayName: element.getAttribute('name') || element.textContent.trim() || null,
  });

  const logMessage = async (container, button) => {
    const me = await api.me();

    if (!me) {
      U.toast('Roboost CRM: not connected. Open the extension settings and paste your token.', true);

      return;
    }

    const senderElement = container.querySelector(S.messageSender);
    const from = senderElement ? person(senderElement) : null;
    const recipients = [...container.querySelectorAll(S.messageRecipients)].map(person).filter((recipient) => recipient.address);
    const participants = [from, ...recipients].filter(Boolean);

    if (participants.every(({ address }) => U.isInternal(address, me.internalDomains))) {
      U.toast('Internal email: not logged.');

      return;
    }

    const isFromUs = from && U.isInternal(from.address, me.internalDomains);
    const external = participants.map(({ address }) => U.normalize(address)).filter((address) => !U.isInternal(address, me.internalDomains));
    const lookup = await api.lookup(external);
    const dateTitle = container.querySelector(S.messageDate)?.getAttribute('title');
    const sentAt = dateTitle && !Number.isNaN(Date.parse(dateTitle)) ? new Date(dateTitle).toISOString() : undefined;

    button.disabled = true;
    button.textContent = 'Logging…';

    const response = await api.log({
      direction: isFromUs ? 'OUTGOING' : 'INCOMING',
      subject: document.querySelector(S.threadSubject)?.textContent.trim() || null,
      bodyHtml: container.querySelector(S.messageBody)?.innerHTML || null,
      from,
      to: recipients,
      cc: [],
      bcc: [],
      ...(sentAt ? { sentAt } : {}),
      gmailMessageId: container.getAttribute('data-legacy-message-id') || null,
      gmailThreadId: document.querySelector(S.threadIdHolder)?.getAttribute('data-legacy-thread-id') || null,
      createUnknownContacts: true,
      links: lookup.ok
        ? {
            personIds: lookup.data.contacts.map(({ id }) => id),
            companyIds: lookup.data.companies.map(({ id }) => id),
            opportunityIds: lookup.data.deals.map(({ id }) => id),
          }
        : { personIds: [], companyIds: [], opportunityIds: [] },
    });

    button.disabled = false;

    if (!response.ok) {
      button.textContent = 'Log to CRM';
      U.toast(`Not logged: ${response.error}`, true);

      return;
    }

    button.textContent = response.data.status === 'ALREADY_LOGGED' ? 'Already in CRM' : 'Logged to CRM';
  };

  const attach = (container) => {
    if (attached.has(container)) return;

    const header = container.querySelector(S.messageHeader);

    if (!header) return;

    attached.add(container);

    const button = U.el('button', { type: 'button', class: 'rcrm-log-message', text: 'Log to CRM' });

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      logMessage(container, button);
    });
    header.append(button);
  };

  return { attach };
})();
