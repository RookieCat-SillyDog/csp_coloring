import type { ColorName } from "./stimulus";

export interface FormalStepResponse {
  step: number;
  revealed_node: string;
  visible_nodes: string[];
  response_color: ColorName;
  confidence: number;
  rt_first_choice_ms?: number;
  rt_submit_ms: number;
  choice_change_count: number;
  normative_p_E_red?: number;
  normative_p_E_green?: number;
  normative_p_E_blue?: number;
}

export interface TrialResponse {
  trial_id: string;
  phase: string;
  block_id: string;
  graph_id: string;
  target_node: string;
  response_color: ColorName;
  confidence: number;
  rt_ms: number;
  rt_submit_ms?: number;
  correct_color?: ColorName;
  is_correct?: boolean;
  feedback_shown?: boolean;
  first_choice_color?: ColorName;
  rt_first_choice_ms?: number;
  choice_change_count?: number;
  rank1_color?: ColorName;
  rank1_confidence?: number;
  rank2_color?: ColorName;
  rank2_confidence?: number;
  rank3_color?: ColorName;
  rank3_confidence?: number;
  reveal_order?: string[];
  step_count?: number;
  responses?: FormalStepResponse[];
  final_response_color?: ColorName;
  final_confidence?: number;
  rt_total_ms?: number;
}
