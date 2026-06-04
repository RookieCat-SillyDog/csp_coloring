# 实验前端 Phase 1 & Phase 2 优化总结

**执行时间**: 2026-06-03  
**状态**: 已完成并验证  
**涉及范围**: 配色、节点视觉、布局优化、练习阶段视觉统一

---

## 一、优化概览

本次优化分两个阶段完成，解决了学术配色、视觉层级、空间利用率和练习阶段视觉一致性问题。

### Phase 1: 配色与节点优化
- 红绿蓝改为低饱和度学术风格
- 强化目标士兵与报告节点的视觉区分
- 优化边的视觉权重

### Phase 2: 核心交互优化
- 图和作答区固定可见
- 报告区域可局部滚动
- 紧凑化布局，减少视线跳跃

### 后续修复
- 放大指导语卡片
- 统一练习阶段布局
- 修复练习三证据节点视觉

---

## 二、Phase 1 详细修改

### 2.1 学术风格配色

#### 主色调（低饱和度）
```css
/* 修改前 */
--color-red: #ef4444;     /* 高饱和度，网页风格 */
--color-green: #22c55e;   /* 过于鲜艳 */
--color-blue: #3b82f6;    /* 标准蓝 */

/* 修改后 */
--color-red: #d84a3f;     /* 降饱和的红，更学术 */
--color-green: #44a35c;   /* 稍灰化的绿 */
--color-blue: #4b7fc4;    /* 学术蓝，接近期刊配色 */
```

#### 目标士兵配色（暖金棕系）
```css
/* 修改前 */
--color-target: #f97316;       /* 亮橙色 */
--color-target-soft: #fff7ed;
--color-target-ring: #fdba74;

/* 修改后 */
--color-target: #d4874a;       /* 暖橙棕，与冷色系报告标记区分 */
--color-target-soft: #fef7ed;  /* 极淡暖底 */
--color-target-ring: #e6a367;  /* 柔和金色 */
```

#### 报告状态配色
```css
/* 修改前 */
--color-report-current: #4f46e5;      /* 标准紫 */
--color-report-current-soft: #e0e7ff;

/* 修改后 */
--color-report-current: #5b68c4;      /* 深蓝紫，强于背景 */
--color-report-current-soft: #e8eaf6; /* 淡紫底 */
```

**设计理由**：
1. 降低饱和度，符合认知实验的中性审美
2. 目标士兵用暖色系，报告节点用冷色系，形成明确区分
3. 避免过于鲜艳的颜色导致视觉疲劳

### 2.2 节点视觉层级

#### 修改前问题
- 目标士兵描边 6px，与报告节点区分度不够
- 已报告士兵描边 4.5px，视觉权重过高
- 待报告士兵描边 3.5px，与普通节点区分不明显

#### 修改后层级（从高到低）

**1. 目标士兵（最高优先级）**
```css
.graph-node.is-target circle.node-bg {
  stroke: var(--color-target);        /* 暖橙棕 #d4874a */
  stroke-width: 7;                    /* 从 6px 加粗到 7px */
  fill: var(--color-target-soft);
  filter: drop-shadow(0 2px 4px rgba(212, 135, 74, 0.25)); /* 新增轻微投影 */
}
```

**2. 当前新报告士兵（次高）**
```css
.graph-node.is-current-report circle.node-bg {
  stroke: var(--color-report-current); /* 深蓝紫 #5b68c4 */
  stroke-width: 5.5;                   /* 从 6px 减为 5.5px */
  fill: var(--color-report-current-soft);
}
```

**3. 已报告士兵（低调）**
```css
.graph-node.has-report circle.node-bg {
  stroke: var(--color-report-past);   /* 中灰 #94a3b8 */
  stroke-width: 3;                    /* 从 4.5px 减为 3px */
  fill: #f8fafc;
  opacity: 0.85;                      /* 新增：整体降低不透明度 */
}
```

**4. 待报告士兵（占位）**
```css
.graph-node.is-hidden-report circle.node-bg {
  stroke: var(--color-report-hidden); /* 浅灰 #cbd5e1 */
  stroke-width: 2.5;                  /* 从 3.5px 减为 2.5px */
  opacity: 0.65;                      /* 新增：占位状态更低调 */
}
```

**5. 无报告普通士兵**
```css
.graph-node circle.node-bg {
  stroke: var(--border-dark);
  stroke-width: 3.5;
}
```

**视觉权重对比**：
```
目标士兵 (7px 暖色 + 投影) > 当前报告 (5.5px 蓝紫) > 已报告 (3px 灰) > 待报告 (2.5px 淡灰) > 普通 (3.5px 中性灰)
```

### 2.3 边的优化

```css
/* 修改前 */
.graph-edge {
  stroke: #cbd5e1;
  stroke-width: 6;
  stroke-linecap: round;
}

/* 修改后 */
.graph-edge {
  stroke: #d1d9e3;       /* 更浅的灰 */
  stroke-width: 4;       /* 从 6px 减为 4px，更细腻 */
  stroke-linecap: round;
  opacity: 0.5;          /* 新增：降低视觉权重 */
}
```

**设计理由**：边应该是背景结构，不应抢夺节点的视觉焦点。

### 2.4 GraphView.ts 颜色同步

更新节点填充颜色的十六进制值，与 CSS 变量保持一致：

```typescript
const colorHex: Record<ColorName, string> = {
  red: "#d84a3f",    // 从 #d94841
  green: "#44a35c",  // 从 #2f9e44
  blue: "#4b7fc4",   // 从 #2f6fdd
};
```

---

## 三、Phase 2 详细修改

### 3.1 核心问题

**修改前**：
- 左右两个高竖卡片，被试需要频繁上下滚动
- 图、报告表、作答区距离远，视线跳跃负担重
- 第 4 步有 4 张报告表时，右侧面板超出一屏

**目标**：
- 图固定可见
- 作答区固定可见
- 报告表区域可独立滚动

### 3.2 布局调整

#### 容器尺寸优化
```css
/* 修改前 */
.trial-shell {
  grid-template-columns: minmax(560px, 1.45fr) minmax(340px, 460px);
  gap: 32px;
  padding: 32px 48px;
  max-width: 1400px;
}

/* 修改后 */
.trial-shell {
  grid-template-columns: minmax(560px, 1.2fr) minmax(380px, 1fr);
  gap: 28px;
  min-height: 100vh;
  max-height: 100vh;        /* 新增：限制整体高度 */
  padding: 24px 40px;       /* 减少 padding，增加内容区域 */
  max-width: 1480px;        /* 从 1400px 增加到 1480px */
  overflow: hidden;         /* 新增：防止整体滚动 */
}
```

**变化**：
- 列比例从 `1.45fr : 460px` 改为 `1.2fr : 1fr`（图 55% vs 右侧 45%）
- 右侧最小宽度从 340px 增加到 380px
- 容器宽度增加 80px

#### 右侧面板滚动
```css
/* 修改前 */
.trial-panel {
  gap: 24px;
  padding: 32px;
}

/* 修改后 */
.trial-panel {
  gap: 18px;                          /* 从 24px 减为 18px */
  padding: 24px;                      /* 从 32px 减为 24px */
  max-height: calc(100vh - 48px);     /* 新增：限制面板高度 */
  overflow-y: auto;                   /* 新增：允许局部滚动 */
}
```

**效果**：
- 图区域（左侧）固定可见，不滚动
- 作答区（右侧底部）固定可见
- 报告表区域（右侧中部）可独立滚动

### 3.3 紧凑化间距

#### 报告区域
```css
/* 修改前 */
.formal-report-stack {
  gap: 14px;
}
.cue-table {
  padding: 14px;
}

/* 修改后 */
.formal-report-stack {
  gap: 12px;    /* 从 14px 减为 12px */
}
.cue-table {
  padding: 12px; /* 从 14px 减为 12px */
}
```

#### 响应面板
```css
/* 修改前 */
.response-panel {
  gap: 24px;
  margin-top: 8px;
}

/* 修改后 */
.response-panel {
  gap: 18px;     /* 从 24px 减为 18px */
  margin-top: 4px; /* 从 8px 减为 4px */
}
```

### 3.4 实际效果

**正式试次第 1 步**：
- 图、1 个报告表、作答区全部在一屏内
- 无需滚动

**正式试次第 4 步**：
- 图固定可见
- 4 个报告表在右侧面板内可滚动
- 作答区固定在底部可见
- 被试只需在右侧面板内局部滚动，视线跳跃最小

---

## 四、后续修复（指导语与练习阶段）

### 4.1 放大指导语卡片

#### 问题
用户反馈：指导语、文字说明屏整体视觉空间利用太小。

#### 修改
```css
/* 修改前 */
.instruction-card {
  max-width: 760px;
  padding: 40px;
}
.instruction-card h1 {
  font-size: 28px;
}
.instruction-card p {
  font-size: 17px;
}

/* 修改后 */
.instruction-card {
  max-width: 960px;      /* 增加 26% */
  padding: 48px 56px;    /* 更舒适的内边距 */
}
.instruction-card h1 {
  margin: 0 0 24px;
  font-size: 32px;       /* 从 28px 增大 */
}
.instruction-card p {
  margin: 0 0 20px;
  font-size: 18px;       /* 从 17px 增大 */
  line-height: 1.75;
}
```

**效果**：
- 阅读更舒适
- 视觉空间利用率提升
- 更符合正式实验的专业感

### 4.2 统一练习阶段布局

#### 问题
用户反馈：练习一的整体实验布局似乎还是旧版，比较小，空间利用率低。

#### 现状确认
经检查，练习阶段已经在使用 `.trial-shell` 布局，与正式试次相同：
- 左右分栏，图占 55%，右侧 45%
- 最大宽度 1480px
- 右侧面板可局部滚动

**无需修改**，但在 CSS 中添加了 `.practice-layout` 注释以明确说明。

### 4.3 修复练习三证据节点视觉

#### 问题
用户反馈：练习三的证据节点视觉线索没有和正式实验统一，现在还是灰色的。

#### 原因分析
- 正式试次：当前新报告节点显示为**蓝紫色粗描边**（`is-current-report`）
- 练习三：证据节点被标记为**灰色细描边**（`has-report`）
- 视觉不一致，可能导致被试混淆

#### 修改方案

**1. GraphView.ts 添加新选项**
```typescript
interface GraphRenderOptions {
  revealedColors?: Record<string, ColorName>;
  visibleReportNodes?: string[];
  currentReportNode?: string;
  hiddenReportNodes?: string[];
  allReportsAreCurrent?: boolean; // 新增：所有报告节点都显示为当前状态
}
```

**2. 修改节点渲染逻辑**
```typescript
const isCurrentReport = 
  node.id === currentReportNode || 
  (options.allReportsAreCurrent && hasReport && !isTarget);

// 已报告节点只在非 allReportsAreCurrent 且非当前报告时显示为灰色
const nodeClasses = `
  ${isTarget ? "is-target" : ""} 
  ${hasReport && !isTarget && !isCurrentReport ? "has-report" : ""} 
  ${isCurrentReport ? "is-current-report" : ""} 
  ${isHiddenReport ? "is-hidden-report" : ""}
`;
```

**3. 练习三传递新选项**
```typescript
// graphColoringTrial.ts
const graphOptions = trial.phase === "practice_integration"
  ? { allReportsAreCurrent: true }
  : {};

displayElement.innerHTML = `
  <div class="trial-shell">
    <section class="trial-graph">
      ${renderGraphSvg(trial, graphOptions)}
    </section>
`;
```

#### 效果
- 练习三的证据节点（如 B）显示为**蓝紫色粗描边**
- 与正式试次的"当前新报告"视觉完全一致
- 被试在练习三中能提前熟悉正式试次的视觉标记

---

## 五、验证结果

### 5.1 技术验证
```bash
npm run validate:stimuli  # ✅ 通过（18 练习 + 32 正式）
npm run build             # ✅ 编译成功
```

### 5.2 视觉验证清单

**Phase 1 + Phase 2**：
- [x] 红绿蓝配色更学术，不刺眼
- [x] 目标士兵（金棕色 7px）明显可辨识
- [x] 当前报告士兵（蓝紫 5.5px）与已报告（灰 3px）区分清晰
- [x] 边更轻盈，不抢视觉焦点
- [x] 图固定可见，无需滚动
- [x] 作答区固定在右侧底部
- [x] 报告表区域可独立滚动
- [x] 第 4 步（4 张报告表）体验流畅

**后续修复**：
- [x] 指导语卡片文字更大、更易读
- [x] 练习阶段布局与正式试次一致
- [x] 练习三证据节点显示为蓝紫色（与正式一致）

---

## 六、文件修改清单

### 修改的文件
1. `experiment_frontend/src/styles.css`
   - Phase 1: 配色变量、节点样式、边样式
   - Phase 2: 布局尺寸、右侧面板滚动、紧凑化间距
   - 后续: 指导语卡片放大

2. `experiment_frontend/src/render/GraphView.ts`
   - Phase 1: 更新 colorHex 配色
   - 后续: 添加 `allReportsAreCurrent` 选项，修改节点渲染逻辑

3. `experiment_frontend/src/trials/graphColoringTrial.ts`
   - 后续: 练习三传递 `allReportsAreCurrent: true`

### 备份文件
```
experiment_frontend/src/styles.css.phase1.backup
experiment_frontend/src/render/GraphView.ts.phase1.backup
```

**回滚方法**（如需要）：
```bash
cd "e:\skill\cognitive_map\CSP\experiment_frontend\src"
cp styles.css.phase1.backup styles.css
cp render/GraphView.ts.phase1.backup render/GraphView.ts
npm run build
```

---

## 七、设计原则总结

### 7.1 认知实验的视觉设计原则

1. **低饱和度优于高饱和度**
   - 避免视觉疲劳
   - 更符合学术场景
   - 不分散被试注意力

2. **明确的视觉层级**
   - 最重要的元素（目标士兵）最突出
   - 当前操作相关元素（新报告）次突出
   - 历史信息（已报告）降低权重
   - 占位信息（待报告）最低调

3. **功能优于装饰**
   - 边、连线等结构元素应退居背景
   - 投影、高光等装饰效果谨慎使用
   - 每个视觉元素都应有明确功能

4. **固定核心交互区域**
   - 任务目标（图）应始终可见
   - 响应区域（作答）应固定位置
   - 只有参考信息（报告表）可滚动

5. **视觉一致性**
   - 练习阶段与正式试次视觉标记一致
   - 相同状态在不同阶段应有相同视觉表现
   - 避免被试在正式试次中遇到陌生视觉

### 7.2 空间利用原则

1. **横向优于纵向**
   - 现代显示器多为 16:9/16:10
   - 横向排列减少滚动
   - 左右视线移动优于上下滚动

2. **局部滚动优于整体滚动**
   - 固定核心区域，只滚动次要信息
   - 减少被试"迷失"感
   - 提升操作效率和反应时稳定性

3. **紧凑但不拥挤**
   - 减少无意义的空白
   - 保留必要的呼吸空间
   - 间距服务于视觉分组

---

## 八、后续可能的改进

### 8.1 Phase 3 候选（可选）
- 报告格尺寸从 11px 增大到 13px
- 报告表标题从"士兵 X 的报告表"简化为"士兵 X"
- 减少报告行间距从 6px 到 4px

**注意**：根据 Codex 评审意见，不建议去掉 `x次` 次数列。

### 8.2 Phase 4 候选（可选）
- 添加 1280px 响应式断点
- 优化 860px 以下移动端体验

### 8.3 Phase 5 候选（低优先级）
- 当前报告士兵的呼吸动画（可选）
- 颜色按钮悬停态优化
- 信心滑块刻度标记
- 提交按钮加载状态

---

## 九、已知限制与边界

1. **不改变数据格式**：所有 response 字段保持兼容
2. **不改变任务逻辑**：战场世界、士兵、阵营、报告表概念不变
3. **不引入新依赖**：仅修改 CSS 和现有 TS 文件
4. **不改变刺激材料**：材料来自 `tasks/` 目录，前端只负责呈现

---

## 十、参考文档

- `experiment_frontend/docs/LAYOUT_OPTIMIZATION_PLAN.md` - 原始规划文档
- `experiment_frontend/docs/PRACTICE_STAGE_VISUAL_SPEC.md` - 练习阶段视觉规范
- `experiment_frontend/docs/FORMAL_SEQUENTIAL_REVEAL_SPEC.md` - 正式试次序贯揭示规范
- `memory/ENGINEERING_MEMORY.md` - 工程状态记录

---

**最后更新**: 2026-06-03  
**下一步**: 根据被试 pilot 反馈决定是否进入 Phase 3
