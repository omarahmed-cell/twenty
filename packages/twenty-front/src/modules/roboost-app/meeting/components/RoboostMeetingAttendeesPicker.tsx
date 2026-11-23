import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Popover } from '@/roboost-ui/components/Popover';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export type RoboostMeetingAttendeeDraft = {
  email: string;
  displayName: string | null;
  personId?: string | null;
  workspaceMemberId?: string | null;
};

type RoboostMeetingAttendeesPickerProps = {
  attendees: RoboostMeetingAttendeeDraft[];
  onChange: (attendees: RoboostMeetingAttendeeDraft[]) => void;
  allowGuests: boolean;
};

const CONTACTS_PAGE_SIZE = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PersonRecord = {
  __typename: string;
  id: string;
  name?: { firstName?: string | null; lastName?: string | null } | null;
  emails?: { primaryEmail?: string | null } | null;
};

const fullName = (
  name:
    | { firstName?: string | null; lastName?: string | null }
    | null
    | undefined,
) => [name?.firstName, name?.lastName].filter(isNonEmptyString).join(' ');

// HubSpot-style: search box, CRM contacts with email, then workspace users; any typed email can join as a guest
export const RoboostMeetingAttendeesPicker = ({
  attendees,
  onChange,
  allowGuests,
}: RoboostMeetingAttendeesPickerProps) => {
  const { t } = useLingui();
  const [search, setSearch] = useState('');
  const [contactsLimit, setContactsLimit] = useState(CONTACTS_PAGE_SIZE);
  const currentWorkspaceMembers = useAtomStateValue(
    currentWorkspaceMembersState,
  );
  const term = search.trim();
  const termLower = term.toLowerCase();

  const filter: RecordGqlOperationFilter = {
    and: [
      { emails: { primaryEmail: { neq: '' } } },
      ...(isNonEmptyString(term)
        ? [
            {
              or: [
                { name: { firstName: { ilike: `%${term}%` } } },
                { name: { lastName: { ilike: `%${term}%` } } },
                { emails: { primaryEmail: { ilike: `%${term}%` } } },
              ],
            },
          ]
        : []),
    ],
  };
  const { records, totalCount } = useFindManyRecords<PersonRecord>({
    objectNameSingular: 'person',
    filter,
    limit: contactsLimit,
    recordGqlFields: { id: true, name: true, emails: true },
  });

  const contacts = records.filter((record) =>
    isNonEmptyString(record.emails?.primaryEmail),
  );
  const users = currentWorkspaceMembers.filter((member) =>
    `${fullName(member.name)} ${member.userEmail}`
      .toLowerCase()
      .includes(termLower),
  );
  const selectedEmails = new Set(
    attendees.map((attendee) => attendee.email.toLowerCase()),
  );
  const isGuestEmail =
    allowGuests &&
    EMAIL_PATTERN.test(term) &&
    !selectedEmails.has(termLower) &&
    !contacts.some(
      (contact) => contact.emails?.primaryEmail?.toLowerCase() === termLower,
    ) &&
    !users.some((member) => member.userEmail.toLowerCase() === termLower);

  const toggle = (attendee: RoboostMeetingAttendeeDraft, checked: boolean) =>
    onChange(
      checked
        ? [...attendees, attendee]
        : attendees.filter(
            ({ email }) => email.toLowerCase() !== attendee.email.toLowerCase(),
          ),
    );

  const guests = attendees.filter(
    (attendee) => !attendee.personId && !attendee.workspaceMemberId,
  );

  return (
    <Popover
      ariaLabel={t`Attendees`}
      className="rb-mtg-pick"
      trigger={({ toggle: toggleOpen, isOpen }) => (
        <button
          type="button"
          className="rb-act-inline"
          aria-expanded={isOpen}
          onClick={toggleOpen}
        >
          {attendees.length === 1
            ? t`1 attendee`
            : t`${attendees.length} attendees`}
          <Icon name="caret" size={12} />
        </button>
      )}
    >
      {() => (
        <div className="rb-mtg-pick-body">
          <Input
            variant="search"
            size="sm"
            placeholder={allowGuests ? t`Search or type an email` : t`Search`}
            aria-label={t`Search attendees`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="rb-mtg-pick-list">
            {isGuestEmail && (
              <button
                type="button"
                className="rb-mtg-pick-guest"
                onClick={() => {
                  toggle({ email: term, displayName: null }, true);
                  setSearch('');
                }}
              >
                <Icon name="plus" size={14} />
                {t`Add ${term} as a guest`}
              </button>
            )}
            {guests.length > 0 && (
              <>
                <div className="rb-mtg-pick-section">{t`Guests`}</div>
                {guests.map((guest) => (
                  <label key={guest.email} className="rb-mtg-pick-row">
                    <Checkbox
                      checked
                      onChange={(checked) => toggle(guest, checked)}
                    />
                    <span className="rb-mtg-pick-text">
                      <span>{guest.email}</span>
                    </span>
                  </label>
                ))}
              </>
            )}
            <div className="rb-mtg-pick-section">{t`Contacts`}</div>
            {contacts.map((contact) => {
              const email = contact.emails?.primaryEmail ?? '';
              const name = fullName(contact.name);

              return (
                <label key={contact.id} className="rb-mtg-pick-row">
                  <Checkbox
                    checked={selectedEmails.has(email.toLowerCase())}
                    onChange={(checked) =>
                      toggle(
                        {
                          email,
                          displayName: name || null,
                          personId: contact.id,
                        },
                        checked,
                      )
                    }
                  />
                  <span className="rb-mtg-pick-text">
                    <span>{name || email}</span>
                    <span className="rb-mtg-pick-sub">{email}</span>
                  </span>
                </label>
              );
            })}
            {contacts.length === 0 && (
              <div className="rb-mtg-pick-empty">{t`No contacts match`}</div>
            )}
            {totalCount > contacts.length && (
              <button
                type="button"
                className="rb-link rb-mtg-pick-more"
                onClick={() =>
                  setContactsLimit(contactsLimit + CONTACTS_PAGE_SIZE)
                }
              >
                {t`Load more contacts`}
              </button>
            )}
            <div className="rb-mtg-pick-section">{t`Users`}</div>
            {users.map((member) => (
              <label key={member.id} className="rb-mtg-pick-row">
                <Checkbox
                  checked={selectedEmails.has(member.userEmail.toLowerCase())}
                  onChange={(checked) =>
                    toggle(
                      {
                        email: member.userEmail,
                        displayName: fullName(member.name) || null,
                        workspaceMemberId: member.id,
                      },
                      checked,
                    )
                  }
                />
                <span className="rb-mtg-pick-text">
                  <span>{fullName(member.name) || member.userEmail}</span>
                  <span className="rb-mtg-pick-sub">{member.userEmail}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </Popover>
  );
};
