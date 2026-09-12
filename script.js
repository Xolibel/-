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

/* Главная галерея независима от карусели во вкладке «Автодом». */
(() => {
  const gallery = document.querySelector("#hero-gallery");

  if (!gallery) {
    return;
  }

  const slides = [...gallery.querySelectorAll("[data-media-slide]")];
  const thumbnails = [...gallery.querySelectorAll("[data-media-index]")];
  const viewport = gallery.querySelector(".media-gallery__viewport");
  const thumbnailStrip = gallery.querySelector(".media-gallery__thumbnails");
  const kind = gallery.querySelector("[data-media-kind]");
  const caption = gallery.querySelector("[data-media-caption]");
  const counter = gallery.querySelector("[data-media-counter]");
  const videoNote = gallery.querySelector("[data-media-video-note]");
  const videoFrame = gallery.querySelector("iframe[data-src]");
  const photoCount = slides.filter((slide) => slide.dataset.mediaType === "photo").length;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let selectedIndex = 0;
  let swipeStart = null;

  function selectMedia(index, { revealThumbnail = true } = {}) {
    const nextIndex = (index + slides.length) % slides.length;
    const nextSlide = slides[nextIndex];
    const isVideo = nextSlide.dataset.mediaType === "video";

    // Выгружаем VK при уходе со слайда, чтобы скрытое видео не продолжало звучать.
    if (!isVideo && videoFrame?.hasAttribute("src")) {
      videoFrame.removeAttribute("src");
    }

    selectedIndex = nextIndex;
    slides.forEach((slide, slideIndex) => {
      slide.hidden = slideIndex !== selectedIndex;
    });

    thumbnails.forEach((thumbnail, thumbnailIndex) => {
      if (thumbnailIndex === selectedIndex) {
        thumbnail.setAttribute("aria-current", "true");
      } else {
        thumbnail.removeAttribute("aria-current");
      }
    });

    if (isVideo && videoFrame && !videoFrame.hasAttribute("src")) {
      videoFrame.src = videoFrame.dataset.src;
    }

    kind.textContent = isVideo ? "Видеообзор" : `Фото ${selectedIndex + 1} из ${photoCount}`;
    caption.textContent = nextSlide.dataset.caption;
    counter.textContent = `${String(selectedIndex + 1).padStart(2, "0")} / ${slides.length}`;
    videoNote.hidden = !isVideo;

    // Двигаем только ленту миниатюр, не прокручивая всю страницу.
    if (revealThumbnail) {
      const thumbnail = thumbnails[selectedIndex];
      const left = thumbnail.offsetLeft;
      const right = left + thumbnail.offsetWidth;
      let scrollLeft = thumbnailStrip.scrollLeft;

      if (left < scrollLeft) {
        scrollLeft = left - 4;
      } else if (right > scrollLeft + thumbnailStrip.clientWidth) {
        scrollLeft = right - thumbnailStrip.clientWidth + 4;
      }

      thumbnailStrip.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: reducedMotion.matches ? "auto" : "smooth"
      });
    }
  }

  gallery.querySelector("[data-media-previous]").addEventListener("click", () => {
    selectMedia(selectedIndex - 1);
  });

  gallery.querySelector("[data-media-next]").addEventListener("click", () => {
    selectMedia(selectedIndex + 1);
  });

  thumbnails.forEach((thumbnail) => {
    thumbnail.addEventListener("click", () => {
      selectMedia(Number(thumbnail.dataset.mediaIndex));
    });
  });

  gallery.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey ||
        event.target.closest("a, input, textarea, select, iframe")) {
      return;
    }

    let nextIndex;

    switch (event.key) {
      case "ArrowLeft": nextIndex = selectedIndex - 1; break;
      case "ArrowRight": nextIndex = selectedIndex + 1; break;
      case "Home": nextIndex = 0; break;
      case "End": nextIndex = slides.length - 1; break;
      default: return;
    }

    event.preventDefault();
    selectMedia(nextIndex);

    if (event.target.closest("[data-media-index]")) {
      thumbnails[selectedIndex].focus({ preventScroll: true });
    }
  });

  viewport.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.pointerType === "mouse" ||
        slides[selectedIndex].dataset.mediaType !== "photo") {
      return;
    }

    swipeStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener("pointerup", (event) => {
    if (!swipeStart || event.pointerId !== swipeStart.id) {
      return;
    }

    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = null;

    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      selectMedia(selectedIndex + (dx < 0 ? 1 : -1));
    }
  });

  viewport.addEventListener("pointercancel", () => { swipeStart = null; });
  viewport.addEventListener("lostpointercapture", () => { swipeStart = null; });

  selectMedia(0, { revealThumbnail: false });
})();
