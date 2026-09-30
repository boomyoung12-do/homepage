import { collectEntries, sitemapXml, originOf } from "./_lib/seo.js";

// 페이지·브랜드·제품 주소를 관리자 데이터에서 그대로 만든다 (제품을 추가·삭제하면 자동 반영).
// 수집 로봇이 HEAD 로 먼저 확인하는 경우가 있어 GET·HEAD 를 모두 받는다.
export async function onRequest({ request, env }) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  const url = new URL(request.url);
  const xml = sitemapXml(await collectEntries(env), originOf(url));
  return new Response(request.method === "HEAD" ? null : xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}
