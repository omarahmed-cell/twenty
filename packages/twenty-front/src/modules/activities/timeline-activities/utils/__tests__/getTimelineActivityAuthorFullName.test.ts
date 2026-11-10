import { type TimelineActivity } from '@/activities/timeline-activities/types/TimelineActivity';
import { getTimelineActivityAuthorFullName } from '@/activities/timeline-activities/utils/getTimelineActivityAuthorFullName';

describe('getTimelineActivityAuthorFullName', () => {
  it('should return the full name of the workspace member who authored the event', () => {
    const event = {
      workspaceMember: {
        id: '123',
        name: {
          firstName: 'John',
          lastName: 'Doe',
        },
      },
    };

    expect(getTimelineActivityAuthorFullName(event as TimelineActivity)).toBe(
      'John Doe',
    );
  });

  it('should skip an empty last name', () => {
    const event = {
      workspaceMember: {
        id: '456',
        name: {
          firstName: 'Jane',
          lastName: '',
        },
      },
    };

    expect(getTimelineActivityAuthorFullName(event as TimelineActivity)).toBe(
      'Jane',
    );
  });

  it('should fall back to the record creator name without a workspace member', () => {
    expect(
      getTimelineActivityAuthorFullName({} as TimelineActivity, 'Marwan Mansi'),
    ).toBe('Marwan Mansi');
  });

  it('should prefer the workspace member over the record creator name', () => {
    const event = {
      workspaceMember: {
        id: '789',
        name: { firstName: 'John', lastName: 'Doe' },
      },
    };

    expect(
      getTimelineActivityAuthorFullName(
        event as TimelineActivity,
        'Marwan Mansi',
      ),
    ).toBe('John Doe');
  });

  it('should return "Twenty" if the workspace member is not defined', () => {
    expect(getTimelineActivityAuthorFullName({} as TimelineActivity)).toBe(
      'Twenty',
    );
  });
});
