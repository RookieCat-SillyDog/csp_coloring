# Practice Stage Visual and Interaction Spec

更新时间：2026-06-03

适用范围：`experiment_frontend/` 练习阶段，不包括正式实验完整实现。

当前职责划分：

1. 规划 agent：维护本文档、审查实现，不直接写前端代码。
2. 实现 agent：按本文档修改前端。
3. 审查标准：以本文档的 must / should / must not 为准。

## 1. 当前问题

当前前端只是工程骨架，视觉和交互都不是正式方案。主要问题：

1. 练习 0A、0B、0C 使用同一个 trial shell，任务目标不清楚。
2. 页面像开发调试面板，不像正式实验界面。
3. 图、目标节点、线索表、作答区没有清晰的注意优先级。
4. 色彩按钮过于粗糙，红绿蓝大色块显得幼稚，也不利于色觉差异用户。
5. cue table（线索表）的含义没有通过视觉结构表达出来。
6. 0A 需要反馈，0B 不应反馈，0C 需要图结构整合反馈；当前没有区分。
7. 当前 “Target E / phase / id” 是工程字段，不应直接暴露给被试。
8. 当前练习阶段没有稳定的 trial header、progress、response lock、feedback state。

本文档定义下一版练习阶段的视觉和交互目标。实现时不要扩展到正式实验，先把练习阶段做好。

## 2. 设计目标

练习阶段的目标不是收集主要模型诊断数据，而是让被试理解：

1. 每个节点代表一个对象，只能属于 red、green、blue 三类之一。
2. 相连节点不能属于同一颜色。
3. 线索表是某个节点的 noisy reports（有噪声报告），不是确定答案。
4. 0A 训练单个节点线索表理解。
5. 0B 无反馈测量 cue sensitivity（线索敏感度）或后续可估计的 `q_hat`。
6. 0C 训练最小图结构整合：邻居节点报告会通过边约束影响目标节点。

视觉目标：

1. 被试第一眼能看到当前要判断哪个目标节点。
2. 线索表应像“报告计数”，不是普通表格。
3. 图结构应简洁、稳定、无装饰。
4. 反馈应短、明确，不解释复杂全局计数。
5. 页面应像实验任务，不像网页产品或营销页。

## 3. 全局视觉规范

### 3.0 语言规范

所有被试看得到的界面文案必须使用简体中文。包括开始页、trial 内说明、颜色选项、信心控件、提交按钮、反馈、结束页和下载按钮。

内部代码字段、导出数据字段、类型名和注释不受此限制，但不得直接暴露在被试界面中。

### 3.1 页面布局

桌面端使用三栏结构：

```text
左：任务进度和简短规则
中：图结构和目标节点
右：线索表、作答、反馈
```

建议宽度：

```text
page max width: 1180-1280px
left rail: 180-220px
center graph area: flexible, min 460px
right panel: 320-380px
```

移动端暂不作为正式收数优先目标，但页面不能破裂。小屏时改为：

```text
顶部：进度和规则
中部：图
下部：线索表和作答
```

### 3.2 禁止的视觉形式

实现中不得使用：

1. 大面积渐变背景。
2. 装饰性圆点、光斑、插画背景。
3. 过大的 hero 标题。
4. 卡片套卡片。
5. 把图放进厚重阴影卡片。
6. 页面内展示工程字段名，例如 `trial_id`、`phase`、`blockId`。
7. 用红绿蓝三个纯色大按钮作为唯一识别方式。

### 3.3 推荐色彩

背景使用中性灰白：

```text
page bg: #F6F7F9
surface: #FFFFFF
border: #D7DEE8
text primary: #202833
text secondary: #5E6B7A
edge: #A8B3C2
target outline: #111827
```

颜色类别使用稳定但不过饱和的三色：

```text
red:   #C84A43
green: #3A8F5A
blue:  #3F6FB6
```

颜色必须同时配文字标签，不能只靠颜色区分。

### 3.4 字体和字号

使用系统 sans-serif：

```css
font-family: Inter, "Segoe UI", Arial, "Microsoft YaHei", sans-serif;
```

建议字号：

```text
body: 15-16px
trial title: 22-26px
section label: 13-14px
node label: 15-17px
button: 15-16px
feedback: 15-16px
```

不要使用 viewport-based font size（随视口宽度变化的字号）。

## 4. 图结构呈现

### 4.1 节点

节点视觉状态：

1. 普通节点：白底、灰边、黑字。
2. 当前目标节点：白底、黑色粗边、外圈 focus ring。
3. 已提供线索的节点：显示小型 report badge（报告标记），不要直接填成真实颜色。
4. 反馈后若需要显示真实颜色，只在反馈状态显示，并保留文字标签。

目标节点必须比其他节点更明显，但不要过大。建议：

```text
normal radius: 22
target radius: 26
target ring radius: 31
```

### 4.2 边

边表示 hard constraint（硬约束）：相连节点不能同色。

视觉：

```text
stroke: #A8B3C2
stroke width: 3
```

0C 中，如果反馈解释涉及某条边，应允许高亮相关边：

```text
highlight edge: #111827, width 4
```

### 4.3 图区域

图区域不是卡片堆叠。建议使用白色图面和轻边框：

```text
background: #FFFFFF
border: 1px solid #D7DEE8
border-radius: 6px
```

图节点位置来自刺激 JSON，不在前端自动布局。

## 5. 线索表呈现

线索表应表达“多个报告者对同一节点颜色的报告计数”。

推荐形式：每个颜色一行，包含：

```text
颜色标签 + 5 个离散报告格 + 次数文本
```

示例：

```text
士兵 B 的报告表
观察员共报告 5 次

红色    ■ ■ ■ ■ □    4 次
绿色    ■ □ □ □ □    1 次
蓝色    □ □ □ □ □    0 次
```

规则：

1. 固定总数为 5 时，使用 5 个离散小格，不使用连续进度条。
2. 计数为 0 时仍显示该颜色行。
3. tie（并列）时不要自动标出“正确”，只显示计数。
4. 不显示 `type: 3-2-0` 这类工程字段。
5. 三行颜色顺序固定为红色、绿色、蓝色，不按报告次数排序。
6. 不显示百分比，例如不写“红色 80%”。
7. 不显示“最多”“推荐”“更可能”等解释性标签。
8. 不自动高亮多数颜色。
9. 颜色必须配文字标签，不能只靠颜色识别。
10. 每个被报告士兵单独一张报告表，不把多名士兵的报告合并。

选择离散报告格的原因：

1. 它贴合“观察员一共观察了五次”的任务设定。
2. 它比普通数值表更自然，比百分比更不容易被误读成真实概率。
3. 它比连续进度条更少暗示系统强度或推荐答案。
4. 它不会额外强化 majority heuristic（多数启发式）。

0A 和 0B 只有目标节点自己的线索表。0C 显示 evidence nodes（证据节点）的线索表，不显示目标节点自己的线索表，除非刺激明确包含。

## 6. 作答控件

### 6.1 颜色选择

颜色选择按钮使用三段式按钮组：

```text
[ Red ] [ Green ] [ Blue ]
```

每个按钮包含：

1. 颜色小方块。
2. 英文或中文颜色名，整套实验内保持一致。
3. 选中态。

不要使用纯色大按钮。按钮背景应为白色或浅色，颜色只作为小标记和选中边框。

### 6.2 信心评分

练习阶段建议保留 confidence（信心）控件，但形式要克制：

```text
How confident are you?
0     50     100
[----------slider----------]
```

0A 可选：如果训练阶段负担过大，可以先不收信心，只在 0B/0C 收。实现 agent 不应自行删除字段；如果改动 response schema，必须在 PR / 汇报中说明。

### 6.3 提交

颜色选择后不应立刻结束 trial。应有明确按钮：

```text
Submit
```

原因：被试可能误点颜色。响应记录应包含：

```text
first_choice_color
final_response_color
choice_change_count
rt_first_choice_ms
rt_submit_ms
confidence
```

如果当前阶段只实现最小版本，至少必须记录：

```text
response_color
confidence
rt_ms
```

## 7. 练习阶段分段规格

### 7.1 Block 0A: Cue Learning with Feedback

目的：训练被试理解单节点线索表。

页面结构：

```text
左：Practice 1/3，当前 trial 进度，规则一句话
中：5 节点图，目标节点高亮
右：目标节点线索表，颜色选择，提交
```

规则文案建议：

```text
Use the reports for the highlighted node to judge its color.
```

反馈：

1. 提交后显示正确/错误。
2. 显示真实颜色。
3. 如果多数报告与真实颜色一致，文案应简短：

```text
Correct. The true color was red.
```

4. 如果多数报告与真实颜色不一致，文案必须说明报告有噪声：

```text
The true color was red. Reports are helpful but not always correct.
```

反馈时不进入下一 trial，显示 `Next`。

必须支持：

1. 6 个 0A trials。
2. 每题反馈。
3. majority-wrong trial 不应被解释成“线索没用”。

### 7.2 Block 0B: Cue Calibration without Feedback

目的：无反馈测量被试如何使用线索表，并记录其对三个阵营的完整排序。

页面结构同 0A，但不显示反馈。

规则文案建议：

```text
Judge the highlighted node from its reports. No feedback will be shown.
```

必须支持：

1. 8 个 0B trials。
2. 不显示 correct/incorrect。
3. 不显示 true color。
4. 记录三个阵营的排序和各自 confidence。
5. 保留通用 `response_color` / `confidence` 字段作为第一选择兼容字段。

0B 不应出现训练性解释。它是校准任务，不是教学任务。

### 7.3 Block 0C: Graph Integration Practice with Feedback

目的：训练被试把邻居节点线索和图约束结合起来。

页面结构：

```text
左：Practice 3/3，规则一句话
中：5 节点图，目标 E 高亮，evidence nodes 有 report badge
右：证据节点线索表，目标颜色选择，提交
```

规则文案建议：

```text
Use the reports about neighboring nodes and the graph rule: connected nodes cannot share a color.
```

反馈：

1. 显示目标节点真实颜色。
2. 高亮关键 evidence node 和相关边。
3. 使用 `metadata.feedback_text`，但可做轻微排版，不改含义。
4. 反馈不讲全局合法完成计数。

必须支持：

1. 4 个 0C trials。
2. `0C_I01` 是 majority heuristic violation（多数启发式违背）练习 trial，反馈必须清楚表达“报告多数不等于真实状态”。
3. 反馈状态下可以显示 evidence node 的真实颜色，但必须和 trial 作答状态区分。

## 8. Trial State Machine

每个练习 trial 至少有这些状态：

```text
ready -> choosing -> submitted -> feedback_or_next -> complete
```

含义：

1. `ready`：页面渲染完成，RT 计时可以开始。
2. `choosing`：被试选择颜色和信心。
3. `submitted`：提交后锁定控件。
4. `feedback_or_next`：0A/0C 显示反馈，0B 直接显示下一题按钮或自动进入下一题。
5. `complete`：调用 jsPsych finishTrial。

不能在颜色按钮 click 时直接 finishTrial。

## 9. Response Schema 要求

练习阶段 response 至少包含：

```text
participant_id
trial_id
phase
block_id
trial_index_in_block
graph_id
target_node
response_color
confidence
rt_ms
correct_color
is_correct
feedback_shown
```

建议额外包含：

```text
first_choice_color
rt_first_choice_ms
choice_change_count
rt_submit_ms
viewport_width
viewport_height
```

0B 的 `correct_color` 和 `is_correct` 可以为空；不要为了字段完整而编造答案。

## 10. Implementation Todo

### Todo A: 组件拆分

新建或重构为：

```text
src/practice/PracticeTrial.ts
src/practice/PracticeIntro.ts
src/practice/PracticeFeedback.ts
src/render/GraphView.ts
src/render/CueReportBars.ts
src/render/ColorChoiceGroup.ts
src/render/ConfidenceSlider.ts
```

要求：

1. `PracticeTrial` 根据 `phase` 切换 0A/0B/0C 行为。
2. `GraphView` 只负责图，不包含任务文案。
3. `CueReportBars` 替代当前普通 cue table。
4. `ColorChoiceGroup` 不直接结束 trial，只更新选择状态。

### Todo B: 视觉重做

修改：

```text
src/styles.css
```

或拆分为：

```text
src/styles/base.css
src/styles/practice.css
src/styles/graph.css
src/styles/controls.css
```

要求：

1. 三栏布局。
2. 统一 neutral surface。
3. 删除纯色大按钮。
4. 目标节点、证据节点、反馈状态有明确视觉差异。
5. cue table 改成 report bars。

### Todo C: 练习流程

修改：

```text
src/experiment/timeline.ts
```

要求：

1. 加入 0A、0B、0C 分段 intro。
2. 分段显示 progress。
3. 0A/0C 有反馈和 Next。
4. 0B 无反馈。
5. 练习结束后再进入正式阶段占位页，不急着完善正式 trial。

### Todo D: 数据记录

修改：

```text
src/schema/response.ts
src/trials 或 src/practice 下的 trial plugin
```

要求：

1. 不在颜色 click 时结束 trial。
2. 记录 submit RT。
3. 记录 confidence。
4. 记录是否显示反馈。
5. response 字段名稳定，不要混用 camelCase 和 snake_case。建议导出数据使用 snake_case。

### Todo E: 验证

实现 agent 完成后必须运行：

```powershell
cd experiment_frontend
npm run validate:stimuli
npm run build
```

如果启动页面，还应报告实际 URL，例如：

```text
http://127.0.0.1:5175/
```

## 11. Review Checklist

审查时按以下标准判断是否通过。

### Must

1. `npm run build` 通过。
2. `npm run validate:stimuli` 显示 18 个 practice trials 和 32 个 formal trials。
3. 0A 有反馈。
4. 0B 无反馈。
5. 0C 有图结构整合反馈。
6. 颜色选择后不会立刻结束 trial。
7. 页面不显示 `trial_id`、`phase`、`blockId` 等工程字段。
8. 目标节点一眼可见。
9. 线索表以 report bars 显示。
10. 数据中包含 response、confidence、RT。

### Should

1. 反馈状态高亮相关节点和边。
2. 颜色按钮有选中态。
3. 被试可在提交前修改选择。
4. 小屏布局不破裂。
5. 视觉整体克制、清楚、适合实验室任务。

### Must Not

1. 不得把 0A/0B/0C 混成同一种 trial。
2. 不得把 majority color（多数颜色）显示成正确答案。
3. 不得在 0B 显示反馈。
4. 不得改动 `tasks/` 原始刺激文件。
5. 不得删除当前 schema 校验。
6. 不得把 GitHub Pages 当作正式收数后端。

## 12. Deferred Work

以下内容暂不做：

1. 正式 4 步序贯揭示完整 UI。
2. JATOS 或后端 API。
3. 被试信息页。
4. consent（知情同意）页。
5. 断点续做。
6. 数据加密或服务器端数据安全策略。
7. 模型预测可视化。

练习阶段视觉确认后，再进入正式实验 trial 设计。
