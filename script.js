"use strict";

const panelTriggers = [...document.querySelectorAll("[data-open-panel]")];
const overlayPanels = [...document.querySelectorAll(".overlay-panel")];
const panelCloseButtons = [...document.querySelectorAll("[data-close-panel]")];
const pageBackdrop = document.querySelector("#page-backdrop");

let activePanel = null;
let lastPanelTrigger = null;

function focusableElements(container) {
  return [...container.querySelectorAll(
    "a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex='-1'])"
  )].filter((element) => !element.hidden && element.offsetParent !== null);
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (activePanel) {
      closePanel();
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

/* Проигрыватель VK Видео загружается только после действия пользователя. */

const heroVideoFrame = document.querySelector("#hero-video-frame");
const videoPoster = document.querySelector("#video-poster");
const videoPlay = document.querySelector("#video-play");

videoPlay?.addEventListener("click", () => {
  if (!heroVideoFrame || !heroVideoFrame.dataset.src) {
    return;
  }

  if (!heroVideoFrame.src) {
    heroVideoFrame.src = heroVideoFrame.dataset.src;
  }

  heroVideoFrame.hidden = false;

  if (videoPoster) {
    videoPoster.hidden = true;
  }

  videoPlay.hidden = true;
});
