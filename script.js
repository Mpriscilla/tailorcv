// =====================
//  TailorCV – script.js
// =====================

// API key is stored securely in Vercel environment variables — see /api/analyze.js

// ── INIT ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  setupDropZone("resumeDropZone", "resumeFile", "resume", "resumeFilename");
  setupDropZone("jdDropZone",     "jdFile",     "jobdesc", "jdFilename");
  setupCounter("resume",  "resumeCounter");
  setupCounter("jobdesc", "jobdescCounter");
});

// ── WORD / CHAR COUNTER ───────────────────────────────────────────────────────

function setupCounter(textareaId, counterId) {
  const ta      = document.getElementById(textareaId);
  const counter = document.getElementById(counterId);
  const update  = () => {
    const val   = ta.value.trim();
    const words = val ? val.split(/\s+/).length : 0;
    const chars = ta.value.length;
    counter.textContent = `${words.toLocaleString()} words · ${chars.toLocaleString()} chars`;
  };
  ta.addEventListener("input", update);
  update();
}

// ── FILE UPLOAD / DRAG-AND-DROP ───────────────────────────────────────────────

function setupDropZone(zoneId, inputId, textareaId, filenameId) {
  const zone     = document.getElementById(zoneId);
  const input    = document.getElementById(inputId);
  const textarea = document.getElementById(textareaId);
  const nameSpan = document.getElementById(filenameId);

  // Click to open file picker
  zone.addEventListener("click", () => input.click());
  zone.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); }
  });

  // File picker change
  input.addEventListener("change", () => {
    if (input.files[0]) handleFile(input.files[0], textarea, nameSpan, zone);
  });

  // Drag events
  zone.addEventListener("dragover", e => {
    e.preventDefault();
    zone.classList.add("drag-over");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
  zone.addEventListener("drop", e => {
    e.preventDefault();
    zone.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, textarea, nameSpan, zone);
  });
}

async function handleFile(file, textarea, nameSpan, zone) {
  const ext = file.name.split(".").pop().toLowerCase();
  nameSpan.textContent = "⏳ Reading " + file.name + "…";

  try {
    let text = "";
    if (ext === "txt") {
      text = await readTextFile(file);
    } else if (ext === "pdf") {
      text = await readPdfFile(file);
    } else {
      nameSpan.textContent = "⚠️ Unsupported format — use PDF or TXT";
      return;
    }
    textarea.value = text;
    textarea.dispatchEvent(new Event("input")); // update counter
    nameSpan.textContent = "✓ " + file.name;
  } catch (err) {
    nameSpan.textContent = "⚠️ Could not read file: " + err.message;
  }
}

function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsText(file);
  });
}

async function readPdfFile(file) {
  await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf         = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages       = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map(item => item.str).join(" "));
  }
  return pages.join("\n\n");
}

let pdfJsLoaded = false;
function loadPdfJs() {
  if (pdfJsLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src   = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      pdfJsLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load PDF parser. Check your connection."));
    document.head.appendChild(script);
  });
}

// ── ERROR HELPERS ─────────────────────────────────────────────────────────────

function showError(msg) {
  const banner = document.getElementById("errorMsg");
  document.getElementById("errorText").textContent = msg;
  banner.classList.remove("hidden");
  banner.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function dismissError() {
  document.getElementById("errorMsg").classList.add("hidden");
}

// ── SANITIZE (prevent XSS from API response) ──────────────────────────────────

function sanitize(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── MAIN ANALYSIS ─────────────────────────────────────────────────────────────

async function analyzeResume() {
  const resume  = document.getElementById("resume").value.trim();
  const jobdesc = document.getElementById("jobdesc").value.trim();

  if (!resume || !jobdesc) {
    showError("Please provide both your resume and the job description before analyzing.");
    return;
  }

  dismissError();
  document.getElementById("results").classList.add("hidden");
  document.getElementById("skeleton").classList.remove("hidden");
  document.getElementById("analyzeBtn").disabled = true;

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resume, jobdesc })
    });

    if (!response.ok) {
      let errMsg = `API error ${response.status}`;
      try {
        const errJson = await response.json();
        errMsg = errJson.error || errMsg;
        if (response.status === 429) errMsg = "Rate limit hit. Wait a moment and try again.";
      } catch (_) { /* ignore */ }
      throw new Error(errMsg);
    }

    const result = await response.json();
    renderResults(result);

  } catch (err) {
    console.error("[TailorCV]", err);
    showError(err.message || "An unexpected error occurred. Please try again.");
  } finally {
    document.getElementById("skeleton").classList.add("hidden");
    document.getElementById("analyzeBtn").disabled = false;
  }
}

// ── PROMPT BUILDER ────────────────────────────────────────────────────────────

function buildPrompt(resume, jobdesc) {
  return `You are an expert career coach and ATS (applicant tracking system) specialist. Analyze how well the provided resume matches the job description, then return structured feedback.

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
    { "system": "Greenhouse", ... },
    { "system": "Taleo", ... },
    { "system": "Lever", ... },
    { "system": "iCIMS", ... },
    { "system": "BambooHR", ... }
  ]
}

Rules:
- missingKeywords: up to 8 important terms/phrases from the JD absent from the resume
- strengths: up to 5 specific, concrete strengths observed
- feedbackCards: 4–6 cards total across all three types
- rewrites: 2–3 bullet rewrites; use actual text from the resume
- atsBreakdown: score each ATS honestly based on resume formatting, keyword density, section clarity, and file-format considerations; status is "pass" (≥70), "warning" (50–69), "fail" (<50)
- Be specific and actionable — no generic career advice`;
}

// ── RENDER RESULTS ────────────────────────────────────────────────────────────

function renderResults(r) {
  // Score card
  const score     = Number(r.matchScore) || 0;
  const scoreCard = document.querySelector(".score-card");
  document.getElementById("matchScore").textContent = score + "%";
  document.getElementById("scoreTag").textContent   = sanitize(r.scoreLabel || "");

  if      (score >= 80) scoreCard.style.background = "#16a34a";
  else if (score >= 60) scoreCard.style.background = "#ca8a04";
  else                  scoreCard.style.background = "#dc2626";

  // Missing keywords
  const kwList = document.getElementById("missingKeywords");
  kwList.innerHTML = (r.missingKeywords || []).length
    ? (r.missingKeywords).map(k => `<li>🔑 ${sanitize(k)}</li>`).join("")
    : "<li>None found — great keyword coverage!</li>";

  // Strengths
  const strList = document.getElementById("strengths");
  strList.innerHTML = (r.strengths || []).length
    ? (r.strengths).map(s => `<li>✅ ${sanitize(s)}</li>`).join("")
    : "<li>—</li>";

  // Feedback cards
  document.getElementById("feedbackCards").innerHTML =
    (r.feedbackCards || []).map(card => `
      <div class="feedback-card ${sanitize(card.type)}">
        <strong>${sanitize(card.title)}</strong>
        ${sanitize(card.detail)}
      </div>`).join("") || "<p style='color:var(--muted)'>No feedback generated.</p>";

  // Rewrites
  document.getElementById("rewrites").innerHTML =
    (r.rewrites || []).length
      ? (r.rewrites).map((rw, i) => `
          <div class="rewrite-item">
            <div class="before">Before: ${sanitize(rw.before)}</div>
            <div class="after" id="after-${i}">After: ${sanitize(rw.after)}</div>
            <button class="copy-btn" onclick="copyBullet(${i}, this)">
              📋 Copy improved bullet
            </button>
          </div>`).join("")
      : "<p style='color:var(--muted)'>No rewrites suggested.</p>";

  // Store rewrites for copy access
  window._rewrites = r.rewrites || [];

  // ATS breakdown
  const atsGrid = document.getElementById("atsGrid");
  atsGrid.innerHTML = (r.atsBreakdown || []).map(ats => `
    <div class="ats-card ${sanitize(ats.status)}">
      <div class="ats-name">${sanitize(ats.system)}</div>
      <div class="ats-score">${Number(ats.score) || 0}%</div>
      <div class="ats-badge">${sanitize(ats.status)}</div>
      <div class="ats-reason">${sanitize(ats.reason)}</div>
    </div>`).join("") || "<p style='color:var(--muted)'>ATS data unavailable.</p>";

  // Show results
  const resultsEl = document.getElementById("results");
  resultsEl.classList.remove("hidden");
  resultsEl.scrollIntoView({ behavior: "smooth" });
}

// ── COPY IMPROVED BULLET ──────────────────────────────────────────────────────

function copyBullet(index, btn) {
  const rw = window._rewrites?.[index];
  if (!rw) return;
  navigator.clipboard.writeText(rw.after).then(() => {
    btn.textContent = "✓ Copied!";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = "📋 Copy improved bullet";
      btn.classList.remove("copied");
    }, 2000);
  }).catch(() => {
    // Fallback for browsers without clipboard API
    const ta = document.createElement("textarea");
    ta.value = rw.after;
    ta.style.position = "fixed";
    ta.style.opacity  = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    btn.textContent = "✓ Copied!";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = "📋 Copy improved bullet";
      btn.classList.remove("copied");
    }, 2000);
  });
}

// ── PRINT / EXPORT ────────────────────────────────────────────────────────────

function printResults() {
  if (document.getElementById("results").classList.contains("hidden")) {
    showError("Run an analysis first before exporting results.");
    return;
  }
  window.print();
}
