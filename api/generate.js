export default async function handler(req, res) {
  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // --- Validate request body ---
  const { prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  try {
    // --- Call Groq ---
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `
You are SnapCap, an Instagram caption generator.

Return exactly 3 captions in strict JSON format:

{
  "captions": [
    "caption 1",
    "caption 2",
    "caption 3"
  ]
}

Rules:
- Only output valid JSON.
- No markdown.
- No commentary.
- No numbering.
- No extra text before or after the JSON.
            `,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
      }),
    });

    console.log("Groq status:", groqRes.status);

    const bodyText = await groqRes.text();
    console.log("Groq raw response:", bodyText);

    if (!groqRes.ok) {
      return res.status(500).json({
        error: "Groq error",
        details: bodyText,
      });
    }

    // --- Parse Groq JSON ---
    let data;
    try {
      data = JSON.parse(bodyText);
    } catch (err) {
      console.error("JSON parse error:", err);
      return res.status(500).json({ error: "Invalid JSON from Groq" });
    }

    const raw = data.choices?.[0]?.message?.content;

    if (!raw) {
      console.error("No usable content in Groq response:", data);
      return res.status(500).json({ error: "Groq returned no content" });
    }

    // --- Parse captions JSON ---
    let captions;
    try {
      const parsed = JSON.parse(raw);
      captions = parsed.captions;
    } catch (err) {
      console.error("Caption JSON parse error:", err, "Raw:", raw);
      return res.status(500).json({ error: "Groq returned invalid caption JSON" });
    }

    return res.status(200).json({ captions });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}