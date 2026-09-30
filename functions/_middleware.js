import { PROD_ORIGIN, REDIRECT_HOSTS, matchRoute, renderPage, notFound } from "./_lib/seo.js";

// API 요청이 처음 들어올 때 D1 테이블이 없으면 만든다.
// 새 데이터베이스를 붙여도 콘솔에서 스키마를 직접 실행할 필요가 없게 하려는 것이다.
// 격리 인스턴스(isolate)마다 한 번만 실행된다.
let schemaReady = false;

async function ensureSchema(env) {
  if (schemaReady || !env.DB) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS content (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      content_type TEXT NOT NULL,
      filename TEXT,
      data BLOB NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      company TEXT,
      name TEXT,
      phone TEXT,
      email TEXT,
      message TEXT,
      submitted_at TEXT,
      read INTEGER DEFAULT 0
    )`),
  ]);
  schemaReady = true;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/")) {
    await ensureSchema(env);
    return context.next();
  }
  if (request.method !== "GET" && request.method !== "HEAD") return context.next();

  // www 와 옛 pages.dev 주소는 대표 주소(boomyoung.com)로 영구 이동 — 검색 점수가 갈라지지 않게 한다
  if (REDIRECT_HOSTS.includes(url.hostname)) {
    return Response.redirect(PROD_ORIGIN + url.pathname + url.search, 301);
  }

  // robots.txt · sitemap.xml 은 전용 함수 파일이 처리한다
  if (url.pathname === "/robots.txt" || url.pathname === "/sitemap.xml") return context.next();

  const route = matchRoute(url.pathname);
  if (!route) return context.next();
  if (route.kind === "redirect") return Response.redirect(url.origin + route.to + url.search, 301);
  if (route.kind === "notfound") return notFound(context);

  await ensureSchema(env);
  return renderPage(context, route);
}
