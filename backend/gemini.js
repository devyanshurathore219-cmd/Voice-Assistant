import axios from "axios";

// Base URL can be overridden, but you should not need to touch it.
const GEMINI_API_BASE =
  process.env.GEMINI_API_BASE?.trim() ||
  "https://generativelanguage.googleapis.com/v1beta";

// gemini-2.0-* models no longer get free-tier quota, so they always answer 429.
const DEFAULT_MODEL = "gemini-3.5-flash";

const buildError = (status, message, hint, raw = null) => ({
  success: false,
  status,
  message,
  hint,
  error: raw,
});

// The system prompt is built per request, because it embeds the assistant name,
// the owner name and the sentence the user just spoke.
const buildPrompt = (command, assistantName, userName) => `You are a virtual assistant named ${assistantName} created by ${userName}.
You are not Google. You will now behave like a voice-enabled assistant.

Your task is to understand the user's natural language input and respond with a JSON
object like this:

{
  "type": "general" | "google_search" | "youtube_search" | "youtube_play" |
          "get_time" | "get_date" | "get_day" | "get_month" | "calculator_open" |
          "instagram_open" | "facebook_open" | "weather-show",
  "userInput": "<original user input; remove your own name from it if present, and
                if the user asked to search something on Google or YouTube keep only
                the text to be searched>",
  "response": "<a short spoken response to read out loud to the user>"
}

Instructions:
- "type": determine the intent of the user.
- "userInput": the original sentence the user spoke.
- "response": a short voice-friendly reply, e.g., "Sure, playing it now",
  "Here's what I found", "Today is Tuesday", etc.

Type meanings:
- "general": if it's a factual or informational question.
- "google_search": if user wants to search something on Google.
- "youtube_search": if user wants to search something on YouTube.
- "youtube_play": if user wants to directly play a video or song.
- "calculator_open": if user wants to open a calculator.
- "instagram_open": if user wants to open Instagram.
- "facebook_open": if user wants to open Facebook.
- "weather-show": if user wants to know the weather.
- "get_time": if user asks for the current time.
- "get_date": if user asks for today's date.
- "get_day": if user asks what day it is.
- "get_month": if user asks for the current month.

Important:
- Use "${userName}" if anyone asks who created you.
- Only respond with the JSON object, nothing else.

now your userInput- ${command}
`;

const geminiResponse = async (
  command,
  assistantName = "Assistant",
  userName = "User",
) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // Accept either "gemini-3.5-flash" or "models/gemini-3.5-flash".
  const model = (process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL).replace(
    /^models\//,
    "",
  );

  if (!apiKey) {
    return buildError(
      500,
      "GEMINI_API_KEY is not configured",
      "Add GEMINI_API_KEY=<your key> to backend/.env and restart the server.",
    );
  }

  if (!command || typeof command !== "string" || command.trim().length === 0) {
    return buildError(
      400,
      "Command is required",
      "Call it as geminiResponse(command, assistantName, userName), where command is the sentence the user spoke.",
    );
  }

  const url = `${GEMINI_API_BASE}/models/${encodeURIComponent(
    model,
  )}:generateContent`;

  // Deliberately NOT called "prompt": re-declaring it here would shadow the
  // parameter and make ${prompt} inside the template a TDZ error.
  const systemPrompt = buildPrompt(command.trim(), assistantName, userName);

  try {
    const result = await axios.post(
      url,
      {
        contents: [
          {
            parts: [{ text: systemPrompt }],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          // Auth keys (the new "AQ." format) are sent as a header, not as ?key=
          "x-goog-api-key": apiKey,
        },
        timeout: 30000,
      },
    );

    const text = result?.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return buildError(
        502,
        "Gemini returned an empty response",
        "The request succeeded but no text was generated. Retry, or check whether the prompt was blocked by a safety filter.",
        result?.data || null,
      );
    }

    // Raw model text. The caller extracts the JSON object from it, e.g.
    // const jsonMatch = text.match(/{[\s\S]*}/)
    return text;
  } catch (error) {
    const status = error?.response?.status || 500;
    const apiMessage =
      error?.response?.data?.error?.message || error?.message || "Unknown error";

    let hint;
    if (status === 401 || status === 403) {
      hint =
        "The key was rejected. Create a fresh key at https://aistudio.google.com/apikey and update GEMINI_API_KEY in backend/.env.";
    } else if (status === 404) {
      hint = `The model "${model}" is not available to this key. Set GEMINI_MODEL in backend/.env to a supported model, e.g. gemini-3.5-flash or gemini-flash-latest.`;
    } else if (status === 429) {
      hint = `Quota exhausted for "${model}", the key itself is fine. Legacy gemini-2.0-* models have a free-tier limit of 0. Set GEMINI_MODEL=gemini-3.5-flash-lite in backend/.env, or wait for the daily quota to reset.`;
    } else if (status === 503) {
      hint = `"${model}" is temporarily overloaded, nothing is wrong with the key or the request. Retry in a moment, or set GEMINI_MODEL=gemini-flash-latest in backend/.env.`;
    } else if (error?.code === "ECONNABORTED") {
      hint = `The request to "${model}" timed out. This usually means the model is under heavy load. Retry, or switch GEMINI_MODEL in backend/.env to a lighter model such as gemini-3.5-flash-lite.`;
    } else {
      hint = "Check the server logs and the Gemini API status.";
    }

    console.error(
      `Gemini request failed (${status}) for model "${model}": ${apiMessage}`,
    );

    return buildError(status, apiMessage, hint, error?.response?.data || null);
  }
};

export default geminiResponse;
