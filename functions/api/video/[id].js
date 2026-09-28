import { isAuthed } from "../../_lib/auth.js";
import { videoKey, serveR2 } from "../../_lib/media.js";

// 업로드한 배경 영상을 내보낸다. 아이폰 사파리는 Range 응답이 없으면 영상을
// 재생하지 않으므로 serveR2 가 206 부분 응답을 처리한다.
// 영상은 교체할 때마다 새 id 를 받으므로 오래 캐시해도 된다.
const CACHE = "public, max-age=31536000, immutable";

export async function onRequestGet({ request, params, env }) {
  if (!env.MEDIA) return new Response("Not configured", { status: 500 });
  const res = await serveR2(request, env.MEDIA, videoKey(params.id), CACHE);
  return res || new Response("Not found", { status: 404 });
}

export async function onRequestHead(context) {
  const res = await onRequestGet(context);
  return new Response(null, { status: res.status, headers: res.headers });
}

export async function onRequestDelete({ request, params, env }) {
  if (!(await isAuthed(request, env))) return new Response("Unauthorized", { status: 401 });
  if (env.MEDIA) await env.MEDIA.delete(videoKey(params.id));
  return Response.json({ ok: true });
}
