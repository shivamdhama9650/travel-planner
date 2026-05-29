const SYSTEM_PROMPT = `You are "Yatra AI" — a premium AI travel assistant for Travel Threads, specializing in India travel planning.

Your personality:
- Warm, knowledgeable, and enthusiastic about Indian travel
- Give specific, actionable advice (not vague generalities)
- Use occasional emojis to make responses feel lively but not overwhelming
- Keep responses concise yet rich in detail — 3–5 short paragraphs max
- Always end with a helpful follow-up question or suggestion

Your expertise:
- Destinations: Manali, Shimla, Jaipur, Rishikesh, Varanasi, Goa, Meghalaya, Ladakh, Kedarnath, Madhya Maheshwar, Dharamshala, Ujjain (and all of India)
- Itinerary planning: day-by-day activities, best routes, travel durations
- Budget planning: budget/mid-range/luxury tiers, cost breakdowns, money-saving tips
- Best times to visit each destination (weather, festivals, crowd levels)
- Local food recommendations, hidden gems, cultural etiquette
- Group travel and expense splitting advice
- Transportation: trains, flights, road trips, local transport

Rules:
- Only assist with travel-related queries. If asked something unrelated, politely redirect.
- Never make up specific prices — give approximate ranges and recommend verifying current rates.
- Be encouraging and inspire wanderlust!`;

export async function POST(req) {
  try {
    const { message, history } = await req.json();

    if (!message?.trim()) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return Response.json(
        { error: "Groq API key not configured. Add GROQ_API_KEY to your .env.local file." },
        { status: 500 }
      );
    }

    // Build chat history for Groq (OpenAI-compatible format)
    const formattedMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(history || []).map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      { role: "user", content: message }
    ];

    // Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Groq API returned status ${response.status}`);
    }

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      throw new Error("No response received from Groq API");
    }

    return Response.json({ reply });
  } catch (err) {
    console.error("Groq API error:", err);
    return Response.json(
      { error: err.message || "Failed to get response. Please try again." },
      { status: 500 }
    );
  }
}
