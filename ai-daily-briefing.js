#!/usr/bin/env node

/**
 * AI Daily Briefing — GitHub Trending AI Projects Report
 * 自动从 GitHub 获取最新热门 AI 项目并生成分析简报
 *
 * Usage:
 *   node ai-daily-briefing.js ./reports
 *
 * 策略：按 created 时间窗口排序，确保每天看到的是新项目
 *       每天 9AM (UTC+8) 通过 GitHub Actions 自动运行
 */

const fs = require("fs");
const GITHUB_API = "https://api.github.com";
const DATE_STR = new Date().toISOString().split("T")[0];

async function fetchTrendingRepos() {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // 多关键词并行查询，覆盖更多 AI 项目
  // created 时间窗口确保项目是新创建的（每天不同）
  // stars 排序确保选出的是"最新热门"项目
  var queries = [
    "topic:ai created:>" + twoWeeksAgo + " pushed:>" + weekAgo,
    "topic:llm created:>" + twoWeeksAgo + " pushed:>" + weekAgo,
    "topic:machine-learning created:>" + twoWeeksAgo + " stars:>50"
  ];

  console.log("Fetching AI projects from the past 14 days...");
  var allItems = [];
  var seenIds = new Set();

  for (var q of queries) {
    var url = GITHUB_API + "/search/repositories?q=" + encodeURIComponent(q) + "&sort=stars&order=desc&per_page=30";
    try {
      var res = await fetch(url, {
        headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "AI-Daily-Briefing" }
      });
      if (!res.ok) continue;
      var data = await res.json();
      for (var r of (data.items || [])) {
        if (!seenIds.has(r.id)) {
          allItems.push(r);
          seenIds.add(r.id);
        }
      }
    } catch(e) {
      console.log("Skipped query: " + q.split(" ")[0]);
    }
  }

  allItems.sort((a, b) => b.stargazers_count - a.stargazers_count);
  if (allItems.length >= 20) {
    console.log("Found " + allItems.length + " unique projects");
    return allItems.slice(0, 20);
  }

  // Fallback: 扩大到 30 天
  var monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  var fbUrl = GITHUB_API + "/search/repositories?q=topic:ai+created:>" + monthAgo + "+stars:>10&sort=stars&order=desc&per_page=50";
  console.log("Not enough results, expanding query...");
  var fbRes = await fetch(fbUrl, {
    headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "AI-Daily-Briefing" }
  });
  if (fbRes.ok) {
    var fbData = await fbRes.json();
    for (var r of (fbData.items || [])) {
      if (!seenIds.has(r.id)) {
        allItems.push(r);
        seenIds.add(r.id);
      }
    }
  }

  allItems.sort((a, b) => b.stargazers_count - a.stargazers_count);
  console.log("Found " + allItems.length + " projects (with fallback)");
  return allItems.slice(0, 20);
}

function categorize(repo) {
  var c = ((repo.description || "") + " " + (repo.topics || []).join(" ")).toLowerCase();
  if (/llm|large languagemodel|gpt|chatgpt/.test(c)) return "Large Language Models (LLMs)";
  if (/agent|autonomous/.test(c)) return "AI Agents";
  if (/rag|retrieval/.test(c)) return "RAG / Retrieval";
  if (/image|vision|diffusion|video/.test(c)) return "Computer Vision / Image";
  if (/voice|speech|tts|audio/.test(c)) return "Speech / Audio";
  if (/code|coding|programming/.test(c)) return "Code Generation";
  if (/fine-?tun|training/.test(c)) return "Training / Fine-tuning";
  if (/embedding|vector/.test(c)) return "Embeddings / Vector DB";
  if (/tool|cli|framework|sdk/.test(c)) return "Tools / Frameworks";
  if (/safety|alignment|eval|benchmark/.test(c)) return "Safety / Evaluation";
  return "General AI";
}

function valueAnalysis(repo) {
  var c = ((repo.description || "") + " " + (repo.topics || []).join(" ")).toLowerCase();
  if (/llm|languagemodel|chat|gpt|inference/.test(c)) {
    return "- 核心功能：提供或增强大语言模型能力\n- 应用价值：对话系统、内容生成、知识问答\n- 技术亮点：架构创新 / 推理优化 / 多模态支持";
  }
  if (/agent|autonomous|tool use/.test(c)) {
    return "- 核心功能：构建自主 AI Agent\n- 应用价值：自动化工作流、智能助手\n- 技术亮点：Agent 编排 / 多步骤推理";
  }
  if (/image|vision|diffusion/.test(c)) {
    return "- 核心功能：图像/视频生成、编辑或视觉理解\n- 应用价值：创意设计、内容生产\n- 技术亮点：扩散模型 / ViT / 多模态融合";
  }
  if (/code|programming/.test(c)) {
    return "- 核心功能：代码生成、补全、审查\n- 应用价值：提升开发效率\n- 技术亮点：代码理解 / 多语言支持";
  }
  if (/rag|retrieval/.test(c)) {
    return "- 核心功能：检索增强生成，连接外部知识库\n- 应用价值：企业知识问答、文档分析\n- 技术亮点：高效检索 / 上下文增强";
  }
  if (/voice|speech|audio/.test(c)) {
    return "- 核心功能：语音识别/合成或音频处理\n- 应用价值：语音交互、配音、翻译\n- 技术亮点：端到端模型 / 低延迟";
  }
  if (/fine-?tun|training/.test(c)) {
    return "- 核心功能：模型微调或训练工具\n- 应用价值：降低模型定制成本\n- 技术亮点：参数高效微调 / 分布式训练";
  }
  if (/embedding|vector/.test(c)) {
    return "- 核心功能：嵌入与向量检索\n- 应用价值：语义搜索、推荐系统\n- 技术亮点：高维向量索引 / 混合检索";
  }
  if (/safety|alignment|eval/.test(c)) {
    return "- 核心功能：AI 安全评估与对齐\n- 应用价值：保障 AI 系统安全可靠\n- 技术亮点：红队测试 / 自动化评估";
  }
  return "- 核心功能：" + (repo.description || "提供 AI 相关能力") + "\n- 应用价值：推动 AI 技术创新落地\n- 技术亮点：开源贡献 / 社区驱动";
}

function generateReport(repos) {
  var data = repos.map(function(r) { return Object.assign({}, r, { category: categorize(r) }); });
  var cats = [...new Set(data.map(function(r) { return r.category; }))];

  var m = "# AI Daily Briefing --- " + DATE_STR + "\n\n";
  m += "> 自动从 GitHub 最新热门 AI 项目生成\n\n---\n\n";
  m += "## Overview\n\n";
  m += "- **" + data.length + "** 个最新热门 AI 项目\n";
  m += "- **" + cats.length + "** 个类别\n";
  m += "- " + new Date().toLocaleString("zh-CN", {timeZone:"Asia/Shanghai"}) + "\n\n---\n\n";

  for (var ci = 0; ci < cats.length; ci++) {
    var cat = cats[ci];
    var items = data.filter(function(r) { return r.category === cat; });
    m += "## " + cat + " (" + items.length + ")\n\n";
    for (var ri = 0; ri < items.length; ri++) {
      var r = items[ri];
      m += "### " + r.full_name + "\n\n";
      m += "| Stars | Forks | Language | Topics |\n";
      m += "|-------|-------|----------|--------|\n";
      m += "| " + r.stargazers_count.toLocaleString() + " | " + r.forks_count.toLocaleString() + " | " + (r.language||"N/A") + " | " + ((r.topics||[]).slice(0,5).join(", ")||"N/A") + " |\n\n";
      m += "**Description:** " + (r.description||"N/A") + "\n\n";
      m += "**Value Analysis:**\n" + valueAnalysis(r) + "\n\n";
      m += "Created: " + new Date(r.created_at).toLocaleDateString("zh-CN") + " | Updated: " + new Date(r.pushed_at).toLocaleDateString("zh-CN") + "\n\n---\n\n";
    }
  }

  var sorted = [...data].sort(function(a,b) { return b.stargazers_count - a.stargazers_count; }).slice(0,5);
  m += "## Top 5\n\n| # | Project | Stars | Category |\n|---|---------|-------|----------|\n";
  for (var si = 0; si < sorted.length; si++) {
    var sr = sorted[si];
    m += "| " + (si+1) + " | " + sr.full_name + " | " + sr.stargazers_count.toLocaleString() + " | " + sr.category + " |\n";
  }
  m += "\n> Generated by AI Daily Briefing\n";
  return m;
}

async function main() {
  try {
    console.log("Fetching trending AI projects...");
    var repos = await fetchTrendingRepos();
    var top20 = repos.slice(0, 20);
    console.log("Found " + top20.length + " projects");
    var md = generateReport(top20);
    var outDir = process.argv[2] || ".";
    var outPath = outDir + "/AI-Daily-Briefing-" + DATE_STR + ".md";
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, md, "utf-8");
    console.log("Saved: " + outPath);
  } catch(e) {
    console.error("Error:", e.message);
    process.exit(1);
  }
}
main();
