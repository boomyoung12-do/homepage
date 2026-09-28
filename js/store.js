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
    priceAsk: "가격은 판매처에서 확인", noLink: "판매처 링크 준비 중입니다. 구매 문의를 남겨주세요.",
    wishAdd: "찜 목록에 담았어요", wishDel: "찜 목록에서 뺐어요", copied: "상품 링크를 복사했어요",
    share: "링크 복사", wish: "찜하기", wished: "찜 완료",
    info: { spec: "규격", code: "바코드", origin: "원산지", shelf: "유통기한", itemNo: "품번" },
    tabs: { detail: "상세정보", ingredients: "원료·성분" },
    features: "이런 점이 좋아요", noDetail: "등록된 상세 이미지가 없습니다.",
    nutrition: { protein: "조단백", fat: "조지방", fiber: "조섬유", moisture: "수분" },
    official: "공식 판매처로 이동합니다",
    ticker: ["제조사 직영 정품", "공식 판매처 안전 결제", "B2B 대량 구매·입점 문의 환영", "자체 R&D 배합 설계", "HACCP · ISO 22000 공정"],
    badge: { new: "NEW", best: "BEST", soldout: "SOLD OUT" },
    count: (n) => `${n}개`,
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
    priceAsk: "See price at seller", noLink: "Seller link coming soon — send us an inquiry.",
    wishAdd: "Added to wishlist", wishDel: "Removed from wishlist", copied: "Product link copied",
    share: "Copy link", wish: "Wishlist", wished: "Saved",
    info: { spec: "Size", code: "Barcode", origin: "Origin", shelf: "Shelf life", itemNo: "Item No." },
    tabs: { detail: "Details", ingredients: "Ingredients" },
    features: "Why you'll like it", noDetail: "No detail images yet.",
    nutrition: { protein: "Crude protein", fat: "Crude fat", fiber: "Crude fiber", moisture: "Moisture" },
    official: "Opens the official seller",
    ticker: ["Maker-direct genuine products", "Secure checkout at official sellers", "B2B bulk & retail inquiries welcome", "In-house R&D formulation", "HACCP · ISO 22000 production"],
    badge: { new: "NEW", best: "BEST", soldout: "SOLD OUT" },
    count: (n) => `${n}`,
  },
};

const PAGE_SIZE = 24;
const state = { cat: "all", brand: "all", pet: "all", q: "", sort: "recommend", wishOnly: false, shown: PAGE_SIZE };
let content = null;
let lang = "ko";
let brandMap = {};
let brandLogos = {};

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
function renderHeroStage() {
  const stage = document.getElementById("store-hero-stage");
  if (stage.childElementCount) return;
  // 배지가 붙은 상품을 우선, 없으면 앞쪽 상품으로 세 개를 띄운다
  const picks = [...content.products].sort((a, b) => (b.storeBadge ? 1 : 0) - (a.storeBadge ? 1 : 0)).filter((p) => p.image).slice(0, 3);
  picks.forEach((p, i) => {
    stage.appendChild(el("div", { class: `store-float f${i + 1}` }, [el("img", { src: p.image, alt: "" })]));
  });
}

function renderTicker() {
  const track = document.getElementById("store-ticker");
  track.innerHTML = "";
  const items = [...L().ticker, ...L().ticker];
  items.forEach((t) => track.appendChild(el("span", { text: t })));
}

function renderBrandRail() {
  const rail = document.getElementById("store-brand-rail");
  rail.innerHTML = "";
  const counts = {};
  content.products.forEach((p) => (counts[p.brandId] = (counts[p.brandId] || 0) + 1));
  const brands = content.brands.filter((b) => b.id !== "all" && counts[b.id]);
  const mk = (id, label, logo) => {
    const btn = el("button", { type: "button", class: "store-brand-chip" + (state.brand === id ? " active" : ""), "data-brand": id }, [
      el("span", { class: "logo" }, logo ? [el("img", { src: logo, alt: "", loading: "lazy" })] : [el("em", { text: label.slice(0, 1) })]),
      el("span", { class: "name", text: label }),
      el("span", { class: "cnt", text: L().count(id === "all" ? content.products.length : counts[id]) }),
    ]);
    btn.addEventListener("click", () => {
      state.brand = state.brand === id && id !== "all" ? "all" : id;
      update(true);
      document.getElementById("store-shop").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return btn;
  };
  rail.appendChild(mk("all", L().allBrands, ""));
  brands.forEach((b) => rail.appendChild(mk(b.id, t(b, "label", lang), brandLogos[b.id])));
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
  optionRow(
    document.getElementById("store-brand-list"),
    [{ id: "all", label: L().allBrands, count: brandCounts("all") }].concat(
      content.brands.filter((b) => b.id !== "all").map((b) => ({ id: b.id, label: t(b, "label", lang), count: brandCounts(b.id) })).filter((b) => b.count > 0 || state.brand === b.id)
    ),
    state.brand,
    (id) => { state.brand = id; update(true); }
  );
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
  if (!price) return el("div", { class: "store-price ask" + (big ? " big" : "") }, [el("span", { text: L().priceAsk })]);
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
      el("div", { class: "store-card-meta" }, [
        p.code ? el("span", { text: `CODE ${p.code}` }) : null,
        p.petType && p.petType !== "all" ? el("span", { class: "pet", text: L().pet[p.petType] || p.petType }) : null,
      ]),
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
    const url = new URL(location.href);
    url.searchParams.set("p", p.id);
    try {
      await navigator.clipboard.writeText(url.toString());
      toast(L().copied);
    } catch {
      prompt(L().share, url.toString());
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
  const url = new URL(location.href);
  url.searchParams.set("p", p.id);
  history.replaceState(null, "", url);
  close.focus();
}

function closeQuickView() {
  const modal = document.getElementById("store-modal");
  if (!modal.classList.contains("open")) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  const url = new URL(location.href);
  url.searchParams.delete("p");
  history.replaceState(null, "", url);
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
  renderHeroStage();
  renderTicker();
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
    [...(brands.brands || []), ...(brands.importedBrands || [])].forEach((b) => (brandLogos[b.id] = b.logo));
  } catch {}

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
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeQuickView();
      openFilters(false);
    }
  });

  // 공유 링크(?p=상품id)로 들어오면 해당 상품을 바로 연다
  const linked = params.get("p") && content.products.find((p) => p.id === params.get("p"));
  if (linked) openQuickView(linked);
})();
