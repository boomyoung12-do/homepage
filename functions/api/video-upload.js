import { isAuthed } from "../_lib/auth.js";
import { videoKey } from "../_lib/media.js";

// 배경 영상 업로드 (관리자 전용). 요청 본문이 영상 파일 그대로이고,
// R2 로 곧장 흘려보내므로 서버 메모리에 파일 전체를 올리지 않는다.
//   POST /api/video-upload
//   Content-Type: video/mp4 | video/webm
//   X-Filename: <원래 파일 이름, URI 인코딩>
//   → { id, url: "/api/video/<id>" }
export const MAX_VIDEO_BYTES = 90 * 1024 * 1024; // Pages 요청 본문 한도(100MB)보다 여유 있게

export async function onRequestPost({ request, env }) {
  if (!(await isAuthed(request, env))) return new Response("Unauthorized", { status: 401 });
  if (!env.MEDIA) return new Response("R2(MEDIA) 저장소가 연결되어 있지 않습니다.", { status: 500 });

  const contentType = (request.headers.get("Content-Type") || "").split(";")[0].trim();
  if (!/^video\/(mp4|webm)$/.test(contentType)) {
    return new Response("mp4 또는 webm 영상만 올릴 수 있습니다.", { status: 400 });
  }
  const size = Number(request.headers.get("Content-Length") || 0);
  if (!size) return new Response("파일 크기를 알 수 없습니다.", { status: 411 });
  if (size > MAX_VIDEO_BYTES) return new Response("영상은 90MB 이하만 올릴 수 있습니다.", { status: 413 });

  let filename = "";
  try {
    filename = decodeURIComponent(request.headers.get("X-Filename") || "");
  } catch {}

  const id = crypto.randomUUID();
  await env.MEDIA.put(videoKey(id), request.body, {
    httpMetadata: { contentType },
    customMetadata: { filename: filename || id },
  });
  return Response.json({ id, url: `/api/video/${id}` });
}
