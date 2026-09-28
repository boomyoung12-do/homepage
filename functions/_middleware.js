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
  if (new URL(context.request.url).pathname.startsWith("/api/")) {
    await ensureSchema(context.env);
  }
  return context.next();
}
