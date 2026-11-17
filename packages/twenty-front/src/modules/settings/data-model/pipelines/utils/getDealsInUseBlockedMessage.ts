import { plural, t } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';

// Null means nothing uses it, so deleting is allowed; an unknown count blocks until it loads
export const getDealsInUseBlockedMessage = ({
  dealCount,
  kind,
  isDealPipeline = true,
}: {
  dealCount: number | null | undefined;
  kind: 'pipeline' | 'stage';
  isDealPipeline?: boolean;
}): string | null => {
  if (!isDefined(dealCount)) {
    return isDealPipeline ? t`Counting deals…` : t`Counting records…`;
  }

  if (dealCount === 0) {
    return null;
  }

  if (!isDealPipeline) {
    return kind === 'pipeline'
      ? plural(dealCount, {
          one: '# record uses this pipeline. Move it to another pipeline first.',
          other:
            '# records use this pipeline. Move them to another pipeline first.',
        })
      : plural(dealCount, {
          one: '# record is in this stage. Move it to another stage first.',
          other:
            '# records are in this stage. Move them to another stage first.',
        });
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
