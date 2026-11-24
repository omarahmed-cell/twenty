import { ROBOOST_SCORE } from '@/roboost-app/scoring/graphql/roboostScoreQueries';
import { type RoboostScore } from '@/roboost-app/scoring/types/RoboostScore';
import { useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'react-router-dom';

type RoboostScoreEditorProps = {
  scoreId: string;
};

export const RoboostScoreEditor = ({ scoreId }: RoboostScoreEditorProps) => {
  const { t } = useLingui();
  const { data } = useQuery<{ roboostScore: RoboostScore }>(ROBOOST_SCORE, {
    variables: { scoreId },
    fetchPolicy: 'network-only',
  });
  const scoreName = data?.roboostScore.name ?? '';

  return (
    <div className="rb-sce">
      <div className="rb-sce-top">
        <div className="rb-sce-top-left">
          <Link className="rb-hbtn" to="/scoring">
            {t`Exit`}
          </Link>
        </div>
        <div className="rb-sce-title">{scoreName}</div>
        <div className="rb-sce-top-right" />
      </div>
    </div>
  );
};
