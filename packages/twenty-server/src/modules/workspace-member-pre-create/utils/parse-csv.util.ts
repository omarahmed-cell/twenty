// RFC 4180 subset: quoted fields with doubled quotes, commas and line breaks inside quotes, CRLF or LF rows
const parseCsvRecords = (content: string): string[][] => {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let isInQuotes = false;

  for (let index = 0; index < content.length; index++) {
    const character = content[index];

    if (isInQuotes) {
      if (character === '"' && content[index + 1] === '"') {
        field += '"';
        index++;
      } else if (character === '"') {
        isInQuotes = false;
      } else {
        field += character;
      }

      continue;
    }

    if (character === '"') {
      isInQuotes = true;
    } else if (character === ',') {
      record.push(field);
      field = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && content[index + 1] === '\n') {
        index++;
      }

      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (field !== '' || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  return records.filter((cells) => cells.some((cell) => cell.trim() !== ''));
};

export const parseCsvRows = (content: string): Record<string, string>[] => {
  const [headerCells, ...valueRows] = parseCsvRecords(content.replace(/^﻿/, ''));

  if (headerCells === undefined) {
    return [];
  }

  const headers = headerCells.map((header) => header.trim().toLowerCase());

  return valueRows.map((cells) =>
    Object.fromEntries(
      headers.map((header, index) => [header, (cells[index] ?? '').trim()]),
    ),
  );
};
