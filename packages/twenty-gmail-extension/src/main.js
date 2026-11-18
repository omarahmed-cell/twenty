(() => {
  const S = window.RoboostGmailSelectors;
  let scheduled = false;

  const scan = () => {
    scheduled = false;

    for (const body of document.querySelectorAll(S.composeBody)) {
      window.RoboostCompose.attach(body);
    }

    for (const container of document.querySelectorAll(S.messageContainer)) {
      window.RoboostReading.attach(container);
    }

    window.RoboostSidePanel.refresh();
  };

  const schedule = () => {
    if (!scheduled) {
      scheduled = true;
      setTimeout(scan, 400);
    }
  };

  window.RoboostSidePanel.mount();
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('hashchange', schedule);
  schedule();
})();
