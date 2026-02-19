const bentoGrid = document.querySelector("[data-bento-grid]");

if (bentoGrid) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cards = Array.from(bentoGrid.querySelectorAll(".bento-card"));

  let clearStateTimer;

  const activateCard = (card) => {
    bentoGrid.classList.add("is-dimmed");

    cards.forEach((item) => {
      item.classList.toggle("is-active", item === card);
    });
  };

  const clearActiveState = () => {
    bentoGrid.classList.remove("is-dimmed");

    cards.forEach((item) => {
      item.classList.remove("is-active");
    });
  };

  const queueClear = () => {
    window.clearTimeout(clearStateTimer);

    clearStateTimer = window.setTimeout(() => {
      const focusedInside = bentoGrid.contains(document.activeElement);
      const hoveredInside = bentoGrid.matches(":hover");

      if (!focusedInside && !hoveredInside) {
        clearActiveState();
      }
    }, 24);
  };

  cards.forEach((card) => {
    card.addEventListener("pointerenter", () => activateCard(card));
    card.addEventListener("pointerleave", queueClear);
    card.addEventListener("focusin", () => activateCard(card));
    card.addEventListener("focusout", queueClear);
  });

  bentoGrid.addEventListener("mouseleave", queueClear);

  const metricCounter = bentoGrid.querySelector("[data-counter]");
  const metricCard = bentoGrid.querySelector(".card-metric");

  const formatCounter = (value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }

    return String(Math.round(value));
  };

  const runCounter = () => {
    if (!metricCounter) {
      return;
    }

    const target = Number(metricCounter.dataset.target || 0);

    if (prefersReducedMotion.matches) {
      metricCounter.textContent = formatCounter(target);
      return;
    }

    const start = performance.now();
    const duration = 1400;

    const tick = (now) => {
      const elapsed = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      const value = target * eased;

      metricCounter.textContent = formatCounter(value);

      if (elapsed < 1) {
        window.requestAnimationFrame(tick);
      }
    };

    window.requestAnimationFrame(tick);
  };

  if (metricCard && metricCounter) {
    if ("IntersectionObserver" in window) {
      const counterObserver = new IntersectionObserver(
        (entries, observer) => {
          const entry = entries[0];

          if (entry?.isIntersecting) {
            runCounter();
            observer.disconnect();
          }
        },
        { threshold: 0.55 }
      );

      counterObserver.observe(metricCard);
    } else {
      runCounter();
    }
  }

  const toggleCard = bentoGrid.querySelector(".card-toggle");
  const themeToggle = bentoGrid.querySelector("[data-theme-toggle]");
  const themeLabel = bentoGrid.querySelector("[data-theme-label]");

  const applyCardTheme = (theme) => {
    if (!toggleCard || !themeToggle || !themeLabel) {
      return;
    }

    const isLight = theme === "light";

    toggleCard.dataset.cardTheme = theme;
    themeToggle.setAttribute("aria-checked", String(isLight));
    themeLabel.textContent = isLight ? "Light" : "Dark";
  };

  if (toggleCard && themeToggle && themeLabel) {
    applyCardTheme(toggleCard.dataset.cardTheme || "dark");

    themeToggle.addEventListener("click", () => {
      const nextTheme = toggleCard.dataset.cardTheme === "light" ? "dark" : "light";
      applyCardTheme(nextTheme);
    });
  }

  const videoCard = bentoGrid.querySelector(".card-video");
  const expandButton = bentoGrid.querySelector("[data-video-expand]");
  const closeButton = bentoGrid.querySelector("[data-video-close]");

  const runFlip = (element, mutate) => {
    const first = element.getBoundingClientRect();
    mutate();

    if (prefersReducedMotion.matches || typeof element.animate !== "function") {
      return Promise.resolve();
    }

    const last = element.getBoundingClientRect();
    const deltaX = first.left - last.left;
    const deltaY = first.top - last.top;
    const scaleX = first.width / last.width;
    const scaleY = first.height / last.height;

    const animation = element.animate(
      [
        {
          transformOrigin: "top left",
          transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`
        },
        {
          transformOrigin: "top left",
          transform: "translate(0px, 0px) scale(1, 1)"
        }
      ],
      {
        duration: 520,
        easing: "cubic-bezier(0.22, 0.9, 0.26, 1)",
        fill: "both"
      }
    );

    return animation.finished.catch(() => undefined);
  };

  let isVideoAnimating = false;

  const setVideoExpanded = async (expand) => {
    if (!videoCard || !expandButton || !closeButton || isVideoAnimating) {
      return;
    }

    const isExpanded = videoCard.classList.contains("is-expanded");

    if (isExpanded === expand) {
      return;
    }

    isVideoAnimating = true;

    await runFlip(videoCard, () => {
      videoCard.classList.toggle("is-expanded", expand);
      document.body.classList.toggle("video-open", expand);
      expandButton.setAttribute("aria-expanded", String(expand));
    });

    isVideoAnimating = false;

    if (expand) {
      closeButton.focus({ preventScroll: true });
    } else {
      expandButton.focus({ preventScroll: true });
    }
  };

  if (videoCard && expandButton && closeButton) {
    expandButton.addEventListener("click", () => {
      setVideoExpanded(true);
    });

    closeButton.addEventListener("click", () => {
      setVideoExpanded(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && videoCard.classList.contains("is-expanded")) {
        setVideoExpanded(false);
      }
    });
  }

  if (prefersReducedMotion.matches) {
    bentoGrid.classList.add("is-assembled");
  } else if ("IntersectionObserver" in window) {
    const assemblyObserver = new IntersectionObserver(
      (entries, observer) => {
        const entry = entries[0];

        if (entry?.isIntersecting) {
          bentoGrid.classList.add("is-assembled");
          observer.disconnect();
        }
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.22
      }
    );

    assemblyObserver.observe(bentoGrid);
  } else {
    bentoGrid.classList.add("is-assembled");
  }
}
