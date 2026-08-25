"use strict";

const panelTriggers = [...document.querySelectorAll("[data-open-panel]")];
const overlayPanels = [...document.querySelectorAll(".overlay-panel")];
const panelCloseButtons = [...document.querySelectorAll("[data-close-panel]")];
const pageBackdrop = document.querySelector("#page-backdrop");

const mobileMenuButton = document.querySelector("#mobile-menu-button");
const headerPanel = document.querySelector("#header-panel");

let activePanel = null;
let lastPanelTrigger = null;

function focusableElements(container) {
  return [...container.querySelectorAll(
    "a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex='-1'])"
  )].filter((element) => !element.hidden && element.offsetParent !== null);
}

function closeMobileMenu() {
  if (!mobileMenuButton || !headerPanel) {
    return;
  }

  mobileMenuButton.setAttribute("aria-expanded", "false");
  headerPanel.classList.remove("is-open");
}

function closePanel({ returnFocus = true } = {}) {
  if (!activePanel) {
    return;
  }

  activePanel.hidden = true;
  activePanel = null;

  if (pageBackdrop) {
    pageBackdrop.hidden = true;
  }

  document.body.classList.remove("has-overlay");

  panelTriggers.forEach((trigger) => {
    trigger.setAttribute("aria-expanded", "false");
  });

  if (returnFocus && lastPanelTrigger) {
    lastPanelTrigger.focus();
  }
}

function openPanel(panelId, trigger) {
  const panel = document.getElementById(panelId);

  if (!panel) {
    return;
  }

  closePanel({ returnFocus: false });
  closeMobileMenu();

  activePanel = panel;
  lastPanelTrigger = trigger;

  trigger.setAttribute("aria-expanded", "true");
  panel.hidden = false;

  if (pageBackdrop) {
    pageBackdrop.hidden = false;
  }

  document.body.classList.add("has-overlay");

  window.requestAnimationFrame(() => {
    panel.focus();
  });
}

panelTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const panelId = trigger.dataset.openPanel;
    const selectedPanel = document.getElementById(panelId);

    if (activePanel === selectedPanel) {
      closePanel();
      return;
    }

    openPanel(panelId, trigger);
  });
});

panelCloseButtons.forEach((button) => {
  button.addEventListener("click", () => closePanel());
});

pageBackdrop?.addEventListener("click", () => closePanel());

mobileMenuButton?.addEventListener("click", () => {
  const menuIsOpen = mobileMenuButton.getAttribute("aria-expanded") === "true";

  mobileMenuButton.setAttribute("aria-expanded", String(!menuIsOpen));
  headerPanel?.classList.toggle("is-open", !menuIsOpen);
});

document.addEventListener("click", (event) => {
  if (window.innerWidth > 1240 || !headerPanel?.classList.contains("is-open")) {
    return;
  }

  const clickedInsideHeader = event.target.closest(".header__inner");

  if (!clickedInsideHeader) {
    closeMobileMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (activePanel) {
      closePanel();
    } else {
      closeMobileMenu();
    }

    return;
  }

  if (event.key !== "Tab" || !activePanel) {
    return;
  }

  const focusable = focusableElements(activePanel);

  if (!focusable.length) {
    event.preventDefault();
    activePanel.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 1240) {
    closeMobileMenu();
  }
});

/* Карусель фотографий */

const carouselSlides = [...document.querySelectorAll("[data-carousel-slide]")];
const carouselPrevious = document.querySelector("#carousel-previous");
const carouselNext = document.querySelector("#carousel-next");
const carouselCounter = document.querySelector("#carousel-counter");

let currentSlide = 0;

function showSlide(index) {
  if (!carouselSlides.length) {
    return;
  }

  currentSlide = (index + carouselSlides.length) % carouselSlides.length;

  carouselSlides.forEach((slide, slideIndex) => {
    slide.hidden = slideIndex !== currentSlide;
  });

  if (carouselCounter) {
    carouselCounter.textContent = `${currentSlide + 1} / ${carouselSlides.length}`;
  }
}

carouselPrevious?.addEventListener("click", () => {
  showSlide(currentSlide - 1);
});

carouselNext?.addEventListener("click", () => {
  showSlide(currentSlide + 1);
});

carouselSlides.forEach((slide) => {
  const image = slide.querySelector("img");

  image?.addEventListener("error", () => {
    image.hidden = true;
    slide.classList.add("is-missing");
  });
});

showSlide(0);

/* Вкладки характеристик и цен */

const camperTabs = [...document.querySelectorAll("[data-tab]")];
const camperTabPanels = [...document.querySelectorAll(".camper-tab-panel")];

function activateTab(panelId, { focus = false } = {}) {
  camperTabs.forEach((tab) => {
    const isActive = tab.dataset.tab === panelId;

    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;

    if (isActive && focus) {
      tab.focus();
    }
  });

  camperTabPanels.forEach((panel) => {
    panel.hidden = panel.id !== panelId;
  });
}

camperTabs.forEach((tab, tabIndex) => {
  tab.addEventListener("click", () => {
    activateTab(tab.dataset.tab);
  });

  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();

    let nextIndex = tabIndex;

    if (event.key === "ArrowLeft") {
      nextIndex = (tabIndex - 1 + camperTabs.length) % camperTabs.length;
    }

    if (event.key === "ArrowRight") {
      nextIndex = (tabIndex + 1) % camperTabs.length;
    }

    if (event.key === "Home") {
      nextIndex = 0;
    }

    if (event.key === "End") {
      nextIndex = camperTabs.length - 1;
    }

    activateTab(camperTabs[nextIndex].dataset.tab, { focus: true });
  });
});

activateTab("specifications-content");

/* Видео загружается только после действия пользователя. */

const heroVideo = document.querySelector("#hero-video");
const videoPlay = document.querySelector("#video-play");
const videoMessage = document.querySelector("#video-message");

heroVideo?.addEventListener("playing", () => {
  if (videoPlay) {
    videoPlay.hidden = true;
  }

  if (videoMessage) {
    videoMessage.hidden = true;
  }
});

heroVideo?.addEventListener("pause", () => {
  if (videoPlay && heroVideo.currentTime === 0) {
    videoPlay.hidden = false;
  }
});

heroVideo?.addEventListener("error", () => {
  if (videoPlay) {
    videoPlay.hidden = true;
  }

  if (videoMessage) {
    videoMessage.hidden = false;
  }
});

videoPlay?.addEventListener("click", async () => {
  if (!heroVideo) {
    return;
  }

  heroVideo.muted = true;

  try {
    await heroVideo.play();
  } catch (error) {
    if (videoMessage) {
      videoMessage.hidden = false;
    }
  }
});
