// Every Gmail DOM detail the extension depends on lives here, so a Gmail redesign is fixed in one file.
// Gmail's class names are obfuscated and change rarely; attributes (aria, name, data-*) are preferred where they exist.
window.RoboostGmailSelectors = {
  // Compose (new message window, pop-out, and inline reply)
  composeBody: 'div[contenteditable="true"][g_editable="true"], div[aria-label="Message Body"][contenteditable="true"]',
  composeRoots: ['div.M9', 'div[role="dialog"]', 'td.I5', 'div.ip.adB'],
  sendButton: 'div[role="button"].T-I.aoO, div[role="button"][data-tooltip^="Send"], div[role="button"][aria-label^="Send"]',
  subjectInput: 'input[name="subjectbox"]',
  fromInput: 'input[name="from"]',
  recipientFieldInputs: { to: 'input[name="to"]', cc: 'input[name="cc"]', bcc: 'input[name="bcc"]' },
  // Recipient chips; the row they sit in carries the field name in an aria-label ("To", "Cc", "Bcc")
  recipientChip: '[data-hovercard-id][email], span[email], div[data-hovercard-id]',
  recipientRow: 'div[name], tr, div.aoD',
  // "Message sent" toast with its "View message" link (param holds the thread id)
  sentToastLink: '#link_vsm',

  // Reading a message
  messageContainer: 'div.adn[data-legacy-message-id], div[data-legacy-message-id]',
  messageHeader: 'div.gE.iv.gt, table.cf.gJ, div.gH',
  messageSender: 'span.gD[email]',
  messageRecipients: 'span.g2[email], span.hb span[email]',
  messageBody: 'div.a3s',
  messageDate: 'span.g3[title], span.g3',
  threadSubject: 'h2.hP',
  threadIdHolder: '[data-legacy-thread-id]',

  // Current account, read from the page title "Inbox (3) - rep@company.com - Gmail"
  accountEmailFromTitle: /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i,
};
