export type ColorName = "red" | "green" | "blue";

export const COLORS: ColorName[] = ["red", "green", "blue"];

export type CueTable = Record<ColorName, number> & {
  type?: string;
};

export interface GraphNode {
  id: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface PosteriorStep {
  red: number;
  green: number;
  blue: number;
}

export interface ExperimentTrial {
  id: string;
  phase: "practice_learning" | "practice_calibration" | "practice_integration" | "formal";
  blockId: string;
  graphId: string;
  targetNode: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  cueTables: Record<string, CueTable>;
  revealOrder: string[];
  correctColor?: ColorName;
  feedback?: boolean;
  posteriors?: PosteriorStep[];
  metadata?: Record<string, unknown>;
}

export interface StimulusDocument {
  schemaVersion: 1;
  kind: "practice" | "formal";
  source: string;
  generatedAt: string;
  trials: ExperimentTrial[];
}
