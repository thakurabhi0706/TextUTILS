export async function askAI(prompt, context = "") {
  // Use the '-latest' alias to avoid 404s when Google updates versions
  const MODEL = "gemini-flash-latest"; 
  const API_VERSION = "v1beta";
  const URL = `https://generativelanguage.googleapis.com/${API_VERSION}/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: context
                  ? `Context: ${context}\n\nTask: ${prompt}`
                  : prompt,
              },
            ],
          },
        ],
      }),
    });

    const data = await res.json();

    // Check for API-level errors (like 404 or 429)
    if (data.error) {
      console.error("Gemini API Error:", data.error.message);
      throw new Error(`API Error: ${data.error.message}`);
    }

    // Safety check for empty or blocked responses
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.warn("Response blocked or empty:", JSON.stringify(data, null, 2));
      throw new Error("Gemini returned an empty response (possibly blocked by safety filters).");
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("askAI Function Failed:", error.message);
    throw error;
  }
}