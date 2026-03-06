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
    // --- Call OpenAI ---
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You generate Instagram captions as a JSON array of strings.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
      }),
    });

    console.log("OpenAI status:", openaiRes.status);

    // 🚨 READ BODY ONCE — THIS IS THE ONLY READ
    const bodyText = await openaiRes.text();
    console.log("OpenAI raw response:", bodyText);

    // --- If OpenAI returned an error ---
    if (!openaiRes.ok) {
      return res.status(500).json({
        error: "OpenAI error",
        details: bodyText, // reuse the already-read body
      });
    }

    // --- Parse OpenAI JSON ---
    let data;
    try {
      data = JSON.parse(bodyText);
    } catch (err) {
      console.error("JSON parse error:", err);
      return res.status(500).json({ error: "Invalid JSON from OpenAI" });
    }

    const raw = data.choices?.[0]?.message?.content;

    if (!raw) {
      console.error("No usable content in OpenAI response:", data);
      return res.status(500).json({ error: "OpenAI returned no content" });
    }

    // --- Parse captions array ---
    let captions;
    try {
      captions = JSON.parse(raw);
    } catch (err) {
      console.error("Caption JSON parse error:", err, "Raw:", raw);
      return res.status(500).json({ error: "OpenAI returned invalid caption JSON" });
    }

    return res.status(200).json({ captions });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
