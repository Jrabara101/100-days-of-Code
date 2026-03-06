window.tailwind = window.tailwind || {};
window.tailwind.config = {
  theme: {
    extend: {
      colors: {
        "focus-pink": "#ffd1dc",
        "focus-rose": "#ffb3c6",
        "focus-cream": "#fff7fb",
        "focus-mauve": "#84586f",
        "focus-ink": "#2c1d34",
        "focus-lilac": "#eadffc"
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Space Grotesk", "sans-serif"]
      },
      boxShadow: {
        soft: "0 14px 36px rgba(224, 137, 172, 0.22)"
      }
    }
  },
  safelist: [
    "absolute",
    "top-2",
    "right-2",
    "backdrop-blur-md",
    "bg-white/30",
    "border",
    "border-white/60",
    "rounded-full",
    "px-2.5",
    "py-1",
    "text-xs",
    "font-semibold",
    "text-slate-400",
    "text-focus-pink",
    "transition-transform",
    "active:scale-90"
  ]
};

document.addEventListener("DOMContentLoaded", () => {
  const feedShell = document.getElementById("feed-shell");
  const feedGrid = document.getElementById("feed-grid");
  const recycleTop = document.getElementById("recycle-top");
  const recycleBottom = document.getElementById("recycle-bottom");
  const skeletonLayer = document.getElementById("skeleton-layer");
  const filterRibbon = document.getElementById("filter-ribbon");
  const loadIndicator = document.getElementById("load-indicator");
  const sentinel = document.getElementById("scroll-sentinel");
  const totalCountEl = document.getElementById("total-count");
  const visibleCountEl = document.getElementById("visible-count");
  const emptyStateEl = document.getElementById("empty-state");
  const toastEl = document.getElementById("toast");

  const CATEGORY_FILTERS = ["Web Dev", "UI/UX", "3D Modeling"];
  const PER_SOURCE_BATCH = 12;
  const PAGE_LIMIT = 28;
  const VIEWPORT_BUFFER = 1050;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const state = {
    page: 0,
    hasMore: true,
    isLoading: false,
    activeFilter: "All",
    allItems: [],
    filteredItems: [],
    positions: [],
    layout: { columns: 1, colWidth: 0, gap: 16, totalHeight: 0 },
    nodeMap: new Map(),
    heightCache: new Map(),
    savedIds: new Set(),
    pendingSaves: new Set(),
    frameQueued: false,
    relayoutQueued: false,
    toastTimer: null
  };

  bindEvents();
  renderFilterState();
  loadNextPage();

  function bindEvents() {
    filterRibbon.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-filter]");
      if (!button) {
        return;
      }

      const selectedFilter = button.getAttribute("data-filter");
      if (!selectedFilter || selectedFilter === state.activeFilter) {
        return;
      }

      state.activeFilter = selectedFilter;
      renderFilterState();
      applyFilter();
    });

    feedGrid.addEventListener("click", (event) => {
      const saveButton = event.target.closest("[data-save-btn]");
      if (!saveButton) {
        return;
      }

      const itemId = saveButton.getAttribute("data-item-id");
      if (!itemId) {
        return;
      }

      handleOptimisticSave(itemId, saveButton);
    });

    window.addEventListener("scroll", scheduleViewportRender, { passive: true });
    window.addEventListener(
      "resize",
      () => {
        renderSkeletons();
        recomputeAndRender();
      },
      { passive: true }
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            loadNextPage();
            break;
          }
        }
      },
      {
        root: null,
        rootMargin: "1200px 0px 1200px 0px",
        threshold: 0
      }
    );

    observer.observe(sentinel);

    setInterval(() => {
      for (const node of state.nodeMap.values()) {
        const timeNode = node.querySelector("[data-time]");
        if (!timeNode) {
          continue;
        }
        const timestamp = Number(timeNode.getAttribute("data-time"));
        timeNode.textContent = formatRelativeTime(timestamp);
      }
    }, 60000);
  }

  function renderFilterState() {
    const buttons = filterRibbon.querySelectorAll("button[data-filter]");
    for (const button of buttons) {
      button.classList.toggle("is-active", button.getAttribute("data-filter") === state.activeFilter);
    }
  }

  async function loadNextPage() {
    if (state.isLoading || !state.hasMore) {
      return;
    }

    state.isLoading = true;
    loadIndicator.classList.remove("hidden");
    loadIndicator.classList.add("flex");

    if (state.allItems.length === 0) {
      renderSkeletons(true);
    }

    const nextPage = state.page + 1;

    try {
      const [githubRaw, designRaw, socialRaw] = await Promise.all([
        mockGithubEvents(nextPage),
        mockDesignShots(nextPage),
        mockSocialPosts(nextPage)
      ]);

      const normalizedBatch = [
        ...normalizeFeedData(githubRaw, "github_events"),
        ...normalizeFeedData(designRaw, "design_shots"),
        ...normalizeFeedData(socialRaw, "social_posts")
      ].sort((left, right) => right.timestamp - left.timestamp);

      state.page = nextPage;
      if (state.page >= PAGE_LIMIT || normalizedBatch.length === 0) {
        state.hasMore = false;
      }

      state.allItems = state.allItems.concat(normalizedBatch);
      state.allItems.sort((left, right) => right.timestamp - left.timestamp);

      applyFilter();
    } catch (error) {
      showToast("Feed sync failed. Scroll to retry.");
    } finally {
      state.isLoading = false;
      loadIndicator.classList.add("hidden");
      loadIndicator.classList.remove("flex");
      renderSkeletons(false);
    }
  }

  function applyFilter() {
    if (state.activeFilter === "All") {
      state.filteredItems = state.allItems.slice();
    } else {
      state.filteredItems = state.allItems.filter((item) => item.category === state.activeFilter);
    }

    totalCountEl.textContent = state.allItems.length.toLocaleString();
    emptyStateEl.classList.toggle("hidden", state.filteredItems.length > 0);

    recomputeAndRender();
  }

  function recomputeAndRender() {
    computeMasonryLayout();
    renderVirtualWindow();
  }

  function computeMasonryLayout() {
    const items = state.filteredItems;
    if (items.length === 0) {
      state.positions = [];
      state.layout = { columns: 1, colWidth: 0, gap: 16, totalHeight: 0 };
      return;
    }

    const shellWidth = feedShell.clientWidth;
    const columns = getColumnCount(shellWidth);
    const gap = 16;
    const colWidth = (shellWidth - gap * (columns - 1)) / columns;
    const colHeights = Array.from({ length: columns }, () => 0);
    const positions = new Array(items.length);

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const cachedHeight = state.heightCache.get(item.id);
      const height = cachedHeight || estimateCardHeight(item, colWidth);

      let targetColumn = 0;
      for (let column = 1; column < columns; column += 1) {
        if (colHeights[column] < colHeights[targetColumn]) {
          targetColumn = column;
        }
      }

      const top = colHeights[targetColumn];
      const left = targetColumn * (colWidth + gap);

      positions[index] = {
        top,
        left,
        width: colWidth,
        height,
        bottom: top + height
      };

      colHeights[targetColumn] = top + height + gap;
    }

    const tallestColumn = Math.max(...colHeights, 0);
    const totalHeight = Math.max(0, tallestColumn - gap);

    state.layout = {
      columns,
      colWidth,
      gap,
      totalHeight
    };
    state.positions = positions;
  }

  function renderVirtualWindow() {
    if (state.filteredItems.length === 0 || state.positions.length === 0) {
      recycleTop.style.height = "0px";
      recycleBottom.style.height = "0px";
      feedGrid.style.height = "0px";
      feedGrid.replaceChildren();
      state.nodeMap.clear();
      visibleCountEl.textContent = "0";
      return;
    }

    const shellRect = feedShell.getBoundingClientRect();
    const viewportTop = -shellRect.top;
    const viewportBottom = viewportTop + window.innerHeight;

    const visibleIndices = [];
    let minTop = Number.POSITIVE_INFINITY;
    let maxBottom = 0;

    for (let index = 0; index < state.positions.length; index += 1) {
      const position = state.positions[index];
      if (
        position.bottom >= viewportTop - VIEWPORT_BUFFER &&
        position.top <= viewportBottom + VIEWPORT_BUFFER
      ) {
        visibleIndices.push(index);
        if (position.top < minTop) {
          minTop = position.top;
        }
        if (position.bottom > maxBottom) {
          maxBottom = position.bottom;
        }
      }
    }

    if (visibleIndices.length === 0) {
      minTop = Math.max(0, viewportTop - VIEWPORT_BUFFER);
      maxBottom = minTop + 1;
    }

    recycleTop.style.height = `${Math.max(0, Math.floor(minTop))}px`;
    recycleBottom.style.height = `${Math.max(0, Math.ceil(state.layout.totalHeight - maxBottom))}px`;
    feedGrid.style.height = `${Math.max(1, Math.ceil(maxBottom - minTop))}px`;

    const keepIds = new Set();
    const fragment = document.createDocumentFragment();

    for (const index of visibleIndices) {
      const item = state.filteredItems[index];
      const position = state.positions[index];
      keepIds.add(item.id);

      let card = state.nodeMap.get(item.id);
      if (!card) {
        card = buildFeedCard(item);
        state.nodeMap.set(item.id, card);
      }

      card.style.width = `${Math.round(position.width)}px`;
      card.style.transform = `translate3d(${Math.round(position.left)}px, ${Math.round(
        position.top - minTop
      )}px, 0)`;

      const saveButton = card.querySelector("[data-save-btn]");
      if (saveButton) {
        paintSaveButton(saveButton, state.savedIds.has(item.id));
      }

      const timeNode = card.querySelector("[data-time]");
      if (timeNode) {
        timeNode.textContent = formatRelativeTime(item.timestamp);
      }

      fragment.appendChild(card);
    }

    for (const itemId of Array.from(state.nodeMap.keys())) {
      if (!keepIds.has(itemId)) {
        state.nodeMap.delete(itemId);
      }
    }

    feedGrid.replaceChildren(fragment);
    visibleCountEl.textContent = visibleIndices.length.toLocaleString();

    measureVisibleHeights(visibleIndices);
  }

  function measureVisibleHeights(indices) {
    let changed = false;

    for (const index of indices) {
      const item = state.filteredItems[index];
      const node = state.nodeMap.get(item.id);
      if (!node) {
        continue;
      }

      const measuredHeight = Math.round(node.getBoundingClientRect().height);
      if (!measuredHeight) {
        continue;
      }

      const cachedHeight = state.heightCache.get(item.id);
      if (!cachedHeight || Math.abs(cachedHeight - measuredHeight) > 2) {
        state.heightCache.set(item.id, measuredHeight);
        changed = true;
      }
    }

    if (changed) {
      queueRelayout();
    }
  }

  function queueRelayout() {
    if (state.relayoutQueued) {
      return;
    }

    state.relayoutQueued = true;
    requestAnimationFrame(() => {
      state.relayoutQueued = false;
      computeMasonryLayout();
      renderVirtualWindow();
    });
  }

  function scheduleViewportRender() {
    if (state.frameQueued) {
      return;
    }

    state.frameQueued = true;
    requestAnimationFrame(() => {
      state.frameQueued = false;
      renderVirtualWindow();
    });
  }

  function handleOptimisticSave(itemId, button) {
    if (state.pendingSaves.has(itemId)) {
      return;
    }

    const wasSaved = state.savedIds.has(itemId);

    if (wasSaved) {
      state.savedIds.delete(itemId);
    } else {
      state.savedIds.add(itemId);
    }

    paintSaveButton(button, !wasSaved);
    button.classList.add("save-pop");
    setTimeout(() => button.classList.remove("save-pop"), 140);

    state.pendingSaves.add(itemId);

    fakeSaveRequest(itemId, !wasSaved)
      .catch(() => {
        if (wasSaved) {
          state.savedIds.add(itemId);
        } else {
          state.savedIds.delete(itemId);
        }

        paintSaveButton(button, wasSaved);
        showToast("Save sync failed, state restored.");
      })
      .finally(() => {
        state.pendingSaves.delete(itemId);
      });
  }

  function paintSaveButton(button, saved) {
    button.classList.toggle("text-focus-pink", saved);
    button.classList.toggle("text-slate-400", !saved);
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.remove("hidden");

    if (state.toastTimer) {
      clearTimeout(state.toastTimer);
    }

    state.toastTimer = setTimeout(() => {
      toastEl.classList.add("hidden");
    }, 1800);
  }

  function renderSkeletons(show = state.isLoading && state.allItems.length === 0) {
    if (!show) {
      skeletonLayer.classList.add("hidden");
      skeletonLayer.replaceChildren();
      return;
    }

    const shellWidth = feedShell.clientWidth;
    if (!shellWidth) {
      return;
    }

    const columns = getColumnCount(shellWidth);
    const gap = 16;
    const colWidth = (shellWidth - gap * (columns - 1)) / columns;
    const colHeights = Array.from({ length: columns }, () => 0);
    const skeletonBlueprints = buildSkeletonBlueprints(columns);
    const fragment = document.createDocumentFragment();

    for (const blueprint of skeletonBlueprints) {
      let targetColumn = 0;
      for (let column = 1; column < columns; column += 1) {
        if (colHeights[column] < colHeights[targetColumn]) {
          targetColumn = column;
        }
      }

      const cardHeight = estimateCardHeight(blueprint, colWidth);
      const top = colHeights[targetColumn];
      const left = targetColumn * (colWidth + gap);

      const card = document.createElement("div");
      card.className = "skeleton-card animate-pulse";
      card.style.width = `${Math.round(colWidth)}px`;
      card.style.height = `${Math.round(cardHeight)}px`;
      card.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
      card.innerHTML =
        '<div class="skeleton-line skeleton-line-sm"></div>' +
        '<div class="skeleton-line skeleton-line-md"></div>' +
        '<div class="skeleton-line skeleton-line-lg"></div>' +
        '<div class="skeleton-media"></div>';

      fragment.appendChild(card);
      colHeights[targetColumn] = top + cardHeight + gap;
    }

    const skeletonHeight = Math.max(...colHeights, 0) - gap;
    skeletonLayer.style.height = `${Math.max(0, skeletonHeight)}px`;
    skeletonLayer.replaceChildren(fragment);
    skeletonLayer.classList.remove("hidden");
  }

  function buildFeedCard(item) {
    const article = document.createElement("article");
    article.className = "feed-card";
    article.dataset.itemId = item.id;

    article.innerHTML = `
      <span class="source-badge source-${item.source} absolute top-2 right-2 backdrop-blur-md bg-white/30 border border-white/60 px-2.5 py-1">
        <span class="material-symbols-outlined badge-icon">${item.sourceIcon}</span>
        ${escapeHtml(item.sourceLabel)}
      </span>
      <header class="feed-card-header">
        <p class="feed-category">${escapeHtml(item.category)}</p>
        <h3 class="feed-title">${escapeHtml(item.title)}</h3>
        <p class="feed-meta">@${escapeHtml(item.author)} - <span data-time="${item.timestamp}">${formatRelativeTime(
      item.timestamp
    )}</span></p>
      </header>
      ${
        item.mediaUrl
          ? `<div class="feed-media-wrap"><img class="feed-media" loading="lazy" src="${escapeHtml(
              item.mediaUrl
            )}" alt="${escapeHtml(item.title)}" /></div>`
          : ""
      }
      <p class="feed-content">${escapeHtml(item.content)}</p>
      <footer class="feed-footer">
        <div class="feed-stats">
          <span>${item.metrics.heartCount.toLocaleString()} saves</span>
          <span>${item.metrics.discussionCount.toLocaleString()} threads</span>
        </div>
        <button type="button" aria-label="Save item" data-save-btn data-item-id="${item.id}" class="save-btn material-symbols-outlined text-slate-400 transition-transform active:scale-90">favorite</button>
      </footer>
    `;

    const image = article.querySelector("img");
    if (image) {
      image.addEventListener("load", queueRelayout, { once: true });
      image.addEventListener(
        "error",
        () => {
          const wrapper = article.querySelector(".feed-media-wrap");
          if (wrapper) {
            wrapper.remove();
          }
          queueRelayout();
        },
        { once: true }
      );
    }

    return article;
  }

  function buildSkeletonBlueprints(columns) {
    const base = [
      { title: "Refactor auth middleware", content: "a".repeat(140), mediaUrl: null, type: "code" },
      { title: "Dashboard concept", content: "a".repeat(180), mediaUrl: "media", type: "design" },
      { title: "Shipping update", content: "a".repeat(200), mediaUrl: null, type: "social" },
      { title: "Accessibility patch", content: "a".repeat(120), mediaUrl: "media", type: "design" },
      { title: "Runtime benchmark", content: "a".repeat(160), mediaUrl: null, type: "code" }
    ];

    const result = [];
    const target = columns * 4;
    for (let i = 0; i < target; i += 1) {
      result.push(base[i % base.length]);
    }
    return result;
  }

  function estimateCardHeight(item, columnWidth) {
    const titleLines = Math.max(1, Math.ceil(item.title.length / 26));
    const contentLines = Math.max(2, Math.ceil(item.content.length / 42));
    const mediaHeight = item.mediaUrl ? Math.round(columnWidth * 0.72) : 0;

    return (
      108 +
      Math.min(3, titleLines) * 21 +
      Math.min(8, contentLines) * 16 +
      mediaHeight +
      (item.type === "social" ? 14 : 0)
    );
  }

  function getColumnCount(width) {
    if (width >= 1280) {
      return 4;
    }
    if (width >= 920) {
      return 3;
    }
    if (width >= 620) {
      return 2;
    }
    return 1;
  }

  function formatRelativeTime(timestamp) {
    const deltaSeconds = Math.round((timestamp - Date.now()) / 1000);
    const units = [
      { unit: "year", seconds: 31536000 },
      { unit: "month", seconds: 2592000 },
      { unit: "week", seconds: 604800 },
      { unit: "day", seconds: 86400 },
      { unit: "hour", seconds: 3600 },
      { unit: "minute", seconds: 60 },
      { unit: "second", seconds: 1 }
    ];

    for (const item of units) {
      if (Math.abs(deltaSeconds) >= item.seconds || item.unit === "second") {
        const value = Math.round(deltaSeconds / item.seconds);
        if (item.unit === "second" && Math.abs(value) < 8) {
          return "Just now";
        }
        return rtf.format(value, item.unit);
      }
    }

    return "Just now";
  }

  function normalizeFeedData(rawItems, sourceName) {
    return rawItems
      .map((item) => {
        if (sourceName === "github_events") {
          return {
            id: `gh-${item.event_id}`,
            type: "code",
            source: "code",
            sourceLabel: "GitHub",
            sourceIcon: "terminal",
            author: item.actor.login,
            title: `Pushed to ${item.repo.name}`,
            content: item.summary,
            timestamp: new Date(item.created_at).getTime(),
            mediaUrl: null,
            category: item.focus_area,
            metrics: {
              heartCount: item.reactions,
              discussionCount: item.comments
            }
          };
        }

        if (sourceName === "design_shots") {
          return {
            id: `ds-${item.shot_id}`,
            type: "design",
            source: "design",
            sourceLabel: "Figma",
            sourceIcon: "palette",
            author: item.creator,
            title: item.title,
            content: item.description,
            timestamp: new Date(item.published_date).getTime(),
            mediaUrl: item.image_highres,
            category: item.discipline,
            metrics: {
              heartCount: item.saves,
              discussionCount: item.comments
            }
          };
        }

        if (sourceName === "social_posts") {
          return {
            id: `sp-${item.post_uuid}`,
            type: "social",
            source: "social",
            sourceLabel: "Social",
            sourceIcon: "forum",
            author: item.handle,
            title: item.thread_title,
            content: item.text,
            timestamp: new Date(item.posted_on).getTime(),
            mediaUrl: item.attachment_url,
            category: item.topic,
            metrics: {
              heartCount: item.hearts,
              discussionCount: item.replies
            }
          };
        }

        return null;
      })
      .filter(Boolean);
  }

  function mockGithubEvents(page) {
    const actorPool = ["maya.dev", "teo.engineer", "sam.codes", "dina.stack", "leo.runtime"];
    const repoPool = [
      "omnistream/ui-shell",
      "omnistream/recycle-engine",
      "omnistream/design-sync",
      "sidehustle/lab-grid",
      "focusmode/browser-core"
    ];
    const summaryPool = [
      "Optimized hydration timings and trimmed bundle size.",
      "Refactored adapter layer for cleaner parsing flow.",
      "Patched observer thresholds to avoid duplicate loads.",
      "Improved keyboard navigation for feed controls.",
      "Hardened error boundaries for unstable API payloads."
    ];

    return simulateNetwork(() => {
      const items = [];
      for (let index = 0; index < PER_SOURCE_BATCH; index += 1) {
        const ageMinutes = (page - 1) * 110 + index * 7 + randomInt(1, 9);
        items.push({
          event_id: `${page}-${index}-${randomToken()}`,
          actor: { login: pick(actorPool) },
          repo: { name: pick(repoPool) },
          summary: pick(summaryPool),
          created_at: new Date(Date.now() - ageMinutes * 60000).toISOString(),
          focus_area: Math.random() < 0.82 ? "Web Dev" : pick(CATEGORY_FILTERS),
          reactions: randomInt(28, 420),
          comments: randomInt(2, 64)
        });
      }
      return items;
    });
  }

  function mockDesignShots(page) {
    const creators = ["Aria Bloom", "Nico Vale", "Kara Finch", "Eli Rowan", "Sora Kent"];
    const titles = [
      "Creator Dashboard Moodboard",
      "Motion Card System",
      "Design Token Atlas",
      "3D Product Teardown",
      "Soft UI Research Pass"
    ];
    const descriptions = [
      "Iterating on soft-contrast interfaces for long evening sessions with calmer visual weight.",
      "Exploring glass overlays and depth hierarchy across high-traffic widget cards.",
      "Built reusable pink-scale design tokens and tested contrast in low-light rooms.",
      "Mapped design systems into modular 3D primitives for handoff clarity.",
      "Evaluated onboarding surfaces with tighter rhythm and lower cognitive load."
    ];

    return simulateNetwork(() => {
      const items = [];
      for (let index = 0; index < PER_SOURCE_BATCH; index += 1) {
        const ageMinutes = (page - 1) * 120 + index * 9 + randomInt(4, 15);
        const discipline = Math.random() < 0.8 ? "UI/UX" : "3D Modeling";
        items.push({
          shot_id: `${page}-${index}-${randomToken()}`,
          creator: pick(creators),
          title: pick(titles),
          description: pick(descriptions),
          published_date: new Date(Date.now() - ageMinutes * 60000).toISOString(),
          image_highres: `https://picsum.photos/seed/design-${page}-${index}/900/675`,
          discipline,
          saves: randomInt(80, 980),
          comments: randomInt(6, 130)
        });
      }
      return items;
    });
  }

  function mockSocialPosts(page) {
    const handles = ["pixelforge", "buildnight", "meshpilot", "ramenstack", "devafterdark"];
    const threadTitles = [
      "Night shift shipping notes",
      "Performance checklist",
      "Figma to code handoff",
      "How I scope side projects",
      "Masonry rendering pitfalls"
    ];
    const texts = [
      "Shipped a lean parser tonight. Adapter handles three feeds now and the UI layer stayed untouched.",
      "Swapped eager card rendering for virtual recycling and memory dropped hard on mobile.",
      "Tested pastel focus palette during late sessions. Less eye fatigue than my old dark theme.",
      "If your list jumps on image load, cache measured heights and trigger controlled relayout.",
      "Using relative timestamps keeps the scan loop fast. ISO strings break reading rhythm."
    ];

    return simulateNetwork(() => {
      const items = [];
      for (let index = 0; index < PER_SOURCE_BATCH; index += 1) {
        const ageMinutes = (page - 1) * 95 + index * 6 + randomInt(1, 18);
        const includeMedia = Math.random() < 0.22;

        items.push({
          post_uuid: `${page}-${index}-${randomToken()}`,
          handle: pick(handles),
          thread_title: pick(threadTitles),
          text: pick(texts),
          posted_on: new Date(Date.now() - ageMinutes * 60000).toISOString(),
          topic: pick(CATEGORY_FILTERS),
          attachment_url: includeMedia
            ? `https://picsum.photos/seed/social-${page}-${index}/900/675`
            : null,
          hearts: randomInt(14, 430),
          replies: randomInt(0, 75)
        });
      }
      return items;
    });
  }

  function fakeSaveRequest() {
    return new Promise((resolve, reject) => {
      const latency = randomInt(180, 650);
      setTimeout(() => {
        if (Math.random() < 0.9) {
          resolve();
        } else {
          reject(new Error("save rejected"));
        }
      }, latency);
    });
  }

  function simulateNetwork(factory) {
    return new Promise((resolve) => {
      const latency = randomInt(250, 720);
      setTimeout(() => resolve(factory()), latency);
    });
  }

  function pick(values) {
    return values[randomInt(0, values.length - 1)];
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomToken() {
    return Math.random().toString(36).slice(2, 8);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
});
