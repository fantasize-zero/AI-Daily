#!/usr/bin/env node

/**
 * AI Daily Briefing — GitHub Trending AI Projects Report
 * 自动从 GitHub 获取热门 AI 项目并生成分析简报
 *
 * Usage:
 *   node ai-daily-briefing.js                  # save to current dir
 *   node ai-daily-briefing.js ./reports        # save to ./reports/
 *   0 9 * * 1-5 /usr/bin/node /path/to/ai-daily-briefing.js /path/to/reports
 */

const fs = require("fs");
const GITHUB_API = "https://api.github.com";
const DATE_STR = new Date().toISOString().split("T")[0];

async function fetchTrendingRepos() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const url = GITHUB_API + "/search/repositories?q=topic:ai+pushed:>=" + weekAgo + "&sort=stars&order=desc&per_page=50";
  const res = await fetch(url, {
    headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "AI-Daily-Briefing" }
  });
  if (!res.ok) throw new Error("GitHub API error: " + res.status);
  return (await res.json()).items;
}

function categorize(repo) {
  const c = ((repo.description || "") + " " + (repo.topics || []).join(" ")).toLowerCase();
  if (/llm|large languagemodel|gpt|chatgpt/.test(c)) return "Large Language Models (LLMs)";
  if (/agent|autonomous|function calling/.test(c)) return "AI Agents";
  if (/rag|retrieval|knowledge base/.test(c)) return "RAG / Retrieval";
  if (/image|vision|diffusion|video/.test(c)) return "Computer Vision / Image";
  if (/voice|speech|tts|audio/.test(c)) return "Speech / Audio";
  if (/code|coding|programming/.test(c)) return "Code Generation";
  if (/fine-?tun|training/.test(c)) return "Training / Fine-tuning";
  if (/embedding|vector/.test(c)) return "Embeddings / Vector DB";
  if (/tool|cli|framework|sdk/.test(c)) return "Tools / Frameworks";
  if (/safety|alignment|evaluation|benchmark/.test(c)) return "Safety / Evaluation";
  return "General AI";
}

function valueAnalysis(repo) {
  const c = ((repo.description || "") + " " + (repo.topics || []).join(" ")).toLowerCase();
  const v = [];
  if (/llm|languagemodel|chat|gpt|inference/.test(c)) {
    v.push("- 核心功能：提供或增强大语言模型能力");
    v.push("- 应用价值：对话系统、内容生成、知识问答");
    v.push("- 技术亮点：架构创新 / 推理优化 / 多模态支持");
  } else if (/agent|autonomous|tool use/.test(c)) {
    v.push("- 核心功能：构建自主 AI Agent");
    v.push("- 应用价值：自动化工作流、智能助手");
    v.push("- 技术亮点：Agent 编排 / 多步骤推理");
  } else if (/image|vision|diffusion/.test(c)) {
    v.push("- 核心功能：图像/视频生成、编辑或视觉理解");
    v.push("- 应用价值：创意设计、内容生产");
    v.push("- 技术亮点：扩散模型 / ViT / 多模态融合");
  } else if (/code|programming/.test(c)) {
    v.push("- 核心功能：代码生成、补全、审查");
    v.push("- 应用价值：提升开发效率");
    v.push("- 技术亮点：代码理解 / 多语言支持");
  } else if (/rag|retrieval/.test(c)) {
    v.push("- 核心功能：检索增强生成，连接外部知识库");
    v.push("- 应用价值：企业知识问答、文档分析");
    v.push("- 技术亮点：高效检索 / 上下文增强");
  } else if (/voice|speech|audio/.test(c)) {
    v.push("- 核心功能：语音识别/合成或音频处理");
    v.push("- 应用价值：语音交互、配音、翻译");
    v.push("- 技术亮点：端到端模型 / 低延迟");
  } else if (/fine-?tun|training/.test(c)) {
    v.push("- 核心功能：模型微调或训练工具");
    v.push("- 应用价值：降低模型定制成本");
    v.push("- 技术亮点：参数高效微调 / 分布式训练");
  } else if (/embedding|vector/.test(c)) {
    v.push("- 核心功能：嵌入与向量检索");
    v.push("- 应用价值：语义搜索、推荐系统");
    v.push("- 技术亮点：高维向量索引 / 混合检索");
  } else if (/safety|alignment|evaluation/.test(c)) {
    v.push("- 核心功能：AI 安全评估与对齐");
    v.push("- 应用价值：保障 AI 系统安全可靠");
    v.push("- 技术亮点：红队测试 / 自动化评估");
  } else {
    v.push("- 核心功能：" + (repo.description || "提供 AI 相关能力"));
    v.push("- 应用价值：推动 AI 技术创新落地");
    v.push("- 技术亮点：开源贡献 / 社区驱动");
  }
  return v.join("\n");
}

function generateReport(repos) {
  const data = repos.map(r => ({ ...r, category: categorize(r) }));
  const cats = [...new Set(data.map(r => r.category))];
  
  let m = "# AI Daily Briefing — " + DATE_STR + "\n\n";
  m += "> 自动从 GitHub 热门 AI 项目生成\n\n---\n\n";
  m += "## Overview\n\n";
  m += "- **" + data.length + "** 个热门 AI 项目\n";
  m += "- **" + cats.length + "** 个类别\n";
  m += "- " + new Date().toLocaleString("zh-CN", {timeZone:"Asia/Shanghai"}) + "\n\n---\n\n";
  
  for (const cat of cats) {
    const items = data.filter(r => r.category === cat);
    m += "## " + cat + " (" + items.length + ")\n\n";
    for (const r of items) {
      m += "### " + r.full_name + "\n\n";
      m += "| Stars | Forks | Language | Topics |\n";
      m += "|-------|-------|----------|--------|\n";
      m += "| " + r.stargazers_count.toLocaleString() + " | " + r.forks_count.toLocaleString() + " | " + (r.language||"N/A") + " | " + ((r.topics||[]).slice(0,5).join(", ")||"N/A") + " |\n\n";
      m += "**Description:** " + (r.description||"N/A") + "\n\n";
      m += "**Value Analysis:**\n" + valueAnalysis(r) + "\n\n";
      m += "Created: " + new Date(r.created_at).toLocaleDateString("zh-CN") + " | Updated: " + new Date(r.pushed_at).toLocaleDateString("zh-CN") + "\n\n---\n\n";
    }
  }
  
  var sorted = [...data].sort((a,b) => b.stargazers_count - a.stargazers_count).slice(0,5);
  m += "## Top 5\n\n| # | Project | Stars | Category |\n|---|---------|-------|----------|\n";
  sorted.forEach((r,i) => { m += "| " + (i+1) + " | " + r.full_name + " | " + r.stargazers_count.toLocaleString() + " | " + r.category + " |\n"; });
  m += "\n> Generated by AI Daily Briefing\n";
  return m;
}

async function main() {
  try {
    console.log("Fetching trending AI projects...");
    const repos = await fetchTrendingRepos();
    var top20 = repos.slice(0, 20);
    console.log("Found " + top20.length + " projects");
    var md = generateReport(top20);
    var outDir = process.argv[2] || ".";
    var outPath = outDir + "/AI-Daily-Briefing-" + DATE_STR + ".md";
    fs.writeFileSync(outPath, md, "utf-8");
    console.log("Saved: " + outPath);
  } catch(e) {
    console.error("Error:", e.message);
    process.exit(1);
  }
}
main();
