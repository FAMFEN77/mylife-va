import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { fetch } from "undici";
import OpenAI from "openai";

import { IntentLabel, IntentResult } from "./intent.types";

const INTENT_VALUES: IntentLabel[] = [
  "task.create",
  "task.list",
  "reminder.create",
  "reminder.list",
  "calendar.create",
  "meeting.schedule",
  "room.reserve",
  "email.send",
  "email.write",
  "grocery.list",
  "file.summarize",
  "math.calculate",
  "unknown",
];

interface AiIntentResponse {
  intent?: string;
  confidence?: number;
  parameters?: Record<string, unknown>;
}

@Injectable()
export class IntentDetectionService {
  private readonly logger = new Logger(IntentDetectionService.name);
  private client?: OpenAI;

  constructor(private readonly configService: ConfigService) {}

  async detect(message: string): Promise<IntentResult> {
    const apiKey = this.configService.get<string>("OPENAI_API_KEY");

    if (apiKey) {
      try {
        return await this.detectWithOpenAi(message, apiKey);
      } catch (error) {
        this.logger.warn(`OpenAI intent detectie mislukt: ${error}`);
      }
    }

    const ollamaHost =
      this.configService.get<string>("OLLAMA_HOST") ??
      this.configService.get<string>("AI_HOST") ??
      process.env.OLLAMA_HOST ??
      process.env.AI_HOST;

    if (ollamaHost) {
      try {
        const ollamaIntent = await this.detectWithOllama(message, ollamaHost);
        if (ollamaIntent) {
          return ollamaIntent;
        }
      } catch (error) {
        this.logger.warn(`Ollama intent detectie mislukt: ${error}`);
      }
    }

    return this.keywordFallback(message);
  }

  private async detectWithOpenAi(message: string, apiKey: string): Promise<IntentResult> {
    if (!this.client) {
      this.client = new OpenAI({ apiKey });
    }

    const model = this.configService.get<string>("OPENAI_INTENT_MODEL") ?? "gpt-4o-mini";

    const completion = await this.client.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: this.intentPrompt(),
        },
        { role: "user", content: message },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error("Leeg antwoord van OpenAI");
    }

    return this.parseIntentResponse(rawContent);
  }

  private async detectWithOllama(message: string, host: string): Promise<IntentResult | undefined> {
    const model =
      this.configService.get<string>("OLLAMA_INTENT_MODEL") ??
      this.configService.get<string>("AI_INTENT_MODEL") ??
      this.configService.get<string>("AI_MODEL") ??
      "llama3";

    const url = `${host.replace(/\/+$/, "")}/api/chat`;

    const controller = new AbortController();
    const timeoutMs =
      Number(this.configService.get<string>("OLLAMA_TIMEOUT_MS") ?? process.env.OLLAMA_TIMEOUT_MS ?? 6000);
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          stream: false,
          format: "json",
          options: {
            temperature: 0,
          },
          messages: [
            { role: "system", content: this.intentPrompt() },
            { role: "user", content: message },
          ],
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama request failed (${response.status}): ${errorText}`);
      }

      const textPayload = await response.text();
      const data = this.safeParseJson(textPayload) as {
        message?: { content?: string | Array<{ type: string; text: string }> };
        response?: string;
      };

      const content = this.extractOllamaContent(data);
      if (!content) {
        throw new Error("Leeg antwoord van Ollama");
      }

      return this.parseIntentResponse(content);
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        throw new Error(`Ollama request timed out after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private safeParseJson(payload: string): unknown {
    try {
      return JSON.parse(payload);
    } catch (error) {
      this.logger.warn(`Kon Ollama-antwoord niet als JSON lezen: ${(error as Error).message}`);
      throw new Error("Ollama antwoord is geen geldige JSON");
    }
  }

  private parseIntentResponse(rawContent: string): IntentResult {
    const cleaned = rawContent.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as AiIntentResponse;
    const mappedIntent = this.ensureIntent(parsed.intent);
    if (!mappedIntent) {
      throw new Error(`Onbekende intent: ${parsed.intent}`);
    }

    return {
      intent: mappedIntent,
      confidence: this.ensureConfidence(parsed.confidence),
      parameters: this.ensureParameters(parsed.parameters),
    };
  }

  private intentPrompt(): string {
    return [
      "Je bent een intent-classifier voor een Nederlandse persoonlijke assistent.",
      "Beschikbare intents (exact overnemen): task.create, task.list, reminder.create, reminder.list, calendar.create, meeting.schedule, room.reserve, email.send, email.write, grocery.list, file.summarize, math.calculate.",
      "Gebruik email.write wanneer de gebruiker een e-mail of brief wil laten opstellen (woorden zoals 'schrijf', 'stel op', 'maak brief', 'maak e-mail'). Gebruik task.create alleen wanneer er expliciet om een taak/todo wordt gevraagd. Gebruik email.send uitsluitend als er om verzending met ontvanger/onderwerp/body wordt gevraagd.",
      "Retourneer het antwoord ALLEEN als JSON-object (geen tekst of Markdown eromheen). Begin direct met { en eindig met }. Gebruik exact de velden \"intent\", \"confidence\" (float 0-1) en \"parameters\" (object). Geen commentaar, geen code fences.",
      "Voorbeeld 1: {\"intent\":\"email.write\",\"confidence\":0.87,\"parameters\":{\"tone\":\"formeel\",\"subject\":\"Projectstatus\",\"body\":\"...\"}}",
      "Voorbeeld 2: {\"intent\":\"reminder.create\",\"confidence\":0.74,\"parameters\":{\"description\":\"Bel klant\",\"dateTime\":\"2025-11-07T09:00\"}}",
      "Voorbeeld 3: {\"intent\":\"task.create\",\"confidence\":0.68,\"parameters\":{\"title\":\"Projectaanvraag\",\"description\":\"Stel brief op\",\"dueDate\":\"2025-11-30\"}}",
      "Gebruik deze structuur exact en pas de parameters aan op basis van het bericht. Geen extra velden toevoegen.",
    ].join(" ");
  }

  private extractOllamaContent(data: {
    message?: { content?: string | Array<{ type: string; text: string }> };
    response?: string;
  }): string | undefined {
    if (typeof data?.message?.content === "string") {
      return data.message.content;
    }

    if (Array.isArray(data?.message?.content)) {
      return data.message.content
        .map((part) => (typeof part?.text === "string" ? part.text : undefined))
        .filter(Boolean)
        .join("\n");
    }

    if (typeof data.response === "string") {
      return data.response;
    }

    return undefined;
  }

  private ensureIntent(value: string | undefined): IntentLabel | undefined {
    if (!value) {
      return undefined;
    }
    const candidate = value.toLowerCase() as IntentLabel;
    return INTENT_VALUES.includes(candidate) ? candidate : undefined;
  }

  private ensureConfidence(value: number | undefined): number | undefined {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return undefined;
    }
    return Math.min(Math.max(value, 0), 1);
  }

  private ensureParameters(value: Record<string, unknown> | undefined): Record<string, unknown> {
    if (!value || typeof value !== "object") {
      return {};
    }
    const normalized: Record<string, unknown> = { ...value };

    if (typeof normalized.description !== "string" && typeof normalized.text === "string") {
      normalized.description = normalized.text;
    }
    if (normalized.dateTime === undefined && typeof normalized.datetime === "string") {
      normalized.dateTime = normalized.datetime;
    }
    if (normalized.dateTime === undefined && typeof normalized.remindAt === "string") {
      normalized.dateTime = normalized.remindAt;
    }
    if (normalized.date === undefined && typeof normalized.day === "string") {
      normalized.date = normalized.day;
    }

    return normalized;
  }

  private keywordFallback(message: string): IntentResult {
    const lower = message.toLowerCase();

    if (lower.includes("herinner") || lower.includes("reminder")) {
      const upcoming = new Date();
      upcoming.setMinutes(upcoming.getMinutes() + 10);
      return {
        intent: "reminder.create",
        parameters: {
          description: this.extractReminderDescription(message),
          dateTime: upcoming.toISOString(),
        },
      };
    }

    if (lower.includes("toon reminders") || lower.includes("lijst reminders")) {
      return { intent: "reminder.list", parameters: {} };
    }

    if (/\b\d{1,2}[:.]\d{2}\b/.test(lower) || /\b\d{1,2}\s*(uur|u)\b/.test(lower)) {
      return { intent: "unknown", parameters: {} };
    }

    const expression = this.extractMathExpression(lower);
    if (expression) {
      return {
        intent: "math.calculate",
        parameters: { expression },
      };
    }

    if (lower.includes("taak") || lower.includes("todo") || lower.includes("werk op")) {
      return { intent: "task.create", parameters: { text: message } };
    }

    if (lower.includes("toon taken") || lower.includes("takenlijst")) {
      return { intent: "task.list", parameters: {} };
    }

    if (lower.includes("meeting") || lower.includes("afspraak") || lower.includes("call")) {
      return {
        intent: "calendar.create",
        parameters: { title: "Afspraak", datetime: new Date().toISOString() },
      };
    }

    if (
      lower.includes("reserveer") ||
      lower.includes("boek") ||
      lower.includes("vergaderruimte") ||
      lower.includes("meeting room")
    ) {
      return {
        intent: "room.reserve",
        parameters: {
          roomLabel: this.extractRoomKeyword(message),
          datetime: new Date().toISOString(),
        },
      };
    }

    if (
      lower.includes("schrijf een mail") ||
      lower.includes("schrijf een e-mail") ||
      lower.includes("email opstellen") ||
      lower.includes("e-mail opstellen") ||
      (lower.includes("mail") && lower.includes("concept"))
    ) {
      return {
        intent: "email.write",
        parameters: { body: message },
      };
    }

    if (lower.includes("mail") || lower.includes("e-mail")) {
      return {
        intent: "email.send",
        parameters: { subject: "Bericht", body: message },
      };
    }

    if (lower.includes("boodschappen") || lower.includes("groceries")) {
      return { intent: "grocery.list", parameters: {} };
    }

    if (lower.includes("pdf") || lower.includes("document")) {
      return { intent: "file.summarize", parameters: {} };
    }

    return { intent: "unknown", parameters: {} };
  }

  private extractMathExpression(message: string): string | undefined {
    const trimmed = message.trim().toLowerCase();

    if (
      trimmed.includes("herinner") ||
      trimmed.includes("reminder") ||
      /\b\d{1,2}[:.]\d{2}\b/.test(trimmed) ||
      /\b\d{1,2}\s*(uur|u)\b/.test(trimmed)
    ) {
      return undefined;
    }

    const cleaned = trimmed.replace(/[^0-9+\-*/().,^%√\s]/g, " ");
    const candidate = cleaned
      .replace(/\s{2,}/g, " ")
      .trim()
      .replace(/^bereken\s+/i, "")
      .replace(/^wat\s+is\s+/i, "")
      .trim();

    if (!candidate) {
      return undefined;
    }

    const validCharacters = /^[0-9+\-*/().,^%√\s]+$/;
    if (!validCharacters.test(candidate)) {
      return undefined;
    }

    if (!/[0-9]/.test(candidate)) {
      return undefined;
    }

    const hasOperator = /[+\-*/^%√]/.test(candidate);
    const hasKeyword = /bereken|som|reken|calculate|calc/.test(trimmed);

    if (!hasOperator && !hasKeyword) {
      return undefined;
    }

    return candidate;
  }

  private extractRoomKeyword(message: string): string | undefined {
    const roomMatch = message.match(/(ruimte|room|ruimte\s+[a-z0-9]+|vergaderruimte\s+[a-z0-9]+|ruimte\s+\w+)/i);
    if (!roomMatch) {
      return undefined;
    }
    return roomMatch[0]?.replace(/^(ruimte|vergaderruimte)\s*/i, "").trim() || undefined;
  }

  private extractReminderDescription(message: string): string {
    const trimmed = message.trim();
    const patterns = [
      /herinner\s+me\s+(?:eraan\s+)?(?:om\s+|over\s+|aan\s+)?(.+)/i,
      /maak\s+(?:een\s+)?reminder\s+(?:aan\s+)?(?:voor|om)\s+(.+)/i,
      /zet\s+(.+?)\s+als\s+reminder/i,
      /plan\s+(?:een\s+)?herinnering\s+(?:voor|om)\s+(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match?.[1]) {
        const cleaned = this.cleanReminderDescription(match[1]);
        if (cleaned) {
          return cleaned;
        }
      }
    }

    if (trimmed.toLowerCase().startsWith("reminder")) {
      const remainder = trimmed.substring("reminder".length).trim();
      const cleaned = this.cleanReminderDescription(remainder);
      if (cleaned) {
        return cleaned;
      }
      return remainder;
    }

    return this.cleanReminderDescription(trimmed) ?? trimmed;
  }

  private cleanReminderDescription(raw: string): string | undefined {
    let result = raw.trim();
    if (!result) {
      return undefined;
    }

    result = result.replace(/^herinner\s+me\s+(?:eraan\s+)?(?:om\s+|over\s+|aan\s+)?/i, "");
    result = result.replace(/^maak\s+(?:een\s+)?reminder\s+(?:aan\s+)?(?:voor|om)\s+/i, "");
    result = result.replace(/^zet\s+(?:een\s+)?reminder\s*(?:aan\s*)?(?:voor|om)\s+/i, "");
    result = result.replace(/^reminder\s*[:,\-]?\s*/i, "");
    result = result.replace(/\b(?:om|at)\b\s+\d{1,2}(?::\d{2})?(?:\s*(?:uur|u|am|pm))?/gi, " ");
    result = result.replace(/\b\d{1,2}[:.]\d{2}\b/gi, " ");
    result = result.replace(/\b\d{1,2}\s*(?:uur|u)\b/gi, " ");
    result = result.replace(/^(?:morgen|vandaag|overmorgen)\b[\s,]*/i, "");
    result = result.replace(/\b(?:en\s+)?zet\s+(?:het\s+)?in\s+de\s+agenda\b.*$/i, " ");
    result = result.replace(/\bplaats\s+(?:het\s+)?in\s+de\s+agenda\b.*$/i, " ");
    result = result.replace(/\bvoeg\s+(?:het\s+)?toe\s+aan\s+de\s+agenda\b.*$/i, " ");

    const trailing = result.match(/\b(?:voor|om|over|aan)\s+(.+)/i);
    if (trailing?.[1]) {
      const candidate = trailing[1].trim();
      if (candidate && !/^(?:morgen|vandaag|overmorgen)\b/i.test(candidate)) {
        result = candidate;
      }
    }

    result = result.replace(/\been\s+reminder\b/gi, " ");
    result = result.replace(/\breminder\b/gi, " ");
    result = result.replace(/\bherinnering\b/gi, " ");
    result = result.replace(/\s{2,}/g, " ").trim();
    result = result.replace(/^[,.\-\s]+|[,.\-\s]+$/g, "");

    return result.length ? result : undefined;
  }
}
