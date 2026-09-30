// 스토어 페이지.
//
// 제품 카탈로그와 같은 문서(/api/catalog-content)를 그대로 읽는다. 어드민에서
// 제품을 추가·수정·삭제하면 카탈로그와 스토어에 똑같이 반영된다.
// 스토어에만 쓰는 값(정가 price, 판매가 salePrice, 배지 storeBadge)도 같은
// 제품 데이터에 들어 있고, 비어 있으면 표시하지 않는다.
//
// 찜·최근 본 상품은 방문자 브라우저(localStorage)에만 저장하는 편의 기능이라,
// 저장이 막힌 환경에서도 페이지는 그대로 동작한다.

const S = {
  ko: {
    all: "전체", allBrands: "전체 브랜드", pet: { all: "전체", dog: "강아지", cat: "고양이" },
    sort: { recommend: "추천순", new: "신상품순", priceLow: "낮은 가격순", priceHigh: "높은 가격순", name: "이름순" },
    result: (n) => `상품 <b>${n}</b>개`,
    more: (n) => `상품 더 보기 (${n}개 남음)`,
    empty: "조건에 맞는 상품이 없어요.",
    emptyHint: "필터를 줄이거나 다른 검색어로 찾아보세요.",
    reset: "필터 초기화",
    quick: "빠른 보기", buy: "구매하기", buyNow: "바로 구매하기", b2b: "B2B 구매하기", b2bAsk: "B2B 대량 구매 문의",
    soldOut: "품절", soldOutMsg: "현재 품절된 상품입니다.",
    noLink: "판매처 링크 준비 중입니다. 구매 문의를 남겨주세요.",
    wishAdd: "찜 목록에 담았어요", wishDel: "찜 목록에서 뺐어요", copied: "상품 링크를 복사했어요",
    share: "링크 복사", wish: "찜하기", wished: "찜 완료",
    info: { spec: "규격", code: "바코드", origin: "원산지", shelf: "유통기한", itemNo: "품번" },
    tabs: { detail: "상세정보", ingredients: "원료·성분" },
    features: "이런 점이 좋아요", noDetail: "등록된 상세 이미지가 없습니다.",
    nutrition: { protein: "조단백", fat: "조지방", fiber: "조섬유", moisture: "수분" },
    official: "공식 판매처로 이동합니다",
    badge: { new: "NEW", best: "BEST", soldout: "SOLD OUT" },
    count: (n) => `${n}개`,
    allBrandsN: (n) => `전체 브랜드 ${n}개`, moreBrands: (n) => `브랜드 ${n}개 더보기`,
    dirTabs: { all: "전체", own: "자사", imported: "수입" }, dirEmpty: "찾는 브랜드가 없어요.", etc: "기타",
  },
  en: {
    all: "All", allBrands: "All brands", pet: { all: "All", dog: "Dog", cat: "Cat" },
    sort: { recommend: "Recommended", new: "Newest", priceLow: "Price: low to high", priceHigh: "Price: high to low", name: "Name" },
    result: (n) => `<b>${n}</b> products`,
    more: (n) => `Show more (${n} left)`,
    empty: "No products match these filters.",
    emptyHint: "Try removing a filter or searching another word.",
    reset: "Reset filters",
    quick: "Quick view", buy: "Buy", buyNow: "Buy now", b2b: "B2B purchase", b2bAsk: "B2B bulk inquiry",
    soldOut: "Sold out", soldOutMsg: "This product is currently sold out.",
    noLink: "Seller link coming soon — send us an inquiry.",
    wishAdd: "Added to wishlist", wishDel: "Removed from wishlist", copied: "Product link copied",
    share: "Copy link", wish: "Wishlist", wished: "Saved",
    info: { spec: "Size", code: "Barcode", origin: "Origin", shelf: "Shelf life", itemNo: "Item No." },
    tabs: { detail: "Details", ingredients: "Ingredients" },
    features: "Why you'll like it", noDetail: "No detail images yet.",
    nutrition: { protein: "Crude protein", fat: "Crude fat", fiber: "Crude fiber", moisture: "Moisture" },
    official: "Opens the official seller",
    badge: { new: "NEW", best: "BEST", soldout: "SOLD OUT" },
    count: (n) => `${n}`,
    allBrandsN: (n) => `All ${n} brands`, moreBrands: (n) => `${n} more brands`,
    dirTabs: { all: "All", own: "Ours", imported: "Imported" }, dirEmpty: "No brands found.", etc: "Other",
  },
};

const PAGE_SIZE = 24;
const state = { cat: "all", brand: "all", pet: "all", q: "", sort: "recommend", wishOnly: false, shown: PAGE_SIZE };
let content = null;
let lang = "ko";
let brandMap = {};
let brandLogos = {};
let brandScale = {};
let brandType = {};
let brandCount = {};
const RAIL_LIMIT = 9; // 브랜드관에 바로 보이는 브랜드 수
const SIDE_LIMIT = 7; // 필터 목록에 바로 보이는 브랜드 수
const dirState = { tab: "all", q: "" };

// ---------- 방문자 브라우저 저장 (실패해도 동작) ----------
const store = {
  get(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};
const wishes = () => new Set(store.get("bm-wish", []));
function toggleWish(id) {
  const set = wishes();
  const on = !set.has(id);
  on ? set.add(id) : set.delete(id);
  store.set("bm-wish", [...set]);
  toast(on ? L().wishAdd : L().wishDel);
  return on;
}
function pushRecent(id) {
  const list = store.get("bm-recent", []).filter((x) => x !== id);
  list.unshift(id);
  store.set("bm-recent", list.slice(0, 12));
}

const L = () => S[lang === "en" ? "en" : "ko"];
const nameOf = (p) => (lang === "en" ? p.nameEn || p.nameKo : p.nameKo);
const brandOf = (p) => brandMap[p.brandId] || p.brandId;
const isUrl = (v) => /^https?:\/\//i.test((v || "").trim());
const num = (v) => {
  const n = Number(String(v || "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const won = (n) => (lang === "en" ? `₩${n.toLocaleString("en-US")}` : `${n.toLocaleString("ko-KR")}원`);

// 가격 정보: 판매가가 정가보다 낮을 때만 할인율을 보여준다
function priceOf(p) {
  const list = num(p.price);
  const sale = num(p.salePrice);
  if (sale && list && sale < list) return { now: sale, was: list, off: Math.round((1 - sale / list) * 100) };
  if (sale || list) return { now: sale || list, was: 0, off: 0 };
  return null;
}
const effectivePrice = (p) => priceOf(p)?.now || 0;
const soldOut = (p) => p.storeBadge === "soldout";

function toast(msg) {
  const t = document.getElementById("store-toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 1800);
}

// ---------- 필터 ----------
function matches(p, skip) {
  if (skip !== "cat" && state.cat !== "all" && p.category !== state.cat) return false;
  if (skip !== "brand" && state.brand !== "all" && p.brandId !== state.brand) return false;
  if (skip !== "pet" && state.pet !== "all" && !(p.petType === state.pet || p.petType === "all")) return false;
  if (state.wishOnly && !wishes().has(p.id)) return false;
  if (state.q) {
    const hay = [p.nameKo, p.nameEn, brandMap[p.brandId], p.brandId, p.code, p.spec, p.itemNo].join(" ").toLowerCase();
    if (!state.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
  }
  return true;
}

function sorted(list) {
  const order = new Map(content.products.map((p, i) => [p.id, i]));
  const rank = { best: 0, new: 1 };
  const byOrder = (a, b) => order.get(a.id) - order.get(b.id);
  const soldLast = (a, b) => soldOut(a) - soldOut(b);
  const copy = [...list];
  switch (state.sort) {
    case "new":
      return copy.sort((a, b) => soldLast(a, b) || (b.storeBadge === "new") - (a.storeBadge === "new") || order.get(b.id) - order.get(a.id));
    case "priceLow":
      return copy.sort((a, b) => soldLast(a, b) || (effectivePrice(a) || Infinity) - (effectivePrice(b) || Infinity) || byOrder(a, b));
    case "priceHigh":
      return copy.sort((a, b) => soldLast(a, b) || effectivePrice(b) - effectivePrice(a) || byOrder(a, b));
    case "name":
      return copy.sort((a, b) => soldLast(a, b) || nameOf(a).localeCompare(nameOf(b), lang === "en" ? "en" : "ko"));
    default:
      return copy.sort((a, b) => soldLast(a, b) || (rank[a.storeBadge] ?? 9) - (rank[b.storeBadge] ?? 9) || byOrder(a, b));
  }
}

// 제품은 /products/<id>, 영어는 /en/products/<id> 라는 고유 주소를 갖는다
const langPrefix = () => (location.pathname === "/en" || location.pathname.startsWith("/en/") ? "/en" : "");
const storePath = () => langPrefix() + "/store";
const productPath = (id) => langPrefix() + "/products/" + encodeURIComponent(id);

function syncUrl() {
  const params = new URLSearchParams(location.search);
  const set = (k, v, def) => (v && v !== def ? params.set(k, v) : params.delete(k));
  set("category", state.cat, "all");
  set("brand", state.brand, "all");
  set("pet", state.pet, "all");
  set("q", state.q, "");
  set("sort", state.sort, "recommend");
  const qs = params.toString();
  history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
}

// ---------- 그리기 ----------
// 브랜드가 늘어나도 브랜드관이 한 줄로 유지되도록 자사 브랜드 → 상품이 많은 수입
// 브랜드 순으로 앞쪽 몇 개만 보여주고, 나머지는 "전체 브랜드" 창에서 찾게 한다.
function brandList() {
  return content.brands.filter((b) => b.id !== "all" && brandCount[b.id]);
}
function featuredBrands() {
  const list = brandList();
  const own = list.filter((b) => brandType[b.id] !== "imported");
  const imported = list.filter((b) => brandType[b.id] === "imported").sort((a, b) => brandCount[b.id] - brandCount[a.id]);
  const picked = [...own, ...imported].slice(0, RAIL_LIMIT);
  // 지금 고른 브랜드는 목록 밖이어도 보이게 한다
  if (state.brand !== "all" && !picked.some((b) => b.id === state.brand)) {
    const cur = list.find((b) => b.id === state.brand);
    if (cur) picked[picked.length - 1] = cur;
  }
  return picked;
}

function renderBrandRail() {
  const rail = document.getElementById("store-brand-rail");
  rail.innerHTML = "";
  const mk = (id, label, logo, count) => {
    const btn = el("button", { type: "button", class: "store-brand-chip" + (state.brand === id ? " active" : ""), "data-brand": id }, [
      el("span", { class: "logo" }, logo ? [el("img", { src: logo, alt: "", loading: "lazy", style: logoScaleStyle(brandScale[id]) })] : [el("em", { text: label.slice(0, 1) })]),
      el("span", { class: "name", text: label }),
      el("span", { class: "cnt", text: L().count(count) }),
    ]);
    btn.addEventListener("click", () => pickBrand(state.brand === id && id !== "all" ? "all" : id, true));
    return btn;
  };
  // 브랜드 칩은 가로로 스크롤되는 영역에, "전체 브랜드" 버튼은 그 바깥 오른쪽 끝에 고정해서
  // 브랜드가 많아도 항상 보이게 한다.
  const scroller = el("div", { class: "store-brand-scroll" });
  const prev = el("button", { type: "button", class: "store-rail-arrow prev", "aria-label": lang === "en" ? "Previous brands" : "이전 브랜드", html: "&#8249;" });
  const next = el("button", { type: "button", class: "store-rail-arrow next", "aria-label": lang === "en" ? "Next brands" : "다음 브랜드", html: "&#8250;" });
  rail.appendChild(el("div", { class: "store-brand-viewport" }, [scroller, prev, next]));
  // "전체 브랜드"는 글자 대신 아이콘으로
  const allChip = mk("all", L().allBrands, "", content.products.length);
  allChip.classList.add("all");
  allChip.querySelector(".logo").innerHTML =
    '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="5" width="9.5" height="9.5" rx="3"/><rect x="17.5" y="5" width="9.5" height="9.5" rx="3"/><rect x="5" y="17.5" width="9.5" height="9.5" rx="3"/><rect x="17.5" y="17.5" width="9.5" height="9.5" rx="4.75"/></svg>';
  scroller.appendChild(allChip);
  featuredBrands().forEach((b) => scroller.appendChild(mk(b.id, t(b, "label", lang), brandLogos[b.id], brandCount[b.id])));
  const total = brandList().length;
  if (total > RAIL_LIMIT) {
    const more = el("button", { type: "button", class: "store-brand-chip more" }, [
      el("span", { class: "logo", html: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>' }),
      el("span", { class: "name", text: L().allBrands }),
      el("span", { class: "cnt", text: `${L().count(total)} →` }),
    ]);
    more.addEventListener("click", openDirectory);
    rail.appendChild(more);
  }
  setupRailScroll();
}

// ---------- 브랜드관 넘기기 (PC: 좌우 화살표 + 마우스로 끌기, 모바일: 스와이프) ----------
const railDrag = { scroller: null, dragging: false, moved: false, startX: 0, startLeft: 0, bound: false };
function setupRailScroll() {
  const viewport = document.querySelector(".store-brand-viewport");
  if (!viewport) return;
  const scroller = viewport.querySelector(".store-brand-scroll");
  const prev = viewport.querySelector(".store-rail-arrow.prev");
  const next = viewport.querySelector(".store-rail-arrow.next");

  // 넘칠 때만 화살표를 보이고, 끝에 닿은 쪽은 숨긴다
  const sync = () => {
    const max = scroller.scrollWidth - scroller.clientWidth;
    const overflow = max > 2;
    viewport.classList.toggle("overflow", overflow);
    viewport.classList.toggle("at-start", scroller.scrollLeft <= 2);
    viewport.classList.toggle("at-end", scroller.scrollLeft >= max - 2);
  };
  const page = (dir) => scroller.scrollBy({ left: dir * scroller.clientWidth * 0.8, behavior: "smooth" });
  prev.addEventListener("click", () => page(-1));
  next.addEventListener("click", () => page(1));
  scroller.addEventListener("scroll", sync, { passive: true });
  if (!setupRailScroll.resizeBound) {
    setupRailScroll.resizeBound = true;
    addEventListener("resize", () => setupRailScroll.sync && setupRailScroll.sync());
  }
  setupRailScroll.sync = sync;

  // 마우스로 끌어서 넘기기. 조금이라도 끌었으면 그 뒤의 클릭(브랜드 선택)은 무시한다.
  // 창 전체에 거는 이동/놓기 감지는 한 번만 걸고, 지금 그려진 줄(railDrag.scroller)을 쓴다.
  railDrag.scroller = scroller;
  scroller.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    Object.assign(railDrag, { dragging: true, moved: false, startX: e.clientX, startLeft: scroller.scrollLeft });
  });
  if (!railDrag.bound) {
    railDrag.bound = true;
    addEventListener("pointermove", (e) => {
      const sc = railDrag.scroller;
      if (!railDrag.dragging || !sc) return;
      const dx = e.clientX - railDrag.startX;
      if (Math.abs(dx) > 5) {
        railDrag.moved = true;
        sc.classList.add("dragging");
      }
      if (railDrag.moved) sc.scrollLeft = railDrag.startLeft - dx;
    });
    addEventListener("pointerup", () => {
      if (!railDrag.dragging) return;
      railDrag.dragging = false;
      railDrag.scroller?.classList.remove("dragging");
    });
  }
  scroller.addEventListener(
    "click",
    (e) => {
      if (railDrag.moved) {
        e.stopPropagation();
        e.preventDefault();
        railDrag.moved = false;
      }
    },
    true
  );
  scroller.addEventListener("dragstart", (e) => e.preventDefault());

  // 선택된 브랜드가 보이도록 필요하면 그쪽으로 넘긴다
  const active = scroller.querySelector(".store-brand-chip.active");
  if (active) {
    const a = active.getBoundingClientRect();
    const v = scroller.getBoundingClientRect();
    if (a.left < v.left || a.right > v.right) scroller.scrollLeft += a.left - v.left - 16;
  }
  requestAnimationFrame(sync);
  // 로고 이미지가 늦게 로드되며 폭이 바뀌어도 다시 계산
  scroller.querySelectorAll("img").forEach((img) => img.complete || img.addEventListener("load", sync, { once: true }));
}

function pickBrand(id, scroll) {
  state.brand = id;
  renderBrandRail();
  update(true);
  if (scroll) document.getElementById("store-shop").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- 전체 브랜드 창 (검색 + 가나다/ABC 색인) ----------
const CHO = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const CHO_BASE = { ㄲ: "ㄱ", ㄸ: "ㄷ", ㅃ: "ㅂ", ㅆ: "ㅅ", ㅉ: "ㅈ" };
const CHO_LABEL = { ㄱ: "가", ㄴ: "나", ㄷ: "다", ㄹ: "라", ㅁ: "마", ㅂ: "바", ㅅ: "사", ㅇ: "아", ㅈ: "자", ㅊ: "차", ㅋ: "카", ㅌ: "타", ㅍ: "파", ㅎ: "하" };
function initialOf(name) {
  const c = (name || "").trim().charAt(0);
  const code = c.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const cho = CHO[Math.floor((code - 0xac00) / 588)];
    // 자음(ㄱ~ㅎ)은 글꼴에 따라 작게 깨져 보여서 색인은 "가·나·다…" 로 표시한다
    return CHO_LABEL[CHO_BASE[cho] || cho];
  }
  if (/[a-z]/i.test(c)) return c.toUpperCase();
  return "#";
}

function renderDirectory() {
  const seg = document.getElementById("store-dir-seg");
  seg.innerHTML = "";
  ["all", "own", "imported"].forEach((id) => {
    const b = el("button", { type: "button", class: dirState.tab === id ? "active" : "", text: L().dirTabs[id] });
    b.addEventListener("click", () => {
      dirState.tab = id;
      renderDirectory();
    });
    seg.appendChild(b);
  });

  const q = dirState.q.toLowerCase();
  const list = brandList()
    .filter((b) => dirState.tab === "all" || (dirState.tab === "imported" ? brandType[b.id] === "imported" : brandType[b.id] !== "imported"))
    .filter((b) => !q || [b.label, b.labelEn, b.id].join(" ").toLowerCase().includes(q))
    .map((b) => ({ b, name: t(b, "label", lang) }))
    .sort((x, y) => x.name.localeCompare(y.name, lang === "en" ? "en" : "ko"));

  const groups = new Map();
  list.forEach((it) => {
    const k = initialOf(it.name);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(it);
  });
  const rank = (k) => (k === "#" ? 3 : /[A-Z]/.test(k) ? 2 : 1);
  const keys = [...groups.keys()].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, "ko"));

  const index = document.getElementById("store-dir-index");
  index.innerHTML = "";
  keys.forEach((k) => {
    const a = el("button", { type: "button", text: k === "#" ? L().etc : k });
    a.addEventListener("click", () => document.getElementById(`dir-${k}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    index.appendChild(a);
  });

  const box = document.getElementById("store-dir-list");
  box.innerHTML = "";
  if (!list.length) {
    box.appendChild(el("p", { class: "store-dir-empty", text: L().dirEmpty }));
    return;
  }
  keys.forEach((k) => {
    box.appendChild(el("h4", { id: `dir-${k}`, text: k === "#" ? L().etc : k }));
    const grid = el("div", { class: "store-dir-grid" });
    groups.get(k).forEach(({ b, name }) => {
      const btn = el("button", { type: "button", class: "store-dir-item" + (state.brand === b.id ? " active" : "") }, [
        el("span", { class: "logo" }, brandLogos[b.id] ? [el("img", { src: brandLogos[b.id], alt: "", loading: "lazy", style: logoScaleStyle(brandScale[b.id]) })] : [el("em", { text: name.slice(0, 1) })]),
        el("span", { class: "name", text: name }),
        el("b", { text: String(brandCount[b.id]) }),
      ]);
      btn.addEventListener("click", () => {
        closeDirectory();
        openFilters(false);
        pickBrand(b.id, true);
      });
      grid.appendChild(btn);
    });
    box.appendChild(grid);
  });
}

function openDirectory() {
  dirState.q = "";
  document.getElementById("store-dir-q").value = "";
  renderDirectory();
  const d = document.getElementById("store-dir");
  d.classList.add("open");
  d.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(() => document.getElementById("store-dir-q").focus(), 50);
}

function closeDirectory() {
  const d = document.getElementById("store-dir");
  if (!d.classList.contains("open")) return;
  d.classList.remove("open");
  d.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function optionRow(listEl, items, current, onPick) {
  listEl.innerHTML = "";
  items.forEach(({ id, label, count }) => {
    const btn = el("button", { type: "button", class: "store-opt" + (current === id ? " active" : "") + (count === 0 ? " zero" : "") }, [
      el("span", { text: label }),
      el("b", { text: String(count) }),
    ]);
    btn.addEventListener("click", () => onPick(id));
    listEl.appendChild(btn);
  });
}

function renderFilters() {
  const base = content.products;
  const catCounts = (id) => base.filter((p) => matches(p, "cat") && (id === "all" || p.category === id)).length;
  optionRow(
    document.getElementById("store-cat-list"),
    content.categories.map((c) => ({ id: c.id, label: t(c, "label", lang), count: catCounts(c.id) })),
    state.cat,
    (id) => { state.cat = id; update(true); }
  );
  const brandCounts = (id) => base.filter((p) => matches(p, "brand") && (id === "all" || p.brandId === id)).length;
  const brandOpts = content.brands
    .filter((b) => b.id !== "all")
    .map((b) => ({ id: b.id, label: t(b, "label", lang), count: brandCounts(b.id) }))
    .filter((b) => b.count > 0 || state.brand === b.id)
    .sort((a, b) => b.count - a.count);
  // 상품이 많은 브랜드 몇 개만 바로 보여주고 나머지는 "전체 브랜드" 창으로
  const visible = brandOpts.slice(0, SIDE_LIMIT);
  const cur = brandOpts.find((b) => b.id === state.brand);
  if (cur && !visible.includes(cur)) visible.push(cur);
  const brandListEl = document.getElementById("store-brand-list");
  optionRow(
    brandListEl,
    [{ id: "all", label: L().allBrands, count: brandCounts("all") }].concat(visible),
    state.brand,
    (id) => pickBrand(id, false)
  );
  const hiddenN = brandOpts.length - visible.length;
  if (hiddenN > 0) {
    const more = el("button", { type: "button", class: "store-opt more", text: `${L().moreBrands(hiddenN)} →` });
    more.addEventListener("click", openDirectory);
    brandListEl.appendChild(more);
  }
  const seg = document.getElementById("store-pet-seg");
  seg.innerHTML = "";
  ["all", "dog", "cat"].forEach((id) => {
    const btn = el("button", { type: "button", class: state.pet === id ? "active" : "", text: L().pet[id] });
    btn.addEventListener("click", () => { state.pet = id; update(true); });
    seg.appendChild(btn);
  });
  document.getElementById("store-wish-only").checked = state.wishOnly;

  const sortSel = document.getElementById("store-sort");
  sortSel.innerHTML = "";
  Object.entries(L().sort).forEach(([id, label]) => sortSel.appendChild(el("option", { value: id, text: label })));
  sortSel.value = state.sort;
}

function renderActiveChips() {
  const box = document.getElementById("store-active");
  box.innerHTML = "";
  const chips = [];
  if (state.cat !== "all") {
    const c = content.categories.find((x) => x.id === state.cat);
    chips.push([c ? t(c, "label", lang) : state.cat, () => (state.cat = "all")]);
  }
  if (state.brand !== "all") chips.push([brandMap[state.brand] || state.brand, () => (state.brand = "all")]);
  if (state.pet !== "all") chips.push([L().pet[state.pet], () => (state.pet = "all")]);
  if (state.q) chips.push([`“${state.q}”`, () => { state.q = ""; document.getElementById("store-q").value = ""; }]);
  if (state.wishOnly) chips.push(["♥", () => (state.wishOnly = false)]);
  chips.forEach(([label, clear]) => {
    const b = el("button", { type: "button", class: "store-active-chip" }, [el("span", { text: label }), el("i", { text: "×" })]);
    b.addEventListener("click", () => { clear(); update(true); });
    box.appendChild(b);
  });
  const n = chips.length;
  const badge = document.getElementById("store-filter-badge");
  badge.textContent = n ? String(n) : "";
  badge.hidden = !n;
}

function badgeEls(p, price) {
  const out = [];
  if (p.storeBadge && L().badge[p.storeBadge]) out.push(el("span", { class: `store-badge ${p.storeBadge}`, text: L().badge[p.storeBadge] }));
  if (price && price.off) out.push(el("span", { class: "store-badge sale", text: `-${price.off}%` }));
  return out;
}

function priceEl(p, big) {
  const price = priceOf(p);
  // 가격이 없는 상품은 가격 줄을 두지 않는다 (같은 안내 문구가 목록에 반복되지 않게)
  if (!price) return null;
  return el("div", { class: "store-price" + (big ? " big" : "") }, [
    price.off ? el("span", { class: "off", text: `${price.off}%` }) : null,
    el("strong", { text: won(price.now) }),
    price.was ? el("del", { text: won(price.was) }) : null,
  ]);
}

function heartBtn(p, cls) {
  const on = wishes().has(p.id);
  const btn = el("button", { type: "button", class: `${cls}${on ? " on" : ""}`, "aria-label": L().wish, "aria-pressed": on ? "true" : "false" }, [
    el("span", { html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>' }),
  ]);
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const now = toggleWish(p.id);
    document.querySelectorAll(`[data-wish="${CSS.escape(p.id)}"]`).forEach((b) => {
      b.classList.toggle("on", now);
      b.setAttribute("aria-pressed", now ? "true" : "false");
    });
    if (state.wishOnly) update(false);
  });
  btn.dataset.wish = p.id;
  return btn;
}

function card(p) {
  const name = nameOf(p);
  const price = priceOf(p);
  const c = el("article", { class: "store-card" + (soldOut(p) ? " is-soldout" : ""), tabindex: "0" }, [
    el("div", { class: "store-card-media" }, [
      el("img", { class: "main", src: p.image, alt: name, loading: "lazy" }),
      el("div", { class: "store-badges" }, badgeEls(p, price)),
      heartBtn(p, "store-heart"),
      el("div", { class: "store-card-actions" }, [
        el("button", { type: "button", class: "store-qv-btn", text: L().quick }),
        buyLinkEl(p, "buy", L().buy),
      ]),
    ]),
    el("div", { class: "store-card-body" }, [
      el("div", { class: "store-card-brand", text: brandOf(p) }),
      el("h3", { class: "store-card-name", text: name }),
      el("div", { class: "store-card-spec", text: p.spec || "" }),
      priceEl(p),
      p.petType && p.petType !== "all" ? el("div", { class: "store-card-meta" }, [el("span", { class: "pet", text: L().pet[p.petType] || p.petType })]) : null,
    ]),
  ]);
  const open = () => openQuickView(p);
  c.addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    open();
  });
  c.addEventListener("keydown", (e) => {
    if (e.key === "Enter") open();
  });
  return c;
}

// 구매 링크: 품절이거나 링크가 없으면 버튼 대신 비활성 표시
function buyLinkEl(p, cls, label) {
  if (soldOut(p)) return el("span", { class: `${cls} disabled`, text: L().soldOut });
  if (!isUrl(p.buyLink)) return el("span", { class: `${cls} disabled`, text: label });
  const a = el("a", { class: cls, href: p.buyLink.trim(), target: "_blank", rel: "noopener noreferrer", title: L().official, text: label });
  a.addEventListener("click", (e) => e.stopPropagation());
  return a;
}

function renderGrid() {
  const list = sorted(content.products.filter((p) => matches(p)));
  document.getElementById("store-result").innerHTML = L().result(list.length);
  document.getElementById("store-apply-count").textContent = `(${list.length})`;
  const grid = document.getElementById("store-grid");
  grid.innerHTML = "";
  const more = document.getElementById("store-more");
  if (!list.length) {
    const reset = el("button", { type: "button", class: "store-cta primary small", text: L().reset });
    reset.addEventListener("click", resetFilters);
    grid.appendChild(el("div", { class: "store-empty" }, [el("strong", { text: L().empty }), el("p", { text: L().emptyHint }), reset]));
    more.hidden = true;
    return;
  }
  list.slice(0, state.shown).forEach((p, i) => {
    const c = card(p);
    c.style.setProperty("--i", String(i % PAGE_SIZE));
    grid.appendChild(c);
  });
  const left = list.length - state.shown;
  more.hidden = left <= 0;
  more.textContent = left > 0 ? L().more(left) : "";
}

function renderRecent() {
  const ids = store.get("bm-recent", []);
  const byId = new Map(content.products.map((p) => [p.id, p]));
  const list = ids.map((id) => byId.get(id)).filter(Boolean);
  const sec = document.getElementById("store-recent");
  const row = document.getElementById("store-recent-row");
  row.innerHTML = "";
  sec.hidden = !list.length;
  list.forEach((p) => {
    const b = el("button", { type: "button", class: "store-recent-item" }, [
      el("img", { src: p.image, alt: "", loading: "lazy" }),
      el("span", { text: nameOf(p) }),
    ]);
    b.addEventListener("click", () => openQuickView(p));
    row.appendChild(b);
  });
}

function update(resetPaging) {
  if (resetPaging) state.shown = PAGE_SIZE;
  renderFilters();
  renderActiveChips();
  renderGrid();
  document.querySelectorAll(".store-brand-chip").forEach((b) => b.classList.toggle("active", b.dataset.brand === state.brand));
  syncUrl();
}

function resetFilters() {
  Object.assign(state, { cat: "all", brand: "all", pet: "all", q: "", wishOnly: false });
  document.getElementById("store-q").value = "";
  update(true);
}

// ---------- 빠른 보기 ----------
function openQuickView(p) {
  const modal = document.getElementById("store-modal");
  const sheet = document.getElementById("store-sheet");
  sheet.innerHTML = "";
  pushRecent(p.id);

  const name = nameOf(p);
  const images = [p.image, ...(p.detailImages || [])].filter(Boolean);
  const mainImg = el("img", { src: images[0], alt: name });
  const thumbs = el("div", { class: "qv-thumbs" }, images.slice(0, 6).map((src, i) => {
    const b = el("button", { type: "button", class: i === 0 ? "active" : "" }, [el("img", { src, alt: "", loading: "lazy" })]);
    b.addEventListener("click", () => {
      mainImg.src = src;
      thumbs.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
    });
    return b;
  }));

  const info = L().info;
  const origin = lang === "en" ? p.originEn || p.origin : p.origin;
  const shelf = lang === "en" ? p.shelfLifeEn || p.shelfLife : p.shelfLife;
  const rows = [
    [info.spec, p.spec],
    [info.code, p.code],
    [info.itemNo, p.itemNo],
    [info.origin, origin],
    [info.shelf, shelf],
  ].filter(([, v]) => v);

  const features = (lang === "en" ? (p.featuresEn?.length ? p.featuresEn : p.features) : p.features) || [];
  const nutrition = p.nutrition || {};
  const nutKeys = Object.keys(L().nutrition).filter((k) => nutrition[k]);

  const actions = el("div", { class: "qv-actions" }, [
    soldOut(p)
      ? el("span", { class: "qv-buy disabled", text: L().soldOutMsg })
      : isUrl(p.buyLink)
        ? el("a", { class: "qv-buy", href: p.buyLink.trim(), target: "_blank", rel: "noopener noreferrer", text: `${L().buyNow} ↗` })
        : el("span", { class: "qv-buy disabled", text: L().noLink }),
    isUrl(p.b2bLink)
      ? el("a", { class: "qv-b2b", href: p.b2bLink.trim(), target: "_blank", rel: "noopener noreferrer", text: `${L().b2b} ↗` })
      : el("a", { class: "qv-b2b", href: "contact.html", text: L().b2bAsk }),
  ]);

  const shareBtn = el("button", { type: "button", class: "qv-icon", "aria-label": L().share, html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>' });
  shareBtn.addEventListener("click", async () => {
    const shareUrl = location.origin + productPath(p.id);
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast(L().copied);
    } catch {
      prompt(L().share, shareUrl);
    }
  });

  const tabDetail = el("div", { class: "qv-panel" }, (p.detailImages || []).length
    ? p.detailImages.map((src) => el("img", { src, alt: name, loading: "lazy" }))
    : [el("p", { class: "qv-empty", text: L().noDetail })]);
  const ingredients = lang === "en" ? p.ingredientsEn || p.ingredients : p.ingredients;
  const tabIng = el("div", { class: "qv-panel", hidden: true }, [
    nutKeys.length
      ? el("div", { class: "qv-nutrition" }, nutKeys.map((k) => el("div", {}, [el("span", { text: L().nutrition[k] }), el("strong", { text: nutrition[k] })])))
      : null,
    el("p", { class: "qv-ing", text: ingredients || "-" }),
  ]);
  const tabBar = el("div", { class: "qv-tabs", role: "tablist" });
  [["detail", tabDetail], ["ingredients", tabIng]].forEach(([key, panel], i) => {
    const b = el("button", { type: "button", role: "tab", class: i === 0 ? "active" : "", text: L().tabs[key] });
    b.addEventListener("click", () => {
      tabBar.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
      tabDetail.hidden = panel !== tabDetail;
      tabIng.hidden = panel !== tabIng;
    });
    tabBar.appendChild(b);
  });

  const close = el("button", { type: "button", class: "qv-close", "aria-label": "닫기", html: "&times;" });
  close.addEventListener("click", closeQuickView);

  sheet.appendChild(close);
  sheet.appendChild(
    el("div", { class: "qv" }, [
      el("div", { class: "qv-gallery" }, [el("div", { class: "qv-main" }, [mainImg, el("div", { class: "store-badges" }, badgeEls(p, priceOf(p)))]), images.length > 1 ? thumbs : null]),
      el("div", { class: "qv-info" }, [
        el("a", { class: "qv-brand", href: `store.html?brand=${encodeURIComponent(p.brandId)}`, text: `${brandOf(p)} ›` }),
        el("h2", { class: "qv-name", text: name }),
        priceEl(p, true),
        el("dl", { class: "qv-table" }, rows.flatMap(([k, v]) => [el("dt", { text: k }), el("dd", { text: v })])),
        features.length ? el("div", { class: "qv-features" }, [el("h4", { text: L().features }), el("ul", {}, features.map((f) => el("li", { text: f })))]) : null,
        actions,
        el("div", { class: "qv-sub" }, [heartBtn(p, "qv-icon heart"), shareBtn, el("span", { class: "qv-note", text: L().official })]),
      ]),
    ])
  );
  sheet.appendChild(el("div", { class: "qv-bottom" }, [tabBar, tabDetail, tabIng]));

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  sheet.scrollTop = 0;
  history.replaceState(null, "", productPath(p.id));
  close.focus();
}

function closeQuickView() {
  const modal = document.getElementById("store-modal");
  if (!modal.classList.contains("open")) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  const rest = new URLSearchParams(location.search);
  rest.delete("p");
  history.replaceState(null, "", storePath() + (rest.toString() ? "?" + rest : ""));
  renderRecent();
}

// ---------- 모바일 필터 시트 ----------
function openFilters(open) {
  document.getElementById("store-filters").classList.toggle("open", open);
  document.getElementById("store-filters-backdrop").classList.toggle("open", open);
  document.body.style.overflow = open ? "hidden" : "";
}

function render(newLang) {
  lang = newLang;
  renderFooter(content.footer, lang);
  brandMap = Object.fromEntries(content.brands.filter((b) => b.id !== "all").map((b) => [b.id, t(b, "label", lang)]));
  renderBrandRail();
  update(false);
  renderRecent();
}

(async function init() {
  setupHeaderScroll();
  content = await loadContent("/api/catalog-content", "content/catalog.json");
  // 브랜드 로고는 브랜드 문서에서 가져온다 (없어도 이름으로 표시)
  try {
    const brands = await loadContent("/api/brands-content", "content/brands.json");
    (brands.brands || []).forEach((b) => { brandLogos[b.id] = b.logo; brandScale[b.id] = b.logoScale; brandType[b.id] = "own"; });
    (brands.importedBrands || []).forEach((b) => { brandLogos[b.id] = b.logo; brandScale[b.id] = b.logoScale; brandType[b.id] = "imported"; });
  } catch {}

  content.products.forEach((p) => (brandCount[p.brandId] = (brandCount[p.brandId] || 0) + 1));

  const params = new URLSearchParams(location.search);
  const pick = (k, ok) => (params.get(k) && ok(params.get(k)) ? params.get(k) : null);
  state.cat = pick("category", (v) => content.categories.some((c) => c.id === v)) || "all";
  state.brand = pick("brand", (v) => content.brands.some((b) => b.id === v)) || "all";
  state.pet = pick("pet", (v) => ["dog", "cat"].includes(v)) || "all";
  state.sort = pick("sort", (v) => v in S.ko.sort) || "recommend";
  state.q = params.get("q") || "";
  document.getElementById("store-q").value = state.q;

  setupLangToggle((newLang) => render(newLang));

  // 검색: 입력을 잠깐 멈추면 반영
  let timer;
  document.getElementById("store-q").addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.q = e.target.value.trim();
      update(true);
    }, 180);
  });
  document.getElementById("store-sort").addEventListener("change", (e) => {
    state.sort = e.target.value;
    update(true);
  });
  document.getElementById("store-wish-only").addEventListener("change", (e) => {
    state.wishOnly = e.target.checked;
    update(true);
  });
  document.getElementById("store-reset").addEventListener("click", resetFilters);
  document.getElementById("store-more").addEventListener("click", () => {
    state.shown += PAGE_SIZE;
    renderGrid();
  });
  document.getElementById("store-filter-toggle").addEventListener("click", () => openFilters(true));
  document.getElementById("store-filters-close").addEventListener("click", () => openFilters(false));
  document.getElementById("store-apply").addEventListener("click", () => openFilters(false));
  document.getElementById("store-filters-backdrop").addEventListener("click", () => openFilters(false));

  const modal = document.getElementById("store-modal");
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeQuickView();
  });
  const dir = document.getElementById("store-dir");
  dir.addEventListener("click", (e) => {
    if (e.target === dir) closeDirectory();
  });
  document.getElementById("store-dir-close").addEventListener("click", closeDirectory);
  document.getElementById("store-dir-q").addEventListener("input", (e) => {
    dirState.q = e.target.value.trim();
    renderDirectory();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDirectory();
      closeQuickView();
      openFilters(false);
    }
  });

  // 제품 주소(/products/상품id) 또는 예전 공유 링크(?p=상품id)로 들어오면 해당 상품을 바로 연다
  const linkedId = params.get("p") || (window.__SEO__ && window.__SEO__.product);
  const linked = linkedId && content.products.find((p) => p.id === linkedId);
  if (linked) openQuickView(linked);
})();
