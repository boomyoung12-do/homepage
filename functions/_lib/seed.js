// 엑셀(홈페이지 상품 리스트)에서 가져온 제품·카테고리·브랜드를 기존 문서에 한 번 합친다.
//
// 어드민에서 저장한 문서(D1)가 파일(content/*.json)보다 우선하므로, 파일만 바꾸면 반영되지 않는다.
// 그래서 문서를 읽을 때 seedVersion 이 다르면 시드를 합쳐 돌려주고(저장은 하지 않음),
// 어드민이 그 문서를 저장하는 순간 seedVersion 도 함께 저장되어 이후에는 다시 합치지 않는다.
// → 합친 뒤 어드민에서 지운 제품이 되살아나지 않는다.

import seed from "../../content/seed-xl.json";

export function applySeed(key, doc) {
  if (!doc || typeof doc !== "object" || doc.seedVersion === seed.version) return doc;
  const out = { ...doc, seedVersion: seed.version };

  if (key === "catalog-content") {
    const products = (doc.products || []).map((p) => (seed.categoryByCode[p.code] ? { ...p, category: seed.categoryByCode[p.code] } : p));
    const codes = new Set(products.map((p) => String(p.code).trim()));
    seed.products.forEach((p) => codes.has(p.code) || products.push(p));
    out.products = products;

    // 카테고리: 엑셀 카테고리 → 그 밖에 아직 쓰는 기존 카테고리 순서
    const used = new Set(products.map((p) => p.category));
    const old = (doc.categories || []).filter((c) => c.id !== "all" && !seed.categories.some((s) => s.id === c.id) && used.has(c.id));
    const usedOld = new Set(old.map((c) => c.id));
    products.forEach((p) => {
      if (!seed.categories.some((s) => s.id === p.category) && !usedOld.has(p.category)) {
        usedOld.add(p.category);
        old.push({ id: p.category, label: p.category, labelEn: p.category });
      }
    });
    const all = (doc.categories || []).find((c) => c.id === "all") || { id: "all", label: "전체", labelEn: "All" };
    out.categories = [all, ...seed.categories, ...old];

    const chips = [...(doc.brands || [])];
    seed.brandChips.forEach((b) => chips.some((c) => c.id === b.id) || chips.push(b));
    out.brands = chips;
  }

  if (key === "brands-content") {
    const imported = [...(doc.importedBrands || [])];
    const known = new Set([...(doc.brands || []), ...imported].map((b) => b.id));
    seed.importedBrands.forEach((b) => known.has(b.id) || imported.push(b));
    out.importedBrands = imported;
  }
  return out;
}
