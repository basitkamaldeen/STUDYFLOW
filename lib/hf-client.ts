// lib/hf-client.ts
export const HF_SPACE_URL = process.env.HF_SPACE_URL;

type HFPayload = string | object;

export async function callHFSpace(endpoint: string, payload: HFPayload) {
  try {
    const res = await fetch(`${HF_SPACE_URL}/api/predict/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [payload] }),
    });
    const json = await res.json();
    return json?.data?.[0] ?? null;
  } catch (err) {
    console.error("HF Space call error:", err);
    return null;
  }
}
