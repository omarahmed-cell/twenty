import {
  FieldMetadataType,
  ViewFilterOperand as RecordFilterOperand,
} from '@/types';
import {
  type FieldShared,
  turnRecordFilterIntoRecordGqlOperationFilter,
} from '@/utils/filter/turnRecordFilterIntoGqlOperationFilter';

const CURRENT_MEMBER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_MEMBER_ID = '22222222-2222-4222-8222-222222222222';

const dealCollaboratorsField: FieldShared = {
  id: 'f-deal-collaborators',
  name: 'dealCollaborators',
  type: FieldMetadataType.RELATION,
  label: 'Deal collaborators',
  settings: {
    relationType: 'ONE_TO_MANY',
    junctionTargetFieldId: 'f-junction-workspace-member',
  },
};

const junctionWorkspaceMemberField: FieldShared = {
  id: 'f-junction-workspace-member',
  name: 'workspaceMember',
  type: FieldMetadataType.RELATION,
  label: 'Workspace Member',
};

const fieldMetadataItemById = new Map(
  [dealCollaboratorsField, junctionWorkspaceMemberField].map((field) => [
    field.id,
    field,
  ]),
);

const turn = (operand: RecordFilterOperand, value: string) =>
  turnRecordFilterIntoRecordGqlOperationFilter({
    recordFilter: {
      fieldMetadataId: dealCollaboratorsField.id,
      operand,
      value,
    },
    fieldMetadataItemById,
    filterValueDependencies: { currentWorkspaceMemberId: CURRENT_MEMBER_ID },
  });

const LIVE = { deletedAt: { is: 'NULL' } };

describe('filters on a many-to-many field', () => {
  it('matches deals where I am a collaborator', () => {
    expect(
      turn(
        RecordFilterOperand.IS,
        JSON.stringify({
          isCurrentWorkspaceMemberSelected: true,
          selectedRecordIds: [],
        }),
      ),
    ).toEqual({
      dealCollaborators: {
        and: [{ workspaceMemberId: { in: [CURRENT_MEMBER_ID] } }, LIVE],
      },
    });
  });

  it('matches deals where any of the picked members collaborates', () => {
    expect(
      turn(
        RecordFilterOperand.IS,
        JSON.stringify({
          isCurrentWorkspaceMemberSelected: false,
          selectedRecordIds: [OTHER_MEMBER_ID],
        }),
      ),
    ).toEqual({
      dealCollaborators: {
        and: [{ workspaceMemberId: { in: [OTHER_MEMBER_ID] } }, LIVE],
      },
    });
  });

  it('excludes deals the picked members collaborate on', () => {
    expect(
      turn(
        RecordFilterOperand.IS_NOT,
        JSON.stringify({
          isCurrentWorkspaceMemberSelected: false,
          selectedRecordIds: [OTHER_MEMBER_ID],
        }),
      ),
    ).toEqual({
      not: {
        dealCollaborators: {
          and: [{ workspaceMemberId: { in: [OTHER_MEMBER_ID] } }, LIVE],
        },
      },
    });
  });

  it('checks whether a deal has collaborators at all', () => {
    expect(turn(RecordFilterOperand.IS_NOT_EMPTY, '')).toEqual({
      dealCollaborators: LIVE,
    });
    expect(turn(RecordFilterOperand.IS_EMPTY, '')).toEqual({
      not: { dealCollaborators: LIVE },
    });
  });

  it('applies no filter until a member is picked', () => {
    expect(
      turn(
        RecordFilterOperand.IS,
        JSON.stringify({
          isCurrentWorkspaceMemberSelected: false,
          selectedRecordIds: [],
        }),
      ),
    ).toBeUndefined();
  });
});
