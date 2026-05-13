# Claude Code Skills 技能列表

## 内置技能 (Built-in Skills)

| 技能名称 | 说明 | 使用场景 |
|---------|------|----------|
| algorithmic-art | 使用 p5.js 创建算法艺术，支持种子随机性和交互式参数探索 | 当用户请求使用代码创建艺术、生成艺术、算法艺术、流场或粒子系统时 |
| brand-guidelines | 应用 Anthropic 官方品牌颜色和排版 | 当需要应用品牌颜色、样式指南、视觉格式或公司设计标准时 |
| canvas-design | 使用设计理念创建精美的视觉艺术作品（.png 和 .pdf） | 当用户请求创建海报、艺术作品、设计或其他静态作品时 |
| claude-api | 构建、调试和优化 Claude API / Anthropic SDK 应用，支持提示缓存 | 当代码导入 `anthropic` 或 `@anthropic-ai/sdk`；用户询问 Claude API、Anthropic SDK 或托管代理时 |
| doc-coauthoring | 指导用户完成共同编写文档的结构化工作流程 | 当用户想要编写文档、提案、技术规范、决策文档时 |
| docx | 创建、读取、编辑或操作 Word 文档（.docx 文件） | 当涉及 Word 文档、.docx 文件，或需要专业格式文档（如报告、备忘录、信件）时 |
| frontend-design | 创建独特的、生产级的前端界面，具有高设计质量 | 当用户要求构建网页组件、页面、落地页、仪表板、React 组件或任何 Web UI 时 |
| internal-comms | 一套帮助编写各种内部通信的资源 | 当被要求编写内部通信（状态报告、领导更新、公司通讯、FAQ、事件报告等）时 |
| mcp-builder | 创建高质量 MCP（模型上下文协议）服务器的指南 | 当构建 MCP 服务器以集成外部 API 或服务时（支持 Python 和 Node/TypeScript） |
| pdf | 处理 PDF 文件的各种操作 | 当涉及 PDF 文件时，包括读取、合并、拆分、旋转、添加水印、创建、填写表单、加密、OCR 等 |
| pptx | 处理 PowerPoint 演示文稿文件 | 当涉及 .pptx 文件时，包括创建、读取、编辑、解析演示文稿、幻灯片、演讲者备注等 |
| skill-creator | 创建新技能、修改和改进现有技能，并衡量技能性能 | 当用户想要从头创建技能、编辑或优化现有技能、运行评估或基准测试时 |
| slack-gif-creator | 为 Slack 创建优化的动画 GIF | 当用户请求为 Slack 创建动画 GIF 时 |
| theme-factory | 使用主题为工件设置样式的工具包，提供 10 个预设主题 | 当需要为幻灯片、文档、报告、HTML 页面等应用主题时 |
| web-artifacts-builder | 使用现代前端技术（React、Tailwind CSS、shadcn/ui）创建复杂的 HTML 工件 | 当需要创建复杂的、需要状态管理、路由或 shadcn/ui 组件的工件时 |
| webapp-testing | 使用 Playwright 测试本地 Web 应用程序 | 当需要验证前端功能、调试 UI 行为、捕获浏览器截图和查看浏览器日志时 |
| xlsx | 处理电子表格文件（.xlsx、.xlsm、.csv、.tsv） | 当涉及电子表格文件时，包括打开、读取、编辑、修复、创建、转换格式、清理数据等 |

## 超级技能 (Superpowers Skills)

| 技能名称 | 说明 | 使用场景 |
|---------|------|----------|
| brainstorming | 在任何创造性工作之前必须使用，探索用户意图、需求和设计 | 在创建功能、构建组件、添加功能或修改行为之前 |
| dispatching-parallel-agents | 调度并行代理处理独立任务 | 当面临 2 个或更多独立任务，无需共享状态或顺序依赖时 |
| executing-plans | 执行带有审查检查点的实施计划 | 当有书面实施计划需要在单独会话中执行时 |
| finishing-a-development-branch | 完成开发分支，提供合并、PR 或清理的结构化选项 | 当实现完成，所有测试通过，需要决定如何集成工作时 |
| receiving-code-review | 接收代码审查反馈，需要技术严谨性和验证 | 当接收代码审查反馈，在实施建议之前，特别是当反馈不清楚或技术上有问题时 |
| requesting-code-review | 请求代码审查以验证工作是否符合要求 | 当完成任务、实现主要功能或合并前验证工作时 |
| subagent-driven-development | 子代理驱动开发，执行具有独立任务的实施计划 | 当在当前会话中执行具有独立任务的实施计划时 |
| systematic-debugging | 系统化调试，在提出修复方案之前 | 当遇到任何错误、测试失败或意外行为时 |
| test-driven-development | 测试驱动开发，在编写实现代码之前 | 当实现任何功能或错误修复时，在编写实现代码之前 |
| using-git-worktrees | 使用 git 工作树进行隔离开发 | 当开始需要与当前工作区隔离的功能工作时 |
| using-superpowers | 使用超级技能，在开始任何对话时建立如何查找和使用技能 | 当开始任何对话时，建立如何查找和使用技能 |
| verification-before-completion | 完成前验证，在声称工作完成之前运行验证命令 | 当即将声称工作完成、修复或通过时，在提交或创建 PR 之前 |
| writing-plans | 编写计划，在接触代码之前 | 当你有规范或多步任务的需求时，在接触代码之前 |
| writing-skills | 编写技能，创建、编辑或验证技能 | 当创建新技能、编辑现有技能或验证技能在部署前是否工作时 |

## 使用方法

1. 直接描述需求，Claude 会自动选择合适的技能
2. 明确要求使用特定技能："请使用 xxx 技能帮我..."
3. 超级技能通常在特定开发阶段自动触发，无需手动调用