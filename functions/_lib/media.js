// 어드민 업로드 파일(이미지·영상)은 R2(env.MEDIA)에 저장한다.
// 주소 모양은 예전 D1 저장 방식과 같게 유지한다(/api/asset/<id>, /api/video/<id>).
// 콘텐츠 문서 안에 이미 들어간 주소나 정리(cleanup) 로직을 바꾸지 않아도 되기 때문이다.
// R2 에 없는 id 는 예전 방식대로 D1 assets 테이블에서 찾는다.

export const imageKey = (id) => `images/${id}`;
export const videoKey = (id) => `videos/${id}`;

export function isUuid(id) {
  return typeof id === "string" && /^[0-9a-fA-F-]{36}$/.test(id);
}

// R2 객체를 Range/조건부 요청에 맞춰 응답한다 (영상 재생·이미지 캐시 둘 다 사용)
export async function serveR2(request, bucket, key, cacheControl) {
  const obj = await bucket.get(key, { range: request.headers, onlyIf: request.headers });
  if (obj === null) return null;

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("ETag", obj.httpEtag);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", cacheControl);

  // onlyIf 조건에 걸리면 body 가 없다 → 304 (브라우저 캐시 그대로 사용)
  if (!("body" in obj) || !obj.body) {
    return new Response(null, { status: 304, headers });
  }

  const range = obj.range;
  if (range && request.headers.has("Range")) {
    const start = "suffix" in range ? obj.size - range.suffix : range.offset;
    const length = "suffix" in range ? range.suffix : (range.length ?? obj.size - start);
    headers.set("Content-Range", `bytes ${start}-${start + length - 1}/${obj.size}`);
    headers.set("Content-Length", String(length));
    return new Response(obj.body, { status: 206, headers });
  }
  headers.set("Content-Length", String(obj.size));
  return new Response(obj.body, { status: 200, headers });
}
