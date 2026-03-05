export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { mood, topic, length, includeEmojis, includeHashtags, includeCTA } = req.body;

    const prompt = `
Generate 4 Instagram captions.
Mood: ${mood}
Topic: ${topic}
Length: ${length}
Include emojis: ${includeEmojis}
Include hashtags: ${includeHashtags}
Include CTA: ${includeCTA}

Return ONLY a JSON array of 4 captions, like:
["caption 1", "caption 2", "caption 3", "caption 4"]
    `;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You generate Instagram captions." },
          { role: "user", content: prompt }
        ],
        temperature: 0.8
      })
    });

    const data = await openaiRes.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const captions = JSON.parse(raw);

    res.status(200).json({ captions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}