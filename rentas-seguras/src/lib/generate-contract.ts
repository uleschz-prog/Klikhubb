import OpenAI from "openai";
import type { ContractFormData } from "@/lib/contract-schema";
import { getOpenAiKey, getOpenAiModel } from "@/lib/env";
import {
  buildLeaseUserPrompt,
  HIDALGO_LEASE_SYSTEM_PROMPT,
} from "@/lib/prompts/hidalgo-lease";

export class OpenAiNotConfiguredError extends Error {
  constructor() {
    super(
      "Falta OPENAI_API_KEY. Configúrala en rentas-seguras/.env.local para generar el contrato."
    );
    this.name = "OpenAiNotConfiguredError";
  }
}

export async function generateLeaseContract(
  data: ContractFormData
): Promise<string> {
  const apiKey = getOpenAiKey();
  if (!apiKey) {
    throw new OpenAiNotConfiguredError();
  }

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: getOpenAiModel(),
    temperature: 0.2,
    messages: [
      { role: "system", content: HIDALGO_LEASE_SYSTEM_PROMPT },
      { role: "user", content: buildLeaseUserPrompt(data) },
    ],
  });

  const markdown = completion.choices[0]?.message?.content?.trim();
  if (!markdown) {
    throw new Error("OpenAI no devolvió contenido para el contrato.");
  }

  return markdown;
}
