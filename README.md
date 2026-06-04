# CSP Graph Coloring Experiment Frontend

This is the browser experiment frontend for the current CSP graph-coloring project.

## Stack

- Vite
- TypeScript
- jsPsych
- SVG rendering for graph trials

## Data Boundary

Stimulus generation remains in the repository-level `tasks/` directory. This frontend consumes normalized JSON copied into:

```text
public/stimuli/practice_trials.json
public/stimuli/formal_trials.json
```

Run:

```powershell
npm install
npm run sync:stimuli
npm run validate:stimuli
npm run dev
```

The first implementation saves data locally as JSON/CSV. Formal online collection should use JATOS or a backend API instead of GitHub Pages alone.
