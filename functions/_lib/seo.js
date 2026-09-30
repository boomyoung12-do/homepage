// 검색엔진 노출(SEO)용 서버 쪽 도우미.
//
// 화면은 브라우저의 JS가 D1 문서(/api/*-content)를 읽어 그린다. 그대로 두면 JS를 실행하지
// 않는 수집기(네이버·다음·SNS 미리보기 등)는 메뉴 글자밖에 못 읽는다. 그래서 페이지를 내보낼 때
// 같은 D1 문서로 (1) 제목·설명·canonical·hreflang·og·JSON-LD 를 채우고 (2) <main> 맨 앞에
// 본문 요약(#seo-snapshot)을 넣는다. 브라우저에서는 JS가 화면을 그린 뒤 이 요약을 지운다.
// 관리자에서 저장한 내용이 곧바로 반영되도록 렌더링 결과는 캐시하지 않는다.

import homeDefault from "../../content/home.json";
import aboutDefault from "../../content/about.json";
import manufacturingDefault from "../../content/manufacturing.json";
import networkDefault from "../../content/network.json";
import brandsDefault from "../../content/brands.json";
import catalogDefault from "../../content/catalog.json";

export const PROD_ORIGIN = "https://boomyoung.com";
// 대표 주소(boomyoung.com)로 영구 이동시킬 주소들
export const REDIRECT_HOSTS = ["www.boomyoung.com", "homepage-tcp.pages.dev"];
// IndexNow 소유 확인 키 (같은 이름의 <키>.txt 파일이 사이트 루트에 있다)
export const INDEXNOW_KEY = "f017e99736e0386cc60cf071a80b87f0";

const DEFAULTS = {
  "home-content": homeDefault,
  "about-content": aboutDefault,
  "manufacturing-content": manufacturingDefault,
  "network-content": networkDefault,
  "brands-content": brandsDefault,
  "catalog-content": catalogDefault,
};

// 페이지 정의: 주소, 정적 HTML 위치, 필요한 문서, 제목·설명(ko/en)
export const PAGES = {
  home: {
    path: "/", asset: "/", docs: ["home-content", "brands-content"],
    ko: { title: "(주)부명 | BOOMYOUNG", desc: "(주)부명은 반려동물 제품 제조 및 유통 전문 기업입니다. DAYSPO, Bell bird, HOWPET 등 프리미엄 펫 브랜드를 보유하고 있습니다." },
    en: { title: "BOOMYOUNG Co., Ltd. | Pet Product Manufacturer & Distributor", desc: "BOOMYOUNG is a pet product manufacturer and distributor with 30 years of experience, owning premium pet brands such as DAYSPO, Bell bird and HOWPET." },
  },
  about: {
    path: "/about", asset: "/about", docs: ["about-content"], crumb: { ko: "회사소개", en: "About Us" },
    ko: { title: "회사소개 | (주)부명 BOOMYOUNG", desc: "30년 이상 축적된 정직한 기술과 신뢰를 바탕으로 반려동물과 반려인의 행복한 내일을 열어가는 (주)부명을 소개합니다." },
    en: { title: "About Us | BOOMYOUNG", desc: "BOOMYOUNG builds on more than 30 years of honest technology and trust to create a happier tomorrow for pets and the people who love them." },
  },
  manufacturing: {
    path: "/manufacturing", asset: "/manufacturing", docs: ["manufacturing-content"], crumb: { ko: "제조·역량", en: "Manufacturing" },
    ko: { title: "제조·역량 | (주)부명 BOOMYOUNG", desc: "(주)부명은 펫 전문 식품 공장과 칭다오 벤토나이트 모래 공장을 직접 운영합니다. 배합 설계부터 생산, 품질 인증, 지식재산권까지 자체 제조 역량을 소개합니다." },
    en: { title: "Manufacturing & Capabilities | BOOMYOUNG", desc: "BOOMYOUNG runs its own pet food plant and a bentonite cat litter plant in Qingdao, China — from formulation and production to quality certification and patents." },
  },
  brands: {
    path: "/brands", asset: "/brands", docs: ["brands-content", "catalog-content"], crumb: { ko: "브랜드", en: "Brands" },
    ko: { title: "브랜드 | (주)부명 BOOMYOUNG", desc: "(주)부명이 직접 만드는 자사 브랜드와 엄선한 해외 수입 브랜드를 한 곳에서 소개합니다." },
    en: { title: "Brands | BOOMYOUNG", desc: "Our own pet brands and carefully selected imported brands, all in one place." },
  },
  catalog: {
    path: "/catalog", asset: "/catalog", docs: ["catalog-content", "brands-content"], crumb: { ko: "제품 카탈로그", en: "Product Catalog" },
    ko: { title: "제품 카탈로그 | (주)부명 BOOMYOUNG", desc: "데이스포, 벨버드, 에버그로 등 (주)부명 자체 브랜드의 사료·간식 제품 카탈로그입니다." },
    en: { title: "Product Catalog | BOOMYOUNG", desc: "Product catalog of pet food, treats and care products from BOOMYOUNG's own brands such as DAYSPO, Bell bird and Evergrow." },
  },
  store: {
    path: "/store", asset: "/store", docs: ["catalog-content", "brands-content"], crumb: { ko: "스토어", en: "Store" },
    ko: { title: "스토어 | (주)부명 BOOMYOUNG", desc: "(주)부명 공식 스토어 — 제조사가 직접 만들고 고른 데이스포·벨버드·에버그로와 수입 브랜드 제품을 만나보세요." },
    en: { title: "Store | BOOMYOUNG", desc: "BOOMYOUNG official store — products made and hand-picked by the manufacturer, from DAYSPO, Bell bird, Evergrow and imported brands." },
  },
  network: {
    path: "/network", asset: "/network", docs: ["network-content"], crumb: { ko: "파트너·네트워크", en: "Partners & Network" },
    ko: { title: "파트너·네트워크 | (주)부명 BOOMYOUNG", desc: "(주)부명이 참가한 국내외 박람회와 전국 유통 채널, 지역 대리점 네트워크를 소개합니다." },
    en: { title: "Partners & Network | BOOMYOUNG", desc: "Global trade shows, nationwide retail channels and the regional distributor network of BOOMYOUNG." },
  },
  contact: {
    path: "/contact", asset: "/contact", docs: ["home-content"], crumb: { ko: "문의하기", en: "Contact" },
    ko: { title: "문의하기 | (주)부명 BOOMYOUNG", desc: "B2B 입점, 제휴, OEM/ODM 관련 문의를 남겨주시면 담당자가 확인 후 연락드립니다." },
    en: { title: "Contact | BOOMYOUNG", desc: "Leave an inquiry about B2B partnerships, distribution or OEM/ODM and we will get back to you." },
  },
};
const PAGE_BY_PATH = Object.fromEntries(Object.entries(PAGES).map(([k, v]) => [v.path, k]));

// ---------- 주소 판별 ----------
export function isProdHost(url) {
  return url.hostname === "boomyoung.com";
}
export const originOf = (url) => (isProdHost(url) ? PROD_ORIGIN : url.origin);

// 요청 경로를 { lang, kind, page?, id? } 로 해석한다. 모르는 경로는 null, /en/ 뒤 모르는 경로는 kind:"notfound"
export function matchRoute(pathname) {
  if (pathname === "/en/") return { kind: "redirect", to: "/en" };
  let lang = "ko";
  let p = pathname;
  if (p === "/en" || p.startsWith("/en/")) {
    lang = "en";
    p = p.slice(3) || "/";
  }
  if (p.length > 1 && p.endsWith("/")) return { kind: "redirect", to: (lang === "en" ? "/en" : "") + p.replace(/\/+$/, "") };
  if (PAGE_BY_PATH[p]) return { kind: "page", lang, page: PAGE_BY_PATH[p] };
  let m = p.match(/^\/products\/(.+)$/);
  if (m) return { kind: "product", lang, id: safeDecode(m[1]) };
  m = p.match(/^\/brands\/(.+)$/);
  if (m) return { kind: "brand", lang, id: safeDecode(m[1]) };
  return lang === "en" ? { kind: "notfound", lang } : null;
}
const safeDecode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

// ---------- 데이터 읽기 ----------
export async function loadDocs(env, keys) {
  const out = {};
  keys.forEach((k) => (out[k] = { data: DEFAULTS[k], updatedAt: null }));
  if (!env.DB) return out;
  try {
    const marks = keys.map(() => "?").join(",");
    const { results } = await env.DB.prepare(`SELECT key, data, updated_at FROM content WHERE key IN (${marks})`).bind(...keys).all();
    for (const row of results || []) {
      try {
        out[row.key] = { data: JSON.parse(row.data), updatedAt: row.updated_at };
      } catch {
        /* 깨진 문서는 기본값을 쓴다 */
      }
    }
  } catch {
    /* 테이블이 아직 없으면 기본값 */
  }
  return out;
}

// ---------- 글 만들기 도우미 ----------
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const flat = (s) => String(s ?? "").replace(/\s*\n\s*/g, " ").trim();
const tx = (o, k, lang) => flat(lang === "en" ? o?.[k + "En"] || o?.[k] : o?.[k]);
const pathFor = (lang, p) => (lang === "en" ? "/en" + (p === "/" ? "" : p) : p);
export const productPath = (id, lang) => pathFor(lang, "/products/" + encodeURIComponent(id));
export const brandPath = (id, lang) => pathFor(lang, "/brands/" + encodeURIComponent(id));
const abs = (origin, src) => {
  if (!src) return "";
  if (/^https?:\/\//.test(src)) return src;
  return origin + "/" + String(src).replace(/^\.?\//, "");
};
const numOf = (v) => {
  const n = Number(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const brandName = (b, lang) => flat(lang === "en" ? b.nameEn || b.nameKo : b.nameKo || b.nameEn);
const brandDesc = (b, lang) => flat(lang === "en" ? b.descriptionEn || b.descriptionKo : b.descriptionKo);
function brandList(brandsDoc, catalogDoc) {
  const list = [...(brandsDoc?.brands || []), ...(brandsDoc?.importedBrands || [])].filter((b) => b.id);
  // 카탈로그 쪽에만 있는 브랜드 칩도 이름 조회에 쓴다
  (catalogDoc?.brands || []).forEach((c) => {
    if (c.id && c.id !== "all" && !list.some((b) => b.id === c.id)) list.push({ id: c.id, nameKo: c.label, nameEn: c.labelEn, _chip: true });
  });
  return list;
}

const PET = { dog: { ko: "강아지", en: "Dog" }, cat: { ko: "고양이", en: "Cat" } };
const NUTRI = {
  protein: { ko: "조단백질", en: "Crude protein" }, fat: { ko: "조지방", en: "Crude fat" }, fiber: { ko: "조섬유", en: "Crude fiber" },
  moisture: { ko: "수분", en: "Moisture" }, ash: { ko: "조회분", en: "Crude ash" }, calcium: { ko: "칼슘", en: "Calcium" }, phosphorus: { ko: "인", en: "Phosphorus" },
};

function productView(p, lang, brands, catalog) {
  const b = brands.find((x) => x.id === p.brandId);
  const cat = (catalog?.categories || []).find((c) => c.id === p.category || c.label === p.category);
  const features = (lang === "en" ? p.featuresEn : p.features) || p.features || [];
  return {
    id: p.id,
    name: flat(lang === "en" ? p.nameEn || p.nameKo : p.nameKo),
    brand: b ? brandName(b, lang) : "",
    brandId: p.brandId,
    category: flat(lang === "en" ? cat?.labelEn || p.category : p.category),
    pet: PET[p.petType]?.[lang] || "",
    spec: flat(p.spec),
    code: flat(p.code),
    itemNo: flat(p.itemNo),
    shelfLife: flat(lang === "en" ? p.shelfLifeEn || p.shelfLife : p.shelfLife),
    origin: flat(lang === "en" ? p.originEn || p.origin : p.origin),
    features: (Array.isArray(features) ? features : String(features).split("\n")).map(flat).filter(Boolean),
    ingredients: flat(lang === "en" ? p.ingredientsEn || p.ingredients : p.ingredients),
    nutrition: Object.entries(p.nutrition || {}).filter(([, v]) => v),
    price: numOf(p.price),
    salePrice: numOf(p.salePrice),
    soldOut: p.storeBadge === "soldout",
    image: p.image,
    detailImages: p.detailImages || [],
    buyLink: /^https?:\/\//.test(String(p.buyLink || "").trim()) ? String(p.buyLink).trim() : "",
  };
}

// 제품명이 이미 브랜드명으로 시작하면 다시 붙이지 않는다 ("데이스포 와이즈 퍼피")
const fullName = (pv) => (pv.brand && !pv.name.toLowerCase().startsWith(pv.brand.toLowerCase()) ? `${pv.brand} ${pv.name}` : pv.name);

const won = (n, lang) => (lang === "en" ? `KRW ${n.toLocaleString("en-US")}` : `${n.toLocaleString("ko-KR")}원`);

// ---------- 본문 요약(#seo-snapshot) ----------
const h = (tag, text) => (text ? `<${tag}>${esc(text)}</${tag}>` : "");
const para = (text) => (text ? `<p>${esc(text)}</p>` : "");
const ul = (items) => {
  const li = items.filter(Boolean).map((i) => `<li>${i}</li>`).join("");
  return li ? `<ul>${li}</ul>` : "";
};
const link = (href, text) => (text ? `<a href="${esc(href)}">${esc(text)}</a>` : "");

function footerBlock(f, lang) {
  if (!f) return "";
  const rows = [
    lang === "en" ? f.companyEn || f.company : f.company,
    lang === "en" ? f.addressEn || f.address : f.address,
    f.tel ? `Tel ${f.tel}` : "",
    f.fax ? `Fax ${f.fax}` : "",
    f.email ? `E-mail ${f.email}` : "",
    f.brn ? `${lang === "en" ? "Business Registration No." : "사업자등록번호"} ${f.brn}` : "",
  ];
  return `<address>${rows.filter(Boolean).map((r) => `<div>${esc(r)}</div>`).join("")}</address>`;
}

function productLi(pv, lang) {
  const meta = [pv.brand, pv.spec, pv.salePrice || pv.price ? won(pv.salePrice || pv.price, lang) : ""].filter(Boolean).join(" · ");
  return `<a href="${esc(productPath(pv.id, lang))}">${esc(pv.name)}</a>${meta ? ` — ${esc(meta)}` : ""}`;
}

function snapshotFor(route, docs, lang) {
  const g = (k) => docs[k]?.data;
  const footer = g(PAGES[route.page]?.docs?.[0])?.footer || g("home-content")?.footer;
  const brands = brandList(g("brands-content"), g("catalog-content"));
  const catalog = g("catalog-content");
  const products = (catalog?.products || []).map((p) => productView(p, lang, brands, catalog));
  let html = "";

  if (route.kind === "product") {
    const p = (catalog?.products || []).find((x) => x.id === route.id);
    const pv = productView(p, lang, brands, catalog);
    const facts = [
      [lang === "en" ? "Brand" : "브랜드", pv.brand],
      [lang === "en" ? "Category" : "카테고리", pv.category],
      [lang === "en" ? "For" : "반려동물", pv.pet],
      [lang === "en" ? "Size" : "규격", pv.spec],
      [lang === "en" ? "Barcode" : "바코드", pv.code],
      [lang === "en" ? "Item No." : "품번", pv.itemNo],
      [lang === "en" ? "Shelf life" : "유통기한", pv.shelfLife],
      [lang === "en" ? "Origin" : "제조국", pv.origin],
    ];
    html += h("h1", fullName(pv));
    html += ul(facts.filter(([, v]) => v).map(([k, v]) => `${esc(k)}: ${esc(v)}`));
    if (pv.price || pv.salePrice) html += para(`${lang === "en" ? "Price" : "가격"}: ${won(pv.salePrice || pv.price, lang)}`);
    if (pv.features.length) html += h("h2", lang === "en" ? "Key features" : "주요 특징") + ul(pv.features.map(esc));
    if (pv.ingredients) html += h("h2", lang === "en" ? "Ingredients" : "원료 정보") + para(pv.ingredients);
    if (pv.nutrition.length)
      html += h("h2", lang === "en" ? "Guaranteed analysis" : "등록 성분량") + ul(pv.nutrition.map(([k, v]) => `${esc(NUTRI[k]?.[lang] || k)}: ${esc(v)}`));
    if (pv.buyLink) html += para(lang === "en" ? "Available online:" : "구매하기:") + link(pv.buyLink, pv.buyLink);
    html += link(pathFor(lang, "/store"), lang === "en" ? "Back to the store" : "스토어로 돌아가기");
    return html + footerBlock(footer, lang);
  }

  if (route.kind === "brand") {
    const b = brands.find((x) => x.id === route.id);
    const list = products.filter((x) => x.brandId === route.id);
    html += h("h1", brandName(b, lang)) + para(flat(b.tagline)) + para(brandDesc(b, lang));
    html += h("h2", lang === "en" ? `${brandName(b, lang)} products` : `${brandName(b, lang)} 제품`) + ul(list.map((x) => productLi(x, lang)));
    html += link(pathFor(lang, "/brands"), lang === "en" ? "All brands" : "전체 브랜드");
    return html + footerBlock(footer, lang);
  }

  switch (route.page) {
    case "home": {
      const d = g("home-content");
      const hero = d.hero || {};
      html += h("h1", tx(hero, "headline", lang)) + para(tx(hero, "eyebrow", lang)) + para(tx(hero, "body", lang));
      (d.philosophy || []).forEach((s) => {
        html += h("h2", tx(s, "title", lang)) + para(tx(s, "body", lang)) + ul(((lang === "en" ? s.tagsEn : s.tags) || s.tags || []).map((x) => esc(flat(x))));
      });
      html += h("h2", tx(d.brandsIntro, "title", lang)) + para(tx(d.brandsIntro, "body", lang));
      html += ul((d.brands || []).map((b) => {
        const id = String(b.href || "").match(/#own-(.+)$/)?.[1];
        const name = tx(b, "name", lang);
        return (id ? link(brandPath(id, lang), name) : esc(name)) + (b.tagline ? ` — ${esc(tx(b, "tagline", lang))}` : "");
      }));
      if ((d.importedBrands || []).length)
        html += h("h2", lang === "en" ? "Imported brands" : "수입 브랜드") + ul(d.importedBrands.map((b) => {
          const name = tx(b, "name", lang);
          return b.id ? link(brandPath(b.id, lang), name) : esc(name);
        }));
      html += h("h2", tx(d.retailIntro, "title", lang)) + para(tx(d.retailIntro, "body", lang)) + ul((d.retailers || []).map((r) => esc(flat(r.name))));
      html += h("h2", tx(d.distributorIntro, "title", lang)) + para(tx(d.distributorIntro, "body", lang)) + ul((d.distributors || []).map((r) => esc(flat(r.name))));
      html += h("h2", tx(d.export, "title", lang)) + para(tx(d.export, "body", lang)) + link(pathFor(lang, "/contact"), tx(d.export, "ctaText", lang));
      break;
    }
    case "about": {
      const d = g("about-content");
      html += h("h1", tx(d.hero, "title", lang)) + para(tx(d.hero, "body", lang));
      html += h("h2", tx(d.ceo, "title", lang)) + ((lang === "en" ? d.ceo?.paragraphsEn : d.ceo?.paragraphs) || d.ceo?.paragraphs || []).map((x) => para(flat(x))).join("");
      html += para([tx(d.ceo, "name", lang), tx(d.ceo, "role", lang)].filter(Boolean).join(" — "));
      html += h("h2", tx(d.historyIntro, "title", lang));
      (d.history || []).forEach((y) => {
        html += h("h3", `${flat(y.year)} ${tx(y, "title", lang)}`) + ul(((lang === "en" ? y.itemsEn : y.items) || y.items || []).map((x) => esc(flat(x))));
      });
      html += h("h2", tx(d.infraIntro, "title", lang));
      (d.infra || []).forEach((s) => {
        html += h("h3", tx(s, "title", lang)) + para(tx(s, "body", lang)) + ul((s.tags || []).map((x) => esc(flat(x))));
      });
      html += h("h2", tx(d.ciIntro, "title", lang)) + para(flat(d.ciIntro?.subtitle));
      (d.ci || []).forEach((s) => (html += h("h3", tx(s, "title", lang)) + para(tx(s, "body", lang))));
      break;
    }
    case "manufacturing": {
      const d = g("manufacturing-content");
      html += h("h1", tx(d.hero, "title", lang)) + para(tx(d.hero, "body", lang));
      const cap = (arr) => (arr || []).forEach((c) => (html += h("h3", tx(c, "title", lang)) + para(tx(c, "body", lang))));
      const gal = (arr) => (arr && arr.length ? ul(arr.map((x) => esc(tx(x, "caption", lang)))) : "");
      html += h("h2", tx(d.feedIntro, "title", lang)) + para(tx(d.feedIntro, "body", lang));
      cap(d.feedCapabilities);
      html += gal(d.feedGallery);
      html += h("h2", tx(d.certIntro, "title", lang)) + para(tx(d.certIntro, "body", lang));
      (d.certifications || []).forEach((c) => (html += h("h3", `${flat(c.code)} ${tx(c, "title", lang)}`.trim()) + para(tx(c, "body", lang))));
      html += h("h2", tx(d.ipIntro, "title", lang)) + para(tx(d.ipIntro, "body", lang));
      html += ul((d.patents || []).map((x) => esc(`${flat(x.type)} ${flat(x.number)} ${tx(x, "title", lang)}`.trim())));
      html += h("h2", tx(d.litterIntro, "title", lang)) + para(tx(d.litterIntro, "body", lang));
      cap(d.litterCapabilities);
      html += gal(d.litterGallery);
      break;
    }
    case "network": {
      const d = g("network-content");
      html += h("h1", tx(d.hero, "title", lang)) + para(tx(d.hero, "body", lang));
      html += h("h2", tx(d.expoIntro, "title", lang)) + ul((d.exhibitions || []).map((x) => esc(`${flat(x.year)} ${tx(x, "title", lang)} (${tx(x, "location", lang)})`)));
      html += h("h2", tx(d.retailIntro, "title", lang)) + ul((d.retailers || []).map((x) => esc(flat(x.name))));
      html += h("h2", tx(d.distributorIntro, "title", lang)) + para(tx(d.distributorIntro, "body", lang)) + ul((d.distributors || []).map((x) => esc(flat(x.name))));
      html += h("h2", tx(d.export, "title", lang)) + para(tx(d.export, "body", lang)) + link(pathFor(lang, "/contact"), tx(d.export, "button", lang));
      break;
    }
    case "brands": {
      const d = g("brands-content");
      const card = (b) => `${link(brandPath(b.id, lang), brandName(b, lang))}${b.tagline ? ` — ${esc(flat(b.tagline))}` : ""} ${esc(brandDesc(b, lang))}`;
      html += h("h1", tx(d.intro, "title", lang)) + para(tx(d.intro, "body", lang)) + ul((d.brands || []).map(card));
      html += h("h2", tx(d.importedIntro, "title", lang)) + para(tx(d.importedIntro, "body", lang)) + ul((d.importedBrands || []).map(card));
      break;
    }
    case "catalog":
    case "store": {
      const isStore = route.page === "store";
      const hero = catalog?.hero || {};
      html += h("h1", isStore ? (lang === "en" ? "BOOMYOUNG Store" : "부명 스토어") : tx(hero, "title", lang));
      html += para(isStore ? PAGES.store[lang].desc : tx(hero, "body", lang));
      html += h("h2", lang === "en" ? "Products" : "제품 목록") + ul(products.map((x) => productLi(x, lang)));
      break;
    }
    default:
      break;
  }
  return html + footerBlock(footer, lang);
}

// ---------- JSON-LD ----------
const ldScript = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

function organizationLd(origin, footer) {
  const tel = String(footer?.tel || "").replace(/^0/, "+82-");
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": origin + "/#organization",
    name: "(주)부명",
    legalName: "(주)부명",
    alternateName: ["부명", "BOOMYOUNG", "BOOMYOUNG Co., Ltd."],
    url: origin + "/",
    logo: origin + "/assets/boomyung_ci_logo.png",
    ...(tel ? { telephone: tel } : {}),
    ...(footer?.email ? { email: footer.email } : {}),
    ...(footer?.address ? { address: { "@type": "PostalAddress", streetAddress: footer.address, addressCountry: "KR" } } : {}),
  };
}
const crumbLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
});

// ---------- 페이지 하나 처리 ----------
export async function renderPage(context, route) {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = originOf(url);
  const lang = route.lang;
  const isBase = route.kind === "page";
  const pageKey = route.kind === "product" ? "store" : route.kind === "brand" ? "brands" : route.page;
  const pdef = PAGES[pageKey];

  const docKeys = [...new Set([...pdef.docs, "brands-content", "catalog-content", "home-content"])];
  const docs = await loadDocs(env, docKeys);
  const catalog = docs["catalog-content"].data;
  const brands = brandList(docs["brands-content"].data, catalog);
  const footer = docs[pdef.docs[0]]?.data?.footer || docs["home-content"].data.footer;

  // 존재하지 않는 제품·브랜드는 404
  let prod = null;
  let brand = null;
  if (route.kind === "product") prod = (catalog.products || []).find((p) => p.id === route.id);
  if (route.kind === "brand") brand = brands.find((b) => b.id === route.id && !b._chip);
  if ((route.kind === "product" && !prod) || (route.kind === "brand" && !brand)) return notFound(context);

  const asset = await env.ASSETS.fetch(new Request(new URL(route.kind === "product" ? "/store" : route.kind === "brand" ? "/brands" : pdef.asset, url).toString()));
  if (asset.status !== 200) return asset;

  // 제목·설명·주소·og·구조화 데이터
  let title = pdef[lang].title;
  let desc = pdef[lang].desc;
  let ogImage = origin + "/assets/og-default.jpg";
  let selfPath = pathFor(lang, pdef.path);
  let altPath = pdef.path;
  const crumbs = [{ name: lang === "en" ? "Home" : "홈", url: origin + pathFor(lang, "/") }];
  const ld = [];

  if (route.kind === "product") {
    const pv = productView(prod, lang, brands, catalog);
    title = `${fullName(pv)} | ${lang === "en" ? "BOOMYOUNG" : "(주)부명 BOOMYOUNG"}`;
    desc = [fullName(pv), pv.spec && `(${pv.spec})`, pv.features.slice(0, 3).join(", ")].filter(Boolean).join(" ").slice(0, 155);
    if (pv.image) ogImage = abs(origin, pv.image);
    selfPath = productPath(prod.id, lang);
    altPath = "/products/" + encodeURIComponent(prod.id);
    crumbs.push({ name: pdef.crumb[lang], url: origin + pathFor(lang, "/store") }, { name: pv.name, url: origin + selfPath });
    const price = pv.salePrice || pv.price;
    ld.push({
      "@context": "https://schema.org",
      "@type": "Product",
      name: pv.name,
      description: desc,
      image: [pv.image, ...pv.detailImages.slice(0, 2)].filter(Boolean).map((s) => abs(origin, s)),
      sku: pv.itemNo || pv.code || String(prod.id),
      ...(/^\d{13}$/.test(pv.code) ? { gtin13: pv.code } : {}),
      ...(pv.brand ? { brand: { "@type": "Brand", name: pv.brand } } : {}),
      ...(pv.category ? { category: pv.category } : {}),
      manufacturer: { "@id": origin + "/#organization" },
      url: origin + selfPath,
      ...(price
        ? { offers: { "@type": "Offer", priceCurrency: "KRW", price: String(price), availability: pv.soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock", url: pv.buyLink || origin + selfPath, itemCondition: "https://schema.org/NewCondition" } }
        : {}),
    });
  } else if (route.kind === "brand") {
    const nm = brandName(brand, lang);
    title = `${nm} | ${lang === "en" ? "Brands | BOOMYOUNG" : "브랜드 | (주)부명 BOOMYOUNG"}`;
    desc = [nm, flat(brand.tagline), brandDesc(brand, lang)].filter(Boolean).join(" — ").slice(0, 155);
    if (brand.logo) ogImage = abs(origin, brand.logo);
    selfPath = brandPath(brand.id, lang);
    altPath = "/brands/" + encodeURIComponent(brand.id);
    crumbs.push({ name: pdef.crumb[lang], url: origin + pathFor(lang, "/brands") }, { name: nm, url: origin + selfPath });
    ld.push({ "@context": "https://schema.org", "@type": "Brand", name: nm, description: brandDesc(brand, lang), url: origin + selfPath, ...(brand.logo ? { logo: abs(origin, brand.logo) } : {}) });
  } else if (pageKey !== "home") {
    crumbs.push({ name: pdef.crumb[lang], url: origin + selfPath });
  }

  if (pageKey === "home" && route.kind === "page") {
    ld.push(organizationLd(origin, footer));
    ld.push({ "@context": "https://schema.org", "@type": "WebSite", name: "(주)부명 BOOMYOUNG", alternateName: ["부명", "BOOMYOUNG"], url: origin + "/", inLanguage: lang });
  } else {
    ld.push(organizationLd(origin, footer));
  }
  if (crumbs.length > 1) ld.push(crumbLd(crumbs));

  const canonical = origin + selfPath;
  const koUrl = origin + altPath;
  const enUrl = origin + pathFor("en", altPath);
  const prodHost = isProdHost(url);
  const headExtra = [
    prodHost ? "" : `<meta name="robots" content="noindex, nofollow" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<link rel="alternate" hreflang="ko" href="${esc(koUrl)}" />`,
    `<link rel="alternate" hreflang="en" href="${esc(enUrl)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${esc(koUrl)}" />`,
    `<meta property="og:site_name" content="(주)부명 BOOMYOUNG" />`,
    `<meta property="og:type" content="${route.kind === "product" ? "product" : "website"}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:image" content="${esc(ogImage)}" />`,
    `<meta property="og:locale" content="${lang === "en" ? "en_US" : "ko_KR"}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    `<meta name="twitter:image" content="${esc(ogImage)}" />`,
    ...ld.map(ldScript),
    `<style>#seo-snapshot{position:absolute!important;left:0;top:0;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}</style>`,
  ].join("\n");

  const seoState = { lang, page: pageKey, ...(route.kind === "product" ? { product: prod.id } : {}), ...(route.kind === "brand" ? { brand: brand.id } : {}) };
  const needsBase = !(route.kind === "page" && lang === "ko"); // /en/…, /products/…, /brands/… 는 상대 경로가 깨지므로 기준 주소를 루트로 고정
  const snapshot = snapshotFor(route.kind === "page" ? { ...route } : route, docs, lang);
  const selfNoQuery = selfPath;

  const rewriter = new HTMLRewriter()
    .on("html", { element: (e) => e.setAttribute("lang", lang) })
    .on("head", {
      element: (e) => {
        if (needsBase) e.prepend(`<base href="/" />`, { html: true });
        e.append(`<script>window.__SEO__=${JSON.stringify(seoState).replace(/</g, "\\u003c")};</script>\n${headExtra}`, { html: true });
      },
    })
    .on("title", { element: (e) => e.setInnerContent(title) })
    .on('meta[name="description"]', { element: (e) => e.setAttribute("content", desc) })
    .on('meta[property^="og:"]', { element: (e) => e.remove() })
    .on('meta[name^="twitter:"]', { element: (e) => e.remove() })
    .on('link[rel="canonical"]', { element: (e) => e.remove() })
    .on("main", { element: (e) => e.prepend(`<div id="seo-snapshot" aria-hidden="true">${snapshot}</div>`, { html: true }) })
    .on("a[href]", {
      element: (e) => {
        const href = e.getAttribute("href");
        if (href.startsWith("#")) {
          if (needsBase) e.setAttribute("href", selfNoQuery + href);
          return;
        }
        const fixed = cleanHref(href, lang);
        if (fixed !== href) e.setAttribute("href", fixed);
      },
    });

  const headers = new Headers({
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "public, max-age=0, must-revalidate",
    "Content-Language": lang,
  });
  if (!prodHost) headers.set("X-Robots-Tag", "noindex, nofollow");
  return rewriter.transform(new Response(request.method === "HEAD" ? null : asset.body, { status: 200, headers }));
}

// 정적 HTML 안의 index.html·about.html 같은 링크를 깔끔한 주소(/about, /en/about)로 바꾼다
const PAGE_FILES = { "index.html": "/", "about.html": "/about", "manufacturing.html": "/manufacturing", "brands.html": "/brands", "catalog.html": "/catalog", "store.html": "/store", "contact.html": "/contact", "network.html": "/network" };
export function cleanHref(href, lang) {
  const m = String(href).match(/^\.?\/?([a-z]+\.html)([?#].*)?$/);
  if (!m || !PAGE_FILES[m[1]]) return href;
  return pathFor(lang, PAGE_FILES[m[1]]) + (m[2] || "");
}

export async function notFound(context) {
  const { request, env } = context;
  const res = await env.ASSETS.fetch(new Request(new URL("/404.html", request.url).toString()));
  const headers = new Headers(res.headers);
  headers.set("X-Robots-Tag", "noindex");
  headers.delete("content-length");
  return new Response(request.method === "HEAD" ? null : res.body, { status: 404, headers });
}

// ---------- 사이트맵·IndexNow ----------
export async function collectEntries(env) {
  const docs = await loadDocs(env, ["home-content", "about-content", "manufacturing-content", "network-content", "brands-content", "catalog-content"]);
  const day = (k) => (docs[k]?.updatedAt ? String(docs[k].updatedAt).slice(0, 10) : null);
  const entries = [
    { path: "/", lastmod: day("home-content") },
    { path: "/about", lastmod: day("about-content") },
    { path: "/manufacturing", lastmod: day("manufacturing-content") },
    { path: "/brands", lastmod: day("brands-content") },
    { path: "/catalog", lastmod: day("catalog-content") },
    { path: "/store", lastmod: day("catalog-content") },
    { path: "/network", lastmod: day("network-content") },
    { path: "/contact", lastmod: null },
  ];
  const brands = [...(docs["brands-content"].data.brands || []), ...(docs["brands-content"].data.importedBrands || [])];
  brands.filter((b) => b.id).forEach((b) => entries.push({ path: "/brands/" + encodeURIComponent(b.id), lastmod: day("brands-content") }));
  (docs["catalog-content"].data.products || []).filter((p) => p.id).forEach((p) => entries.push({ path: "/products/" + encodeURIComponent(p.id), lastmod: day("catalog-content") }));
  return entries;
}

export function sitemapXml(entries, origin) {
  const loc = (p, lang) => origin + pathFor(lang, p);
  const one = (e, lang) => {
    const alt = [
      `<xhtml:link rel="alternate" hreflang="ko" href="${esc(loc(e.path, "ko"))}"/>`,
      `<xhtml:link rel="alternate" hreflang="en" href="${esc(loc(e.path, "en"))}"/>`,
      `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(loc(e.path, "ko"))}"/>`,
    ].join("");
    return `<url><loc>${esc(loc(e.path, lang))}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}${alt}</url>`;
  };
  const body = entries.flatMap((e) => [one(e, "ko"), one(e, "en")]).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`;
}

// 관리자에서 저장하면 검색엔진(빙·네이버 등 IndexNow 참여처)에 바뀐 주소를 알린다. 운영 주소에서만 보낸다.
export async function pingIndexNow(env, url) {
  if (!isProdHost(url)) return;
  try {
    const entries = await collectEntries(env);
    const urlList = entries.flatMap((e) => [PROD_ORIGIN + e.path, PROD_ORIGIN + pathFor("en", e.path)]);
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: "boomyoung.com", key: INDEXNOW_KEY, keyLocation: `${PROD_ORIGIN}/${INDEXNOW_KEY}.txt`, urlList: urlList.slice(0, 10000) }),
    });
  } catch {
    /* 알림 실패는 저장에 영향을 주지 않는다 */
  }
}
