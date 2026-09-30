import { isProdHost, originOf } from "./_lib/seo.js";

// 운영 주소에서만 수집을 허용한다. 테스트·미리보기 주소는 통째로 막아 검색에 섞이지 않게 한다.
export function onRequestGet({ request }) {
  const url = new URL(request.url);
  const body = isProdHost(url)
    ? `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${originOf(url)}/sitemap.xml\n`
    : `User-agent: *\nDisallow: /\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
