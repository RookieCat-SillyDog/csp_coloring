import { COLORS, type ColorName, type CueTable, type ExperimentTrial } from "../schema/stimulus";

const label: Record<ColorName, string> = {
  red: "红色",
  green: "绿色",
  blue: "蓝色",
};

function renderReportCells(color: ColorName, count: number): string {
  const total = 5;
  const safeCount = Math.max(0, Math.min(total, Math.round(count)));
  return Array.from({ length: total }, (_, index) => {
    const filled = index < safeCount;
    return `<span class="report-cell ${filled ? `is-filled report-${color}` : ""}" aria-hidden="true"></span>`;
  }).join("");
}

export function renderCueTable(nodeId: string, table: CueTable, isTargetTable: boolean): string {
  const rows = COLORS.map(
    (color) => `
      <div class="cue-row cue-${color}">
        <div class="cue-label-container">
          <div class="cue-color-dot"></div>
          <span>${label[color]}</span>
        </div>
        <div class="report-cells" aria-label="${label[color]}报告 ${table[color]} 次">
          ${renderReportCells(color, table[color])}
        </div>
        <span class="cue-count">${table[color]}次</span>
      </div>
    `
  ).join("");
  return `
    <section class="cue-table">
      <h3>${isTargetTable ? "目标士兵" : "士兵"} ${nodeId} 的报告表</h3>
      <p class="cue-table-note">观察员共报告 5 次</p>
      ${rows}
    </section>
  `;
}

export function renderCueTables(trial: ExperimentTrial): string {
  const ordered = trial.revealOrder.length ? trial.revealOrder : Object.keys(trial.cueTables);
  return ordered
    .filter((nodeId) => trial.cueTables[nodeId])
    .map((nodeId) => renderCueTable(nodeId, trial.cueTables[nodeId], nodeId === trial.targetNode))
    .join("");
}

export function renderCueTablesForStep(trial: ExperimentTrial, currentStep: number): string {
  const safeStep = Math.max(1, Math.min(currentStep, trial.revealOrder.length));
  const currentNode = trial.revealOrder[safeStep - 1];
  const previousNodes = trial.revealOrder.slice(0, safeStep - 1).filter((nodeId) => trial.cueTables[nodeId]);
  const hiddenNodes = trial.revealOrder.slice(safeStep);

  const currentTable = currentNode && trial.cueTables[currentNode]
    ? renderCueTable(currentNode, trial.cueTables[currentNode], false)
    : "";
  const previousTables = previousNodes
    .map((nodeId) => renderCueTable(nodeId, trial.cueTables[nodeId], false))
    .join("");
  const hiddenList = hiddenNodes.length
    ? `<div class="formal-hidden-list">${hiddenNodes.map((nodeId) => `<span>士兵 ${nodeId}</span>`).join("")}</div>`
    : `<p class="formal-empty-note">没有待送达的报告。</p>`;

  return `
    <div class="formal-report-stack">
      <section class="formal-report-section formal-current-report">
        <div class="formal-report-heading">新收到的报告</div>
        ${currentTable}
      </section>
      <section class="formal-report-section formal-previous-reports">
        <div class="formal-report-heading">已收到的报告</div>
        ${previousTables || `<p class="formal-empty-note">此前还没有收到其他报告。</p>`}
      </section>
      <section class="formal-report-section formal-hidden-reports">
        <div class="formal-report-heading">待送达</div>
        ${hiddenList}
      </section>
    </div>
  `;
}
