import { getActorSourceIcon } from '@/ui/field/display/utils/getActorSourceIcon';
import { IconFileText, IconListCheck } from 'twenty-ui/icon';

describe('getActorSourceIcon', () => {
  it('gives the Forms and Document app sources their icons', () => {
    expect(getActorSourceIcon({ source: 'FORMS' })).toBe(IconListCheck);
    expect(getActorSourceIcon({ source: 'DOCUMENT_APP' })).toBe(IconFileText);
  });
});
