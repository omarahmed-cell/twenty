import { styled } from '@linaria/react';
import Linkify from 'linkify-react';
import { isFieldValueRestricted } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

import { EventCardMessageBodyNotShared } from '@/activities/timeline-activities/rows/message/components/EventCardMessageBodyNotShared';

const StyledSnippet = styled.div<{ lineClamp: number }>`
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${({ lineClamp }) => lineClamp};
  color: ${themeCssVariables.font.color.secondary};
  display: -webkit-box;
  overflow: hidden;
  overflow-wrap: anywhere;
  white-space: normal;
`;

const StyledFullBody = styled.div`
  color: ${themeCssVariables.font.color.primary};
  overflow-wrap: anywhere;
  white-space: pre-line;

  a {
    color: ${themeCssVariables.font.color.primary};
    text-decoration: underline;
  }
`;

type EventCardMessageBodyProps = {
  body: string;
  isOpen: boolean;
  snippetLineClamp?: number;
  notSharedByFullName: string;
};

export const EventCardMessageBody = ({
  body,
  isOpen,
  snippetLineClamp = 2,
  notSharedByFullName,
}: EventCardMessageBodyProps) => {
  if (isFieldValueRestricted(body)) {
    return (
      <EventCardMessageBodyNotShared
        notSharedByFullName={notSharedByFullName}
      />
    );
  }

  if (!isOpen) {
    return (
      <StyledSnippet lineClamp={snippetLineClamp}>
        {body.replace(/\s+/g, ' ').trim()}
      </StyledSnippet>
    );
  }

  return (
    <StyledFullBody>
      <Linkify options={{ target: '_blank', rel: 'noopener noreferrer' }}>
        {body}
      </Linkify>
    </StyledFullBody>
  );
};
