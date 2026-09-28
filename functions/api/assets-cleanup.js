import { isAuthed } from "../_lib/auth.js";
import { imageKey, videoKey, isUuid } from "../_lib/media.js";

// 업로드한 파일의 주소(/api/asset/<id>, /api/video/<id>)는 content 테이블의
// 문서 JSON 안에 문자열로 들어간다. 브랜드·제품을 지우거나 사진·영상을 바꾸면
// 문서에서 주소만 빠지고 파일은 남아 용량만 차지하므로, 빠진 id 를 받아
// "이제 아무 문서에서도 안 쓰는" 것만 R2(와 예전 D1)에서 지운다.
//
// POST /api/assets-cleanup  { ids: [이미지 id...], videoIds: [영상 id...] }  (관리자 전용)
export async function onRequestPost({ request, env }) {
  if (!(await isAuthed(request, env))) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!env.DB) return new Response("DB binding is not configured", { status: 500 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const ids = Array.isArray(body.ids) ? body.ids.filter(isUuid) : [];
  const videoIds = Array.isArray(body.videoIds) ? body.videoIds.filter(isUuid) : [];

  const unreferenced = async (path) => {
    const row = await env.DB.prepare("SELECT COUNT(*) AS refs FROM content WHERE data LIKE ?1").bind(`%${path}%`).first();
    return row && Number(row.refs) === 0;
  };

  let removed = 0;
  for (const id of ids) {
    if (!(await unreferenced(`/api/asset/${id}`))) continue;
    if (env.MEDIA) await env.MEDIA.delete(imageKey(id));
    await env.DB.prepare("DELETE FROM assets WHERE id = ?").bind(id).run();
    removed++;
  }
  for (const id of videoIds) {
    if (!(await unreferenced(`/api/video/${id}`))) continue;
    if (env.MEDIA) await env.MEDIA.delete(videoKey(id));
    removed++;
  }
  return Response.json({ ok: true, removed });
}
