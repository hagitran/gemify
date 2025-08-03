export async function generateRubyPrompt(placeData: {
  notes: string;
  ambiance: string[];
  price: number;
  type: string;
}) {
  const { notes, ambiance, price, type } = placeData;

  // Only use AI if we have some data to work with
  if (notes && (price || ambiance?.length)) {
    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://gemify.me",
            "X-Title": "Gemify",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3.2-3b-instruct:free",
            messages: [
              {
                role: "system",
                content:
                  "You are Ruby, a friendly AI assistant that helps users improve their place reviews. Generate one short, casual, Gen-Z style question to help them add more detail. Keep it under 50 characters and make it feel natural and conversational.",
              },
              {
                role: "user",
                content: `Generate a helpful prompt for a ${type} place review. Current notes: "${notes}" (${
                  notes.length
                } chars). Price: ${price || "not set"}, Ambiance: ${
                  ambiance?.length ? ambiance.join(", ") : "not set"
                }. If the review looks complete (good notes, price, ambiance), say something positive like "looks great! ready to share?". Otherwise, suggest one improvement. Keep it under 50 characters and casual.`,
              },
            ],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const aiPrompt = data.choices?.[0]?.message?.content?.trim();

        if (aiPrompt && aiPrompt.length > 0 && aiPrompt.length < 100) {
          return aiPrompt;
        }
      }
    } catch (error) {
      console.log("AI prompt generation failed, using fallback:", error);
    }
  }

  // Fallback logic for missing essential data
  if (!ambiance?.length)
    return "what kinda vibe are we talkin'? cozy, lively, more chill?";
  if (!price) return "was it more $$ or affordable vibes?";
  if (!notes) return "what's your go-to here?";

  return "anything else that would help someone new here?";
}
