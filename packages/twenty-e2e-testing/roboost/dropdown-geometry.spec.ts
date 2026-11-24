import { expect, type Locator, type Page, test } from '@playwright/test';

// Measured placement of every Roboost list and panel. Only CC Test records are opened, and every
// editor is closed with Escape, so nothing is saved.
const CC_TEST_CONTACT_ID = '294bec3a-5df7-46ab-8152-0d79b36c5203';
const CC_TEST_COMPANY_ID = 'e40d2561-00ad-4139-b52a-141544a4f676';
const CC_TEST_CONTACT_NAME = 'CC Test Contact';

const GAP_MIN = 2;
const GAP_MAX = 12;
const CARET_CORNER = 16;
const CARET_HALF = 5;

type Box = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

type CaseResult = { name: string; problems: string[]; numbers: string };

const toBox = (rect: {
  x: number;
  y: number;
  width: number;
  height: number;
}): Box => ({
  left: rect.x,
  top: rect.y,
  right: rect.x + rect.width,
  bottom: rect.y + rect.height,
  width: rect.width,
  height: rect.height,
});

const boxOf = async (locator: Locator): Promise<Box | null> => {
  if ((await locator.count()) === 0) {
    return null;
  }
  const rect = await locator.first().boundingBox();

  return rect === null ? null : toBox(rect);
};

const intersects = (first: Box, second: Box) =>
  first.left < second.right - 0.5 &&
  first.right > second.left + 0.5 &&
  first.top < second.bottom - 0.5 &&
  first.bottom > second.top + 0.5;

const round = (value: number) => Math.round(value);
const describeBox = (box: Box | null) =>
  box === null
    ? 'none'
    : `${round(box.left)},${round(box.top)},${round(box.right)},${round(box.bottom)}`;

const applyUiScale = async (page: Page, uiScale: number) => {
  if (uiScale !== 1) {
    await page.addStyleTag({
      content: `:root { --t-scale-user: ${uiScale} !important; }`,
    });
  }
};

// Editors that are not floating must sit inside their cell or field: never a second box elsewhere
const countStrayEditorBoxes = (page: Page) =>
  page.evaluate(
    () =>
      [...document.querySelectorAll('.rb-cell-editor')].filter((editor) => {
        const rect = editor.getBoundingClientRect();

        return (
          rect.width > 0 &&
          editor.closest('.rb-floating') === null &&
          !editor.classList.contains('is-in-cell') &&
          !editor.classList.contains('is-inline-dropdown')
        );
      }).length,
  );

const measurePanel = async ({
  page,
  name,
  trigger,
  avoid = [],
  layerCount = 1,
}: {
  page: Page;
  name: string;
  trigger: Locator;
  avoid?: [string, Locator][];
  layerCount?: number;
}): Promise<CaseResult> => {
  const layers = page.locator('.rb-floating');

  await layers
    .nth(layerCount - 1)
    .waitFor({ state: 'visible', timeout: 15_000 })
    .catch(() => undefined);
  await page.waitForTimeout(350);

  const problems: string[] = [];
  const layer = layers.nth(layerCount - 1);
  const panel = await boxOf(layer.locator('> .rb-floating-panel'));
  const caret = await boxOf(layer.locator('> .rb-floating-arrow'));
  const triggerBox = await boxOf(trigger);
  const side = await layer.getAttribute('data-side').catch(() => null);
  const viewport = page.viewportSize() ?? { width: 0, height: 0 };
  const visibleLayers = await layers.count();

  if (visibleLayers !== layerCount) {
    problems.push(`${visibleLayers} open panels, expected ${layerCount}`);
  }
  if ((await countStrayEditorBoxes(page)) > 0) {
    problems.push('a second editor box is visible');
  }

  if (panel === null || triggerBox === null) {
    problems.push(panel === null ? 'no panel' : 'no trigger');

    return { name, problems, numbers: '' };
  }

  if (side === 'top') {
    const gap = triggerBox.top - panel.bottom;

    if (gap < GAP_MIN || gap > GAP_MAX) {
      problems.push(`gap above ${round(gap)}`);
    }
    if (viewport.height - triggerBox.bottom - GAP_MAX >= panel.height) {
      problems.push('opened above although there was room below');
    }
  } else {
    const gap = panel.top - triggerBox.bottom;

    if (gap < GAP_MIN || gap > GAP_MAX) {
      problems.push(`gap ${round(gap)}`);
    }
  }

  const triggerCentre = (triggerBox.left + triggerBox.right) / 2;
  const caretCentre =
    caret === null ? Number.NaN : (caret.left + caret.right) / 2;
  const isAligned =
    Math.abs(panel.left - triggerBox.left) <= 2 ||
    Math.abs(panel.right - triggerBox.right) <= 2 ||
    Math.abs(caretCentre - triggerCentre) <= 4;

  if (!isAligned) {
    problems.push(
      `not aligned (panel ${round(panel.left)}, trigger ${round(triggerBox.left)})`,
    );
  }

  for (const [label, box] of [
    ['trigger', triggerBox] as const,
    ...(await Promise.all(
      avoid.map(async ([label, locator]) => [label, await boxOf(locator)] as const),
    )),
  ]) {
    if (box !== null && intersects(panel, box)) {
      problems.push(`covers ${label}`);
    }
  }

  if (
    panel.left < -0.5 ||
    panel.top < -0.5 ||
    panel.right > viewport.width + 0.5 ||
    panel.bottom > viewport.height + 0.5
  ) {
    problems.push('outside the viewport');
  }

  if (caret === null) {
    problems.push('no caret');
  } else {
    const expectedCaret = Math.min(
      Math.max(triggerCentre, panel.left + CARET_CORNER + CARET_HALF),
      panel.right - CARET_CORNER - CARET_HALF,
    );
    const caretEdge = (caret.top + caret.bottom) / 2;
    const panelEdge = side === 'top' ? panel.bottom : panel.top;

    if (Math.abs(caretCentre - expectedCaret) > 4) {
      problems.push(
        `caret at ${round(caretCentre)}, expected ${round(expectedCaret)}`,
      );
    }
    if (Math.abs(caretEdge - panelEdge) > 3) {
      problems.push('caret not on the edge facing the trigger');
    }
  }

  return {
    name,
    problems,
    numbers: `T ${describeBox(triggerBox)} P ${describeBox(panel)} C ${describeBox(caret)} side ${side}`,
  };
};

const report = (results: CaseResult[]) => {
  for (const result of results) {
    console.log(
      `${result.problems.length === 0 ? 'PASS' : 'FAIL'} ${result.name}${result.problems.length > 0 ? ` (${result.problems.join('; ')})` : ''} :: ${result.numbers}`,
    );
  }
  const failures = results.filter((result) => result.problems.length > 0);

  expect(
    failures.map((failure) => `${failure.name}: ${failure.problems.join('; ')}`),
  ).toEqual([]);
};

const closeOpenEditor = async (page: Page) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    if ((await page.locator('.rb-floating, td.is-cell-editing').count()) === 0) {
      return;
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
  }
  await page.mouse.click(2, 2);
  await page.waitForTimeout(250);
};

const propertyRow = (page: Page, label: string) =>
  page
    .locator('.rb-prop', {
      has: page.locator('.rb-prop-label', { hasText: new RegExp(`^${label}$`) }),
    })
    .first();

// Puts the field at a fraction of the left column's height, so lists are checked near the top,
// in the middle and near the bottom of the screen
const placeInColumn = async (row: Locator, fraction: number) =>
  row.evaluate((element, position) => {
    let scroller = element.parentElement;

    while (
      scroller !== null &&
      !(
        scroller.scrollHeight > scroller.clientHeight + 2 &&
        /auto|scroll/.test(getComputedStyle(scroller).overflowY)
      )
    ) {
      scroller = scroller.parentElement;
    }
    if (scroller === null) {
      element.scrollIntoView({ block: 'center' });

      return;
    }
    const scrollerRect = scroller.getBoundingClientRect();
    const rowRect = element.getBoundingClientRect();
    const target = scrollerRect.top + scrollerRect.height * position;

    scroller.scrollTop += rowRect.top - target;
  }, fraction);

const checkRecordField = async ({
  page,
  name,
  label,
}: {
  page: Page;
  name: string;
  label: string;
}) => {
  const row = propertyRow(page, label);

  if ((await row.count()) === 0) {
    return { name, problems: [`field "${label}" not on the page`], numbers: '' };
  }
  await row.click();
  await page.waitForTimeout(400);

  // Lists hang under the whole field; a relation's list hangs under the value box that replaced the value
  // Every list hangs under the whole field (label and value), relations included
  const trigger = row;
  const result = await measurePanel({
    page,
    name,
    trigger,
    avoid: [
      ['field label', row.locator('.rb-prop-label')],
      ['field value', row.locator('.rb-prop-value')],
    ],
  });

  await closeOpenEditor(page);

  return result;
};

const openRecord = async (page: Page, path: string, uiScale: number) => {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.rb-prop', { timeout: 600_000 });
  await applyUiScale(page, uiScale);
  await page.waitForTimeout(2500);
};

// The toolbar shifts while the view loads; measure only once it stops moving
const waitForStableBox = async (locator: Locator) => {
  let previous = '';

  for (let attempt = 0; attempt < 20; attempt++) {
    const current = describeBox(await boxOf(locator));

    if (current === previous && current !== 'none') {
      return;
    }
    previous = current;
    await locator.page().waitForTimeout(500);
  }
};

const openList = async (page: Page, path: string, uiScale: number) => {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.rb-cell', { timeout: 600_000 });
  await applyUiScale(page, uiScale);
  await page.waitForTimeout(2500);
};

const uiScaleOf = (metadata: Record<string, unknown>) =>
  typeof metadata.uiScale === 'number' ? metadata.uiScale : 1;

test('record page fields', async ({ page }, testInfo) => {
  const uiScale = uiScaleOf(testInfo.project.metadata);
  const results: CaseResult[] = [];
  const positions: [string, number][] = [
    ['top', 0.12],
    ['middle', 0.5],
    ['bottom', 0.85],
  ];

  await openRecord(page, `/object/person/${CC_TEST_CONTACT_ID}`, uiScale);
  for (const field of ['Lifecycle Stage', 'Company', 'Contact owner']) {
    for (const [positionName, fraction] of positions) {
      const row = propertyRow(page, field);

      if ((await row.count()) === 0) {
        results.push({
          name: `contact ${field}`,
          problems: ['field not on the page'],
          numbers: '',
        });
        break;
      }
      await placeInColumn(row, fraction);
      await page.waitForTimeout(300);
      results.push(
        await checkRecordField({
          page,
          name: `contact ${field} (${positionName} of column)`,
          label: field,
        }),
      );
    }
  }

  await openRecord(page, `/object/company/${CC_TEST_COMPANY_ID}`, uiScale);
  for (const [positionName, fraction] of positions) {
    const row = propertyRow(page, 'Uses Aggregators');

    await placeInColumn(row, fraction);
    await page.waitForTimeout(300);
    results.push(
      await checkRecordField({
        page,
        name: `company Uses Aggregators multi-select (${positionName} of column)`,
        label: 'Uses Aggregators',
      }),
    );
  }

  report(results);
});

const columnIndex = (page: Page, header: string) =>
  page.evaluate((name) => {
    const headers = [...document.querySelectorAll('thead th')];

    return headers.findIndex(
      (th) => (th as HTMLElement).innerText.trim().toLowerCase() === name.toLowerCase(),
    );
  }, header);

const tableScroller = (page: Page) =>
  page.evaluateHandle(() => {
    const table = document.querySelector('thead')?.closest('table');
    let scroller = table?.parentElement ?? null;

    while (
      scroller !== null &&
      !(scroller.scrollWidth > scroller.clientWidth + 2)
    ) {
      scroller = scroller.parentElement;
    }

    return scroller;
  });

const setTableScroll = async (
  page: Page,
  horizontal: 'left' | 'middle' | 'right',
) => {
  const scroller = await tableScroller(page);

  await scroller.evaluate((element, position) => {
    if (element === null) {
      return;
    }
    const max = element.scrollWidth - element.clientWidth;

    element.scrollLeft =
      position === 'left' ? 0 : position === 'middle' ? max / 2 : max;
  }, horizontal);
  await page.waitForTimeout(300);
};

const isCellVisible = (cell: Locator) =>
  cell.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const scroller = element.closest('table')?.parentElement;
    let clip = scroller ?? null;

    while (clip !== null && !(clip.scrollWidth > clip.clientWidth + 2)) {
      clip = clip.parentElement;
    }
    const bounds = clip?.getBoundingClientRect() ?? {
      left: 0,
      right: innerWidth,
      top: 0,
      bottom: innerHeight,
    };

    return (
      rect.left >= bounds.left - 1 &&
      rect.right <= bounds.right + 1 &&
      rect.top >= bounds.top - 1 &&
      rect.bottom <= Math.min(bounds.bottom, innerHeight) + 1
    );
  });

type TableCase = {
  header: string;
  kind: 'list' | 'relation' | 'in-place';
};

const checkTableCell = async ({
  page,
  name,
  row,
  header,
  kind,
}: {
  page: Page;
  name: string;
  row: Locator;
  header: string;
  kind: TableCase['kind'];
}): Promise<CaseResult | null> => {
  const index = await columnIndex(page, header);

  if (index < 0) {
    return { name, problems: [`column "${header}" not in the view`], numbers: '' };
  }
  const cell = row.locator('td').nth(index);

  if (!(await isCellVisible(cell))) {
    return null;
  }
  await cell.locator('.rb-cell').first().dispatchEvent('pointerdown', {
    button: 0,
  });
  await page.waitForTimeout(500);

  if (kind === 'in-place') {
    const problems: string[] = [];
    const cellBox = await boxOf(cell);
    const inputBox = await boxOf(cell.locator('input').first());

    if (!(await cell.evaluate((td) => td.classList.contains('is-cell-editing')))) {
      problems.push('cell not outlined');
    }
    if ((await page.locator('.rb-floating').count()) > 0) {
      problems.push('a panel opened over the table');
    }
    if ((await countStrayEditorBoxes(page)) > 0) {
      problems.push('a second editor box is visible');
    }
    if (
      cellBox === null ||
      inputBox === null ||
      inputBox.left < cellBox.left - 1 ||
      inputBox.right > cellBox.right + 1 ||
      inputBox.top < cellBox.top - 1 ||
      inputBox.bottom > cellBox.bottom + 1
    ) {
      problems.push('input not inside the cell');
    }
    await closeOpenEditor(page);

    return {
      name,
      problems,
      numbers: `cell ${describeBox(cellBox)} input ${describeBox(inputBox)}`,
    };
  }

  const result = await measurePanel({
    page,
    name,
    trigger: cell,
    avoid: [],
  });

  if (
    !(await cell.evaluate((td) => td.classList.contains('is-cell-editing')))
  ) {
    result.problems.push('cell not outlined');
  }
  const panelWidth = (await boxOf(page.locator('.rb-floating-panel').last()))
    ?.width;
  const cellWidth = (await boxOf(cell))?.width;
  const zoom = await page.evaluate(
    () => Number.parseFloat(getComputedStyle(document.documentElement).zoom) || 1,
  );

  if (
    panelWidth !== undefined &&
    cellWidth !== undefined &&
    panelWidth + 1 < Math.max(cellWidth, 240 * zoom)
  ) {
    result.problems.push(
      `panel ${round(panelWidth)} narrower than max(cell ${round(cellWidth)}, 240)`,
    );
  }
  await closeOpenEditor(page);

  return result;
};

const PEOPLE_TABLE_CASES: TableCase[] = [
  { header: 'Job Title Dropdown', kind: 'list' },
  { header: 'Company', kind: 'relation' },
  { header: 'Customer Success Responsible', kind: 'relation' },
  { header: 'Job Title', kind: 'in-place' },
];

const COMPANY_TABLE_CASES: TableCase[] = [
  { header: 'Uses Aggregators', kind: 'list' },
  { header: 'Uses 3PLs', kind: 'list' },
  { header: 'No. of Branches', kind: 'in-place' },
];

const runTableCases = async (
  page: Page,
  rowText: string,
  cases: TableCase[],
  results: CaseResult[],
  label: string,
) => {
  const missing = new Set(cases.map(({ header }) => header));

  for (const horizontal of ['left', 'middle', 'right'] as const) {
    await setTableScroll(page, horizontal);
    const row = page.locator('tbody tr', { hasText: rowText }).first();

    for (const { header, kind } of cases) {
      const result = await checkTableCell({
        page,
        name: `${label} table ${header} (${kind}, scrolled ${horizontal})`,
        row,
        header,
        kind,
      });

      if (result !== null) {
        missing.delete(header);
        results.push(result);
      }
    }
  }

  // Columns never visible at the three positions are brought into view once
  for (const header of missing) {
    const kind = cases.find((item) => item.header === header)?.kind ?? 'list';
    const index = await columnIndex(page, header);

    if (index < 0) {
      results.push({
        name: `${label} table ${header}`,
        problems: ['column not in the view'],
        numbers: '',
      });
      continue;
    }
    const row = page.locator('tbody tr', { hasText: rowText }).first();

    await row.locator('td').nth(index).scrollIntoViewIfNeeded();
    const result = await checkTableCell({
      page,
      name: `${label} table ${header} (${kind}, scrolled to column)`,
      row,
      header,
      kind,
    });

    if (result !== null) {
      results.push(result);
    }
  }
};

test('table cells', async ({ page }, testInfo) => {
  const uiScale = uiScaleOf(testInfo.project.metadata);
  const results: CaseResult[] = [];

  await openList(page, '/objects/people', uiScale);
  await runTableCases(
    page,
    CC_TEST_CONTACT_NAME,
    PEOPLE_TABLE_CASES,
    results,
    'contacts',
  );

  // Vertically scrolled: a lower row, opened and closed with Escape only
  await setTableScroll(page, 'left');
  const lowerRow = page.locator('tbody tr').nth(8);

  if ((await lowerRow.count()) > 0) {
    await lowerRow.scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(400);
    const result = await checkTableCell({
      page,
      name: 'contacts table Company (relation, vertically scrolled)',
      row: lowerRow,
      header: 'Company',
      kind: 'relation',
    });

    if (result !== null) {
      results.push(result);
    }
  }

  await openList(page, '/objects/companies', uiScale);
  await runTableCases(
    page,
    'CC Test Company',
    COMPANY_TABLE_CASES,
    results,
    'companies',
  );

  report(results);
});

test('toolbar and timeline panels', async ({ page }, testInfo) => {
  const uiScale = uiScaleOf(testInfo.project.metadata);
  const results: CaseResult[] = [];

  await openList(page, '/objects/people', uiScale);
  await waitForStableBox(page.getByRole('button', { name: /^Sort/ }).first());
  const sortButton = page.getByRole('button', { name: /^Sort/ }).first();
  const filterButton = page.getByRole('button', { name: /^Filter/ }).first();
  const toolbarNeighbours: [string, Locator][] = [
    ['Filter button', filterButton],
    ['Sort button', sortButton],
  ];

  await sortButton.click();
  results.push(
    await measurePanel({
      page,
      name: 'Sort panel',
      trigger: sortButton,
      avoid: toolbarNeighbours,
    }),
  );
  const sortField = page.locator('.rb-sort-box-field').first();

  if ((await sortField.count()) > 0) {
    await sortField.locator('button').first().click();
    results.push(
      await measurePanel({
        page,
        name: 'Sort property list',
        trigger: sortField,
        layerCount: 2,
      }),
    );
  }
  await closeOpenEditor(page);

  const chips = page.locator('.rb-chip[aria-haspopup="menu"]');
  const chipCount = Math.min(await chips.count(), 4);

  for (let index = 0; index < chipCount; index++) {
    const chip = chips.nth(index);
    if (!(await chip.isVisible())) {
      continue;
    }
    const chipName = ((await chip.textContent()) ?? '').trim().slice(0, 30);

    await chip.click();
    results.push(
      await measurePanel({
        page,
        name: `quick filter chip "${chipName}"`,
        trigger: chip,
        avoid: [
          ['Filter button', filterButton],
          ['Sort button', sortButton],
        ],
      }),
    );
    await closeOpenEditor(page);
  }

  const columnMenuButton = page.locator('thead th .rb-th-menu-btn').nth(2);

  await columnMenuButton.locator('xpath=ancestor::th[1]').hover();
  await columnMenuButton.click();
  results.push(
    await measurePanel({
      page,
      name: 'column menu',
      trigger: columnMenuButton,
    }),
  );
  await closeOpenEditor(page);

  const advanced = page.getByRole('button', { name: /^Advanced filters/ });

  if ((await advanced.count()) > 0) {
    const toolbarBefore = await boxOf(sortButton);

    await advanced.first().click();
    await page.waitForTimeout(600);
    const sidePanel = await boxOf(page.locator('.rb-afp, .rb-side-panel').first());

    results.push({
      name: 'Advanced filters panel',
      problems:
        sidePanel !== null &&
        toolbarBefore !== null &&
        intersects(sidePanel, toolbarBefore)
          ? ['covers the toolbar']
          : [],
      numbers: `panel ${describeBox(sidePanel)}`,
    });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  await openRecord(page, `/object/person/${CC_TEST_CONTACT_ID}`, uiScale);
  const activityChips = page.locator('.rb-acol .rb-chip, .rb-activity-filters .rb-chip');
  const timelineChips =
    (await activityChips.count()) > 0 ? activityChips : page.locator('.rb-chip');
  const timelineChipCount = Math.min(await timelineChips.count(), 4);
  const chipBoxes: [string, Locator][] = [];

  for (let index = 0; index < timelineChipCount; index++) {
    chipBoxes.push([`chip ${index + 1}`, timelineChips.nth(index)]);
  }
  for (let index = 0; index < timelineChipCount; index++) {
    const chip = timelineChips.nth(index);
    if (!(await chip.isVisible())) {
      continue;
    }
    const chipName = ((await chip.textContent()) ?? '').trim().slice(0, 30);

    await chip.click();
    results.push(
      await measurePanel({
        page,
        name: `activity filter "${chipName}"`,
        trigger: chip,
        avoid: chipBoxes.filter((_, other) => other !== index),
      }),
    );
    await closeOpenEditor(page);
  }

  const actionsButton = page.getByRole('button', { name: /^Actions/ }).nth(1);

  if ((await actionsButton.count()) > 0) {
    await actionsButton.click();
    results.push(
      await measurePanel({
        page,
        name: 'card Actions menu',
        trigger: actionsButton,
      }),
    );
    await closeOpenEditor(page);
  }

  const meetingButton = page
    .locator('button', { hasText: /^Meeting$/ })
    .first();

  if ((await meetingButton.count()) === 0) {
    results.push({
      name: 'meeting scheduler',
      problems: ['no Meeting button on the record page'],
      numbers: '',
    });
  } else {
    await meetingButton.click();
    results.push(
      await measurePanel({
        page,
        name: 'Meeting button menu',
        trigger: meetingButton,
      }),
    );
    await page
      .locator('.rb-floating [role="menuitem"]', { hasText: /Schedule/ })
      .first()
      .click();
    await page.waitForTimeout(2500);
    const scheduler = page.locator('.rb-mtg-pop').last();
    const pickers = scheduler.locator('.rb-select-trigger');
    const pickerCount = Math.min(await pickers.count(), 3);

    for (let index = 0; index < pickerCount; index++) {
      const picker = pickers.nth(index);

      if (!(await picker.isVisible())) {
        continue;
      }
      const anchor = picker.locator('xpath=..');

      await picker.click();
      results.push(
        await measurePanel({
          page,
          name: `meeting scheduler picker ${index + 1}`,
          trigger: anchor,
        }),
      );
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    if (pickerCount === 0) {
      results.push({
        name: 'meeting scheduler',
        problems: ['no pickers found in the scheduler'],
        numbers: '',
      });
    }
  }

  report(results);
});
