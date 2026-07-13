/* ==========================================================================
   NEOPURE — Interactions de base
   Menu évolutif (flottant, pas de barre), reveal au scroll,
   année du footer. Léger, sans dépendance.
   ========================================================================== */
(function () {
  "use strict";

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

  /* 2. Reveal au scroll (IntersectionObserver) ----------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  // Le reveal au scroll joue même en "réduire les animations" (fondu ponctuel léger).
  if (!("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: "0px 0px -10% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* 3. Année automatique du footer ----------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* 4. Scroll-spy : surligne la section courante dans le menu évolutif ------ */
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

  /* 5. Chips « Nature du message » : sélection unique avec mise à jour du champ caché */
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

  /* 6. Formulaire de contact : confirmation propre (pas de back-end) -------- */
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
      h.textContent = prenom ? "Merci " + prenom + " !" : "Merci !";
      var p = document.createElement("p");
      p.textContent = "On a bien reçu ton message. On te recontacte très vite — promis.";
      ok.appendChild(h);
      ok.appendChild(p);
      form.replaceWith(ok);
    });
  }

  /* 7. Lightbox galerie : clic sur une photo/vidéo → plein écran + navigation -- */
  (function () {
    var lb = document.getElementById("lightbox");
    var stage = document.getElementById("lbStage");
    var counter = document.getElementById("lbCounter");
    var btnClose = document.getElementById("lbClose");
    var btnPrev = document.getElementById("lbPrev");
    var btnNext = document.getElementById("lbNext");
    var btnSound = document.getElementById("lbSound");
    var items = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
    if (!lb || !stage || !items.length) return;
    var lock = makeScrollLock();

    // Icônes du bouton son (SVG inline pour rester net et sans requête réseau)
    var SVG_ON  = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
    var SVG_OFF = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
    var currentVideo = null;

    // Construit la liste des médias (type + source) à partir de la galerie
    var media = items.map(function (fig) {
      var v = fig.querySelector("video");
      if (v) return { type: "video", src: v.currentSrc || v.getAttribute("src"), poster: v.getAttribute("poster") || "" };
      var img = fig.querySelector("img");
      return { type: "image", src: img ? img.getAttribute("src") : "", alt: img ? img.getAttribute("alt") : "" };
    });

    var current = -1;

    function updateSoundBtn() {
      if (!btnSound) return;
      if (!currentVideo) { btnSound.hidden = true; return; }
      var on = !currentVideo.muted;
      btnSound.hidden = false;
      btnSound.classList.toggle("is-on", on);
      btnSound.setAttribute("aria-pressed", on ? "true" : "false");
      btnSound.setAttribute("aria-label", on ? "Couper le son" : "Activer le son");
      btnSound.innerHTML = on ? SVG_ON : SVG_OFF;
    }

    function render(i) {
      var m = media[i];
      if (!m) return;
      stage.innerHTML = "";
      currentVideo = null;
      var el;
      if (m.type === "video") {
        el = document.createElement("video");
        el.src = m.src;
        if (m.poster) el.poster = m.poster;
        el.controls = true;
        el.loop = true;
        el.playsInline = true;
        el.setAttribute("playsinline", "");
        currentVideo = el;
        // Ouvrir une réalisation vidéo = geste utilisateur → on tente le son direct.
        el.muted = false;
        el.volume = 1;
        var pv = el.play && el.play();
        if (pv && pv.catch) pv.catch(function () {
          // Autoplay AVEC son refusé (iOS surtout) : on démarre en muet pour
          // que la vidéo ne reste pas figée, et le bouton son permet d'activer
          // le son en un tap.
          el.muted = true;
          updateSoundBtn();
          var p2 = el.play();
          if (p2 && p2.catch) p2.catch(function () {});
        });
      } else {
        el = document.createElement("img");
        el.src = m.src;
        el.alt = m.alt || "Réalisation Neopure";
      }
      stage.appendChild(el);
      updateSoundBtn();
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
      if (currentVideo) { try { currentVideo.pause(); } catch (e) {} }
      currentVideo = null;
      if (btnSound) btnSound.hidden = true;
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
    if (btnSound) {
      btnSound.addEventListener("click", function (e) {
        e.stopPropagation();               // ne pas fermer la visionneuse
        if (!currentVideo) return;
        currentVideo.muted = !currentVideo.muted;
        if (!currentVideo.muted) {
          currentVideo.volume = 1;
          var p = currentVideo.play();     // relance si iOS avait mis en pause
          if (p && p.catch) p.catch(function () {});
        }
        updateSoundBtn();
      });
    }
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

  /* 8. Modale légale : clic sur un lien légal → bulle de lecture ------------- */
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

  /* 9. Services : petite bulle d'explication (popover discret, pas de modale) - */
  (function () {
    var pop = document.getElementById("svcPop");
    var body = pop && pop.querySelector(".svc-pop-body");
    var triggers = document.querySelectorAll("[data-svc]");
    if (!pop || !body || !triggers.length) return;

    var openEl = null;

    function place(anchor) {
      // Positionne la bulle sous l'élément cliqué, recalée dans l'écran.
      pop.style.visibility = "hidden";
      pop.hidden = false;
      var r = anchor.getBoundingClientRect();
      var pw = pop.offsetWidth, ph = pop.offsetHeight;
      var margin = 12;
      var left = r.left;
      if (left + pw > window.innerWidth - margin) left = window.innerWidth - pw - margin;
      if (left < margin) left = margin;
      var top = r.bottom + 10;
      if (top + ph > window.innerHeight - margin) {
        // pas la place en dessous → au-dessus
        top = r.top - ph - 10;
        if (top < margin) top = margin;
      }
      pop.style.left = Math.round(left) + "px";
      pop.style.top = Math.round(top) + "px";
      pop.style.visibility = "";
    }

    function open(el) {
      var doc = document.querySelector('[data-svc-doc="' + el.getAttribute("data-svc") + '"]');
      if (!doc) return;
      body.innerHTML = doc.innerHTML;
      pop.hidden = false;
      place(el);
      // force le reflow puis anime
      void pop.offsetWidth;
      pop.classList.add("is-open");
      openEl = el;
      el.setAttribute("aria-expanded", "true");
    }
    function close() {
      if (!openEl) return;
      pop.classList.remove("is-open");
      openEl.setAttribute("aria-expanded", "false");
      openEl = null;
      setTimeout(function () { if (!openEl) { pop.hidden = true; body.innerHTML = ""; } }, 200);
    }

    triggers.forEach(function (el) {
      el.setAttribute("aria-haspopup", "dialog");
      el.setAttribute("aria-expanded", "false");
      function trigger(e) {
        e.stopPropagation();
        if (openEl === el) { close(); return; }
        if (openEl) { pop.classList.remove("is-open"); openEl.setAttribute("aria-expanded", "false"); openEl = null; }
        open(el);
      }
      el.addEventListener("click", trigger);
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); trigger(e); }
      });
    });

    // Fermeture : clic ailleurs, Échap, scroll, redimensionnement
    var closeBtn = pop.querySelector(".svc-pop-close");
    if (closeBtn) closeBtn.addEventListener("click", close);
    pop.addEventListener("click", function (e) { e.stopPropagation(); });
    document.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    // Fermeture au redimensionnement — mais seulement si la LARGEUR change :
    // sur mobile, l'apparition/disparition de la barre d'adresse déclenche un
    // resize vertical qui fermait la bulle dès qu'on scrollait d'un pixel.
    var lastW = window.innerWidth;
    window.addEventListener("resize", function () {
      if (window.innerWidth !== lastW) { lastW = window.innerWidth; close(); }
    });
    // le scroll du site se fait via .h-viewport (horizontal) et window (vertical)
    window.addEventListener("scroll", close, true);
  })();

  /* 10. Modale Calendly : le calendrier se charge dans une bulle (pas de nouvel onglet) */
  (function () {
    var CAL_URL = "https://calendly.com/neopurecom/30min";
    var modal = document.getElementById("calModal");
    var frame = document.getElementById("calFrame");
    var closeBtn = document.getElementById("calClose");
    var triggers = document.querySelectorAll("[data-calendly]");
    if (!modal || !frame || !triggers.length) return;

    var lock = makeScrollLock();
    var loaded = false;

    function buildUrl() {
      // Thème Calendly aux couleurs de la charte (hex sans #)
      var params = "hide_gdpr_banner=1&background_color=2f173b&text_color=ffffff&primary_color=b92afa";
      return CAL_URL + (CAL_URL.indexOf("?") > -1 ? "&" : "?") + params;
    }
    function open() {
      if (!loaded) {
        frame.innerHTML = '<div class="cal-loading">Chargement du calendrier…</div>';
        var ifr = document.createElement("iframe");
        ifr.src = buildUrl();
        ifr.title = "Calendly — réserver un appel";
        ifr.setAttribute("frameborder", "0");
        ifr.addEventListener("load", function () {
          var l = frame.querySelector(".cal-loading");
          if (l) l.remove();
        });
        frame.appendChild(ifr);
        loaded = true;
      }
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      lock.lock(frame);
    }
    function close() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      lock.unlock();
    }

    triggers.forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();      // pas de nouvel onglet : on ouvre la modale
        open();
      });
    });
    if (closeBtn) closeBtn.addEventListener("click", close);
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
    });
  })();
})();
