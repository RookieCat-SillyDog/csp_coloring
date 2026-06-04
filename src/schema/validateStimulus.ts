import { COLORS, type ExperimentTrial, type StimulusDocument } from "./stimulus";

function fail(message: string): never {
  throw new Error(message);
}

function validateTrial(trial: ExperimentTrial, index: number): void {
  if (!trial.id) fail(`trial ${index}: missing id`);
  if (!trial.targetNode) fail(`${trial.id}: missing targetNode`);
  if (!Array.isArray(trial.nodes) || trial.nodes.length === 0) fail(`${trial.id}: missing nodes`);
  if (!Array.isArray(trial.edges)) fail(`${trial.id}: missing edges`);

  const nodeIds = new Set(trial.nodes.map((node) => node.id));
  if (!nodeIds.has(trial.targetNode)) fail(`${trial.id}: targetNode is not in nodes`);

  for (const edge of trial.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      fail(`${trial.id}: edge references unknown node ${edge.source}-${edge.target}`);
    }
  }

  for (const nodeId of trial.revealOrder) {
    if (!nodeIds.has(nodeId)) fail(`${trial.id}: revealOrder references unknown node ${nodeId}`);
  }

  for (const [nodeId, table] of Object.entries(trial.cueTables)) {
    if (!nodeIds.has(nodeId)) fail(`${trial.id}: cue table references unknown node ${nodeId}`);
    for (const color of COLORS) {
      if (typeof table[color] !== "number") fail(`${trial.id}: cue table ${nodeId} missing ${color}`);
    }
  }

  if (trial.correctColor && !COLORS.includes(trial.correctColor)) {
    fail(`${trial.id}: invalid correctColor ${trial.correctColor}`);
  }
}

export function validateStimulusDocument(doc: StimulusDocument): StimulusDocument {
  if (doc.schemaVersion !== 1) fail("stimulus schemaVersion must be 1");
  if (doc.kind !== "practice" && doc.kind !== "formal") fail("stimulus kind must be practice or formal");
  if (!Array.isArray(doc.trials)) fail("stimulus trials must be an array");
  doc.trials.forEach(validateTrial);
  return doc;
}
