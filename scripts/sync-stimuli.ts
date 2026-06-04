import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ColorName, CueTable, ExperimentTrial, GraphEdge, GraphNode, StimulusDocument } from "../src/schema/stimulus";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");
const repoRoot = path.resolve(frontendRoot, "..");
const outDir = path.join(frontendRoot, "public", "stimuli");

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8")) as T;
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes && ch === '"' && next === '"') {
      field += '"';
      i += 1;
    } else if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && ch === ",") {
      row.push(field);
      field = "";
    } else if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  const [header, ...body] = rows;
  return body.map((cells) => Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""])));
}

function parseJsonCell<T>(value: string): T {
  return JSON.parse(value) as T;
}

function colorOrUndefined(value: string | undefined): ColorName | undefined {
  return value === "red" || value === "green" || value === "blue" ? value : undefined;
}

function edgesFromStrings(values: string[]): GraphEdge[] {
  return values.map((edge) => {
    const [source, target] = edge.split("-");
    return { source, target };
  });
}

function nodesFromLayout(nodeIds: string[], layout: Record<string, [number, number]>): GraphNode[] {
  return nodeIds.map((id) => {
    const [x, y] = layout[id] ?? [0, 0];
    return { id, x, y };
  });
}

function normalizeCueTable(raw: Record<string, unknown>, type?: string): CueTable {
  return {
    red: Number(raw.red ?? 0),
    green: Number(raw.green ?? 0),
    blue: Number(raw.blue ?? 0),
    type,
  };
}

function normalizePracticeRow(
  row: Record<string, string>,
  phase: ExperimentTrial["phase"],
  idKey: string,
  graphIdKey: string
): ExperimentTrial {
  const nodeIds = parseJsonCell<string[]>(row.graph_nodes);
  const layout = parseJsonCell<Record<string, [number, number]>>(row.graph_layout);
  const edges = edgesFromStrings(parseJsonCell<string[]>(row.graph_edges));
  const targetNode = row.target_node;

  if (phase === "practice_integration") {
    const cueTablesRaw = parseJsonCell<Record<string, Record<string, unknown>>>(row.cue_tables);
    const cueTypes = parseJsonCell<Record<string, string>>(row.cue_table_types);
    const evidenceNodes = parseJsonCell<string[]>(row.evidence_nodes);
    return {
      id: row[idKey],
      phase,
      blockId: "0C",
      graphId: row[graphIdKey],
      targetNode,
      nodes: nodesFromLayout(nodeIds, layout),
      edges,
      cueTables: Object.fromEntries(
        Object.entries(cueTablesRaw).map(([nodeId, table]) => [nodeId, normalizeCueTable(table, cueTypes[nodeId])])
      ),
      revealOrder: evidenceNodes,
      correctColor: colorOrUndefined(row.target_true_state),
      feedback: true,
      metadata: {
        majority_heuristic_violation: row.majority_heuristic_violation === "True",
        feedback_text: row.feedback_text,
      },
    };
  }

  const table = normalizeCueTable(parseJsonCell<Record<string, unknown>>(row.cue_table), row.table_type);
  return {
    id: row[idKey],
    phase,
    blockId: phase === "practice_learning" ? "0A" : "0B",
    graphId: row[graphIdKey],
    targetNode,
    nodes: nodesFromLayout(nodeIds, layout),
    edges,
    cueTables: { [targetNode]: table },
    revealOrder: [targetNode],
    correctColor: phase === "practice_learning" ? colorOrUndefined(row.true_state) : undefined,
    feedback: phase === "practice_learning",
    metadata: {
      majority_color: row.majority_color,
      majority_colors: row.majority_colors ? parseJsonCell<string[]>(row.majority_colors) : [],
      is_majority_correct: row.is_majority_correct === "True",
    },
  };
}

function buildPracticeDocument(): StimulusDocument {
  const learning = parseCsv(readFileSync(path.join(repoRoot, "tasks/cue_learning_practice_v1/cue_learning_trials.csv"), "utf8")).map((row) =>
    normalizePracticeRow(row, "practice_learning", "practice_trial_id", "practice_graph_id")
  );
  const calibration = parseCsv(readFileSync(path.join(repoRoot, "tasks/cue_learning_practice_v1/cue_calibration_trials.csv"), "utf8")).map((row) =>
    normalizePracticeRow(row, "practice_calibration", "calibration_trial_id", "calibration_graph_id")
  );
  const integration = parseCsv(readFileSync(path.join(repoRoot, "tasks/cue_learning_practice_v1/graph_integration_practice_trials.csv"), "utf8")).map((row) =>
    normalizePracticeRow(row, "practice_integration", "integration_trial_id", "practice_graph_id")
  );

  return {
    schemaVersion: 1,
    kind: "practice",
    source: "tasks/cue_learning_practice_v1",
    generatedAt: new Date().toISOString(),
    trials: [...learning, ...calibration, ...integration],
  };
}

function buildFormalDocument(): StimulusDocument {
  const base = readJson<any>("tasks/base_graph_library_v1/selected_base_graphs.json");
  const selected = readJson<any>("tasks/evidence_strength_assignment_v1/selected_evidence_strength_trials.json");
  const layout = base.node_layout as Record<string, [number, number]>;
  const graphById = new Map<string, any>(base.selected_graphs.map((graph: any) => [graph.graph_id, graph]));

  const trials = selected.selected_trials.map((trial: any): ExperimentTrial => {
    const graph = graphById.get(trial.graph_id);
    if (!graph) throw new Error(`Missing graph for ${trial.graph_id}`);
    return {
      id: trial.trial_id,
      phase: "formal",
      blockId: `B${trial.block}`,
      graphId: trial.graph_id,
      targetNode: trial.target_node,
      nodes: nodesFromLayout(graph.nodes, layout),
      edges: edgesFromStrings(graph.edge_list),
      cueTables: Object.fromEntries(
        Object.entries(trial.cue_tables).map(([nodeId, table]) => [
          nodeId,
          normalizeCueTable(table as Record<string, unknown>, String((table as Record<string, unknown>).type ?? "")),
        ])
      ),
      revealOrder: trial.reveal_order,
      posteriors: trial.step_posteriors,
      metadata: {
        trial_stub_id: trial.trial_stub_id,
        mask_id: trial.mask_id,
        mask_role: trial.mask_role,
        block_family: trial.block_family,
        final_argmax_color: trial.final_argmax_color,
        final_strength: trial.final_strength,
        final_top_two_margin: trial.final_top_two_margin,
      },
    };
  });

  return {
    schemaVersion: 1,
    kind: "formal",
    source: "tasks/evidence_strength_assignment_v1/selected_evidence_strength_trials.json",
    generatedAt: new Date().toISOString(),
    trials,
  };
}

mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "practice_trials.json"), `${JSON.stringify(buildPracticeDocument(), null, 2)}\n`);
writeFileSync(path.join(outDir, "formal_trials.json"), `${JSON.stringify(buildFormalDocument(), null, 2)}\n`);

console.log("Wrote public/stimuli/practice_trials.json and public/stimuli/formal_trials.json");
