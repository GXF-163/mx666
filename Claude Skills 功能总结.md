# Claude Skills 功能总结

> 共 31 个 Skills，分为 3 大类：会话管理（1）、开发超能力（14）、内置工具（16）

---

## 一、会话管理类

| Skill | 功能描述 |
|-------|----------|
| **neat-freak** | 会话结束时的知识清理工具。自动比对项目文档（CLAUDE.md、README.md、docs/）与实际代码的一致性，识别过时内容并更新，防止文档腐烂。支持跨平台（Claude Code、Codex、OpenCode、OpenClaw）。 |

---

## 二、开发超能力类（skills_superpowers）

### 流程管理

| Skill | 功能描述 |
|-------|----------|
| **using-superpowers** | 元规则：在任何响应或操作之前，必须先检查并调用相关 skill。定义指令优先级和 skill 调用顺序。 |
| **brainstorming** | 实现前的必要步骤。通过结构化对话将模糊想法转化为完整设计方案，输出 spec 文档。支持浏览器可视化伴侣工具。 |
| **writing-plans** | 创建细粒度实现计划（每个任务 2-5 分钟），要求精确的文件路径、完整代码和预期输出，禁止占位符。 |
| **executing-plans** | 加载实现计划，逐项执行并验证，遇到阻塞时停下来请求帮助。 |
| **subagent-driven-development** | 通过子代理执行计划：每个任务派发一个独立子代理，完成后进行两阶段审查（规格合规 + 代码质量）。 |
| **dispatching-parallel-agents** | 将独立任务并行派发给多个专业子代理，适用于 3+ 个不同根因的失败或多个独立子系统故障。 |

### 代码质量

| Skill | 功能描述 |
|-------|----------|
| **test-driven-development** | 强制执行严格的红-绿-重构 TDD 纪律：先写失败测试，再写最少代码通过，最后重构。无失败测试则不写生产代码。 |
| **systematic-debugging** | 四阶段系统调试：调查根因 → 模式分析 → 假设验证 → 实施修复。3 次修复失败后质疑架构而非继续打补丁。 |
| **verification-before-completion** | 在声称完成之前必须运行验证命令并确认输出——先有证据，再有断言。 |
| **requesting-code-review** | 派发代码审查子代理，提供精确的上下文（git SHA、需求描述、计划），按严重程度处理反馈。 |
| **receiving-code-review** | 收到代码审查反馈时的结构化协议：READ-UNDERSTAND-VERIFY-EVALUATE-RESPOND-IMPLEMENT，禁止表演性附和。 |

### 工作空间

| Skill | 功能描述 |
|-------|----------|
| **using-git-worktrees** | 确保在隔离工作空间中工作，优先使用原生 worktree 工具，回退到手动 git worktree。自动检测并运行项目初始化。 |
| **finishing-a-development-branch** | 开发完成后的收尾流程：验证测试 → 检测工作空间 → 提供 4 种集成选项（本地合并、推送 PR、保持现状、丢弃）。 |

### 技能开发

| Skill | 功能描述 |
|-------|----------|
| **writing-skills** | 用 TDD 方法编写 skill 文档：先写测试场景，观察无 skill 时的失败，编写 skill，验证合规，最后封堵漏洞。 |

---

## 三、内置工具类（skills_Built-in）

### 文档处理

| Skill | 功能描述 |
|-------|----------|
| **docx** | 创建、读取、编辑 Word 文档。支持修订追踪、批注、表格、图片、脚注、多栏布局、目录等。 |
| **pdf** | 全方位 PDF 操作：读取、提取文本/表格、合并、拆分、旋转、水印、表单填充、加密、OCR。 |
| **pptx** | 创建、读取、编辑 PowerPoint 演示文稿。强调视觉设计质量，支持子代理 QA 检查。 |
| **xlsx** | 创建、编辑、分析电子表格。强调使用 Excel 公式而非硬编码值，支持金融模型标准。 |

### 创意设计

| Skill | 功能描述 |
|-------|----------|
| **algorithmic-art** | 使用 p5.js 创建生成式算法艺术，支持种子随机性和交互式参数探索。输出自包含 HTML 文件。 |
| **canvas-design** | 创建博物馆级视觉艺术（.png/.pdf），先构思设计哲学再进行画布表达，90% 视觉 + 10% 文字。 |
| **brand-guidelines** | 应用 Anthropic 官方品牌色彩和排版规范。 |
| **frontend-design** | 创建高质量、有辨识度的前端界面，避免"AI 味"的通用设计。强调排版、配色、动效、空间构成。 |
| **theme-factory** | 10 套预设专业主题（海洋、日落、森林、极简等），支持自定义主题生成，统一应用于各类产出物。 |
| **slack-gif-creator** | 创建适配 Slack 的动画 GIF，提供帧组装、缓动函数、动画概念和优化策略。 |

### 开发工具

| Skill | 功能描述 |
|-------|----------|
| **claude-api** | 构建、调试、优化 Claude API / Anthropic SDK 应用。支持 8 种语言，涵盖缓存、流式、工具调用、批处理等。 |
| **mcp-builder** | 引导创建高质量 MCP（Model Context Protocol）服务器，四阶段流程：研究 → 实现 → 测试 → 评估。 |
| **web-artifacts-builder** | 使用 React + Tailwind CSS + shadcn/ui 构建复杂的 claude.ai HTML 产出物，打包为单文件。 |
| **webapp-testing** | 使用 Playwright 交互和测试本地 Web 应用，支持截图、DOM 检查、浏览器日志捕获。 |
| **skill-creator** | 创建新 skill 并通过迭代测试-审查-改进循环进行性能度量，支持定量基准测试。 |

### 写作协作

| Skill | 功能描述 |
|-------|----------|
| **doc-coauthoring** | 三阶段文档协作：上下文收集 → 精炼与结构化 → 读者测试。支持从 Slack/Teams/Google Drive 拉取上下文。 |
| **internal-comms** | 内部沟通写作资源，支持 3P 更新、通讯、FAQ、状态报告、领导层更新等格式。 |
