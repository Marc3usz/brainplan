import { ToolFunction } from "../toolsLoader";

const OLLAMA_HOST = "https://ollama4.kkhost.pl";
const OLLAMA_MODEL = "qwen3:8b";

async function summarizeWithOllama(text: string, maxLength: number): Promise<string> {
  try {
    console.log("Sending request to Ollama AI for brainrot summary...");

    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          {
            role: "system",
            content: "Jesteś ekspertem w streszczaniu tekstów w stylu Gen Z / brainrot. Używaj jak najwięcej slangowych zwrotów jak literally, lowkey, vibes, no cap, slay, fr fr, based, wild, shook, deadass, big yikes, sus, flex, drip, bet, bussin, cringe, smh, fam, riz, ratio, bruh, goofy, skrrt, yeet, L, W, mid, banger, extra, salty, snack, stan, itp. Styl ma być bardzo luzacki, TikTokowo-memiczny. Odpowiadaj w tym samym języku, co oryginalny tekst. NIE używaj tagów <think>, podaj TYLKO finalne streszczenie."
          },
          {
            role: "user",
            content: `Streszcz ten tekst w nie więcej niż ${maxLength} znaków, używając stylu Gen Z / brainrot: ${text}`
          }
        ],
        options: {
          temperature: 0.85,
          top_p: 0.95
        },
        stream: false
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`API response error: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log("Response from Ollama AI:", responseText.substring(0, 200) + "...");

    const data = JSON.parse(responseText);
    let summary = data.message?.content || data.response || "";

    if (!summary) {
      throw new Error("No summary found in AI response");
    }

    summary = summary
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/<think>[\s\S]*/g, '')
      .replace(/<[^>]*>/g, '')
      .trim()
      .replace(/\s+/g, ' ');

    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength - 3) + '...';
    }

    console.log("Successfully created AI brainrot summary");
    return summary;
  } catch (error) {
    console.error("Error with Ollama AI:", error);
    throw error;
  }
}

const functions: ToolFunction[] = [
  {
    type: "function",
    function: {
      name: "summarizeText",
      description: "Streszcz tekst w stylu Gen Z / brainrot używając AI i zachowując język oryginału",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "Oryginalny tekst do streszczenia"
          },
          maxLength: {
            type: "number",
            description: "Maksymalna długość streszczenia (w znakach)"
          }
        },
        required: ["text"]
      }
    },
    execute: async ({ text, maxLength = 280 }: { text: string; maxLength?: number }) => {
      const cleanText = text.replace(/^text to brainrot:\s*/i, '').trim();

      if (cleanText.length <= maxLength) {
        return {
          original: cleanText,
          summary: cleanText,
          shortened: false
        };
      }

      console.log("Using Ollama AI to create brainrot summary...");
      const summary = await summarizeWithOllama(cleanText, maxLength);

      return {
        original: cleanText,
        summary,
        shortened: true,
        originalLength: cleanText.length,
        summaryLength: summary.length,
        compressionRatio: Math.round((summary.length / cleanText.length) * 100) + '%',
        method: "ollama-genz-style"
      };
    }
  }
];

export default functions;
