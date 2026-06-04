import { initJsPsych } from "jspsych";
import "jspsych/css/jspsych.css";
import "./styles.css";
import { buildTimeline } from "./experiment/timeline";
import { validateStimulusDocument } from "./schema/validateStimulus";
import type { StimulusDocument } from "./schema/stimulus";

async function loadStimulus(path: string): Promise<StimulusDocument> {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load ${path}: HTTP ${response.status}`);
  return validateStimulusDocument((await response.json()) as StimulusDocument);
}

async function main(): Promise<void> {
  const stimuli = await Promise.all([
    loadStimulus("./stimuli/practice_trials.json"),
    loadStimulus("./stimuli/formal_trials.json"),
  ]);
  const jsPsych = initJsPsych({
    display_element: "jspsych-target",
  });
  (window as any).__cspJsPsych = jsPsych;
  await jsPsych.run(buildTimeline(stimuli) as any);
}

main().catch((error) => {
  const root = document.getElementById("jspsych-target");
  if (root) {
    root.innerHTML = `<pre class="fatal-error">${String(error?.stack || error)}</pre>`;
  }
  console.error(error);
});
