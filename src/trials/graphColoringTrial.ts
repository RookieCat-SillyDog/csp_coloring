import { renderColorButtons } from "../render/ColorChoiceView";
import { renderCueTables, renderCueTablesForStep } from "../render/CueTableView";
import { renderGraphSvg } from "../render/GraphView";
import { COLORS, type ColorName, type CueTable, type ExperimentTrial } from "../schema/stimulus";
import type { FormalStepResponse, TrialResponse } from "../schema/response";

interface GraphColoringTrialParameters {
  stimulus: ExperimentTrial;
}

const info = {
  name: "graph-coloring-trial",
  parameters: {
    stimulus: {
      type: Object,
      default: undefined,
    },
  },
};

export class GraphColoringTrialPlugin {
  static info = info;
  private jsPsych: any;

  constructor(jsPsych: any) {
    this.jsPsych = jsPsych;
  }

  trial(displayElement: HTMLElement, trialConfig: GraphColoringTrialParameters): void {
    const trial = trialConfig.stimulus;
    if (trial.phase === "practice_calibration") {
      this.calibrationTrial(displayElement, trial);
      return;
    }
    if (trial.phase === "formal") {
      this.formalSequentialTrial(displayElement, trial);
      return;
    }

    const start = performance.now();
    let selectedColor: ColorName | null = null;
    let firstChoiceColor: ColorName | null = null;
    let rtFirstChoiceMs: number | null = null;
    let choiceChangeCount = 0;

    // 练习三的证据节点应显示为当前报告状态（蓝紫色），与正式试次一致
    const graphOptions = trial.phase === "practice_integration"
      ? { allReportsAreCurrent: true }
      : {};

    displayElement.innerHTML = `
      <div class="trial-shell">
        <section class="trial-graph">
          ${renderGraphSvg(trial, graphOptions)}
        </section>
        <aside class="trial-panel">
          <div class="trial-meta">
            <span>${getPhaseLabel(trial.phase)}</span>
            <strong>当前试次</strong>
          </div>
          <h2>${getTrialTitle(trial.phase)}</h2>
          <p class="trial-instruction">${getTrialInstruction(trial)}</p>
          <div class="target-soldier">目标士兵：<strong>${trial.targetNode}</strong></div>
          <div class="cue-grid">${renderCueTables(trial)}</div>
          <div class="response-panel">
            <p class="response-question">${responseQuestionText(trial)}</p>
            <div class="color-choices">${renderColorButtons()}</div>
            <label class="confidence-control">
              <span>你对这个判断有多大信心？<strong id="confidence-value">50%</strong></span>
              <input id="confidence-slider" type="range" min="0" max="100" value="50" />
            </label>
            <button type="button" class="submit-response" id="submit-response" disabled>提交</button>
          </div>
        </aside>
      </div>
    `;

    const slider = displayElement.querySelector<HTMLInputElement>("#confidence-slider");
    const confidenceValue = displayElement.querySelector<HTMLElement>("#confidence-value");
    slider?.addEventListener("input", () => {
      if (confidenceValue && slider) confidenceValue.textContent = slider.value + "%";
    });

    const submitButton = displayElement.querySelector<HTMLButtonElement>("#submit-response");
    const colorButtons = displayElement.querySelectorAll<HTMLButtonElement>("[data-color]");

    colorButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const nextColor = button.dataset.color as ColorName;
        if (!firstChoiceColor) {
          firstChoiceColor = nextColor;
          rtFirstChoiceMs = Math.round(performance.now() - start);
        } else if (selectedColor && selectedColor !== nextColor) {
          choiceChangeCount += 1;
        }
        selectedColor = nextColor;
        colorButtons.forEach((item) => {
          item.classList.toggle("is-selected", item === button);
          item.setAttribute("aria-pressed", item === button ? "true" : "false");
        });
        if (submitButton) submitButton.disabled = false;
      });
    });

    submitButton?.addEventListener("click", () => {
      if (!selectedColor) return;
      const confidence = Number(slider?.value ?? 50);
      const rtMs = Math.round(performance.now() - start);
      const feedbackShown = shouldShowFeedback(trial);
      const response: TrialResponse = {
        trial_id: trial.id,
        phase: trial.phase,
        block_id: trial.blockId,
        graph_id: trial.graphId,
        target_node: trial.targetNode,
        response_color: selectedColor,
        confidence,
        rt_ms: rtMs,
        rt_submit_ms: rtMs,
        correct_color: trial.correctColor,
        is_correct: trial.correctColor ? trial.correctColor === selectedColor : undefined,
        feedback_shown: feedbackShown,
        first_choice_color: firstChoiceColor ?? undefined,
        rt_first_choice_ms: rtFirstChoiceMs ?? undefined,
        choice_change_count: choiceChangeCount,
      };

      if (feedbackShown) {
        this.showFeedback(displayElement, trial, response);
        return;
      }

      displayElement.innerHTML = "";
      this.jsPsych.finishTrial(response);
    });
  }

  private calibrationTrial(displayElement: HTMLElement, trial: ExperimentTrial): void {
    const start = performance.now();
    const rankChoices: Record<1 | 2 | 3, ColorName | null> = {
      1: null,
      2: null,
      3: null,
    };
    let rtFirstChoiceMs: number | null = null;
    let choiceChangeCount = 0;

    displayElement.innerHTML = `
      <div class="trial-shell">
        <section class="trial-graph">
          ${renderGraphSvg(trial)}
        </section>
        <aside class="trial-panel">
          <div class="trial-meta">
            <span>${getPhaseLabel(trial.phase)}</span>
            <strong>当前试次</strong>
          </div>
          <h2>${getTrialTitle(trial.phase)}</h2>
          <p class="trial-instruction">${getTrialInstruction(trial)}</p>
          <div class="target-soldier">目标士兵：<strong>${trial.targetNode}</strong></div>
          <div class="cue-grid">${renderCueTables(trial)}</div>
          <div class="response-panel calibration-response">
            <p class="response-question">请按可能性从高到低排列三个阵营，并分别报告信心。</p>
            ${renderRankRow(1, "第一选择", "最可能的阵营")}
            ${renderRankRow(2, "第二选择", "次可能的阵营")}
            ${renderRankRow(3, "第三选择", "剩余的阵营")}
            <button type="button" class="submit-response" id="submit-response" disabled>提交</button>
          </div>
        </aside>
      </div>
    `;

    const submitButton = displayElement.querySelector<HTMLButtonElement>("#submit-response");
    const colorButtons = displayElement.querySelectorAll<HTMLButtonElement>("[data-rank][data-color]");
    const confidenceSliders = displayElement.querySelectorAll<HTMLInputElement>("[data-rank-confidence]");

    confidenceSliders.forEach((slider) => {
      slider.addEventListener("input", () => {
        const rank = slider.dataset.rankConfidence;
        const value = displayElement.querySelector<HTMLElement>(`#rank-${rank}-confidence-value`);
        if (value) value.textContent = `${slider.value}%`;
      });
    });

    colorButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const rank = Number(button.dataset.rank) as 1 | 2 | 3;
        const color = button.dataset.color as ColorName;
        const previous = rankChoices[rank];

        if (rtFirstChoiceMs == null) {
          rtFirstChoiceMs = Math.round(performance.now() - start);
        }
        if (previous && previous !== color) {
          choiceChangeCount += 1;
        }

        (Object.keys(rankChoices) as Array<"1" | "2" | "3">).forEach((key) => {
          const otherRank = Number(key) as 1 | 2 | 3;
          if (otherRank !== rank && rankChoices[otherRank] === color) {
            rankChoices[otherRank] = null;
          }
        });

        rankChoices[rank] = color;
        autoFillThirdRank(rankChoices);
        updateCalibrationUi(displayElement, rankChoices);
        if (submitButton) submitButton.disabled = !isCompleteRanking(rankChoices);
      });
    });

    submitButton?.addEventListener("click", () => {
      if (!isCompleteRanking(rankChoices)) return;
      const rank1 = rankChoices[1] as ColorName;
      const rank2 = rankChoices[2] as ColorName;
      const rank3 = rankChoices[3] as ColorName;
      const rank1Confidence = getRankConfidence(displayElement, 1);
      const rank2Confidence = getRankConfidence(displayElement, 2);
      const rank3Confidence = getRankConfidence(displayElement, 3);
      const rtMs = Math.round(performance.now() - start);
      const response: TrialResponse = {
        trial_id: trial.id,
        phase: trial.phase,
        block_id: trial.blockId,
        graph_id: trial.graphId,
        target_node: trial.targetNode,
        response_color: rank1,
        confidence: rank1Confidence,
        rt_ms: rtMs,
        rt_submit_ms: rtMs,
        correct_color: undefined,
        is_correct: undefined,
        feedback_shown: false,
        first_choice_color: rank1,
        rt_first_choice_ms: rtFirstChoiceMs ?? undefined,
        choice_change_count: choiceChangeCount,
        rank1_color: rank1,
        rank1_confidence: rank1Confidence,
        rank2_color: rank2,
        rank2_confidence: rank2Confidence,
        rank3_color: rank3,
        rank3_confidence: rank3Confidence,
      };
      displayElement.innerHTML = "";
      this.jsPsych.finishTrial(response);
    });
  }

  private formalSequentialTrial(displayElement: HTMLElement, trial: ExperimentTrial): void {
    const totalSteps = trial.revealOrder.length;
    const trialStart = performance.now();
    const stepResponses: FormalStepResponse[] = [];
    let currentStep = 1;

    const finishFormalTrial = () => {
      const finalStep = stepResponses[stepResponses.length - 1];
      const rtTotalMs = Math.round(performance.now() - trialStart);
      const response: TrialResponse = {
        trial_id: trial.id,
        phase: trial.phase,
        block_id: trial.blockId,
        graph_id: trial.graphId,
        target_node: trial.targetNode,
        response_color: finalStep.response_color,
        confidence: finalStep.confidence,
        rt_ms: rtTotalMs,
        rt_submit_ms: finalStep.rt_submit_ms,
        correct_color: undefined,
        is_correct: undefined,
        feedback_shown: false,
        first_choice_color: stepResponses[0]?.response_color,
        rt_first_choice_ms: stepResponses[0]?.rt_first_choice_ms,
        choice_change_count: stepResponses.reduce((sum, item) => sum + item.choice_change_count, 0),
        reveal_order: [...trial.revealOrder],
        step_count: totalSteps,
        responses: stepResponses,
        final_response_color: finalStep.response_color,
        final_confidence: finalStep.confidence,
        rt_total_ms: rtTotalMs,
      };
      displayElement.innerHTML = "";
      this.jsPsych.finishTrial(response);
    };

    const renderBetweenSteps = (stepResponse: FormalStepResponse) => {
      const visibleNodes = trial.revealOrder.slice(0, currentStep);
      const currentNode = trial.revealOrder[currentStep - 1];
      const hiddenNodes = trial.revealOrder.slice(currentStep);
      displayElement.innerHTML = `
        <div class="trial-shell">
          <section class="trial-graph">
            ${renderGraphSvg(trial, {
              visibleReportNodes: visibleNodes,
              currentReportNode: currentNode,
              hiddenReportNodes: hiddenNodes,
            })}
          </section>
          <aside class="trial-panel">
            <div class="trial-meta">
              <span>正式实验</span>
              <strong>第 ${currentStep} / ${totalSteps} 步</strong>
            </div>
            <h2>已记录本步判断</h2>
            <p class="trial-instruction">你已根据当前收到的报告完成一次判断。下一步会送达一份新的报告。</p>
            <div class="target-soldier">目标士兵：<strong>${trial.targetNode}</strong></div>
            ${renderFormalStepIndicator(currentStep, totalSteps)}
            <div class="cue-grid formal-cue-grid">${renderCueTablesForStep(trial, currentStep)}</div>
            <div class="between-step-panel">
              <p>第 ${stepResponse.step} 步回答：${colorLabel(stepResponse.response_color)}，信心 ${stepResponse.confidence}%</p>
              <button type="button" class="submit-response" id="continue-step">继续接收下一份报告</button>
            </div>
          </aside>
        </div>
      `;
      displayElement.querySelector<HTMLButtonElement>("#continue-step")?.addEventListener("click", () => {
        currentStep += 1;
        renderStep();
      });
    };

    const renderStep = () => {
      const visibleNodes = trial.revealOrder.slice(0, currentStep);
      const currentNode = trial.revealOrder[currentStep - 1];
      const hiddenNodes = trial.revealOrder.slice(currentStep);
      const stepStart = performance.now();
      let selectedColor: ColorName | null = null;
      let firstChoiceColor: ColorName | null = null;
      let rtFirstChoiceMs: number | null = null;
      let choiceChangeCount = 0;

      displayElement.innerHTML = `
        <div class="trial-shell">
          <section class="trial-graph">
            ${renderGraphSvg(trial, {
              visibleReportNodes: visibleNodes,
              currentReportNode: currentNode,
              hiddenReportNodes: hiddenNodes,
            })}
          </section>
          <aside class="trial-panel">
            <div class="trial-meta">
              <span>正式实验</span>
              <strong>当前题目</strong>
            </div>
            <h2>判断目标士兵的阵营</h2>
            <p class="trial-instruction">请根据已收到的观察报告和网络上的竞争关系，判断目标士兵最可能属于哪个阵营。</p>
            <div class="target-soldier">目标士兵：<strong>${trial.targetNode}</strong></div>
            ${renderFormalStepIndicator(currentStep, totalSteps)}
            <div class="cue-grid formal-cue-grid">${renderCueTablesForStep(trial, currentStep)}</div>
            <div class="response-panel">
              <p class="response-question">${responseQuestionText(trial)}</p>
              <div class="color-choices">${renderColorButtons()}</div>
              <label class="confidence-control">
                <span>你对这个判断有多大信心？<strong id="confidence-value">50%</strong></span>
                <input id="confidence-slider" type="range" min="0" max="100" value="50" />
              </label>
              <button type="button" class="submit-response" id="submit-response" disabled>提交</button>
            </div>
          </aside>
        </div>
      `;

      const slider = displayElement.querySelector<HTMLInputElement>("#confidence-slider");
      const confidenceValue = displayElement.querySelector<HTMLElement>("#confidence-value");
      slider?.addEventListener("input", () => {
        if (confidenceValue && slider) confidenceValue.textContent = slider.value + "%";
      });

      const submitButton = displayElement.querySelector<HTMLButtonElement>("#submit-response");
      const colorButtons = displayElement.querySelectorAll<HTMLButtonElement>("[data-color]");

      colorButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const nextColor = button.dataset.color as ColorName;
          if (!firstChoiceColor) {
            firstChoiceColor = nextColor;
            rtFirstChoiceMs = Math.round(performance.now() - stepStart);
          } else if (selectedColor && selectedColor !== nextColor) {
            choiceChangeCount += 1;
          }
          selectedColor = nextColor;
          colorButtons.forEach((item) => {
            item.classList.toggle("is-selected", item === button);
            item.setAttribute("aria-pressed", item === button ? "true" : "false");
          });
          if (submitButton) submitButton.disabled = false;
        });
      });

      submitButton?.addEventListener("click", () => {
        if (!selectedColor || !currentNode) return;
        const posterior = trial.posteriors?.[currentStep - 1];
        const stepResponse: FormalStepResponse = {
          step: currentStep,
          revealed_node: currentNode,
          visible_nodes: visibleNodes,
          response_color: selectedColor,
          confidence: Number(slider?.value ?? 50),
          rt_first_choice_ms: rtFirstChoiceMs ?? undefined,
          rt_submit_ms: Math.round(performance.now() - stepStart),
          choice_change_count: choiceChangeCount,
          normative_p_E_red: posterior?.red,
          normative_p_E_green: posterior?.green,
          normative_p_E_blue: posterior?.blue,
        };
        stepResponses.push(stepResponse);

        if (currentStep >= totalSteps) {
          finishFormalTrial();
          return;
        }

        renderBetweenSteps(stepResponse);
      });
    };

    renderStep();
  }

  private showFeedback(displayElement: HTMLElement, trial: ExperimentTrial, response: TrialResponse): void {
    const feedback = buildFeedback(trial, response);
    displayElement.innerHTML = `
      <div class="feedback-shell">
        <section class="feedback-card ${response.is_correct ? "is-correct" : "is-incorrect"}">
          <p class="feedback-kicker">${getPhaseLabel(trial.phase)}</p>
          <h2>${feedback.title}</h2>
          ${feedback.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
          <button type="button" class="next-trial" id="next-trial">下一题</button>
        </section>
      </div>
    `;
    displayElement.querySelector<HTMLButtonElement>("#next-trial")?.addEventListener("click", () => {
      displayElement.innerHTML = "";
      this.jsPsych.finishTrial(response);
    });
  }
}

function getPhaseLabel(phase: ExperimentTrial["phase"]): string {
  const labels: Record<ExperimentTrial["phase"], string> = {
    practice_learning: "练习一：学习报告表",
    practice_calibration: "练习二：无反馈判断",
    practice_integration: "练习三：结合竞争关系",
    formal: "正式实验",
  };
  return labels[phase];
}

function renderFormalStepIndicator(currentStep: number, totalSteps: number): string {
  const dots = Array.from({ length: totalSteps }, (_, index) => {
    const step = index + 1;
    const state = step < currentStep ? "is-complete" : step === currentStep ? "is-current" : "";
    return `<span class="formal-step-dot ${state}">${step}</span>`;
  }).join("");
  return `
    <div class="formal-step-indicator" aria-label="正式实验步骤">
      <div class="formal-step-dots">${dots}</div>
      <span>第 ${currentStep} / ${totalSteps} 步，已收到 ${currentStep} / ${totalSteps} 份报告</span>
    </div>
  `;
}

function getTrialTitle(phase: ExperimentTrial["phase"]): string {
  if (phase === "practice_integration") return "结合报告和竞争关系";
  return "判断目标士兵的阵营";
}

function getTrialInstruction(trial: ExperimentTrial): string {
  if (trial.phase === "practice_calibration") {
    return "请查看这名士兵的报告表，把三个阵营按可能性排序，并分别报告信心。本部分不会显示反馈。";
  }
  if (trial.phase === "practice_integration") {
    const reported = trial.revealOrder.filter((nodeId) => trial.cueTables[nodeId]);
    if (reported.length === 1) {
      return `当前报告来自士兵 ${reported[0]}。请结合报告表和连线关系，判断目标士兵最可能属于哪个阵营。`;
    }
    return "当前报告来自多名士兵。请同时考虑他们的报告和连线关系。";
  }
  if (trial.phase === "formal") {
    return "请根据网络上的竞争关系和观察报告，判断目标士兵最可能属于哪个阵营。";
  }
  return "请查看这名士兵的报告表，判断他最可能属于哪个阵营。";
}

function responseQuestionText(trial: ExperimentTrial): string {
  if (trial.phase === "practice_integration" || trial.phase === "formal") {
    return `你认为目标士兵 ${trial.targetNode} 最可能属于哪个阵营？`;
  }
  return "你认为目标士兵最可能属于哪个阵营？";
}

function renderRankRow(rank: 1 | 2 | 3, title: string, subtitle: string): string {
  return `
    <section class="rank-row" data-rank-row="${rank}">
      <div class="rank-header">
        <strong>${title}</strong>
        <span>${subtitle}</span>
      </div>
      <div class="rank-color-choices">
        ${renderRankColorButtons(rank)}
      </div>
      <label class="confidence-control rank-confidence">
        <span>这个选择的信心 <strong id="rank-${rank}-confidence-value">50%</strong></span>
        <input data-rank-confidence="${rank}" type="range" min="0" max="100" value="50" />
      </label>
    </section>
  `;
}

function renderRankColorButtons(rank: 1 | 2 | 3): string {
  const labels: Record<ColorName, string> = {
    red: "红色",
    green: "绿色",
    blue: "蓝色",
  };
  return COLORS.map(
    (color) => `<button type="button" class="color-choice color-${color}" data-rank="${rank}" data-color="${color}">${labels[color]}</button>`
  ).join("");
}

function autoFillThirdRank(rankChoices: Record<1 | 2 | 3, ColorName | null>): void {
  if (rankChoices[3] && (rankChoices[3] === rankChoices[1] || rankChoices[3] === rankChoices[2])) {
    rankChoices[3] = null;
  }
  if (rankChoices[1] && rankChoices[2] && rankChoices[1] !== rankChoices[2] && !rankChoices[3]) {
    rankChoices[3] = COLORS.find((color) => color !== rankChoices[1] && color !== rankChoices[2]) ?? null;
  }
}

function updateCalibrationUi(displayElement: HTMLElement, rankChoices: Record<1 | 2 | 3, ColorName | null>): void {
  displayElement.querySelectorAll<HTMLButtonElement>("[data-rank][data-color]").forEach((button) => {
    const rank = Number(button.dataset.rank) as 1 | 2 | 3;
    const color = button.dataset.color as ColorName;
    const isSelected = rankChoices[rank] === color;
    const selectedElsewhere = !isSelected && COLORS.includes(color) && Object.values(rankChoices).includes(color);
    button.classList.toggle("is-selected", isSelected);
    button.classList.toggle("is-used-elsewhere", selectedElsewhere);
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });
}

function isCompleteRanking(rankChoices: Record<1 | 2 | 3, ColorName | null>): boolean {
  const values = [rankChoices[1], rankChoices[2], rankChoices[3]];
  return values.every(Boolean) && new Set(values).size === 3;
}

function getRankConfidence(displayElement: HTMLElement, rank: 1 | 2 | 3): number {
  const slider = displayElement.querySelector<HTMLInputElement>(`[data-rank-confidence="${rank}"]`);
  return Number(slider?.value ?? 50);
}

function shouldShowFeedback(trial: ExperimentTrial): boolean {
  return trial.phase === "practice_learning" || trial.phase === "practice_integration";
}

function buildFeedback(trial: ExperimentTrial, response: TrialResponse): { title: string; paragraphs: string[] } {
  if (trial.phase === "practice_integration") {
    const text = cleanFeedbackText(getMetadataString(trial, "feedback_text"));
    if (text) {
      return {
        title: "本题反馈",
        paragraphs: [text],
      };
    }
  }

  const correctColor = trial.correctColor;
  const correctLabel = correctColor ? colorLabel(correctColor) : "未知";
  const title = response.is_correct ? "回答正确" : "回答错误";
  const first = `目标士兵 ${trial.targetNode} 的真实阵营是${correctLabel}。`;

  if (!correctColor) {
    return { title: "已记录", paragraphs: ["你的回答已记录。"] };
  }

  const targetTable = trial.cueTables[trial.targetNode];
  const majorityColors = targetTable ? getMajorityColors(targetTable) : [];
  const majorityMatchesCorrect = majorityColors.includes(correctColor);

  if (response.is_correct && !majorityMatchesCorrect) {
    return {
      title,
      paragraphs: [first, "这一次，报告最多的颜色并不是真实阵营。你的判断没有只依赖报告最多的颜色。"],
    };
  }

  if (response.is_correct) {
    return { title, paragraphs: [first, "这次你的判断和真实阵营一致。"] };
  }

  if (majorityMatchesCorrect) {
    return {
      title,
      paragraphs: [first, `这一次，报告表中${correctLabel}报告最多。报告次数多的颜色通常更有参考价值。`],
    };
  }

  return {
    title,
    paragraphs: [first, "这一次，报告最多的颜色并不是真实阵营。观察报告通常有帮助，但不是确定答案。"],
  };
}

function getMajorityColors(table: CueTable): ColorName[] {
  const maxCount = Math.max(...COLORS.map((color) => table[color]));
  return COLORS.filter((color) => table[color] === maxCount);
}

function colorLabel(color: ColorName): string {
  const labels: Record<ColorName, string> = {
    red: "红色",
    green: "绿色",
    blue: "蓝色",
  };
  return labels[color];
}

function getMetadataString(trial: ExperimentTrial, key: string): string {
  const value = trial.metadata?.[key];
  return typeof value === "string" ? value : "";
}

function cleanFeedbackText(text: string): string {
  return text
    .replace(/^反馈[:：]\s*/, "")
    .replace(/红(?!色)/g, "红色")
    .replace(/绿(?!色)/g, "绿色")
    .replace(/蓝(?!色)/g, "蓝色");
}
