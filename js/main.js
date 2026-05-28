/* ==========================================================================
   NEOPURE — Interactions de base
   Menu évolutif (flottant, pas de barre), anneau de progression au scroll,
   reveal au scroll, année du footer. Léger, sans dépendance.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1. Menu évolutif (pastille flottante → overlay plein écran) ------------- */
  var btn = document.getElementById("menuBtn");
  var overlay = document.getElementById("menuOverlay");
  function setMenu(open) {
    if (!btn || !overlay) return;
    btn.classList.toggle("is-open", open);
    overlay.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));
    overlay.setAttribute("aria-hidden", String(!open));
    btn.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  }
  if (btn && overlay) {
    btn.addEventListener("click", function () {
      setMenu(!overlay.classList.contains("is-open"));
    });
    // Fermeture au clic sur un lien
    overlay.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    // Fermeture à la touche Échap
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* 2. Anneau de progression (évolue avec le scroll) ----------------------- */
  var root = document.documentElement;
  var ticking = false;
  function progress() {
    var max = root.scrollHeight - root.clientHeight;
    var p = max > 0 ? (window.scrollY || root.scrollTop) / max : 0;
    root.style.setProperty("--np-progress", p.toFixed(4));
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(progress); }
  }, { passive: true });
  progress();

  /* 3. Reveal au scroll (IntersectionObserver) ----------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* 4. Année automatique du footer ----------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* 5. Scroll-spy : surligne la section courante dans le menu évolutif ------ */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll(".side-nav a"));
  if (spyLinks.length && "IntersectionObserver" in window) {
    var targets = [];
    spyLinks.forEach(function (a) {
      var id = a.getAttribute("href");
      if (!id || id.charAt(0) !== "#") return;
      var t = document.querySelector(id);
      if (t) targets.push(t);
    });
    var ratios = new Map();
    function refreshActive() {
      var best = null, bestR = 0;
      ratios.forEach(function (r, t) { if (r > bestR) { bestR = r; best = t; } });
      if (!best) return;
      var activeId = "#" + best.id;
      spyLinks.forEach(function (a) {
        a.classList.toggle("is-active", a.getAttribute("href") === activeId);
      });
    }
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        ratios.set(e.target, e.isIntersecting ? e.intersectionRatio : 0);
      });
      refreshActive();
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    targets.forEach(function (t) { spy.observe(t); });
  }

  /* 6. Chips « Nature du message » : sélection unique avec mise à jour du champ caché */
  (function () {
    var chips = document.querySelectorAll(".field--chips .chip");
    var hidden = document.getElementById("f-nature");
    if (!chips.length || !hidden) return;
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        chips.forEach(function (o) {
          o.classList.remove("is-active");
          o.setAttribute("aria-checked", "false");
        });
        c.classList.add("is-active");
        c.setAttribute("aria-checked", "true");
        hidden.value = c.getAttribute("data-value") || "";
      });
    });
  })();

  /* 7. Formulaire de contact : confirmation propre (pas de back-end) -------- */
  var form = document.querySelector(".contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nom = form.querySelector("#f-nom");
      var email = form.querySelector("#f-email");
      if (nom && !nom.value.trim()) { nom.focus(); return; }
      if (email && (!email.value.trim() || (email.validity && email.validity.typeMismatch))) {
        email.focus(); return;
      }
      var ok = document.createElement("div");
      ok.className = "form-success";
      ok.setAttribute("role", "status");
      var h = document.createElement("h3");
      var prenom = nom ? nom.value.trim().split(" ")[0] : "";
      h.textContent = prenom ? "Merci " + prenom + " ! 🎉" : "Merci ! 🎉";
      var p = document.createElement("p");
      p.textContent = "On a bien reçu ton message. On te recontacte très vite — promis.";
      ok.appendChild(h);
      ok.appendChild(p);
      form.replaceWith(ok);
    });
  }
})();
