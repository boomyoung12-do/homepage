import { isAuthed } from "../_lib/auth.js";
import { imageKey } from "../_lib/media.js";

// Admin image uploads. Images go to R2 (env.MEDIA) and are served back out
// through /api/asset/:id. If no R2 binding is configured they fall back to
// BLOBs in the D1 assets table, which is how older uploads were stored.
const MAX_BYTES = 5 * 1024 * 1024; // 5MB per image is plenty for web use

export async function onRequestPost({ request, env }) {
  if (!(await isAuthed(request, env))) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!env.MEDIA && !env.DB) {
    return new Response("No storage binding is configured", { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { filename, dataBase64, contentType } = body;
  if (!dataBase64 || !contentType || !contentType.startsWith("image/")) {
    return new Response("Expected { filename, dataBase64, contentType: image/* }", { status: 400 });
  }

  let bytes;
  try {
    const binary = atob(dataBase64);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  } catch {
    return new Response("Invalid base64 data", { status: 400 });
  }
  if (bytes.byteLength > MAX_BYTES) {
    return new Response("Image too large (max 5MB)", { status: 413 });
  }

  const id = crypto.randomUUID();
  if (env.MEDIA) {
    await env.MEDIA.put(imageKey(id), bytes, {
      httpMetadata: { contentType },
      customMetadata: { filename: filename || id },
    });
    return Response.json({ id, url: `/api/asset/${id}` });
  }
  // D1's HTTP binding layer only recognizes a raw ArrayBuffer as BLOB —
  // binding the Uint8Array view directly gets coerced to its comma-joined
  // decimal string (e.g. "137,80,78,...") instead of the actual bytes.
  await env.DB.prepare('INSERT INTO assets (id, content_type, filename, data) VALUES (?, ?, ?, ?)')
    .bind(id, contentType, filename || id, bytes.buffer)
    .run();

  return Response.json({ id, url: `/api/asset/${id}` });
}
