# Formal Sequential Reveal Trial Spec

更新时间：2026-06-03

适用范围：`experiment_frontend/` 正式实验 trial。本文档定义正式 trial 的序贯揭示、界面行为、数据记录和实现 TODO。练习阶段规范见：

```text
experiment_frontend/docs/PRACTICE_STAGE_VISUAL_SPEC.md
experiment_frontend/docs/PRACTICE_INSTRUCTIONS_COPY_SPEC.md
```

## 1. 研究问题和方法边界

本实验考察被试在部分观测图着色任务中，如何根据逐步送达的观察报告和图上的竞争关系，更新对目标士兵 `E` 所属阵营的判断。

正式 trial 使用实验范式而不是问卷或纯建模，是因为关键数据不是被试的事后解释，而是每一步新信息到来后的判断、信心和反应时间。正式 trial 的核心观测量是序贯更新轨迹：

```text
step 1 response -> step 2 response -> step 3 response -> step 4 response
```

当前设计假设：

1. 被试理解报告表是有噪声的观察报告，不是真实阵营。
2. 被试理解有连线的两名士兵不能属于同一阵营。
3. 每一步新增一名证据士兵的报告表，已揭示报告表继续保留。
4. 被试每一步都重新判断目标士兵 `E` 最可能属于哪个阵营，并报告信心。

限制：

1. `step_posteriors` 是后台规范模型参考，不直接呈现给被试。
2. 本文档不定义模型拟合、JATOS、后端收数或知情同意页。
3. 当前正式 trial 不应一次性展示 4 张报告表；一次性展示会破坏序贯更新数据。

## 2. 数据依据

正式 trial 来自：

```text
tasks/evidence_strength_assignment_v1/selected_evidence_strength_trials.json
```

前端同步后对应：

```text
experiment_frontend/public/stimuli/formal_trials.json
```

每条正式 trial 必须具备：

```text
phase = "formal"
targetNode = "E"
revealOrder.length = 4
posteriors.length = 4
cueTables 中包含 revealOrder 的 4 名士兵
```

当前已核实：

```text
formal trial count = 32
all revealOrder.length = 4
all posteriors.length = 4
```

示例：

```json
{
  "id": "B1_G1_M1_C000300",
  "targetNode": "E",
  "revealOrder": ["C", "A", "D", "F"],
  "posteriors": [
    {"red": 0.2179, "green": 0.3910, "blue": 0.3910},
    {"red": 0.1596, "green": 0.2121, "blue": 0.6283},
    {"red": 0.0460, "green": 0.3116, "blue": 0.6425},
    {"red": 0.0040, "green": 0.3790, "blue": 0.6170}
  ]
}
```

## 3. 正式 Trial 总体结构

一条正式 trial 不是一个单次反应，而是 4 个 reveal step。

```text
Trial start
  Step 1: reveal node revealOrder[0] -> response 1
  Step 2: reveal node revealOrder[1] -> response 2
  Step 3: reveal node revealOrder[2] -> response 3
  Step 4: reveal node revealOrder[3] -> response 4
Trial complete
```

每一步都要收集：

```text
response_color
confidence
rt_first_choice_ms
rt_submit_ms
choice_change_count
```

第 4 步提交后才进入下一条正式 trial。

## 4. 被试界面文案规范

所有被试看得到的正式实验文案必须使用简体中文。

推荐术语：

```text
正式实验
当前题目
第 1 / 4 步
已收到 1 / 4 份报告
目标士兵
新收到的报告
已收到的报告
待送达
红色 / 绿色 / 蓝色
信心
提交
继续接收下一份报告
下一题
```

避免在被试界面出现：

```text
trial
phase
block
mask
cue
posterior
revealOrder
stepPosterior
evidence node
```

如果必须解释证据节点，使用：

```text
有报告的士兵
收到报告的士兵
```

## 5. Trial 内布局

正式 trial 建议保持当前左右结构，但必须支持 step 状态。

桌面端：

```text
左侧：图结构
右侧：正式实验信息、目标士兵、step 进度、报告表、作答区
```

右侧内容顺序：

```text
1. 顶部：正式实验 / 当前题目
2. 标题：判断目标士兵的阵营
3. 说明：请根据已收到的观察报告和竞争关系，判断目标士兵最可能属于哪个阵营。
4. 目标士兵：E
5. Step 进度：第 1 / 4 步，已收到 1 / 4 份报告
6. 报告表区域
7. 作答区
```

报告表区域分为：

```text
新收到的报告
已收到的报告
待送达
```

其中：

1. 当前 step 新揭示的报告表放在最上方。
2. 之前 step 已揭示的报告表保留在下方。
3. 尚未揭示的士兵可以在图上标记为“待送达”，但右侧不显示其报告表内容。

## 6. 图结构呈现

节点状态必须区分：

1. 普通士兵：白底、灰边。
2. 目标士兵 `E`：低饱和橙色或当前已定的目标色，稳定高亮。
3. 当前新揭示的士兵：与目标色不同的强调样式，例如灰蓝实线外圈。
4. 已揭示的士兵：较弱的灰蓝标记。
5. 待送达但属于本 trial revealOrder 的士兵：可显示浅灰虚线外圈，但不能泄露报告内容。

目标士兵和报告士兵不能使用同一种高亮逻辑。

图中不显示真实阵营颜色，不显示规范后验，不显示正确答案。

## 7. 报告表呈现

正式 trial 的报告表继续使用离散报告格：

```text
士兵 C 的报告表
观察员共报告 5 次

红色    ■ ■ □ □ □    2次
绿色    ■ □ □ □ □    1次
蓝色    ■ ■ □ □ □    2次
```

规则：

1. 三行固定为红色、绿色、蓝色。
2. 每行固定 5 个离散小格。
3. 右侧显示 `x次`。
4. 不按次数排序。
5. 不显示百分比。
6. 不高亮多数颜色。
7. 不显示“更可能”“推荐”等提示。
8. 不把多名士兵报告合并成总表。

报告表在每一步的显示范围：

```text
visibleReportNodes = revealOrder.slice(0, currentStep)
```

当前 step 从 1 开始。

## 8. 作答交互

每一步必须按以下顺序完成：

```text
选择阵营 -> 调整信心 -> 点击提交
```

颜色选择不能自动进入下一步。

提交按钮规则：

1. 未选择颜色时禁用。
2. 选择颜色后启用。
3. 被试提交前可以改选颜色和调整信心。
4. 点击提交后锁定当前 step 的控件。
5. step 1-3 提交后显示“继续接收下一份报告”。
6. step 4 提交后显示“下一题”或直接进入下一条 trial，推荐显示短暂确认后进入下一题。

信心控件：

```text
你对这个判断有多大信心？
0% 到 100%
```

不建议在正式 trial 中显示反馈或正确答案。

## 9. State Machine

正式 trial 内部状态：

```text
init
step_ready
step_choosing
step_submitted
between_steps
trial_complete
```

状态含义：

1. `init`：加载 trial，设置 `currentStep = 1`。
2. `step_ready`：渲染当前已揭示报告，开始当前 step RT 计时。
3. `step_choosing`：被试选择颜色和信心。
4. `step_submitted`：保存当前 step response，锁定控件。
5. `between_steps`：如果 `currentStep < 4`，等待被试点击继续。
6. `trial_complete`：第 4 步提交后调用 `finishTrial`。

关键要求：

1. 每一步 RT 都从该 step 的报告显示完成后开始计时。
2. 不能把第 1 步 RT 算作整条 trial 的 RT。
3. 第 4 步提交时间可额外保存为整条 trial 的总时长。

## 10. Response Schema

正式 trial 建议一条 jsPsych 数据记录保存完整 4 步响应，避免把一个正式 trial 拆成 4 条独立 jsPsych trial 后丢失 trial 内结构。

推荐字段：

```text
trial_id
phase
block_id
graph_id
target_node
reveal_order
step_count
responses
final_response_color
final_confidence
rt_total_ms
```

其中 `responses` 是长度为 4 的数组：

```json
[
  {
    "step": 1,
    "revealed_node": "C",
    "visible_nodes": ["C"],
    "response_color": "blue",
    "confidence": 62,
    "rt_first_choice_ms": 2100,
    "rt_submit_ms": 5200,
    "choice_change_count": 1,
    "normative_p_E_red": 0.2179,
    "normative_p_E_green": 0.3910,
    "normative_p_E_blue": 0.3910
  }
]
```

是否记录规范后验：

1. 可以记录在导出数据中，便于后续分析。
2. 不得呈现给被试。
3. 字段名建议使用 `normative_p_E_*`，明确这是后台参考值，不是被试看到的信息。

兼容字段：

```text
response_color = final_response_color
confidence = final_confidence
rt_ms = rt_total_ms
```

这样可以兼容当前数据下载逻辑，但正式分析应使用 `responses`。

## 11. 开发者跳转规范

当前 `?dev=1` 开发跳转面板可以保留。

正式 trial 跳转后默认进入 step 1。

后续可增加 step 跳转参数：

```text
?dev=1&trial=B1_G1_M1_C000300&step=3
```

如果实现 step 跳转：

1. 只在开发模式启用。
2. `step` 只能是 1、2、3、4。
3. 进入 step 3 时应显示 step 1-3 已揭示报告，但不应伪造 step 1-2 被试响应。
4. 开发跳转产生的数据应带字段：

```text
dev_jump = true
dev_start_step = 3
```

正式收数不使用 step 跳转。

## 12. 实现 TODO

### Todo A: 正式 trial 组件拆分

建议新建：

```text
src/trials/formalSequentialTrial.ts
```

或在现有：

```text
src/trials/graphColoringTrial.ts
```

中把 formal 分支拆成独立函数。

要求：

1. `practice_learning`、`practice_calibration`、`practice_integration` 继续使用当前练习逻辑。
2. `formal` 进入专门的 4-step sequential reveal 逻辑。
3. 不要让正式 trial 复用一次性显示全部报告表的 `renderCueTables(trial)`。

### Todo B: 报告表渲染支持 step

修改或新增：

```text
src/render/CueTableView.ts
```

建议新增函数：

```text
renderCueTablesForStep(trial, currentStep)
```

逻辑：

```text
visible = trial.revealOrder.slice(0, currentStep)
current = trial.revealOrder[currentStep - 1]
previous = trial.revealOrder.slice(0, currentStep - 1)
hidden = trial.revealOrder.slice(currentStep)
```

输出：

1. 当前新报告。
2. 已收到报告。
3. 待送达列表或占位。

### Todo C: 图渲染支持 step

修改：

```text
src/render/GraphView.ts
```

建议参数：

```text
renderGraphSvg(trial, { currentStep })
```

至少支持：

```text
visibleReportNodes
currentReportNode
hiddenReportNodes
targetNode
```

图中只标记状态，不显示未揭示报告内容。

### Todo D: 正式 step 响应记录

修改：

```text
src/schema/response.ts
src/trials/graphColoringTrial.ts
```

新增类型：

```text
FormalStepResponse
FormalTrialResponse
```

必须记录 4 个 step response。第 4 步 response 同步到兼容字段：

```text
response_color
confidence
rt_ms
```

### Todo E: 正式实验阶段说明

修改：

```text
src/experiment/timeline.ts
```

正式实验开始页应说明：

```text
接下来进入正式实验。

每一题中，目标士兵固定为 E。

观察员会依次送来 4 名士兵的报告表。每收到一份新报告，请结合已经收到的报告和网络上的竞争关系，重新判断目标士兵 E 最可能属于哪个阵营，并报告信心。

正式实验不会显示正确答案。
```

按钮：

```text
开始正式实验
```

### Todo F: 样式调整

修改：

```text
src/styles.css
```

新增或调整：

```text
.formal-step-indicator
.formal-report-section
.formal-current-report
.formal-previous-reports
.formal-hidden-reports
.between-step-panel
```

要求：

1. step 进度明显但不喧宾夺主。
2. 当前新报告比已收到报告更突出。
3. 待送达不能像可读报告表。
4. 右侧报告表不能重叠，`x次` 必须可见。

## 13. 验证 TODO

实现后必须运行：

```powershell
cd experiment_frontend
npm run validate:stimuli
npm run build
```

必须人工检查：

1. 正式 trial 第 1 步只显示 1 张报告表。
2. 第 2 步显示 2 张报告表。
3. 第 3 步显示 3 张报告表。
4. 第 4 步显示 4 张报告表。
5. 每一步都必须提交一次判断和信心。
6. 第 1-3 步提交后不会结束整条 trial。
7. 第 4 步提交后才进入下一条正式 trial。
8. 普通被试界面不显示 `posterior`、`revealOrder`、`trial_id` 等工程字段。
9. `?dev=1` 跳转到正式 trial 时默认从 step 1 开始。

可用开发入口示例：

```text
http://127.0.0.1:5176/?dev=1&trial=B1_G1_M1_C000300
```

## 14. Review Checklist

### Must

1. 正式 trial 使用 4-step 序贯揭示。
2. 每一步只新增 1 名士兵的报告表。
3. 已揭示报告表在后续 step 保留。
4. 每一步都收 response 和 confidence。
5. 每一步都有独立 RT。
6. 不显示正确答案或反馈。
7. 不向被试显示后台后验。
8. 不一次性展示 4 张报告表。
9. 第 4 步才结束 trial。
10. 构建和刺激校验通过。

### Should

1. 当前新报告和已收到报告有清楚视觉层级。
2. 图中当前新揭示士兵有清楚但克制的标记。
3. 待送达士兵可被识别，但不泄露报告内容。
4. 数据导出保留完整 step response 数组。
5. 兼容字段仍可用于快速预览最终反应。

### Must Not

1. 不得把正式 trial 做成单次响应。
2. 不得把 `step_posteriors` 展示给被试。
3. 不得把报告表呈现为概率条。
4. 不得用多数报告颜色做视觉推荐。
5. 不得改动 `tasks/` 原始刺激文件。
6. 不得把开发者 step 跳转暴露给正式被试。

## 15. 暂缓内容

以下内容暂不在本轮实现范围：

1. 后端收数。
2. JATOS 集成。
3. 被试随机分组和 counterbalanced lists。
4. 正式数据质量控制页面。
5. 完整模型预测可视化。
6. 移动端正式收数适配。

