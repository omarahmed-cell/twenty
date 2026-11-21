import { Avatar } from '@/roboost-ui/components/Avatar';
import { Button } from '@/roboost-ui/components/Button';
import { Tag } from '@/roboost-ui/components/Tag';
import { type RoboostAvatarTone } from '@/roboost-ui/types/RoboostAvatarTone';
import { type RoboostTone } from '@/roboost-ui/types/RoboostTone';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { Fragment, type ReactNode } from 'react';

export type RecordField = { label: ReactNode; value: ReactNode };

export type RecordCardProps = {
  name: string;
  subtitle?: ReactNode;
  avatar?: string;
  avatarTone?: RoboostAvatarTone;
  status?: { tone: RoboostTone; label: ReactNode };
  fields?: RecordField[];
  actions?: ReactNode;
  onMore?: () => void;
  className?: string;
};

export const RecordCard = ({
  name,
  subtitle,
  avatar,
  avatarTone,
  status,
  fields = [],
  actions,
  onMore,
  className,
}: RecordCardProps) => {
  const { t } = useLingui();

  return (
    <div className={cx('rb-record', className)}>
      <div className="rb-record-head">
        <Avatar name={name} src={avatar} size="lg" tone={avatarTone} />
        <div className="rb-record-title">
          <span className="rb-record-name">{name}</span>
          {subtitle !== undefined && (
            <span className="rb-record-sub">{subtitle}</span>
          )}
          {status !== undefined && (
            <span style={{ marginTop: 6 }}>
              <Tag tone={status.tone} dot>
                {status.label}
              </Tag>
            </span>
          )}
        </div>
        {onMore !== undefined && (
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon="more"
            aria-label={t`More`}
            onClick={onMore}
          />
        )}
      </div>
      {fields.length > 0 && (
        <dl className="rb-record-fields">
          {fields.map((field, index) => (
            <Fragment key={index}>
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </Fragment>
          ))}
        </dl>
      )}
      {actions !== undefined && <div className="rb-record-foot">{actions}</div>}
    </div>
  );
};
