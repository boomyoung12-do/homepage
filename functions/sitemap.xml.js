import { collectEntries, sitemapXml, originOf } from "./_lib/seo.js";

// 페이지·브랜드·제품 주소를 관리자 데이터에서 그대로 만든다 (제품을 추가·삭제하면 자동 반영)
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const xml = sitemapXml(await collectEntries(env), originOf(url));
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
