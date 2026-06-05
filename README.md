# AI 每日简报 (AI Daily Briefing)

🤖 自动从 GitHub 获取热门 AI 项目并生成分析简报

## 工作原理
- 每天早上 9 点（工作日）通过 GitHub Actions 自动运行
- 从 GitHub Search API 抓取本周热门 AI 项目（Top 20）
- 自动分类（LLM、AI Agents、RAG、CV、CodeGen 等 10+ 类别）
- 对每个项目进行功能分析和价值评估
- 生成 Markdown 报告并自动提交到仓库

## 报告格式
生成的报告保存在 `reports/` 目录下

## 手动运行
```bash
node ai-daily-briefing.js reports
```
