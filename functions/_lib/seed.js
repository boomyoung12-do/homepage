// 엑셀(홈페이지 상품 리스트)에서 가져온 제품·카테고리·브랜드를 기존 문서에 합친다.
//
// 어드민에서 저장한 문서(D1)가 파일(content/*.json)보다 우선하므로, 파일만 바꾸면 반영되지 않는다.
// 그래서 문서를 읽을 때 seedVersion 이 다르면 시드를 합쳐 돌려주고(저장은 하지 않음),
// 어드민이 그 문서를 저장하는 순간 seedVersion 도 함께 저장되어 이후에는 다시 합치지 않는다.
//
// - seedVersion 이 없으면(처음): 제품·카테고리·브랜드 전부 합친다.
// - seedVersion 이 예전 값이면: 이미 저장된 문서이므로 어드민에서 지운 제품을 되살리지 않고,
//   아직 손대지 않은 값(프리런 브랜드 복원, 빈 영문명, 빈 상세 이미지)만 보정한다.

import seed from "../../content/seed-xl.json";

const seedByCode = new Map(seed.products.map((p) => [p.code, p]));

// 2차 엑셀: 성분·원료·유통기한·주요 특징·B2B 링크는 비어 있는 칸만 채운다 (어드민에서 입력한 값은 그대로 둔다)
function fillEmpty(q) {
  const f = seed.fillByCode[String(q.code).trim()];
  if (!f) return q;
  const add = {};
  if (!(q.features || []).length && f.features.length) add.features = f.features;
  if (!q.ingredients && f.ingredients) add.ingredients = f.ingredients;
  if (!Object.values(q.nutrition || {}).some(Boolean) && Object.keys(f.nutrition).length) add.nutrition = f.nutrition;
  if (!q.shelfLife && f.shelfLife) Object.assign(add, { shelfLife: f.shelfLife, shelfLifeEn: f.shelfLifeEn });
  if (!q.b2bLink && f.b2bLink) add.b2bLink = f.b2bLink;
  return Object.keys(add).length ? { ...q, ...add } : q;
}

export function applySeed(key, doc) {
  if (!doc || typeof doc !== "object" || doc.seedVersion === seed.version) return doc;
  const fresh = !doc.seedVersion;
  const out = { ...doc, seedVersion: seed.version };

  if (key === "catalog-content") {
    const products = (doc.products || []).map((p) => {
      const code = String(p.code).trim();
      const s = seedByCode.get(code);
      let q = p;
      if (fresh && seed.categoryByCode[code]) q = { ...q, category: seed.categoryByCode[code] };
      if (!(q.detailImages || []).length && seed.detailByCode[code]) q = { ...q, detailImages: seed.detailByCode[code] };
      // 프리런은 독립 브랜드다 (한때 데이스포로 합쳐 보이던 문서를 되돌린다)
      if (s && s.brandId === "freerun" && String(q.id).startsWith("p-") && q.brandId !== "freerun") q = { ...q, brandId: "freerun", nameKo: s.nameKo, nameEn: s.nameEn };
      if (s && !q.nameEn && s.nameEn && String(q.id).startsWith("p-")) q = { ...q, nameEn: s.nameEn };
      q = fillEmpty(q);
      return q;
    });
    if (fresh) {
      const codes = new Set(products.map((p) => String(p.code).trim()));
      seed.products.forEach((p) => codes.has(p.code) || products.push(fillEmpty(p)));
    }
    out.products = products;

    if (fresh) {
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
    // 이전 버전에서 프리런 칩이 빠졌다면 되살린다
    if (!fresh && products.some((p) => p.brandId === "freerun") && !(out.brands || doc.brands || []).some((b) => b.id === "freerun")) {
      out.brands = [...(out.brands || doc.brands || []), ...seed.brandChips.filter((b) => b.id === "freerun")];
    }
  }

  if (key === "brands-content") {
    const imported = [...(doc.importedBrands || [])];
    if (fresh) {
      const known = new Set([...(doc.brands || []), ...imported].map((b) => b.id));
      seed.importedBrands.forEach((b) => known.has(b.id) || imported.push(b));
    }
    if (!fresh && !imported.some((b) => b.id === "freerun")) imported.push(...seed.importedBrands.filter((b) => b.id === "freerun"));
    out.importedBrands = imported;
  }
  return out;
}
