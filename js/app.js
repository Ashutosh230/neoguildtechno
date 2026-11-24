// ===== Contact config =====
const WHATSAPP_NUMBER = "918095344864";
const INQUIRY_EMAIL = "sales@neoguildtechnosolutions.com";

const PAGE_SIZE = 24;
const CART_KEY = "neoguild_inquiry_cart_v1";
const THEME_KEY = "neoguild_theme";

const state = {
  data: null,
  activeCategory: null,   // category id or null = all
  activeSubcategory: null, // subcategory id or null
  searchTerm: "",
  page: 1,
  cart: {}, // id -> { id, name, brand, sku, qty }
};

// ===== Icon set (inline SVG, keyed by subcategory keyword) =====
const ICONS = {
  default: `<path d="M4 17V7l8-4 8 4v10l-8 4-8-4z"/><path d="M4 7l8 4 8-4"/><path d="M12 11v10"/>`,
  oscilloscope: `<path d="M3 12h3l2-7 4 14 3-9 2 5h4"/>`,
  lcr: `<rect x="4" y="9" width="16" height="6" rx="1"/><path d="M4 12H2M22 12h-2M8 9V6M12 9V5M16 9V6"/>`,
  load: `<path d="M4 12h4l2-6 4 12 2-6h4"/>`,
  hipot: `<path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>`,
  power: `<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 9h6M9 13h6M9 17h3"/>`,
  daq: `<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h2v6H7zM11 7h2v8h-2zM15 11h2v4h-2z"/>`,
  spectrum: `<path d="M3 18V8M7 18v-4M11 18V5M15 18v-9M19 18v-6"/>`,
  function_gen: `<path d="M3 12c2 0 2-6 4-6s2 12 4 12 2-12 4-12 2 6 4 6"/>`,
  multimeter: `<rect x="6" y="3" width="12" height="18" rx="3"/><circle cx="12" cy="9" r="2.4"/><path d="M9 15h6M9 18h6"/>`,
  insulation: `<path d="M12 2l8 4v6c0 5-3.6 8.4-8 10-4.4-1.6-8-5-8-10V6z"/>`,
  environment: `<circle cx="12" cy="13" r="4"/><path d="M12 2v3M4.2 6.2l2 2M19.8 6.2l-2 2M2 13h3M19 13h3"/>`,
  thermal: `<path d="M9 14a4 4 0 104 0V5a2 2 0 10-4 0z"/><path d="M9 9h4"/>`,
  caliper: `<path d="M3 8h18M3 8v10M21 8v4M7 8v6M11 8v6M15 8v4M3 18h4M15 12h6"/>`,
  micrometer: `<circle cx="7" cy="12" r="4"/><path d="M11 12h10M17 8v8"/>`,
  depth: `<path d="M12 3v12M8 7l4-4 4 4M5 21h14"/>`,
  medical: `<path d="M12 4v16M4 12h16" stroke-linecap="round"/>`,
  soldering: `<path d="M4 20L15 9a2.5 2.5 0 103-3L7 17z"/><path d="M14 6l4 4"/>`,
};

function iconFor(subName) {
  const n = (subName || "").toLowerCase();
  if (n.includes("oscilloscope")) return ICONS.oscilloscope;
  if (n.includes("lcr")) return ICONS.lcr;
  if (n.includes("load")) return ICONS.load;
  if (n.includes("hipot")) return ICONS.hipot;
  if (n.includes("power supply") || n.includes("ac power")) return ICONS.power;
  if (n.includes("data acquisition")) return ICONS.daq;
  if (n.includes("spectrum")) return ICONS.spectrum;
  if (n.includes("function generator")) return ICONS.function_gen;
  if (n.includes("multimeter")) return ICONS.multimeter;
  if (n.includes("insulation")) return ICONS.insulation;
  if (n.includes("environmental")) return ICONS.environment;
  if (n.includes("thermal")) return ICONS.thermal;
  if (n.includes("calliper") || n.includes("caliper")) return ICONS.caliper;
  if (n.includes("micrometer")) return ICONS.micrometer;
  if (n.includes("depth") || n.includes("height")) return ICONS.depth;
  if (n.includes("solder")) return ICONS.soldering;
  if (n.includes("medical") || n.includes("health")) return ICONS.medical;
  return ICONS.default;
}

function svgIcon(subName) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">${iconFor(subName)}</svg>`;
}

function handleCardImgError(imgEl) {
  const subName = imgEl.dataset.sub || "";
  imgEl.outerHTML = `${svgIcon(subName)}<span class="ph-label">${escapeHtml(subName)}</span>`;
}

// ===== Formatting =====
function formatPrice(price) {
  if (price === null || price === undefined) return `<span class="card-price contact">Contact for price</span>`;
  return `<span class="card-price">₹${Number(price).toLocaleString("en-IN")}</span>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ===== Data loading =====
async function loadData() {
  const res = await fetch("./data/products.json");
  state.data = await res.json();
}

function allProductsFlat() {
  const out = [];
  for (const cat of state.data.categories) {
    for (const sub of cat.subcategories) {
      for (const p of sub.products) {
        out.push({ ...p, categoryId: cat.id, categoryName: cat.name, subId: sub.id, subName: sub.name });
      }
    }
  }
  return out;
}

function getFilteredProducts() {
  let list = allProductsFlat();
  if (state.activeCategory) list = list.filter((p) => p.categoryId === state.activeCategory);
  if (state.activeSubcategory) list = list.filter((p) => p.subId === state.activeSubcategory);
  const term = state.searchTerm.trim().toLowerCase();
  if (term) {
    list = list.filter((p) =>
      p.name.toLowerCase().includes(term) ||
      p.brand.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term)
    );
  }
  return list;
}

// ===== Sidebar rendering =====
function renderSidebar() {
  const nav = document.getElementById("category-nav");
  nav.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = "cat-btn" + (!state.activeCategory ? " active" : "");
  allBtn.textContent = "All Products";
  allBtn.addEventListener("click", () => {
    state.activeCategory = null;
    state.activeSubcategory = null;
    state.page = 1;
    renderSidebar();
    renderGrid();
  });
  nav.appendChild(allBtn);

  for (const cat of state.data.categories) {
    const group = document.createElement("div");
    group.className = "cat-group";

    const btn = document.createElement("button");
    btn.className = "cat-btn" + (state.activeCategory === cat.id ? " active" : "");
    const expanded = state.activeCategory === cat.id;
    btn.setAttribute("aria-expanded", String(expanded));
    const total = cat.subcategories.reduce((s, sc) => s + sc.products.length, 0);
    btn.innerHTML = `<span>${escapeHtml(cat.name)}</span><span class="chev">${cat.subcategories.length ? "▸" : ""}</span>`;
    btn.title = `${total} products`;
    btn.addEventListener("click", () => {
      state.activeCategory = cat.id;
      state.activeSubcategory = null;
      state.page = 1;
      renderSidebar();
      renderGrid();
    });
    group.appendChild(btn);

    const list = document.createElement("ul");
    list.className = "subcat-list" + (expanded ? "" : " collapsed");
    for (const sub of cat.subcategories) {
      const li = document.createElement("li");
      const sbtn = document.createElement("button");
      sbtn.className = state.activeSubcategory === sub.id ? "active" : "";
      sbtn.innerHTML = `${escapeHtml(sub.name)} <span class="count-badge">(${sub.products.length})</span>`;
      sbtn.addEventListener("click", (e) => {
        e.stopPropagation();
        state.activeCategory = cat.id;
        state.activeSubcategory = sub.id;
        state.page = 1;
        renderSidebar();
        renderGrid();
      });
      li.appendChild(sbtn);
      list.appendChild(li);
    }
    group.appendChild(list);
    nav.appendChild(group);
  }
}

// ===== Grid rendering =====
function specBlurb(p) {
  return p.spec && p.spec !== p.name ? p.spec : p.name;
}

function cardHtml(p) {
  const cartItem = state.cart[p.id];
  const inCart = !!cartItem;
  const qty = cartItem ? cartItem.qty : 0;
  return `
  <div class="card-wrap reveal">
    <article class="product-card" data-id="${p.id}">
      <div class="card-media">
        ${p.image
          ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" data-sub="${escapeHtml(p.subName)}" onerror="handleCardImgError(this)">`
          : `${svgIcon(p.subName)}<span class="ph-label">${escapeHtml(p.subName)}</span>`}
        <div class="info-wrap">
          <button class="info-icon" type="button" aria-label="Quick spec for ${escapeHtml(p.name)}">i</button>
          <div class="spec-tooltip">
            <strong>Quick spec</strong>
            <span class="spec-line">${escapeHtml(specBlurb(p))}</span>
            <span class="spec-meta">${escapeHtml(p.brand)} &middot; SKU ${escapeHtml(p.sku)}</span>
          </div>
        </div>
      </div>
      <div class="card-body">
        <span class="card-brand">${escapeHtml(p.brand)}</span>
        <h3 class="card-name">${escapeHtml(p.name)}</h3>
        <span class="card-sku">SKU: ${escapeHtml(p.sku)}</span>
        ${formatPrice(p.price)}
        <div class="card-actions">
          ${inCart
            ? `<div class="card-qty">
                 <button class="qty-btn" data-dec="${p.id}" aria-label="Decrease quantity">−</button>
                 <span class="qty-val">${qty}</span>
                 <button class="qty-btn" data-inc="${p.id}" aria-label="Increase quantity">+</button>
               </div>
               <button class="remove-link" data-remove="${p.id}">Remove</button>`
            : `<button class="add-btn" data-add="${p.id}">Add to Inquiry</button>`}
        </div>
      </div>
    </article>
  </div>`;
}

function comingSoonHtml(catName) {
  return `<div class="coming-soon">
    <h3>${escapeHtml(catName)} — Catalog being finalized</h3>
    <p>We're onboarding products for this category. Contact us for current stock and availability.</p>
  </div>`;
}

let gridObserver = null;

function renderGrid() {
  const grid = document.getElementById("product-grid");
  const emptyState = document.getElementById("empty-state");
  const loadMoreBtn = document.getElementById("load-more-btn");
  const filterBar = document.getElementById("active-filter-bar");
  const resultCount = document.getElementById("result-count");

  // "coming soon" categories with zero products
  if (state.activeCategory && !state.activeSubcategory) {
    const cat = state.data.categories.find((c) => c.id === state.activeCategory);
    if (cat && cat.subcategories.length === 0) {
      grid.innerHTML = comingSoonHtml(cat.name);
      loadMoreBtn.hidden = true;
      emptyState.hidden = true;
      filterBar.innerHTML = `Showing: <strong>${escapeHtml(cat.name)}</strong>`;
      resultCount.textContent = "";
      return;
    }
  }

  const filtered = getFilteredProducts();
  resultCount.textContent = `${filtered.length} product${filtered.length === 1 ? "" : "s"}`;

  let label = "All categories";
  if (state.activeSubcategory) {
    const p = filtered[0];
    label = p ? p.subName : state.activeSubcategory;
  } else if (state.activeCategory) {
    const cat = state.data.categories.find((c) => c.id === state.activeCategory);
    label = cat ? cat.name : label;
  }
  if (state.searchTerm) label += ` — search: "${escapeHtml(state.searchTerm)}"`;
  filterBar.innerHTML = `Showing: <strong>${label}</strong>`;

  if (filtered.length === 0) {
    grid.innerHTML = "";
    emptyState.hidden = false;
    loadMoreBtn.hidden = true;
    return;
  }
  emptyState.hidden = true;

  const visibleCount = Math.min(state.page * PAGE_SIZE, filtered.length);
  const slice = filtered.slice(0, visibleCount);
  grid.innerHTML = slice.map(cardHtml).join("");

  loadMoreBtn.hidden = visibleCount >= filtered.length;

  attachCardBehaviors(grid);
}

function attachCardBehaviors(grid) {
  // Add-to-inquiry buttons
  grid.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-add");
      toggleCartItem(id);
    });
  });

  // In-card quantity stepper
  grid.querySelectorAll("[data-inc]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-inc");
      const item = state.cart[id];
      if (item) setQty(id, item.qty + 1);
    });
  });
  grid.querySelectorAll("[data-dec]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-dec");
      const item = state.cart[id];
      if (item) setQty(id, item.qty - 1);
    });
  });
  grid.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFromCart(btn.getAttribute("data-remove"));
    });
  });

  // Scroll reveal
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wraps = grid.querySelectorAll(".card-wrap");
  if (reduceMotion) {
    wraps.forEach((w) => w.classList.add("in-view"));
  } else {
    if (gridObserver) gridObserver.disconnect();
    gridObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            gridObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    wraps.forEach((w) => gridObserver.observe(w));

    // 3D tilt — only while card is in viewport-ish (lightweight, mousemove-driven)
    grid.querySelectorAll(".product-card").forEach(attachTilt);
  }
}

function attachTilt(card) {
  const maxTilt = 8;
  function onMove(e) {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotY = (x - 0.5) * maxTilt * 2;
    const rotX = (0.5 - y) * maxTilt * 2;
    card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
  }
  function onLeave() {
    card.style.transform = "";
  }
  card.addEventListener("mousemove", onMove);
  card.addEventListener("mouseleave", onLeave);
}

// ===== Cart =====
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    state.cart = raw ? JSON.parse(raw) : {};
  } catch {
    state.cart = {};
  }
}
function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
}

function findProductById(id) {
  return allProductsFlat().find((p) => p.id === id);
}

function toggleCartItem(id) {
  if (state.cart[id]) {
    delete state.cart[id];
  } else {
    const p = findProductById(id);
    if (!p) return;
    state.cart[id] = { id: p.id, name: p.name, brand: p.brand, sku: p.sku, qty: 1 };
  }
  saveCart();
  renderGrid();
  renderCartUI();
}

function setQty(id, qty) {
  if (!state.cart[id]) return;
  if (qty <= 0) {
    delete state.cart[id];
  } else {
    state.cart[id].qty = qty;
  }
  saveCart();
  renderCartUI();
  renderGrid();
}

function removeFromCart(id) {
  delete state.cart[id];
  saveCart();
  renderCartUI();
  renderGrid();
}

function clearCart() {
  state.cart = {};
  saveCart();
  renderCartUI();
  renderGrid();
}

function cartCount() {
  return Object.values(state.cart).reduce((s, it) => s + it.qty, 0);
}

function renderCartUI() {
  document.getElementById("cart-count").textContent = cartCount();
  const itemsEl = document.getElementById("cart-items");
  const emptyEl = document.getElementById("cart-empty");
  const items = Object.values(state.cart);

  if (items.length === 0) {
    itemsEl.innerHTML = "";
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  itemsEl.innerHTML = items
    .map(
      (it) => `
    <div class="cart-item" data-id="${it.id}">
      <div class="cart-item-info">
        <p class="cart-item-name">${escapeHtml(it.name)}</p>
        <span class="cart-item-brand">${escapeHtml(it.brand)} · SKU ${escapeHtml(it.sku)}</span>
        <div class="cart-item-controls">
          <button class="qty-btn" data-dec="${it.id}">−</button>
          <span class="qty-val">${it.qty}</span>
          <button class="qty-btn" data-inc="${it.id}">+</button>
        </div>
      </div>
      <button class="cart-item-remove" data-remove="${it.id}">Remove</button>
    </div>`
    )
    .join("");

  itemsEl.querySelectorAll("[data-inc]").forEach((b) =>
    b.addEventListener("click", () => setQty(b.getAttribute("data-inc"), state.cart[b.getAttribute("data-inc")].qty + 1))
  );
  itemsEl.querySelectorAll("[data-dec]").forEach((b) =>
    b.addEventListener("click", () => setQty(b.getAttribute("data-dec"), state.cart[b.getAttribute("data-dec")].qty - 1))
  );
  itemsEl.querySelectorAll("[data-remove]").forEach((b) =>
    b.addEventListener("click", () => removeFromCart(b.getAttribute("data-remove")))
  );
}

function buildInquiryText() {
  const items = Object.values(state.cart);
  const lines = items.map((it, i) => `${i + 1}. ${it.name} (${it.brand}, SKU: ${it.sku}) — Qty: ${it.qty}`);
  return `Hello Neoguild Technical Solutions, I would like a quotation for:\n\n${lines.join("\n")}\n\nPlease share pricing and availability. Thank you.`;
}

function openWhatsApp() {
  if (Object.keys(state.cart).length === 0) return;
  const text = encodeURIComponent(buildInquiryText());
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
}

// Gmail/Outlook web compose: if the user is already signed into that
// provider in this browser, the compose window opens using their active
// session (and their own account-switcher if they have more than one) —
// no email address needs to be typed or guessed by this site.
function openMailProvider(provider, subject, body) {
  const to = encodeURIComponent(INQUIRY_EMAIL);
  const su = encodeURIComponent(subject);
  const bo = encodeURIComponent(body);
  if (provider === "gmail") {
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${bo}`, "_blank");
  } else if (provider === "outlook") {
    window.open(`https://outlook.office.com/mail/deeplink/compose?to=${to}&subject=${su}&body=${bo}`, "_blank");
  } else {
    window.location.href = `mailto:${INQUIRY_EMAIL}?subject=${su}&body=${bo}`;
  }
}

function openEmail() {
  if (Object.keys(state.cart).length === 0) return;
  openMailProvider("gmail", "Quotation Request — Neoguild Technical Solutions", buildInquiryText());
}
function openEmailOutlook() {
  if (Object.keys(state.cart).length === 0) return;
  openMailProvider("outlook", "Quotation Request — Neoguild Technical Solutions", buildInquiryText());
}
function openEmailDefault() {
  if (Object.keys(state.cart).length === 0) return;
  openMailProvider("default", "Quotation Request — Neoguild Technical Solutions", buildInquiryText());
}

// ===== Cart panel open/close =====
function openCartPanel() {
  document.getElementById("cart-panel").hidden = false;
  document.getElementById("cart-overlay").hidden = false;
}
function closeCartPanel() {
  document.getElementById("cart-panel").hidden = true;
  document.getElementById("cart-overlay").hidden = true;
}

// ===== Theme toggle =====
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const currentlyDark = current === "dark" || (!current && prefersDark);
    const next = currentlyDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
  });
}

// ===== Hero stat counters =====
function animateStats() {
  document.querySelectorAll(".stat-num").forEach((el) => {
    const target = Number(el.getAttribute("data-count")) || 0;
    const duration = 900;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * progress);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// ===== Search & load more =====
function initToolbar() {
  const input = document.getElementById("search-input");
  let debounce;
  input.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.searchTerm = input.value;
      state.page = 1;
      renderGrid();
    }, 180);
  });

  document.getElementById("load-more-btn").addEventListener("click", () => {
    state.page += 1;
    renderGrid();
  });
}

function initCartControls() {
  document.getElementById("cart-fab").addEventListener("click", openCartPanel);
  document.getElementById("cart-close").addEventListener("click", closeCartPanel);
  document.getElementById("cart-overlay").addEventListener("click", closeCartPanel);
  document.getElementById("cart-whatsapp").addEventListener("click", openWhatsApp);
  document.getElementById("cart-email").addEventListener("click", openEmail);
  document.getElementById("cart-email-outlook").addEventListener("click", (e) => {
    e.preventDefault();
    openEmailOutlook();
  });
  document.getElementById("cart-email-default").addEventListener("click", (e) => {
    e.preventDefault();
    openEmailDefault();
  });
  document.getElementById("cart-clear").addEventListener("click", clearCart);
}

// ===== Static scroll reveal (hero CTA, section headings — anything outside the product grid) =====
function initStaticReveal() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const els = document.querySelectorAll(".catalog-section > .reveal, .about-section .reveal");
  if (reduceMotion) {
    els.forEach((el) => el.classList.add("in-view"));
    return;
  }
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => obs.observe(el));
}

// ===== Request-a-product modal =====
function openRequestModal() {
  document.getElementById("request-overlay").hidden = false;
  const first = document.getElementById("req-product");
  if (first) first.focus();
}
function closeRequestModal() {
  document.getElementById("request-overlay").hidden = true;
}

function buildRequestText(data) {
  const lines = [
    `Hello Neoguild Technical Solutions, I'm looking for a product that isn't in your catalog:`,
    ``,
    `Product / model: ${data.product}`,
  ];
  if (data.brand) lines.push(`Preferred brand: ${data.brand}`);
  lines.push(`Quantity: ${data.qty || 1}`);
  if (data.notes) lines.push(`Notes: ${data.notes}`);
  lines.push(``, `My name: ${data.name}`, `Reach me at: ${data.contact}`);
  return lines.join("\n");
}

function initRequestModal() {
  document.getElementById("open-request-hero").addEventListener("click", openRequestModal);
  document.getElementById("open-request-cta").addEventListener("click", openRequestModal);
  document.getElementById("request-close").addEventListener("click", closeRequestModal);
  document.getElementById("request-overlay").addEventListener("click", (e) => {
    if (e.target.id === "request-overlay") closeRequestModal();
  });

  const form = document.getElementById("request-form");

  function getFormData() {
    return {
      product: form.product.value.trim(),
      brand: form.brand.value.trim(),
      qty: form.qty.value.trim(),
      notes: form.notes.value.trim(),
      name: form.name.value.trim(),
      contact: form.contact.value.trim(),
    };
  }
  function finishSend() {
    closeRequestModal();
    form.reset();
    form.qty.value = 1;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const channel = e.submitter ? e.submitter.getAttribute("data-channel") : "whatsapp";
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const text = buildRequestText(getFormData());
    if (channel === "email") {
      openMailProvider("gmail", "Product Request — Neoguild Technical Solutions", text);
    } else {
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
    }
    finishSend();
  });

  function sendVia(provider) {
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const text = buildRequestText(getFormData());
    openMailProvider(provider, "Product Request — Neoguild Technical Solutions", text);
    finishSend();
  }
  document.getElementById("req-email-outlook").addEventListener("click", (e) => {
    e.preventDefault();
    sendVia("outlook");
  });
  document.getElementById("req-email-default").addEventListener("click", (e) => {
    e.preventDefault();
    sendVia("default");
  });
}

// ===== Init =====
async function init() {
  document.getElementById("footer-year").textContent = new Date().getFullYear();
  document.getElementById("footer-email").textContent = INQUIRY_EMAIL;
  initTheme();
  loadCart();
  await loadData();
  renderSidebar();
  renderGrid();
  renderCartUI();
  initToolbar();
  initCartControls();
  initRequestModal();
  initStaticReveal();
  animateStats();
}

document.addEventListener("DOMContentLoaded", init);
