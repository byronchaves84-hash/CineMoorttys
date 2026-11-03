// CINEMAX — Carruseles de series y terror (PC + móvil)
(function () {
  "use strict";

  function setupCarousel(id, cardSelector, positionName) {
    const carousel = document.getElementById(id);
    if (!carousel) return;
    const track = carousel.querySelector(".carousel-track");
    if (!track) return;
    let position = 0;

    function move(direction) {
      if (window.innerWidth <= 600) {
        carousel.scrollBy({ left: direction * 190, behavior: "smooth" });
        return;
      }
      const cards = track.querySelectorAll(cardSelector);
      if (!cards.length) return;
      const cardWidth = cards[0].getBoundingClientRect().width + 18;
      const visible = Math.max(1, Math.floor(carousel.clientWidth / cardWidth));
      const max = Math.max(0, cards.length - visible);
      position = Math.max(0, Math.min(max, position + direction));
      track.style.transform = `translateX(-${position * cardWidth}px)`;
    }

    carousel.addEventListener("touchstart", (event) => {
      carousel.dataset.touchX = String(event.touches[0].clientX);
      carousel.dataset.touchY = String(event.touches[0].clientY);
    }, { passive: true });

    carousel.addEventListener("touchend", (event) => {
      const startX = Number(carousel.dataset.touchX || 0);
      const startY = Number(carousel.dataset.touchY || 0);
      const dx = startX - event.changedTouches[0].clientX;
      const dy = startY - event.changedTouches[0].clientY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        carousel.scrollBy({ left: dx > 0 ? 190 : -190, behavior: "smooth" });
      }
    }, { passive: true });

    return { move, reset() { position = 0; track.style.transform = "translateX(0)"; } };
  }

  const series = setupCarousel("seriesCarousel", ".series-card", "seriesPosition");
  const horror = setupCarousel("horrorCarousel", ".horror-card", "horrorPosition");
  window.moveSeries = (direction) => series?.move(Number(direction) || 0);
  window.moveHorror = (direction) => horror?.move(Number(direction) || 0);
  window.addEventListener("resize", () => {
    if (window.innerWidth > 600) { series?.reset(); horror?.reset(); }
  });
})();
