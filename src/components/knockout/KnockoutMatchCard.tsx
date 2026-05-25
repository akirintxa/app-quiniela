'use client';

import { memo } from "react";
import { KnockoutMatchViewModel } from "@/types/knockout";
import { viewModelToMatchCard } from "@/lib/knockout-ui";
import MatchCard from "@/components/MatchCard";
import { useKnockoutStage } from "./KnockoutStageBoard";

interface KnockoutMatchCardProps {
  viewModel: KnockoutMatchViewModel;
  userId?: string;
}

function KnockoutMatchCardComponent({ viewModel, userId }: KnockoutMatchCardProps) {
  const { drafts, updateDraft } = useKnockoutStage();
  const match = viewModelToMatchCard(viewModel);
  const draft = drafts[viewModel.match.id];

  if (!draft) return null;

  return (
    <MatchCard
      match={match}
      userId={userId}
      initialPrediction={viewModel.userPrediction}
      suppressSave
      controlledDraft={{
        scoreA: draft.scoreA,
        scoreB: draft.scoreB,
        winnerId: draft.winnerId,
      }}
      onDraftChange={(next) => updateDraft(viewModel.match.id, next)}
    />
  );
}

export default memo(KnockoutMatchCardComponent);
