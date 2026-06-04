/* ==========================================================================
   NEOPURE — Interactions de base
   Menu évolutif (flottant, pas de barre), anneau de progression au scroll,
   reveal au scroll, année du footer. Léger, sans dépendance.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Verrou de scroll robuste (iOS Safari inclus) : empêche la page de défiler
     DERRIÈRE une modale, tout en autorisant le scroll À L'INTÉRIEUR d'un élément.
     overflow:hidden sur body ne suffit pas sur iOS → on bloque aussi wheel/touchmove. */
  function makeScrollLock() {
    var prevent = null;
    return {
      lock: function (allowEl) {
        if (prevent) return;
        prevent = function (e) {
          // Autorise le geste s'il se produit dans la zone défilable de la modale
          if (allowEl && allowEl.contains(e.target)) return;
          e.preventDefault();
        };
        document.addEventListener("wheel", prevent, { passive: false });
        document.addEventListener("touchmove", prevent, { passive: false });
        document.body.style.overflow = "hidden";
      },
      unlock: function () {
        if (!prevent) return;
        document.removeEventListener("wheel", prevent, { passive: false });
        document.removeEventListener("touchmove", prevent, { passive: false });
        document.body.style.overflow = "";
        prevent = null;
      }
    };
  }

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
    // Fermeture au clic sur un lien OU sur le fond du menu (en dehors des items)
    overlay.addEventListener("click", function (e) {
      if (e.target.closest("a")) { setMenu(false); return; }
      if (e.target === overlay) setMenu(false);
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

  /* 8. Lightbox galerie : clic sur une photo/vidéo → plein écran + navigation -- */
  (function () {
    var lb = document.getElementById("lightbox");
    var stage = document.getElementById("lbStage");
    var counter = document.getElementById("lbCounter");
    var btnClose = document.getElementById("lbClose");
    var btnPrev = document.getElementById("lbPrev");
    var btnNext = document.getElementById("lbNext");
    var items = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
    if (!lb || !stage || !items.length) return;
    var lock = makeScrollLock();

    // Construit la liste des médias (type + source) à partir de la galerie
    var media = items.map(function (fig) {
      var v = fig.querySelector("video");
      if (v) return { type: "video", src: v.currentSrc || v.getAttribute("src"), poster: v.getAttribute("poster") || "" };
      var img = fig.querySelector("img");
      return { type: "image", src: img ? img.getAttribute("src") : "", alt: img ? img.getAttribute("alt") : "" };
    });

    var current = -1;

    function render(i) {
      var m = media[i];
      if (!m) return;
      stage.innerHTML = "";
      var el;
      if (m.type === "video") {
        el = document.createElement("video");
        el.src = m.src;
        if (m.poster) el.poster = m.poster;
        el.controls = true;
        el.autoplay = true;
        el.loop = true;
        el.playsInline = true;
        el.setAttribute("playsinline", "");
      } else {
        el = document.createElement("img");
        el.src = m.src;
        el.alt = m.alt || "Réalisation Neopure";
      }
      stage.appendChild(el);
      if (counter) counter.textContent = (i + 1) + " / " + media.length;
    }

    function open(i) {
      current = i;
      render(i);
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      lock.lock(null);                       // lightbox : aucun scroll d'arrière-plan
    }
    function close() {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      lock.unlock();
      // stoppe toute vidéo en cours pour libérer le son
      setTimeout(function () { stage.innerHTML = ""; }, 400);
      current = -1;
    }
    function go(dir) {
      if (current < 0) return;
      current = (current + dir + media.length) % media.length;
      render(current);
    }

    items.forEach(function (fig, i) {
      fig.addEventListener("click", function () { open(i); });
    });
    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { go(-1); });
    btnNext.addEventListener("click", function () { go(1); });
    // Clic sur le fond (hors média/boutons) → ferme
    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target === stage) close();
    });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    });
  })();

  /* 9. Modale légale : clic sur un lien légal → bulle de lecture ------------- */
  (function () {
    var modal = document.getElementById("legalModal");
    var body = document.getElementById("legalBody");
    var btnClose = document.getElementById("legalClose");
    var links = document.querySelectorAll("[data-legal]");
    if (!modal || !body || !links.length) return;

    var lock = makeScrollLock();
    var lastFocus = null;

    function open(key) {
      var doc = document.querySelector('[data-legal-doc="' + key + '"]');
      if (!doc) return;
      lastFocus = document.activeElement;
      body.innerHTML = doc.innerHTML;
      body.scrollTop = 0;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      lock.lock(body);                       // autorise le scroll DANS la bulle uniquement
      if (btnClose) btnClose.focus();
    }
    function close() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      lock.unlock();
      setTimeout(function () { body.innerHTML = ""; }, 400);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    links.forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        open(a.getAttribute("data-legal"));
      });
    });
    if (btnClose) btnClose.addEventListener("click", close);
    // Clic sur le fond (hors panneau) → ferme
    modal.addEventListener("click", function (e) {
      if (e.target === modal) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
    });
  })();
})();
