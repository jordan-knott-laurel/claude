/**
 * PR Documentation Scanner
 *
 * Fetches recent merged PRs from configured GitHub repos and uses Claude
 * to identify changes that need help center updates or internal support docs.
 *
 * Usage:
 *   GITHUB_TOKEN=<token> GITHUB_REPOS=org/repo1,org/repo2 tsx src/pr-doc-scanner.ts
 *
 * Optional env vars:
 *   DAYS_BACK=7          — how many days of merged PRs to scan (default: 7)
 *   CLAUDE_MODEL=...     — override the Claude model
 *   OUTPUT_FORMAT=json   — output raw JSON instead of the default markdown report
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6";

// ── GitHub types ──────────────────────────────────────────────────────────────

interface GitHubPR {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  merged_at: string | null;
  user: { login: string } | null;
  labels: { name: string }[];
}

interface GitHubFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

// ── Result types ──────────────────────────────────────────────────────────────

export interface DocFinding {
  pr_number: number;
  pr_title: string;
  pr_url: string;
  pr_author: string;
  merged_at: string;
  repo: string;
  needs_help_center: boolean;
  needs_internal_docs: boolean;
  help_center_summary: string;
  internal_docs_summary: string;
  suggested_articles: string[];
  confidence: "high" | "medium" | "low";
}

// ── GitHub API helpers ────────────────────────────────────────────────────────

async function githubGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${path} → ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function fetchRecentMergedPRs(
  repo: string,
  token: string,
  since: Date
): Promise<GitHubPR[]> {
  const sinceISO = since.toISOString();
  // Fetch up to 100 closed PRs; filter to merged ones within the window
  const prs = await githubGet<GitHubPR[]>(
    `/repos/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=100`,
    token
  );
  return prs.filter(
    (pr) => pr.merged_at !== null && pr.merged_at >= sinceISO
  );
}

async function fetchPRFiles(
  repo: string,
  prNumber: number,
  token: string
): Promise<GitHubFile[]> {
  return githubGet<GitHubFile[]>(
    `/repos/${repo}/pulls/${prNumber}/files?per_page=100`,
    token
  );
}

// ── Claude analysis ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a technical writer assistant at a software company. Your job is to review merged pull requests and determine whether they require:
1. Customer-facing help center article updates (new articles, edits to existing articles, or new sections)
2. Internal support documentation updates (agent runbooks, escalation guides, internal FAQs, support playbooks)

Be conservative — only flag PRs that genuinely change user-visible behavior, settings, pricing, feature availability, UI flows, error messages, API contracts, or anything a customer might ask support about. Ignore pure infrastructure, refactoring, test, or tooling changes.

Respond with a JSON object exactly matching this schema (no extra keys, no markdown fencing):
{
  "needs_help_center": boolean,
  "needs_internal_docs": boolean,
  "help_center_summary": "1-2 sentence description of what the help center update should cover, or empty string",
  "internal_docs_summary": "1-2 sentence description of what internal docs should be updated, or empty string",
  "suggested_articles": ["array of short article title suggestions, max 3, or empty array"],
  "confidence": "high" | "medium" | "low"
}`;

function buildUserPrompt(pr: GitHubPR, files: GitHubFile[]): string {
  const filesSummary = files
    .map((f) => {
      const patchPreview = f.patch
        ? `\n\`\`\`\n${f.patch.slice(0, 800)}${f.patch.length > 800 ? "\n... (truncated)" : ""}\n\`\`\``
        : "";
      return `- ${f.status.toUpperCase()} ${f.filename} (+${f.additions}/-${f.deletions})${patchPreview}`;
    })
    .join("\n");

  return `## Pull Request #${pr.number}: ${pr.title}

**Author:** ${pr.user?.login ?? "unknown"}
**Labels:** ${pr.labels.map((l) => l.name).join(", ") || "none"}

**Description:**
${pr.body?.trim() || "(no description)"}

**Changed files (${files.length} total):**
${filesSummary}`;
}

async function analyzePR(
  pr: GitHubPR,
  files: GitHubFile[]
): Promise<Omit<DocFinding, "pr_number" | "pr_title" | "pr_url" | "pr_author" | "merged_at" | "repo">> {
  const userPrompt = buildUserPrompt(pr, files);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "{}";

  try {
    return JSON.parse(text);
  } catch {
    // Fallback if Claude returns malformed JSON
    return {
      needs_help_center: false,
      needs_internal_docs: false,
      help_center_summary: "",
      internal_docs_summary: "",
      suggested_articles: [],
      confidence: "low",
    };
  }
}

// ── Report formatting ─────────────────────────────────────────────────────────

function formatMarkdownReport(findings: DocFinding[], repos: string[], since: Date): string {
  const flagged = findings.filter(
    (f) => f.needs_help_center || f.needs_internal_docs
  );
  const clean = findings.length - flagged.length;

  const lines: string[] = [
    `# PR Documentation Scan Report`,
    `**Repos:** ${repos.join(", ")}`,
    `**Period:** ${since.toDateString()} → today`,
    `**PRs scanned:** ${findings.length} | **Flagged:** ${flagged.length} | **No action needed:** ${clean}`,
    "",
  ];

  if (flagged.length === 0) {
    lines.push("No documentation updates needed. 🎉");
    return lines.join("\n");
  }

  const helpCenter = flagged.filter((f) => f.needs_help_center);
  const internalDocs = flagged.filter((f) => f.needs_internal_docs);

  if (helpCenter.length > 0) {
    lines.push(`## Help Center Updates Needed (${helpCenter.length})`);
    lines.push("");
    for (const f of helpCenter) {
      lines.push(
        `### [${f.repo} #${f.pr_number}] ${f.pr_title}`,
        `**Author:** ${f.pr_author} · **Merged:** ${f.merged_at.slice(0, 10)} · **Confidence:** ${f.confidence}`,
        `**PR:** ${f.pr_url}`,
        "",
        f.help_center_summary,
        ""
      );
      if (f.suggested_articles.length > 0) {
        lines.push("**Suggested articles:**");
        f.suggested_articles.forEach((a) => lines.push(`- ${a}`));
        lines.push("");
      }
    }
  }

  if (internalDocs.length > 0) {
    lines.push(`## Internal Support Docs Updates Needed (${internalDocs.length})`);
    lines.push("");
    for (const f of internalDocs) {
      lines.push(
        `### [${f.repo} #${f.pr_number}] ${f.pr_title}`,
        `**Author:** ${f.pr_author} · **Merged:** ${f.merged_at.slice(0, 10)} · **Confidence:** ${f.confidence}`,
        `**PR:** ${f.pr_url}`,
        "",
        f.internal_docs_summary,
        ""
      );
    }
  }

  return lines.join("\n");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("Error: GITHUB_TOKEN environment variable is required.");
    process.exit(1);
  }

  const reposEnv = process.env.GITHUB_REPOS;
  if (!reposEnv) {
    console.error(
      "Error: GITHUB_REPOS environment variable is required (comma-separated, e.g. org/repo1,org/repo2)."
    );
    process.exit(1);
  }

  const repos = reposEnv.split(",").map((r) => r.trim()).filter(Boolean);
  const daysBack = parseInt(process.env.DAYS_BACK ?? "7", 10);
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const outputFormat = process.env.OUTPUT_FORMAT ?? "markdown";

  console.error(
    `Scanning ${repos.length} repo(s) for PRs merged in the last ${daysBack} days...`
  );

  const allFindings: DocFinding[] = [];

  for (const repo of repos) {
    console.error(`  → ${repo}`);
    let prs: GitHubPR[];
    try {
      prs = await fetchRecentMergedPRs(repo, token, since);
    } catch (err) {
      console.error(`    Failed to fetch PRs for ${repo}: ${err}`);
      continue;
    }
    console.error(`    Found ${prs.length} merged PR(s) to analyze`);

    for (const pr of prs) {
      process.stderr.write(`    Analyzing #${pr.number}: ${pr.title.slice(0, 60)}... `);
      let files: GitHubFile[] = [];
      try {
        files = await fetchPRFiles(repo, pr.number, token);
      } catch {
        // proceed with no file context
      }

      const analysis = await analyzePR(pr, files);
      process.stderr.write(
        analysis.needs_help_center || analysis.needs_internal_docs
          ? "⚑ flagged\n"
          : "✓\n"
      );

      allFindings.push({
        ...analysis,
        pr_number: pr.number,
        pr_title: pr.title,
        pr_url: pr.html_url,
        pr_author: pr.user?.login ?? "unknown",
        merged_at: pr.merged_at!,
        repo,
      });

      // Small delay to avoid GitHub rate limits
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  if (outputFormat === "json") {
    console.log(JSON.stringify(allFindings, null, 2));
  } else {
    console.log(formatMarkdownReport(allFindings, repos, since));
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
