import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateStimulusDocument } from "../src/schema/validateStimulus";
import type { StimulusDocument } from "../src/schema/stimulus";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

for (const name of ["practice_trials.json", "formal_trials.json"]) {
  const fullPath = path.join(root, "public", "stimuli", name);
  const doc = validateStimulusDocument(JSON.parse(readFileSync(fullPath, "utf8")) as StimulusDocument);
  console.log(`${name}: ${doc.trials.length} trials valid`);
}
