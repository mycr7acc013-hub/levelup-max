const BASE = "https://ai.gateway.lovable.dev";
export const IMAGE_MODEL = "openai/gpt-image-2.5-sunburst";
export const VIDEO_MODEL = "google/gemini-omni-1.1-flash";

function key() {
  const k = process.env["LOVABLE_API_KEY"];
  if (!k) throw new Response("AI is not configured", { status: 500 });
  return k;
}

export const SAFE_PREFIX = "Create appropriate, family-friendly content. No nudity, gore, hate, or real public figures. ";

export function generateImage(prompt: string, signal?: AbortSignal) {
  return fetch(`${BASE}/v1/images/generations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: IMAGE_MODEL, prompt: SAFE_PREFIX + prompt, stream: true, partial_images: 1 }),
    signal: signal ?? null,
  });
}

export function generateImageOnce(prompt: string) {
  return fetch(`${BASE}/v1/images/generations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: IMAGE_MODEL, prompt: SAFE_PREFIX + prompt }),
  });
}

export type VideoJob = { id: string; status: "queued" | "in_progress" | "completed" | "failed"; progress?: number; error?: { code: string; message: string } };

export class GatewayError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function job(res: Response): Promise<VideoJob> {
  if (!res.ok) {
    const b = (await res.json().catch(() => null)) as { message?: string; error?: { message?: string } } | null;
    throw new GatewayError(res.status, b?.message ?? b?.error?.message ?? `Video request failed (${res.status})`);
  }
  return res.json() as Promise<VideoJob>;
}

export async function createVideo(input: string | Record<string, unknown>[], duration: string, extend = false) {
  return job(await fetch(`${BASE}/v1/videos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: VIDEO_MODEL,
      input,
      response_format: { type: "video", resolution: "720p", duration, ...(extend ? {} : { aspect_ratio: "16:9" }) },
      ...(extend ? { generation_config: { video_config: { task: "extend" } } } : {}),
    }),
  }));
}

export async function pollVideo(id: string) {
  return job(await fetch(`${BASE}/v1/videos/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${key()}` } }));
}

export async function downloadVideo(id: string) {
  const res = await fetch(`${BASE}/v1/videos/${encodeURIComponent(id)}/content`, { headers: { Authorization: `Bearer ${key()}` } });
  if (!res.ok) throw new Error(`Video download failed (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

export function toBase64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
