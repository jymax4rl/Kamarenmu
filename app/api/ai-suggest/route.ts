import { NextRequest } from "next/server";
import OpenAI from "openai";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import {
  PARTS_OF_SPEECH,
  WORD_TYPES,
  SEMANTIC_CATEGORIES,
  FREQUENCY_LEVELS,
} from "@/lib/dictionary-vocab";

export interface AISuggestion {
  partOfSpeech?: string;
  wordType?: string;
  semanticCategories?: string[];
  frequencyLevel?: string;
  relatedConcepts?: string[];
}

const SYSTEM_PROMPT = `
You are a linguistic analysis assistant specialising in Soninké (Soninke), a Mande language spoken in West Africa (Mali, Senegal, Mauritania, Gambia, Guinea-Bissau).

You will receive a dictionary entry with a Soninké word and one or more translations.
Return ONLY a JSON object — no explanation, no markdown — with these fields:

{
  "partOfSpeech": one of ${JSON.stringify(PARTS_OF_SPEECH)},
  "wordType": one of ${JSON.stringify(WORD_TYPES)},
  "semanticCategories": array (1–5 items) from ${JSON.stringify(SEMANTIC_CATEGORIES)},
  "frequencyLevel": one of ${JSON.stringify(FREQUENCY_LEVELS)},
  "relatedConcepts": array of 3–5 short English keywords related to the concept
}

Rules:
- Infer from the translations, not from the Soninké spelling.
- If uncertain, omit the field rather than guessing.
- semanticCategories must be from the provided list exactly.
- relatedConcepts are free-text keywords (lowercase English).
`.trim();

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    // Graceful degradation — return empty suggestions
    return jsonOk({ suggestions: {} });
  }

  try {
    const { soninke, english, french } = await req.json();

    if (!soninke?.trim() || (!english?.trim() && !french?.trim())) {
      return jsonError("soninke + at least one translation required", 400);
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const userMessage = JSON.stringify({
      word: soninke.trim(),
      ...(english?.trim() && { english: english.trim() }),
      ...(french?.trim()  && { french:  french.trim()  }),
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userMessage },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as AISuggestion;

    // Validate + sanitise — only return values that are in our enum lists
    const suggestions: AISuggestion = {};

    if (parsed.partOfSpeech && (PARTS_OF_SPEECH as readonly string[]).includes(parsed.partOfSpeech)) {
      suggestions.partOfSpeech = parsed.partOfSpeech;
    }
    if (parsed.wordType && (WORD_TYPES as readonly string[]).includes(parsed.wordType)) {
      suggestions.wordType = parsed.wordType;
    }
    if (Array.isArray(parsed.semanticCategories)) {
      suggestions.semanticCategories = parsed.semanticCategories.filter(
        (c) => (SEMANTIC_CATEGORIES as readonly string[]).includes(c)
      );
    }
    if (parsed.frequencyLevel && (FREQUENCY_LEVELS as readonly string[]).includes(parsed.frequencyLevel)) {
      suggestions.frequencyLevel = parsed.frequencyLevel;
    }
    if (Array.isArray(parsed.relatedConcepts)) {
      suggestions.relatedConcepts = parsed.relatedConcepts
        .filter((c) => typeof c === "string")
        .slice(0, 6);
    }

    return jsonOk({ suggestions });
  } catch (e) {
    console.error("[ai-suggest]", e);
    // Never crash the form — return empty suggestions on any error
    return jsonOk({ suggestions: {} });
  }
}
