export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { resume, jobdesc } = req.body;

  if (!resume || !jobdesc) {
    return res.status(400).json({ error: "Missing resume or jobdesc" });
  }

  const prompt = `You are an expert career coach and ATS (applicant tracking system) specialist. Analyze how well the provided resume matches the job description, then return structured feedback.

RESUME:
"""
${resume}
"""

JOB DESCRIPTION:
"""
${jobdesc}
"""

Return ONLY a valid JSON object — no markdown fences, no prose — in exactly this shape:
{
  "matchScore": <integer 0-100>,
  "scoreLabel": "<Weak|Fair|Good|Strong|Excellent>",
  "missingKeywords": ["keyword1", "keyword2"],
  "strengths": ["strength1", "strength2"],
  "feedbackCards": [
    {
      "type": "critical|suggestion|strength",
      "title": "<short title>",
      "detail": "<specific, actionable detail referencing the JD — not generic advice>"
    }
  ],
  "rewrites": [
    {
      "before": "<original weak bullet from resume>",
      "after":  "<improved version tailored to this JD>"
    }
  ],
  "atsBreakdown": [
    {
      "system": "Workday",
      "score": <0-100>,
      "status": "pass|warning|fail",
      "reason": "<one short sentence explaining the score>"
    },
    { "system": "Greenhouse", "score": 0, "status": "pass", "reason": "" },
    { "system": "Taleo", "score": 0, "status": "pass", "reason": "" },
    { "system": "Lever", "score": 0, "status": "pass", "reason": "" },
    { "system": "iCIMS", "score": 0, "status": "pass", "reason": "" },
    { "system": "BambooHR", "score": 0, "status": "pass", "reason": "" }
  ]
}

Rules:
- missingKeywords: up to 8 important terms/phrases from the JD absent from the resume
- strengths: up to 5 specific, concrete strengths observed
- feedbackCards: 4–6 cards total across all three types
- rewrites: 2–3 bullet rewrites; use actual text from the resume
- atsBreakdown: score each ATS honestly; status is pass (>=70), warning (50-69), fail (<50)`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || "API error" });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text?.trim() ?? "";
    const jsonStr = rawText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    const result = JSON.parse(jsonStr);

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
