import { isAuthed } from "../../_lib/auth.js";
import { imageKey, serveR2 } from "../../_lib/media.js";

// 이미지 주소는 한 번 올리면 내용이 바뀌지 않지만(교체 시 새 id), 예전 D1 시절
// 같은 id 를 덮어쓴 적이 있어 must-revalidate 로 두고 ETag 로 304 를 받게 한다.
const CACHE = "public, max-age=0, must-revalidate";

export async function onRequestGet({ request, params, env }) {
  if (env.MEDIA) {
    const res = await serveR2(request, env.MEDIA, imageKey(params.id), CACHE);
    if (res) return res;
  }
  // R2 에 없으면 예전 방식(D1 assets 테이블)에서 찾는다
  if (!env.DB) return new Response("Not found", { status: 404 });
  const row = await env.DB.prepare('SELECT content_type, data FROM assets WHERE id = ?').bind(params.id).first();
  if (!row) return new Response("Not found", { status: 404 });
  // This D1 binding returns BLOB columns as a plain number Array rather than
  // an ArrayBuffer, so passing row.data to Response directly serializes it
  // via Array.prototype.toString() (a comma-joined decimal string) instead
  // of sending the actual bytes.
  const bytes = row.data instanceof ArrayBuffer ? row.data : new Uint8Array(row.data);
  return new Response(bytes, {
    headers: {
      "Content-Type": row.content_type || "application/octet-stream",
      "Cache-Control": CACHE,
    },
  });
}

export async function onRequestDelete({ request, params, env }) {
  if (!(await isAuthed(request, env))) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (env.MEDIA) await env.MEDIA.delete(imageKey(params.id));
  if (env.DB) await env.DB.prepare('DELETE FROM assets WHERE id = ?').bind(params.id).run();
  return Response.json({ ok: true });
}
