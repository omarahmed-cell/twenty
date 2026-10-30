import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { SEGMENT_TARGET_OBJECT_NAME_SINGULARS } from 'twenty-shared/constants';
import {
  FieldMetadataType,
  type SegmentTargetObject,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export type SegmentPullRelationOption = {
  label: string;
  fieldLabel: string;
  value: string;
  targetObject: SegmentTargetObject;
};

const SEGMENT_TARGET_OBJECT_ENTRIES = Object.entries(
  SEGMENT_TARGET_OBJECT_NAME_SINGULARS,
) as [SegmentTargetObject, string][];

export const getSegmentPullRelationOptions = ({
  sourceObjectMetadataItem,
  objectMetadataItems,
}: {
  sourceObjectMetadataItem: EnrichedObjectMetadataItem;
  objectMetadataItems: EnrichedObjectMetadataItem[];
}): SegmentPullRelationOption[] =>
  sourceObjectMetadataItem.fields.flatMap((field) => {
    if (field.type !== FieldMetadataType.RELATION || !field.isActive) {
      return [];
    }

    const targetNameSingular =
      field.relation?.targetObjectMetadata.nameSingular;

    const targetObject = SEGMENT_TARGET_OBJECT_ENTRIES.find(
      ([, nameSingular]) => nameSingular === targetNameSingular,
    )?.[0];

    const targetObjectMetadataItem = objectMetadataItems.find(
      (objectMetadataItem) =>
        objectMetadataItem.nameSingular === targetNameSingular,
    );

    if (!isDefined(targetObject) || !isDefined(targetObjectMetadataItem)) {
      return [];
    }

    return [
      {
        label: `${field.label} (${targetObjectMetadataItem.labelPlural})`,
        fieldLabel: field.label,
        value: field.id,
        targetObject,
      },
    ];
  });
