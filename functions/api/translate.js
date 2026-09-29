import { isAuthed } from "../_lib/auth.js";

// POST /api/translate — 한글 텍스트를 영어로 자동 번역 (관리자 전용).
// 어드민 폼에서 영문 항목을 비워두면, 저장 시 이 엔드포인트로 한글 값을 보내 영문을 채운다.
export async function onRequestPost({ request, env }) {
  if (!(await isAuthed(request, env))) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const { text, mode } = body;
  if (!text || !text.trim()) {
    return Response.json({ translated: "" });
  }

  // 브랜드명은 뜻을 옮기면 안 되는 고유명사라, 영문 표기를 돌려주는 별도 지시를 쓴다.
  const namePrompt = `You convert Korean brand names into their English brand spelling. The input is a proper noun, not a phrase to translate. If it is an existing international brand, use its official spelling. If it is a Korean transliteration of English words, return those English words in Title Case; otherwise romanize it. The company name 부명 is always written BOOMYOUNG. Output ONLY the brand name on a single line — no quotes, no notes.

Examples:
<ko>벨버드</ko>
Bell Bird
<ko>에버그로</ko>
Ever Grow
<ko>하우펫</ko>
Howpet
<ko>데이스포</ko>
Dayspo
<ko>니나오토슨</ko>
Nina Ottosson
<ko>부명케어</ko>
BOOMYOUNG Care

Now convert this:
<ko>${text.trim()}</ko>`;

  try {
    const result = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        {
          role: "user",
          content: mode === "name" ? namePrompt : `You are a machine translation API. Translate the Korean text between <ko></ko> tags into English. Output ONLY the raw English translation on a single line — no tags, no quotes, no notes, no alternatives.\n\nExample:\n<ko>프리미엄 펫 케어 전문브랜드</ko>\nPremium pet care specialty brand\n\nNow translate this:\n<ko>${text.trim()}</ko>`
        }
      ],
      max_tokens: 300,
      temperature: 0
    });
    return Response.json({ translated: (result.response || "").trim() });
  } catch (err) {
    return Response.json({ error: "번역 실패", detail: String(err) }, { status: 500 });
  }
}
