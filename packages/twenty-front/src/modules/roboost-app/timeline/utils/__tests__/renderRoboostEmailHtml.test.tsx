import { renderRoboostEmailHtml } from '@/roboost-app/timeline/utils/renderRoboostEmailHtml';
import { render } from '@testing-library/react';

const renderPart = (node: React.ReactNode) =>
  render(<div>{node}</div>).container;

describe('renderRoboostEmailHtml', () => {
  it('keeps formatting and safe links but never scripts, handlers or styles', () => {
    const { main } = renderRoboostEmailHtml(
      '<html><head><style>body{color:red}</style></head><body>' +
        '<p style="color:#000">Dear <b>Marwan</b>,</p>' +
        '<a href="https://getsira.ai" onclick="steal()">site</a>' +
        '<a href="javascript:alert(1)">bad</a>' +
        '<script>alert(1)</script><img src="x" onerror="alert(1)">' +
        '</body></html>',
    );
    const container = renderPart(main);

    expect(container.querySelector('b')?.textContent).toBe('Marwan');
    expect(container.querySelector('p')?.getAttribute('style')).toBeNull();
    const links = container.querySelectorAll('a');

    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('https://getsira.ai');
    expect(links[0].getAttribute('onclick')).toBeNull();
    expect(container.textContent).toContain('bad');
    expect(container.querySelector('script, img')).toBeNull();
    expect(container.textContent).not.toContain('color:red');
  });

  it('moves an Outlook reply header and everything after it behind the quote', () => {
    const { main, quoted } = renderRoboostEmailHtml(
      '<div>Please schedule the meeting tomorrow.</div>' +
        '<div id="appendonsend"></div><hr>' +
        '<div id="divRplyFwdMsg"><b>From:</b> Marwan</div><div>Earlier message</div>',
    );

    expect(renderPart(main).textContent).toBe(
      'Please schedule the meeting tomorrow.',
    );
    expect(renderPart(main).querySelector('hr')).toBeNull();
    expect(renderPart(quoted).textContent).toContain('Earlier message');
  });

  it('splits at a Gmail quote', () => {
    const { main, quoted } = renderRoboostEmailHtml(
      '<div>No worries at all.</div><div class="x_gmail_quote">On Sun wrote:<blockquote>Old</blockquote></div>',
    );

    expect(renderPart(main).textContent).toBe('No worries at all.');
    expect(renderPart(quoted).textContent).toContain('Old');
  });

  it('drops images that need a HubSpot login', () => {
    const { main } = renderRoboostEmailHtml(
      '<img src="https://api-na1.hubspot.com/filemanager/api/v2/files/1/signed-url-redirect">' +
        '<img src="https://cdn2.hubspot.net/icon.png" alt="phone" width="18">',
    );
    const images = renderPart(main).querySelectorAll('img');

    expect(images).toHaveLength(1);
    expect(images[0].getAttribute('alt')).toBe('phone');
  });
});
