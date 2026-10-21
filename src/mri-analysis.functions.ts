import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  imageBase64: z.string().min(50),
  mimeType: z.string().default("image/jpeg"),
  patient: z.object({
    full_name: z.string().optional(),
    age: z.number().nullable().optional(),
    gender: z.string().optional(),
    diabetes: z.boolean().optional(),
    hypertension: z.boolean().optional(),
    previous_tumor: z.boolean().optional(),
    family_history: z.string().nullable().optional(),
    medications: z.string().nullable().optional(),
    surgeries: z.string().nullable().optional(),
  }).optional(),
});

export type MriAnalysis = {
  tumor_type: "Glioma" | "Meningioma" | "Pituitary" | "No Tumor";
  confidence: number;
  risk_level: "Low" | "Moderate" | "High" | "Critical";
  affected_region: string;
  observation: string;
  reasoning: string;
  symptoms: string[];
  recommended_tests: string[];
  treatments: string[];
  probabilities: { Glioma: number; Meningioma: number; Pituitary: number; NoTumor: number };
};

const SYSTEM_PROMPT = `You are NeuroMind-CNN, an enterprise brain-tumor detection and clinical reasoning engine used by radiologists. You analyze MRI brain scans and return a strict structured JSON diagnosis.

Detect one of: Glioma, Meningioma, Pituitary, No Tumor.
Ground your reasoning in visible morphology: shape, hyperintensity, edema, midline shift, location. Include a plausible affected brain region.
Provide confidence [0-1], a 4-class probability distribution summing ~1, risk level, symptoms, recommended tests, treatments.
Never say "I can't diagnose from an image" — you are a decision-support model, not final diagnosis, so respond in full.
If the image is not clearly an MRI or is ambiguous, still return your best-effort analysis with lower confidence.

Return ONLY compact JSON, no prose, no markdown fences, matching:
{"tumor_type":"...","confidence":0.0,"risk_level":"Low|Moderate|High|Critical","affected_region":"...","observation":"...","reasoning":"...","symptoms":["..."],"recommended_tests":["..."],"treatments":["..."],"probabilities":{"Glioma":0,"Meningioma":0,"Pituitary":0,"NoTumor":0}}`;

export const analyzeMri = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<MriAnalysis> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const patientCtx = data.patient
      ? `Patient context — age: ${data.patient.age ?? "unknown"}, gender: ${data.patient.gender ?? "unknown"}, diabetes: ${!!data.patient.diabetes}, hypertension: ${!!data.patient.hypertension}, previous tumor: ${!!data.patient.previous_tumor}, family history: ${data.patient.family_history ?? "none"}, medications: ${data.patient.medications ?? "none"}.`
      : "No patient context.";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: `${patientCtx}\nAnalyze this MRI and return JSON only.` },
              { type: "image_url", image_url: { url: `data:${data.mimeType};base64,${data.imageBase64}` } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      if (res.status === 429) throw new Error("Rate limit exceeded. Please try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Plans.");
      throw new Error(`AI gateway error ${res.status}: ${t.slice(0, 200)}`);
    }

    const payload = await res.json();
    const raw = payload.choices?.[0]?.message?.content ?? "{}";
    let parsed: MriAnalysis;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("AI returned malformed JSON");
    }

    // Normalize probabilities
    const p = parsed.probabilities ?? ({} as any);
    const sum = (p.Glioma ?? 0) + (p.Meningioma ?? 0) + (p.Pituitary ?? 0) + (p.NoTumor ?? 0);
    if (sum > 0) {
      parsed.probabilities = {
        Glioma: +(p.Glioma / sum).toFixed(3),
        Meningioma: +(p.Meningioma / sum).toFixed(3),
        Pituitary: +(p.Pituitary / sum).toFixed(3),
        NoTumor: +(p.NoTumor / sum).toFixed(3),
      };
    }
    return parsed;
  });
