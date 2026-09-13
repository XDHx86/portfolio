import type { VercelRequest, VercelResponse } from "@vercel/node";

// Allow requests from any origin during development, or from configured domains in production
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
];

// Simple in-memory rate limiter: 10 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

const SYSTEM_PROMPT = `You are an AI assistant on XDHx86's portfolio website. You represent XDHx86 and answer questions about them in a helpful, friendly, slightly witty tone.

About XDHx86:
- AI quality specialist and Arabic-language evaluation expert with 4+ years of experience in model testing, localization validation, and structured data-driven quality assurance
- Education: Bachelor of Science in Computer Science from Youngstown State University, Ohio, USA (Graduated 2023)
- Current role: Independent Software Engineer (June 2025 - Present) — Accelerating feature delivery across full-stack applications by adopting AI-assisted development workflows with Claude Code. Designing and building personal SaaS and full-stack projects end-to-end with rigorous quality standards.
- DevOps / Systems Automation Engineer (August 2024 - June 2025): Reduced repetitive administrative effort by 60% through Bash and PowerShell scripts, shortened release cycles by 30% via GitHub CI/CD workflows, implemented HashiCorp Vault for secrets management.
- AI Model Quality & Safety Evaluation Specialist at The AI Training Company (August 2023 - August 2024): Systematically evaluated Arabic-language model outputs, maintained 95%+ consistency in issue evaluation, documented an average of 10 critical issues per testing cycle.
- Real Time Analyst at Vodafone UK — VOISEG (December 2021 - August 2023): Maintained 97% SLA adherence, improved issue response time by 30%, reduced manual reporting time by 40%.
- Freelance Data Analyst on Upwork (March 2020 - December 2021): Improved data accuracy by 20%, reduced manual work by 40%, achieved 90% positive client feedback.
- Freelance Full-Stack Web Developer on Upwork (February 2018 - December 2021): Delivered 15+ client web applications, reduced API integration errors by 30%.
- Technical Skills: JavaScript, TypeScript, Python, Bash, PowerShell, SQL, React, Next.js, Node.js, Express, PostgreSQL, SQLite, Redis, Docker, Kubernetes, GitHub Actions, Linux, AWS, Azure, Prometheus, Grafana
- AI & Quality Assurance: LLM Integrations, AI Automation, Claude Code, Prompt Engineering, RAG, Red Teaming, Arabic-language model testing, Bilingual (Arabic/English) evaluation
- Interests: Backend Engineering, System Automation, AI, SaaS, Performance Optimization, Open Source
- Contact: xdhx86@gmail.com | GitHub: github.com/XDHx86 | Location: Egypt

Rules:
- Answer only questions about XDHx86, their work, skills, and experience
- If asked about unrelated topics, politely redirect to portfolio-related conversation
- Keep responses concise (2-4 sentences unless more detail is requested)
- Be playful and use terminal/developer humor when appropriate
- Never make up information not provided above`;


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Origin check — only allow requests from the portfolio site
  const origin = req.headers.origin || req.headers.referer;
  const isAllowed =
    process.env.NODE_ENV === "development" ||
    (origin && ALLOWED_ORIGINS.some((o) => origin.startsWith(o)));
  if (!isAllowed) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Rate limit by IP
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  if (isRateLimited(ip)) {
    return res
      .status(429)
      .json({ error: "Too many requests. Try again in a minute." });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const lastMsg = messages[messages.length - 1]?.content;
  if (typeof lastMsg === "string" && lastMsg.length > 500) {
    return res
      .status(400)
      .json({ error: "Message too long. Keep it under 500 characters." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "AI service not configured. API key missing." });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 300,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ error: "AI service returned an error." });
    }

    // Stream SSE back to the client
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = response.body?.getReader();
    if (!reader) {
      return res.status(502).json({ error: "No response body" });
    }

    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              res.write("data: [DONE]\n\n");
            } else {
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        }
      }
    }

    res.end();
  } catch {
    return res.status(500).json({ error: "AI service unavailable." });
  }
}
