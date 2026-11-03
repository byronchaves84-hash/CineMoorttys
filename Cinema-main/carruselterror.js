// CINEMAX — Carrusel de terror (compatibilidad con páginas que lo cargan por separado)
(function () {
  "use strict";
  const carousel = document.getElementById("horrorCarousel");
  const track = carousel?.querySelector(".carousel-track");
  let position = 0;

  window.moveHorror = function (direction) {
    if (!carousel || !track) return;
    const step = Number(direction) || 0;
    if (window.innerWidth <= 600) {
      carousel.scrollBy({ left: step * 190, behavior: "smooth" });
      return;
    }
    const cards = track.querySelectorAll(".horror-card");
    if (!cards.length) return;
    const cardWidth = cards[0].getBoundingClientRect().width + 18;
    const visible = Math.max(1, Math.floor(carousel.clientWidth / cardWidth));
    position = Math.max(0, Math.min(Math.max(0, cards.length - visible), position + step));
    track.style.transform = `translateX(-${position * cardWidth}px)`;
  };

  carousel?.addEventListener("touchstart", (event) => {
    carousel.dataset.touchX = String(event.touches[0].clientX);
    carousel.dataset.touchY = String(event.touches[0].clientY);
  }, { passive: true });
  carousel?.addEventListener("touchend", (event) => {
    const dx = Number(carousel.dataset.touchX || 0) - event.changedTouches[0].clientX;
    const dy = Number(carousel.dataset.touchY || 0) - event.changedTouches[0].clientY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      carousel.scrollBy({ left: dx > 0 ? 190 : -190, behavior: "smooth" });
    }
  }, { passive: true });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 600) { position = 0; if (track) track.style.transform = "translateX(0)"; }
  });
})();
