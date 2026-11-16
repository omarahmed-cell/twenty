import { plural, t } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';

// Null means nothing uses it, so deleting is allowed; an unknown count blocks until it loads
export const getDealsInUseBlockedMessage = ({
  dealCount,
  kind,
}: {
  dealCount: number | null | undefined;
  kind: 'pipeline' | 'stage';
}): string | null => {
  if (!isDefined(dealCount)) {
    return t`Counting deals…`;
  }

  if (dealCount === 0) {
    return null;
  }

  return kind === 'pipeline'
    ? plural(dealCount, {
        one: '# deal uses this pipeline. Move it to another pipeline first.',
        other:
          '# deals use this pipeline. Move them to another pipeline first.',
      })
    : plural(dealCount, {
        one: '# deal is in this stage. Move it to another stage first.',
        other: '# deals are in this stage. Move them to another stage first.',
      });
};
