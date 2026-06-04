import htmlButtonResponse from "@jspsych/plugin-html-button-response";
import htmlKeyboardResponse from "@jspsych/plugin-html-keyboard-response";
import callFunction from "@jspsych/plugin-call-function";
import { GraphColoringTrialPlugin } from "../trials/graphColoringTrial";
import type { ExperimentTrial, StimulusDocument } from "../schema/stimulus";
import { makeDownloadButton, rowsToCsv } from "./data";

export function buildTimeline(stimuli: StimulusDocument[]) {
  const trials = stimuli.flatMap((doc) => doc.trials);
  setupDevJumpPanel(trials);

  if (trials.length === 0) {
    return [
      {
        type: htmlKeyboardResponse,
        stimulus: "<p>没有找到实验刺激。请先运行 <code>npm run sync:stimuli</code>。</p>",
        choices: "NO_KEYS",
      },
    ];
  }

  const devTrial = getDevTrial(trials);
  if (devTrial) {
    return [...devTrialItems(trials, devTrial), finishItem()];
  }

  const practiceLearning = trials.filter((trial) => trial.phase === "practice_learning");
  const practiceCalibration = trials.filter((trial) => trial.phase === "practice_calibration");
  const practiceIntegration = trials.filter((trial) => trial.phase === "practice_integration");
  const formal = trials.filter((trial) => trial.phase === "formal");

  return [
    ...instructionPages(),
    ...stageIntroPage(
      "练习一：学习报告表",
      [
        "在这一部分，你只需要根据一名士兵自己的报告表，判断他最可能属于哪个阵营。",
        "每题作答后，你会看到正确答案。",
        "请注意：观察报告通常有帮助，但并不总是正确。观察员每次报告正确的概率约为七成。",
      ],
      "开始练习一"
    ),
    ...trialItems(practiceLearning),
    ...stageIntroPage(
      "练习二：无反馈判断",
      [
        "在这一部分，你仍然需要根据目标士兵自己的报告表，判断他可能属于哪个阵营。",
        "请把红色、绿色、蓝色三个阵营从“最可能”到“最不可能”排序，并分别报告信心。",
        "这一部分不会显示正确答案。请按照你的真实判断作答。",
      ],
      "开始练习二"
    ),
    ...trialItems(practiceCalibration),
    ...stageIntroPage(
      "练习三：结合竞争关系",
      [
        "在这一部分，你需要同时使用观察报告和网络中的连线。",
        "两名有连线的士兵存在直接竞争关系，不能属于同一阵营。",
        "请根据这些信息，判断目标士兵最可能属于哪个阵营。每题作答后，你会看到简短反馈。",
      ],
      "开始练习三"
    ),
    ...trialItems(practiceIntegration),
    ...stageIntroPage(
      "正式实验",
      [
        "练习已经结束。接下来进入正式实验。每一题中，目标士兵固定为 E。",
        "观察员会依次送来 4 名士兵的报告表。每收到一份新报告，请结合已经收到的报告和网络上的竞争关系，重新判断目标士兵 E 最可能属于哪个阵营，并报告信心。",
        "正式实验不会显示正确答案。",
      ],
      "开始正式实验"
    ),
    ...formalTrialItems(formal),
    finishItem(),
  ];
}

function instructionPages() {
  return [
    {
      type: htmlButtonResponse,
      stimulus: instructionHtml(
        "任务背景",
        [
          "这是一个战场世界。",
          "每一轮中，网络里的每个圆点代表一名士兵。每名士兵都属于三个阵营之一：红色、绿色或蓝色。",
          "有连线的两名士兵存在直接竞争关系，因此他们不能属于同一阵营。",
        ]
      ),
      choices: ["继续"],
    },
    {
      type: htmlButtonResponse,
      stimulus: instructionHtml(
        "你能看到什么",
        [
          "你是观察员的报告书记。",
          "你无法直接看到任何士兵的真实阵营，只能看到观察员对部分士兵留下的报告。",
          "由于战场信号受到扰动，观察距离也比较远，每次观察报告不一定准确。观察员每次报告正确的概率约为七成。",
        ]
      ),
      choices: ["继续"],
    },
    {
      type: htmlButtonResponse,
      stimulus: instructionHtml(
        "如何阅读报告表",
        [
          "报告表记录的是观察员对同一名士兵进行多次观察后留下的结果。",
          "例如，某名士兵的报告表显示“红色 0 次、绿色 3 次、蓝色 2 次”，表示观察员一共观察了五次，其中三次报告他像绿色阵营，两次报告他像蓝色阵营。",
          "报告次数越多，通常越有参考价值；但报告不是士兵的真实身份。",
        ]
      ),
      choices: ["继续"],
    },
    {
      type: htmlButtonResponse,
      stimulus: instructionHtml(
        "你的任务",
        [
          "每一题中，系统会标出一名目标士兵。",
          "请根据网络上的竞争关系和观察报告，判断目标士兵最可能属于哪个阵营。",
          "作答时，请先选择红色、绿色或蓝色，再报告你对判断的信心，最后点击提交。",
        ]
      ),
      choices: ["开始练习"],
    },
  ];
}

function stageIntroPage(title: string, paragraphs: string[], choice: string) {
  return [
    {
      type: htmlButtonResponse,
      stimulus: instructionHtml(title, paragraphs),
      choices: [choice],
    },
  ];
}

function instructionHtml(title: string, paragraphs: string[]): string {
  return `
    <section class="instruction-card">
      <h1>${title}</h1>
      ${paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
    </section>
  `;
}

function trialItems(trials: ExperimentTrial[]) {
  return trials.map((trial) => ({
    type: GraphColoringTrialPlugin,
    stimulus: trial,
  }));
}

function formalTrialItems(trials: ExperimentTrial[], startIndex = 0, total = trials.length) {
  return trials.flatMap((trial, index) => {
    const item = {
      type: GraphColoringTrialPlugin,
      stimulus: trial,
    };
    if (index === trials.length - 1) return [item];
    const completed = startIndex + index + 1;
    return [
      item,
      {
        type: htmlButtonResponse,
        stimulus: interTrialHtml(completed, total),
        choices: ["继续下一题"],
        data: {
          screen_type: "formal_inter_trial",
          completed_formal_trial_index: completed,
          formal_trial_total: total,
        },
      },
    ];
  });
}

function devTrialItems(trials: ExperimentTrial[], devTrial: ExperimentTrial) {
  const startIndex = trials.findIndex((trial) => trial.id === devTrial.id);
  if (startIndex < 0) return [];
  const remaining = trials.slice(startIndex);
  const allFormal = trials.filter((trial) => trial.phase === "formal");
  const items = [];

  for (let index = 0; index < remaining.length; index += 1) {
    const trial = remaining[index];
    if (trial.phase !== "formal") {
      items.push(...trialItems([trial]));
      continue;
    }

    const formalRun = [];
    let runIndex = index;
    while (runIndex < remaining.length && remaining[runIndex].phase === "formal") {
      formalRun.push(remaining[runIndex]);
      runIndex += 1;
    }

    const formalStartIndex = allFormal.findIndex((item) => item.id === trial.id);
    items.push(...formalTrialItems(formalRun, Math.max(0, formalStartIndex), allFormal.length));
    index = runIndex - 1;
  }

  return items;
}

function finishItem() {
  return {
    type: callFunction,
    func: () => {
      const jsPsych = (window as any).__cspJsPsych;
      const rows = jsPsych.data.get().values() as Record<string, unknown>[];
      const container = document.getElementById("jspsych-target");
      if (!container) return;
      container.innerHTML = '<div class="finish-panel"><h2>实验结束</h2><p>请在下方保存本地预试数据。</p></div>';
      const panel = container.querySelector(".finish-panel");
      panel?.appendChild(makeDownloadButton("csp_graph_coloring_pilot.json", JSON.stringify(rows, null, 2), "application/json", "下载 JSON 数据"));
      panel?.appendChild(makeDownloadButton("csp_graph_coloring_pilot.csv", rowsToCsv(rows), "text/csv;charset=utf-8", "下载 CSV 数据"));
    },
  };
}

function interTrialHtml(completed: number, total: number): string {
  return `
    <section class="instruction-card">
      <h1>+</h1>
      <p>正式实验第 ${completed} / ${total} 题已完成。</p>
      <p>请短暂休息，准备好后进入下一题。</p>
    </section>
  `;
}

function setupDevJumpPanel(trials: ExperimentTrial[]): void {
  if (!isDevMode()) return;
  (window as any).__cspDevTrials = trials;
  const currentDevTrial = getDevTrial(trials);

  window.setTimeout(() => {
    if (document.getElementById("dev-jump-panel")) return;
    const panel = document.createElement("aside");
    panel.id = "dev-jump-panel";
    panel.className = "dev-jump-panel";
    panel.innerHTML = `
      <div class="dev-jump-title">开发跳转</div>
      <label>
        阶段
        <select id="dev-jump-phase">
          <option value="practice_learning">练习一</option>
          <option value="practice_calibration">练习二</option>
          <option value="practice_integration">练习三</option>
          <option value="formal">正式实验</option>
        </select>
      </label>
      <label>
        试次
        <select id="dev-jump-trial"></select>
      </label>
      <button type="button" id="dev-jump-go">跳转</button>
    `;
    document.body.appendChild(panel);

    const phaseSelect = panel.querySelector<HTMLSelectElement>("#dev-jump-phase");
    const trialSelect = panel.querySelector<HTMLSelectElement>("#dev-jump-trial");
    const button = panel.querySelector<HTMLButtonElement>("#dev-jump-go");
    const refreshTrials = () => {
      if (!phaseSelect || !trialSelect) return;
      const phaseTrials = trials.filter((trial) => trial.phase === phaseSelect.value);
      trialSelect.innerHTML = phaseTrials
        .map((trial, index) => `<option value="${trial.id}">${index + 1}. ${trial.id}</option>`)
        .join("");
    };

    if (phaseSelect && currentDevTrial) {
      phaseSelect.value = currentDevTrial.phase;
    }
    phaseSelect?.addEventListener("change", refreshTrials);
    button?.addEventListener("click", () => {
      const trial = trials.find((item) => item.id === trialSelect?.value);
      if (!trial) return;
      const url = new URL(window.location.href);
      url.searchParams.set("dev", "1");
      url.searchParams.set("trial", trial.id);
      window.location.assign(url.toString());
    });
    refreshTrials();
    if (trialSelect && currentDevTrial) {
      trialSelect.value = currentDevTrial.id;
    }
  }, 0);
}

function isDevMode(): boolean {
  return new URLSearchParams(window.location.search).get("dev") === "1";
}

function getDevTrial(trials: ExperimentTrial[]): ExperimentTrial | null {
  if (!isDevMode()) return null;
  const trialId = new URLSearchParams(window.location.search).get("trial");
  if (!trialId) return null;
  return trials.find((trial) => trial.id === trialId) ?? null;
}
