/* ==========================================================================
   NEOPURE — Compteurs de stats + carte Leaflet
   100% vanilla, léger. Respecte prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var raf = window.requestAnimationFrame;

  /* =======================================================================
     1. COMPTEURS ANIMÉS (+35K, +800%)
     ======================================================================= */
  var counters = document.querySelectorAll("[data-count]");
  function setFinal(el) {
    el.textContent = (el.getAttribute("data-prefix") || "") +
                     el.getAttribute("data-count") +
                     (el.getAttribute("data-suffix") || "");
  }
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1700, start = null;
    function step(ts) {
      if (!start) start = ts;
      var prog = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - prog, 3); // ease-out cubic
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (prog < 1) raf(step);
    }
    raf(step);
  }
  if (counters.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      counters.forEach(setFinal);
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* =======================================================================
     1b. VIDÉOS : lecture uniquement à l'écran
     Six vidéos en boucle simultanées (hero + galerie) saturaient le décodage
     et faisaient ramer la navigation. On ne joue que ce qui est visible,
     avec une marge pour que la lecture soit déjà lancée en arrivant dessus.
     ======================================================================= */
  var autoVids = document.querySelectorAll("video[autoplay]");
  if (autoVids.length && "IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        v.dataset.vis = e.isIntersecting ? "1" : "";
        if (e.isIntersecting) {
          if (v.paused) {
            var p = v.play();
            if (p && p.catch) p.catch(function () {});
          }
        } else {
          // Annule aussi l'autoplay DIFFÉRÉ : une vidéo encore en cours de
          // téléchargement démarre toute seule dès qu'elle est prête, même
          // hors écran — c'est ce qui faisait tourner les 5 vidéos en même
          // temps et ramer la navigation.
          v.autoplay = false;
          if (!v.paused) v.pause();
        }
      });
    }, { rootMargin: "30% 30% 30% 30%", threshold: 0 });
    autoVids.forEach(function (v) {
      vio.observe(v);
      v.addEventListener("playing", function () {
        if (v.dataset.vis === "") v.pause();
      });
    });
  }

  /* =======================================================================
     2. CARTE LEAFLET (attribution masquée comme demandé)
     ======================================================================= */
  function initMap() {
    var el = document.getElementById("map");
    if (!el || typeof L === "undefined") return;
    var coords = [43.6112, 3.8716]; // Montpellier — Promenade du Peyrou
    // Carte purement décorative → toutes les interactions désactivées
    var map = L.map(el, {
      center: coords,
      zoom: 13,
      attributionControl: false,   // <-- enlève les écritures en bas à droite
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false
    });
    // Tuiles équilibrées (CartoDB Voyager, SANS labels) — on les teinte ensuite en CSS
    // pour les fondre dans l'univers violet du site.
    // On n'ajoute PAS le calque de labels : son « Montpellier » gravé dans les
    // tuiles tombait pile au centre et entrait en collision avec le pin et les
    // ondes radar (d'où les décalages en pixels qu'on traînait). Le lieu est
    // désormais nommé par notre propre étiquette .radar-label, propre et nette.
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png", {
      maxZoom: 19
    }).addTo(map);
    // Le centre exact (Montpellier) est marqué par .radar-core en CSS, pile au milieu du cadre.
  }
  if (document.readyState === "complete") initMap();
  else window.addEventListener("load", initMap);
})();
