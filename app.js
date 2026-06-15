const data = window.MLP_DATA;
const app = document.querySelector("#app");
const storageKey = "mlp_signal_admin_entries";
const categoryStorageKey = "mlp_signal_categories";
const topImageStorageKey = "mlp_signal_top_images";
const prefImageStorageKey = "mlp_signal_pref_images";
const termsStorageKey = "mlp_signal_terms";
const makerStorageKey = "mlp_signal_makers";
const photoTagStorageKey = "mlp_signal_photo_tags";
const siteSettingsStorageKey = "mlp_signal_site_settings";
let fileData = {};
const fileDataSources = {
  [storageKey]: "data/entries.json",
  [makerStorageKey]: "data/makers.json",
  [categoryStorageKey]: "data/categories.json",
  [topImageStorageKey]: "data/top-images.json",
  [prefImageStorageKey]: "data/pref-images.json",
  [termsStorageKey]: "data/terms.json",
  [photoTagStorageKey]: "data/photo-tags.json",
  [siteSettingsStorageKey]: "data/settings.json"
};

const defaultSiteSettings = {
  siteTitle: "MLP Ch / 信号機",
  siteSubtitle: "信号機・道路標識アーカイブ",
  heroEyebrow: "MLP Ch Archive",
  heroTitle: "信号機と道路標識を、見やすく残す。",
  heroText: "都道府県別、カテゴリ別、メーカー別に整理して、写真と解説をスマートに見られるサイトです。",
  signalsPrefListText: "各都道府県にはトップ画像を1枚設定できます。画像がない県も準備中として表示します。",
  signalsTermsText: "レンズ、灯器の愛称、用語集をここから確認できます。",
  termsHomeLeadText: "信号機を見るときに使う基礎用語を、レンズ・灯器の愛称・用語集に分けて整理します。",
  termsPageLeadText: "管理画面で追加した基礎用語を表示します。",
  termsEmptyTitle: "まだ用語がありません",
  termsEmptyText: "管理画面の基礎用語管理から追加できます。",
  prefPageLeadText: "ページ上部にピックアップ画像を3枚置き、その下に県ごとのカテゴリボタンを表示します。",
  prefCategoryText: "県によって存在する信号が違うため、カテゴリはあとから追加できます。",
  prefCardListText: "カードを押すと、写真・住所・解説をまとめた詳細ページへ進みます。",
  categoryPageLeadText: "メーカー別にページ内で分け、紹介カードから詳細ページに進みます。",
  footerLeft: "MLP Ch / 信号機",
  footerRight: "掲載内容は現地状況と異なる場合があります。",
  logoImage: "",
  logoAlt: "MLP Ch / 信号機",
  logoBackground: "#18211d",
  pageBackground: "#f6f7f4",
  panelBackground: "#ffffff",
  textColor: "#17201c",
  mutedColor: "#67736d",
  lineColor: "#dbe1dc",
  accentColor: "#1f8f5f",
  placeholderBackground: "#e8efe9",
  placeholderText: "画像準備中"
};

function readJson(key, fallback) {
  try {
    if (Object.prototype.hasOwnProperty.call(fileData, key)) return fileData[key];
    return fallback;
  } catch {
    return fallback;
  }
}

function siteSettings() {
  return { ...defaultSiteSettings, ...readJson(siteSettingsStorageKey, {}) };
}

function applySiteSettings() {
  const settings = siteSettings();
  const root = document.documentElement;
  root.style.setProperty("--bg", settings.pageBackground);
  root.style.setProperty("--panel", settings.panelBackground);
  root.style.setProperty("--ink", settings.textColor);
  root.style.setProperty("--muted", settings.mutedColor);
  root.style.setProperty("--line", settings.lineColor);
  root.style.setProperty("--green", settings.accentColor);
  root.style.setProperty("--placeholder-bg", settings.placeholderBackground);

  document.title = settings.siteTitle;
  document.querySelectorAll("[data-site-title]").forEach((item) => {
    item.textContent = settings.siteTitle;
  });
  document.querySelectorAll("[data-site-subtitle]").forEach((item) => {
    item.textContent = settings.siteSubtitle;
  });
  document.querySelectorAll("[data-footer-left]").forEach((item) => {
    item.textContent = settings.footerLeft;
  });
  document.querySelectorAll("[data-footer-right]").forEach((item) => {
    item.textContent = settings.footerRight;
  });

  document.querySelectorAll(".brand-mark").forEach((mark) => {
    mark.style.background = settings.logoBackground;
    if (settings.logoImage) {
      mark.classList.add("image-logo");
      mark.innerHTML = `<img src="${settings.logoImage}" alt="${settings.logoAlt || settings.siteTitle}">`;
    } else if (mark.classList.contains("image-logo")) {
      mark.classList.remove("image-logo");
      mark.innerHTML = "<i></i><i></i><i></i>";
    }
  });
}

async function loadFileData() {
  const loaded = {};
  await Promise.all(Object.entries(fileDataSources).map(async ([key, url]) => {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) return;
      loaded[key] = await response.json();
    } catch {
      // Local file preview may block fetch. Published static hosting will load these files.
    }
  }));
  fileData = loaded;
}

function savedEntries() {
  return readJson(storageKey, []).filter((entry) => entry.status === "published");
}

function savedCategoryMap() {
  return readJson(categoryStorageKey, {});
}

function entryCategories(entry) {
  if (Array.isArray(entry.categories) && entry.categories.length) {
    return entry.categories.filter(Boolean);
  }
  return entry.category ? [entry.category] : [];
}

function categoryText(categories, fallback = "カテゴリ未設定") {
  const values = Array.isArray(categories) ? categories.filter(Boolean) : [];
  return values.length ? values.join(" / ") : fallback;
}

function categoriesForPref(pref) {
  const fromSettings = savedCategoryMap()[pref] || [];
  const fromEntries = savedEntries()
    .filter((entry) => entry.pref === pref)
    .flatMap(entryCategories)
    .filter(Boolean);
  return Array.from(new Set([...(data.categories[pref] || []), ...fromSettings, ...fromEntries]));
}

function topImages() {
  return readJson(topImageStorageKey, []);
}

function prefImages() {
  return readJson(prefImageStorageKey, {});
}

function terms() {
  return readJson(termsStorageKey, []);
}

function makerRecords() {
  const raw = readJson(makerStorageKey, []);
  return raw.map((item) => {
    if (typeof item === "string") return { name: item, aliases: [] };
    return { name: item.name, aliases: item.aliases || [] };
  }).filter((item) => item.name);
}

function makerSearchWords(name) {
  const record = makerRecords().find((maker) => maker.name === name);
  return record ? [record.name, ...record.aliases] : [name];
}

function termGroupName(group) {
  return {
    lens: "レンズ",
    nickname: "灯器の愛称",
    glossary: "用語集"
  }[group] || "用語集";
}

function placeholderThumb(className = "entry-thumb tone-0") {
  const settings = siteSettings();
  return `<div class="${className} placeholder-custom"><span>${settings.placeholderText}</span></div>`;
}

function imageThumb(src, className) {
  if (!src) return placeholderThumb(className);
  return `<div class="${className} image-thumb"><img src="${src}" alt=""></div>`;
}

function zoomButton(src, label, imageMarkup) {
  if (!src) return imageMarkup;
  return `<button class="zoomable-image" type="button" data-zoom-src="${src}" data-zoom-label="${label || "画像"}">${imageMarkup}</button>`;
}

function breadcrumbs(items) {
  return `
    <nav class="breadcrumbs" aria-label="現在位置">
      ${items.map((item, index) => {
        const current = index === items.length - 1;
        return current
          ? `<span aria-current="page">${item.label}</span>`
          : `<a href="${item.href}">${item.label}</a>`;
      }).join("<b>/</b>")}
    </nav>
  `;
}

function intersectionText(entry) {
  if (!entry || entry.hasIntersection === false) return "交差点名なし";
  return entry.intersection || "交差点名未入力";
}

function visualCard(item, label = "") {
  if (item.image) {
    return `
      <a class="hero-tile" href="${item.link || "#signals"}">
        <div class="visual image-visual"><img src="${item.image}" alt=""></div>
        <span>${label || item.title}</span>
      </a>`;
  }
  const classes = ["visual", item.type || item.kind === "道路標識" ? "sign-visual" : "signal-visual", item.tone || "green"].join(" ");
  const signal = `
    <div class="signal-head" aria-hidden="true">
      <span class="lamp red"></span>
      <span class="lamp yellow"></span>
      <span class="lamp green"></span>
    </div>`;
  const sign = `<div class="sign-board" aria-hidden="true"><span></span></div>`;
  return `
    <a class="hero-tile" href="${item.link || "#signals"}">
      <div class="${classes}">${item.type === "sign" || item.kind === "道路標識" ? sign : signal}</div>
      <span>${label || item.title}</span>
    </a>`;
}

function updateCards() {
  const published = savedEntries().map((entry) => ({
    title: entry.title,
    kind: "信号機",
    pref: entry.pref,
    category: categoryText(entryCategories(entry), entry.category || ""),
    maker: entry.maker,
    date: entry.updatedAt ? entry.updatedAt.slice(0, 10) : "",
    tone: "green",
    coverImage: entry.coverImage,
    link: `#entry/${entry.id}`
  }));
  const baseItems = published.length ? published : data.updates;
  const items = Array.from({ length: 24 }, (_, index) => baseItems[index % baseItems.length]);
  return items.map((item, index) => `
    <a class="update-card" href="${item.link || "#signals"}">
      ${item.kind === "道路標識" ? `<div class="thumb sign-thumb ${item.tone}"><span></span></div>` : imageThumb(item.coverImage, `thumb signal-thumb ${item.tone}`)}
      <div>
        <p class="meta">${item.kind} / ${item.pref}</p>
        <h3>${item.title}</h3>
        <p>${item.category}${item.maker ? ` / ${item.maker}` : ""}</p>
        <time>${item.date}</time>
      </div>
    </a>
  `).join("");
}

function searchForm(value = "") {
  return `
    <form class="search-box" action="#search" data-search-form>
      <input type="search" name="q" value="${value}" placeholder="キーワードで探す 例: 角型 日本信号 東京都 銘板">
      <button type="submit">検索</button>
    </form>
  `;
}

function entrySearchText(entry) {
  return [
    entry.title,
    entry.summary,
    entry.body,
    entry.pref,
    entry.city,
    ...entryCategories(entry),
    ...makerSearchWords(entry.maker),
    entry.address,
    entry.intersection,
    ...(entry.detailPhotos || []).flatMap((photo) => [photo.name, photo.group, photo.tags])
  ].filter(Boolean).join(" ").toLowerCase();
}

function searchEntries(query) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return [];
  return savedEntries().filter((entry) => entrySearchText(entry).includes(keyword));
}

function uniqueValues(entries, key) {
  const values = key === "category"
    ? entries.flatMap(entryCategories)
    : entries.map((entry) => entry[key]);
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "ja"));
}

function filterEntries(entries, filters) {
  return entries.filter((entry) => {
    if (filters.pref && entry.pref !== filters.pref) return false;
    if (filters.maker && entry.maker !== filters.maker) return false;
    if (filters.category && !entryCategories(entry).includes(filters.category)) return false;
    return true;
  });
}

function filterSelect(label, name, values, selected) {
  return `
    <label>
      ${label}
      <select name="${name}">
        <option value="">すべて</option>
        ${values.map((value) => `<option value="${value}"${value === selected ? " selected" : ""}>${value}</option>`).join("")}
      </select>
    </label>
  `;
}

function filterForm(query, baseResults, filters) {
  return `
    <form class="filter-box" data-filter-form>
      ${filterSelect("都道府県", "pref", uniqueValues(baseResults, "pref"), filters.pref)}
      ${filterSelect("メーカー", "maker", uniqueValues(baseResults, "maker"), filters.maker)}
      ${filterSelect("カテゴリ", "category", uniqueValues(baseResults, "category"), filters.category)}
      <button type="submit">絞り込む</button>
      <a href="#search/${encodeURIComponent(query)}">解除</a>
    </form>
  `;
}

function entryCard(entry) {
  return `
    <a class="entry-card" href="#entry/${entry.id}">
      ${imageThumb(entry.coverImage, "entry-thumb tone-0")}
      <div>
        <p class="meta">${entry.pref || "都道府県未入力"} / ${entry.maker || "メーカー未設定"}</p>
        <h3>${entry.title || "タイトル未入力"}</h3>
        <p class="location-line">${entry.city || "市区町村未入力"} / ${intersectionText(entry)}</p>
        <p>${entry.summary || "説明はまだありません。"}</p>
        <span>#${categoryText(entryCategories(entry))}</span>
      </div>
    </a>
  `;
}

function home() {
  const heroItems = topImages().length ? topImages() : data.heroImages;
  const settings = siteSettings();
  app.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">${settings.heroEyebrow}</p>
        <h1>${settings.heroTitle}</h1>
        <p>${settings.heroText}</p>
      </div>
      <div class="hero-gallery">${heroItems.map((item) => visualCard(item)).join("")}</div>
    </section>

    <section class="entry-split" aria-label="コーナー選択">
      <a class="big-entry signal-entry" href="#signals">
        <span>信号機</span>
        <strong>都道府県別・基礎用語・紹介一覧</strong>
      </a>
      <a class="big-entry sign-entry" href="#signs">
        <span>道路標識</span>
        <strong>標識コーナーは準備中</strong>
      </a>
    </section>

    <section class="section-block compact-section">
      <div class="section-heading">
        <p class="eyebrow">Search</p>
        <h2>サイト内を探す</h2>
      </div>
      ${searchForm()}
    </section>

    <section class="info-buttons" aria-label="案内">
      ${data.infoLinks.map((item) => `<button type="button" title="${item.text}">${item.title}</button>`).join("")}
    </section>

    <section class="section-block">
      <div class="section-heading">
        <p class="eyebrow">Latest</p>
        <h2>最近更新した画像</h2>
        <p>信号機・道路標識を合わせて、新しい順に24件表示します。</p>
      </div>
      <div class="update-grid">${updateCards()}</div>
    </section>
  `;
}

function signals() {
  const settings = siteSettings();
  const entriesByPref = savedEntries().reduce((result, entry) => {
    if (!result[entry.pref]) result[entry.pref] = entry;
    return result;
  }, {});
  const prefImageSettings = prefImages();
  app.innerHTML = `
    <section class="page-head">
      ${breadcrumbs([{ label: "トップ", href: "#home" }, { label: "信号機" }])}
      <p class="eyebrow">Signals</p>
      <h1>信号機</h1>
      <p>47都道府県から探す、基礎用語を見る、最近の紹介を見る。</p>
      ${searchForm()}
    </section>

    <section class="section-block">
      <div class="section-heading">
        <h2>都道府県から探す</h2>
        <p>${settings.signalsPrefListText}</p>
      </div>
      <div class="pref-grid">
        ${data.prefectures.map((pref, index) => {
          const entry = entriesByPref[pref];
          const cover = prefImageSettings[pref]?.cover;
          return `
          <a class="pref-card" href="#pref/${encodeURIComponent(pref)}">
            ${imageThumb(cover?.image || entry?.coverImage, `pref-image tone-${index % 5}`)}
            <span>${pref}</span>
          </a>`;
        }).join("")}
      </div>
    </section>

    <section class="section-block">
      <div class="section-heading">
        <h2>基礎用語</h2>
        <p>${settings.signalsTermsText}</p>
      </div>
      <div class="term-grid">
        <a href="#terms">基礎用語を見る</a>
      </div>
    </section>
  `;
}

function prefPage(pref) {
  const settings = siteSettings();
  const entries = savedEntries().filter((entry) => entry.pref === pref);
  const categories = categoriesForPref(pref);
  const manualPickups = prefImages()[pref]?.pickups || [];
  const pickups = manualPickups.length ? manualPickups : entries.slice(0, 3);
  app.innerHTML = `
    <section class="page-head">
      ${breadcrumbs([{ label: "トップ", href: "#home" }, { label: "信号機", href: "#signals" }, { label: pref }])}
      <p class="eyebrow">Prefecture</p>
      <h1>${pref}の信号機</h1>
      <p>${settings.prefPageLeadText}</p>
    </section>

    <section class="pickup-row">
      ${(pickups.length ? pickups : [1, 2, 3]).map((item, index) => {
        const entry = typeof item === "object" ? item : null;
        const linkedEntry = entry?.id
          ? entry
          : entry?.entryId
            ? entries.find((savedEntry) => savedEntry.id === entry.entryId)
            : entries.find((savedEntry) => {
                const sameTitle = entry?.title && savedEntry.title === entry.title;
                const sameImage = entry?.image && (savedEntry.image === entry.image || savedEntry.coverImage === entry.image);
                return sameTitle || sameImage;
              });
        const link = linkedEntry?.id ? `#entry/${linkedEntry.id}` : "";
        const content = `
          ${imageThumb(entry?.image || entry?.coverImage, "pickup-image")}
          <strong>${entry?.title || linkedEntry?.title || `ピックアップ ${index + 1}`}</strong>
        `;
        return `
          ${link ? `<a class="pickup-card" href="${link}">${content}</a>` : `<article>${content}</article>`}`;
      }).join("")}
    </section>

    <section class="section-block">
      <div class="section-heading">
        <h2>カテゴリ</h2>
        <p>${settings.prefCategoryText}</p>
      </div>
      <div class="category-buttons">
        ${(categories.length ? categories : ["準備中"]).map((cat) => `<a href="#category/${encodeURIComponent(pref)}/${encodeURIComponent(cat)}">${cat}</a>`).join("")}
      </div>
    </section>

    <section class="section-block">
      <div class="section-heading">
        <h2>${pref}の紹介カード</h2>
        <p>${settings.prefCardListText}</p>
      </div>
      <div class="card-grid">
        ${entries.length ? entries.map(entryCard).join("") : `<article class="empty-card"><p>まだ紹介がありません。</p></article>`}
      </div>
    </section>
  `;
}

function categoryPage(pref, cat) {
  const settings = siteSettings();
  const entries = savedEntries().filter((entry) => entry.pref === pref && entryCategories(entry).includes(cat));
  const makers = entries.length
    ? Array.from(new Set(entries.map((entry) => entry.maker || "メーカー未設定")))
    : ["日本信号", "京三製作所", "コイト電工"];
  app.innerHTML = `
    <section class="page-head">
      ${breadcrumbs([{ label: "トップ", href: "#home" }, { label: "信号機", href: "#signals" }, { label: pref, href: `#pref/${encodeURIComponent(pref)}` }, { label: cat }])}
      <p class="eyebrow">${pref}</p>
      <h1>${cat}</h1>
      <p>${settings.categoryPageLeadText}</p>
    </section>
    <section class="maker-list">
      ${makers.map((maker, makerIndex) => `
        <div class="maker-section">
          <h2>${maker}</h2>
          <div class="card-grid">
            ${(entries.length ? entries.filter((entry) => (entry.maker || "メーカー未設定") === maker) : [1, 2]).map((entryOrNumber, n) => {
              const entry = typeof entryOrNumber === "object" ? entryOrNumber : null;
              return `
              <a class="entry-card" href="#entry/${entry ? entry.id : `${makerIndex}-${n}`}">
                ${imageThumb(entry?.coverImage, `entry-thumb tone-${(makerIndex + n) % 5}`)}
                <div>
                  <p class="meta">${pref} / ${maker}</p>
                  <h3>${entry?.title || `${cat} サンプル ${n + 1}`}</h3>
                  ${entry ? `<p class="location-line">${entry.city || "市区町村未入力"} / ${intersectionText(entry)}</p>` : ""}
                  <p>${entry?.summary || "カードを押すと、写真・住所・リンク・解説をまとめた1件ページへ進みます。"}</p>
                  <span>#${cat}</span>
                </div>
              </a>`;
            }).join("")}
          </div>
        </div>
      `).join("")}
    </section>
  `;
}

function photoImage(photo) {
  if (photo.image) {
    return zoomButton(photo.image, photo.name, `<img src="${photo.image}" alt="">`);
  }
  return `<div class="photo-placeholder placeholder-custom"><span>${siteSettings().placeholderText}</span></div>`;
}

function entryPage(id) {
  const entry = savedEntries().find((item) => item.id === id);
  if (!entry) {
    app.innerHTML = `
      <section class="page-head">
        <p class="eyebrow">Entry</p>
        <h1>紹介が見つかりません</h1>
        <p>管理画面で公開として保存した紹介は、ここに表示されます。</p>
      </section>
    `;
    return;
  }

  const groups = (entry.detailPhotos || []).reduce((result, photo) => {
    const group = photo.group || "その他";
    if (!result[group]) result[group] = [];
    result[group].push(photo);
    return result;
  }, {});
  const categories = entryCategories(entry);
  const primaryCategory = categories[0] || entry.category || "";

  app.innerHTML = `
    <section class="page-head">
      ${breadcrumbs([{ label: "トップ", href: "#home" }, { label: "信号機", href: "#signals" }, { label: entry.pref, href: `#pref/${encodeURIComponent(entry.pref)}` }, { label: primaryCategory || "カテゴリ", href: `#category/${encodeURIComponent(entry.pref)}/${encodeURIComponent(primaryCategory)}` }, { label: entry.title }])}
      <p class="eyebrow">${entry.pref} / ${categoryText(categories)}</p>
      <h1>${entry.title}</h1>
      <p>${entry.summary || ""}</p>
    </section>

    <article class="public-detail">
      <div class="public-cover">${imageThumb(entry.coverImage, "entry-thumb tone-0")}</div>
      ${Object.entries(groups).map(([group, photos]) => `
        <section>
          <h2>${group}</h2>
          <div class="detail-photo-grid">
            ${photos.map((photo) => `
              <figure>
                ${photoImage(photo)}
                <figcaption>
                  <strong>${photo.name || "写真名未入力"}</strong>
                  <span>${photo.tags || ""}</span>
                </figcaption>
              </figure>
            `).join("")}
          </div>
        </section>
      `).join("")}
      <dl>
        <div><dt>交差点名</dt><dd>${intersectionText(entry)}</dd></div>
        <div><dt>住所</dt><dd>${entry.address || "未入力"}</dd></div>
        <div><dt>Google Map</dt><dd>${entry.map ? `<a href="${entry.map}" target="_blank" rel="noreferrer">地図を開く</a>` : "未入力"}</dd></div>
        <div><dt>動画</dt><dd>${entry.video ? `<a href="${entry.video}" target="_blank" rel="noreferrer">動画を開く</a>` : "未入力"}</dd></div>
      </dl>
      <section>
        <h2>解説</h2>
        <p>${entry.body || "解説はまだありません。"}</p>
      </section>
    </article>
  `;
  bindZoomableImages();
}

function signs() {
  app.innerHTML = `
    <section class="page-head">
      ${breadcrumbs([{ label: "トップ", href: "#home" }, { label: "道路標識" }])}
      <p class="eyebrow">Road Signs</p>
      <h1>道路標識</h1>
      <p>道路標識コーナーは準備中です。入口だけ先に用意し、後から信号機と同じ考え方で追加します。</p>
    </section>
  `;
}

function termsHome() {
  const settings = siteSettings();
  app.innerHTML = `
    <section class="page-head">
      ${breadcrumbs([{ label: "トップ", href: "#home" }, { label: "信号機", href: "#signals" }, { label: "基礎用語" }])}
      <p class="eyebrow">Terms</p>
      <h1>基礎用語</h1>
      <p>${settings.termsHomeLeadText}</p>
    </section>

    <section class="entry-split term-entry-split" aria-label="基礎用語分類">
      <a class="big-entry term-entry lens-entry" href="#terms/lens">
        <span>レンズ</span>
        <strong>レンズ径、見え方、種類など</strong>
      </a>
      <a class="big-entry term-entry nickname-entry" href="#terms/nickname">
        <span>灯器の愛称</span>
        <strong>角型、丸型、低コストなど</strong>
      </a>
      <a class="big-entry term-entry glossary-entry" href="#terms/glossary">
        <span>用語集</span>
        <strong>信号機に関する言葉をまとめる</strong>
      </a>
    </section>
  `;
}

function termsPage(group) {
  const settings = siteSettings();
  const items = terms().filter((item) => item.group === group);
  app.innerHTML = `
    <section class="page-head">
      ${breadcrumbs([{ label: "トップ", href: "#home" }, { label: "信号機", href: "#signals" }, { label: "基礎用語", href: "#terms" }, { label: termGroupName(group) }])}
      <p class="eyebrow">Terms</p>
      <h1>${termGroupName(group)}</h1>
      <p>${settings.termsPageLeadText}</p>
    </section>

    <section class="term-list">
      ${items.length ? items.map((item) => `
        <article class="term-card">
          ${item.image ? zoomButton(item.image, item.title, `<img src="${item.image}" alt="">`) : `<div class="photo-placeholder"><span>画像</span></div>`}
          <div>
            <h2>${item.title}</h2>
            <p>${item.body || "説明はまだありません。"}</p>
            ${(item.extras || []).length ? `
              <dl class="term-detail-list">
                ${item.extras.map((extra) => `
                  <div>
                    <dt>${extra.label}</dt>
                    <dd>${extra.value}</dd>
                  </div>
                `).join("")}
              </dl>
            ` : ""}
          </div>
        </article>
      `).join("") : `
        <article class="term-card">
          <div class="photo-placeholder"><span>準備中</span></div>
          <div>
            <h2>${settings.termsEmptyTitle}</h2>
            <p>${settings.termsEmptyText}</p>
          </div>
        </article>
      `}
    </section>
  `;
  bindZoomableImages();
}

function searchPage(query = "", filterParts = []) {
  const params = new URLSearchParams(filterParts.join("&"));
  const filters = {
    pref: params.get("pref") || "",
    maker: params.get("maker") || "",
    category: params.get("category") || ""
  };
  const baseResults = searchEntries(query);
  const results = filterEntries(baseResults, filters);
  app.innerHTML = `
    <section class="page-head">
      ${breadcrumbs([{ label: "トップ", href: "#home" }, { label: "検索" }])}
      <p class="eyebrow">Search</p>
      <h1>検索</h1>
      <p>公開済みの紹介から、タイトル・都道府県・カテゴリ・メーカー・説明文などを探します。</p>
      ${searchForm(query)}
    </section>

    ${query ? `
      <section class="section-block compact-section">
        <div class="section-heading">
          <h2>絞り込み</h2>
          <p>検索結果を都道府県・メーカー・カテゴリで狭めます。</p>
        </div>
        ${filterForm(query, baseResults, filters)}
      </section>
    ` : ""}

    <section class="section-block">
      <div class="section-heading">
        <h2>${query ? `「${query}」の検索結果` : "キーワードを入力してください"}</h2>
        <p>${query ? `${baseResults.length}件中 ${results.length}件を表示しています。` : "例: 角型、日本信号、東京都、銘板"}</p>
      </div>
      <div class="card-grid">
        ${results.length ? results.map(entryCard).join("") : ""}
      </div>
    </section>
  `;
  bindSearchForms();
  bindFilterForms(query);
}

function bindSearchForms() {
  document.querySelectorAll("[data-search-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = new FormData(form).get("q")?.toString().trim() || "";
      location.hash = `#search/${encodeURIComponent(query)}`;
    });
  });
}

function bindFilterForms(query) {
  document.querySelectorAll("[data-filter-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const params = new URLSearchParams();
      ["pref", "maker", "category"].forEach((key) => {
        const value = data.get(key)?.toString();
        if (value) params.set(key, value);
      });
      const suffix = params.toString() ? `/${params.toString()}` : "";
      location.hash = `#search/${encodeURIComponent(query)}${suffix}`;
    });
  });
}

function bindZoomableImages() {
  document.querySelectorAll("[data-zoom-src]").forEach((button) => {
    button.addEventListener("click", () => openLightbox(button.dataset.zoomSrc, button.dataset.zoomLabel));
  });
  protectImages();
}

function openLightbox(src, label) {
  const old = document.querySelector(".lightbox");
  if (old) old.remove();
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = `
    <div class="lightbox-panel" role="dialog" aria-modal="true" aria-label="${label || "画像"}">
      <button class="lightbox-close" type="button" aria-label="閉じる">閉じる</button>
      <img src="${src}" alt="">
      <p>${label || "画像"}</p>
    </div>
  `;
  document.body.appendChild(lightbox);
  lightbox.querySelector(".lightbox-close").focus();
  protectImages();
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target.classList.contains("lightbox-close")) {
      lightbox.remove();
    }
  });
}

function protectImages() {
  document.querySelectorAll("img").forEach((image) => {
    image.setAttribute("draggable", "false");
    image.addEventListener("contextmenu", (event) => event.preventDefault());
    image.addEventListener("dragstart", (event) => event.preventDefault());
  });
}

function route() {
  applySiteSettings();
  const hash = location.hash || "#home";
  const parts = hash.slice(1).split("/").map(decodeURIComponent);
  if (parts[0] === "signals") return signals();
  if (parts[0] === "signs") return signs();
  if (parts[0] === "pref") return prefPage(parts[1]);
  if (parts[0] === "category") return categoryPage(parts[1], parts[2]);
  if (parts[0] === "entry") return entryPage(parts[1]);
  if (parts[0] === "terms" && !parts[1]) return termsHome();
  if (parts[0] === "terms") return termsPage(parts[1]);
  if (parts[0] === "search") return searchPage(parts[1] || "", parts.slice(2));
  home();
  bindSearchForms();
}

window.addEventListener("hashchange", route);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") document.querySelector(".lightbox")?.remove();
});
loadFileData().then(() => {
  applySiteSettings();
  route();
  protectImages();
});
