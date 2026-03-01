export interface Team {
  id: number;
  name: string;
  iso_code: string;
}

export interface Match {
  id: number;
  team_a_id: number;
  team_b_id: number;
  team_a?: Team;
  team_b?: Team;
  group_id: string | null;
  stage: "group" | "round_32" | "round_16" | "quarter_final" | "semi_final" | "final";
  start_time: string;
  result_a: number | null;
  result_b: number | null;
  winner_id: number | null;
}

export interface Prediction {
  id: number;
  user_id: string;
  match_id: number;
  predicted_a: number | null;
  predicted_b: number | null;
  predicted_winner_id: number | null;
  points_won: number | null;
}
