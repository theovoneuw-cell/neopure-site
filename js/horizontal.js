/* ==========================================================================
   NEOPURE — Scroll horizontal (desktop) facon "frise"
   Le scroll vertical fait défiler le site vers la droite, avec un lissage
   (lerp) pour un mouvement "beurré". Désactivé < 1025px → le site reste
   VERTICAL sur mobile/tablette. Respecte prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mq = window.matchMedia("(min-width: 1025px)");
  var viewport = document.getElementById("hViewport");
  var track = document.getElementById("hTrack");
  if (!viewport || !track) return;

  var enabled = false;
  var target = 0, current = 0, maxScroll = 0;
  var rafId = null;
  var panels = [];

  function refreshPanels() { panels = track.querySelectorAll(".panel"); }

  function setHeights() {
    var w = track.scrollWidth;
    maxScroll = Math.max(0, w - window.innerWidth);
    // La hauteur du body crée la "distance" de scroll vertical = distance horizontale
    document.body.style.height = (maxScroll + window.innerHeight) + "px";
  }
  function clamp(v) { return Math.max(0, Math.min(v, maxScroll)); }

  function onScroll() { target = clamp(window.scrollY); }

  /* Effet 3D "coverflow" : chaque panneau pivote selon sa distance au centre */
  function apply3D() {
    var cx = window.innerWidth / 2;
    for (var i = 0; i < panels.length; i++) {
      var p = panels[i];
      var r = p.getBoundingClientRect();
      var dist = (r.left + r.width / 2 - cx) / window.innerWidth;
      var k = Math.max(-1, Math.min(1, dist));
      var rot = (-k * 12).toFixed(2);
      var tz = (-Math.abs(k) * 110).toFixed(0);
      p.style.transform = "rotateY(" + rot + "deg) translateZ(" + tz + "px)";
    }
  }

  function loop() {
    current += (target - current) * 0.09;
    if (Math.abs(target - current) < 0.06) current = target;
    track.style.transform = "translate3d(" + (-current).toFixed(2) + "px,0,0)";
    apply3D();
    rafId = window.requestAnimationFrame(loop);
  }

  function setInstant() {
    track.style.transform = "translate3d(" + (-clamp(window.scrollY)) + "px,0,0)";
  }

  function enable() {
    if (enabled) return;
    enabled = true;
    document.documentElement.classList.add("h-active");
    refreshPanels();
    setHeights();
    target = current = clamp(window.scrollY);
    if (reduced) {
      setInstant();
      window.addEventListener("scroll", setInstant, { passive: true });
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
      rafId = window.requestAnimationFrame(loop);
    }
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    document.documentElement.classList.remove("h-active");
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("scroll", setInstant);
    if (rafId) window.cancelAnimationFrame(rafId);
    track.style.transform = "";
    document.body.style.height = "";
    panels.forEach(function (p) {
      p.style.transform = "";
      p.style.pointerEvents = "";
    });
  }

  function apply() { if (mq.matches) enable(); else disable(); }

  // matchMedia change (compat anciens navigateurs)
  if (mq.addEventListener) mq.addEventListener("change", apply);
  else if (mq.addListener) mq.addListener(apply);

  window.addEventListener("resize", function () {
    if (enabled) { refreshPanels(); setHeights(); target = clamp(window.scrollY); }
  });
  window.addEventListener("load", function () { if (enabled) { refreshPanels(); setHeights(); } });

  apply();

  /* Liens d'ancrage : convertit la cible verticale en position horizontale --- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (!enabled) return; // mobile : ancrage vertical natif
      var id = a.getAttribute("href");
      if (!id || id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var panel = el.closest(".panel") || el;
      window.scrollTo({ top: clamp(panel.offsetLeft), behavior: "smooth" });
    });
  });
})();
