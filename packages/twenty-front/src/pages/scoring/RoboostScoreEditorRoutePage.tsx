import { RoboostScoreEditor } from '@/roboost-app/scoring/components/RoboostScoreEditor';
import { useParams } from 'react-router-dom';

export const RoboostScoreEditorRoutePage = () => {
  const { scoreId } = useParams<{ scoreId: string }>();

  return <RoboostScoreEditor key={scoreId} scoreId={scoreId ?? ''} />;
};
