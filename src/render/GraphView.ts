import type { ColorName, ExperimentTrial } from "../schema/stimulus";

const colorHex: Record<ColorName, string> = {
  red: "#d84a3f",
  green: "#44a35c",
  blue: "#4b7fc4",
};

function scalePoint(value: number, min: number, max: number, outMin: number, outMax: number): number {
  if (max === min) return (outMin + outMax) / 2;
  return outMin + ((value - min) / (max - min)) * (outMax - outMin);
}

interface GraphRenderOptions {
  revealedColors?: Record<string, ColorName>;
  visibleReportNodes?: string[];
  currentReportNode?: string;
  hiddenReportNodes?: string[];
  allReportsAreCurrent?: boolean; // 新增：所有报告节点都显示为当前状态（用于练习三）
}

export function renderGraphSvg(trial: ExperimentTrial, options: GraphRenderOptions = {}): string {
  const width = 800;
  const height = 600;
  const pad = 96;
  const revealedColors = options.revealedColors ?? {};
  const reportedNodes = new Set(options.visibleReportNodes ?? Object.keys(trial.cueTables));
  const currentReportNode = options.currentReportNode;
  const hiddenReportNodes = new Set(options.hiddenReportNodes ?? []);
  const xs = trial.nodes.map((node) => node.x);
  const ys = trial.nodes.map((node) => node.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const points = new Map(
    trial.nodes.map((node) => [
      node.id,
      {
        x: scalePoint(node.x, minX, maxX, pad, width - pad),
        y: scalePoint(node.y, minY, maxY, height - pad, pad),
      },
    ])
  );

  const edges = trial.edges
    .map((edge) => {
      const a = points.get(edge.source);
      const b = points.get(edge.target);
      if (!a || !b) return "";
      return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="graph-edge" />`;
    })
    .join("");

  const nodes = trial.nodes
    .map((node) => {
      const point = points.get(node.id);
      if (!point) return "";
      const isTarget = node.id === trial.targetNode;
      const hasReport = reportedNodes.has(node.id);
      const isCurrentReport = node.id === currentReportNode || (options.allReportsAreCurrent && hasReport && !isTarget);
      const isHiddenReport = hiddenReportNodes.has(node.id);
      const revealed = revealedColors[node.id];
      const fill = revealed ? colorHex[revealed] : "#ffffff";
      const labelColor = revealed && revealed !== ("none" as any) ? "#ffffff" : "#1e293b";

      const targetRings = isTarget
        ? `<circle cx="${point.x}" cy="${point.y}" r="52" class="target-ring" />`
        : hasReport || isHiddenReport || isCurrentReport
          ? `<circle cx="${point.x}" cy="${point.y}" r="48" class="report-ring" />`
        : "";

      return `
        <g class="graph-node ${isTarget ? "is-target" : ""} ${hasReport && !isTarget && !isCurrentReport ? "has-report" : ""} ${isCurrentReport ? "is-current-report" : ""} ${isHiddenReport ? "is-hidden-report" : ""}">
          ${targetRings}
          <circle class="node-bg" cx="${point.x}" cy="${point.y}" r="${isTarget ? 40 : 36}" fill="${fill}" />
          <text x="${point.x}" y="${point.y + 8}" fill="${labelColor}">${node.id}</text>
        </g>
      `;
    })
    .join("");

  return `<svg class="graph-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="graph">${edges}${nodes}</svg>`;
}
