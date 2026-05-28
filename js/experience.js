/* ==========================================================================
   NEOPURE — Couche "expérience" (signature interactions)
   Concept : le site se comporte comme un feed vivant qui réagit au visiteur.
   100% vanilla, léger. Désactivé si prefers-reduced-motion. Curseur/tilt/
   magnétisme uniquement sur pointeur fin (souris).
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var raf = window.requestAnimationFrame;

  /* =======================================================================
     1. INTRO DE MARQUE (preloader)
     ======================================================================= */
  var pre = document.getElementById("preloader");
  function hidePreloader() {
    if (!pre) return;
    pre.classList.add("is-done");
    document.body.classList.add("is-loaded");
    setTimeout(function () { if (pre && pre.parentNode) pre.parentNode.removeChild(pre); }, 400);
  }
  function killPreloaderImmediately() {
    if (!pre) return;
    document.body.classList.add("is-loaded");
    if (pre.parentNode) pre.parentNode.removeChild(pre);
  }
  // On ne montre le preloader qu'à la toute 1re visite de la session.
  // Sur refresh / navigation interne, on le retire instantanément (pas de flash noir).
  var alreadySeen = false;
  try { alreadySeen = sessionStorage.getItem("np_seen") === "1"; } catch (e) {}
  if (pre) {
    if (reduced || alreadySeen) {
      killPreloaderImmediately();
    } else {
      window.addEventListener("load", function () { setTimeout(hidePreloader, 1900); });
      setTimeout(hidePreloader, 4200); // filet de sécurité
    }
    try { sessionStorage.setItem("np_seen", "1"); } catch (e) {}
  }

  /* =======================================================================
     2. BARRE DE PROGRESSION (style story Instagram)
     ======================================================================= */
  var bar = document.querySelector("#scrollProgress span");
  if (bar) {
    var ticking = false;
    function updateProgress() {
      var d = document.documentElement;
      var max = d.scrollHeight - d.clientHeight;
      var p = max > 0 ? (window.scrollY || d.scrollTop) / max : 0;
      bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; raf(updateProgress); }
    }, { passive: true });
    updateProgress();
  }

  /* =======================================================================
     3. COMPTEURS ANIMÉS (+35K, +800%)
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
     4. CARTE LEAFLET (attribution masquée comme demandé)
     ======================================================================= */
  function initMap() {
    var el = document.getElementById("map");
    if (!el || typeof L === "undefined") return;
    var coords = [43.6112, 3.8716]; // Montpellier — Promenade du Peyrou
    // Carte purement décorative (radar) → toutes les interactions désactivées
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
    // Tuiles équilibrées (CartoDB Voyager, sans labels) — on les teinte ensuite en CSS
    // pour les fondre dans l'univers violet du site.
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png", {
      maxZoom: 19
    }).addTo(map);
    // Calque transparent avec UNIQUEMENT les labels (noms de villes, rues principales)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      pane: "markerPane"  // au-dessus des tuiles de base
    }).addTo(map);
    // Le centre exact (Montpellier) est marqué par .radar-core en CSS, pile au milieu du cercle.
  }
  if (document.readyState === "complete") initMap();
  else window.addEventListener("load", initMap);

  /* =======================================================================
     Tout ce qui suit est purement décoratif → coupé si reduced-motion.
     ======================================================================= */
  if (reduced) return;

  /* =======================================================================
     5. HERO RÉACTIF (halo lumineux + parallax du titre)
     ======================================================================= */
  var hero = document.querySelector(".hero");
  var heroInner = document.querySelector(".hero-inner");
  var feedLayers = hero ? hero.querySelectorAll(".hero-feed-layer") : [];
  if (hero && finePointer) {
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width;
      var y = (e.clientY - r.top) / r.height;
      if (heroInner) {
        heroInner.style.transform = "translate3d(" + ((x - 0.5) * 16).toFixed(1) +
                                    "px," + ((y - 0.5) * 16).toFixed(1) + "px,0)";
      }
      feedLayers.forEach(function (l) {
        var d = parseFloat(l.getAttribute("data-depth")) || 0.5;
        l.style.transform = "translate3d(" + ((x - 0.5) * d * -50).toFixed(1) +
                            "px," + ((y - 0.5) * d * -50).toFixed(1) + "px,0)";
      });
    });
    hero.addEventListener("mouseleave", function () {
      if (heroInner) heroInner.style.transform = "";
      feedLayers.forEach(function (l) { l.style.transform = ""; });
    });
  }

  // Compteur d'abonnés en DIRECT (le feed est vivant → "ton algorithme te kiffe")
  var live = document.querySelector("#liveFollowers [data-live]");
  if (live) {
    var n = parseInt(live.textContent.replace(/\D/g, ""), 10) || 12480;
    setInterval(function () {
      n += Math.floor(Math.random() * 3) + 1;
      live.textContent = n.toLocaleString("fr-FR");
    }, 2400);
  }

  /* =======================================================================
     6. CURSEUR SIGNATURE (lentille + labels d'intention)
     ======================================================================= */
  var cursor = document.getElementById("cursor");
  if (cursor && finePointer) {
    var dot = cursor.querySelector(".cursor-dot");
    var ring = cursor.querySelector(".cursor-ring");
    var label = cursor.querySelector(".cursor-label");
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;

    document.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px)";
    });
    (function follow() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      var t = "translate(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px)";
      ring.style.transform = t;
      label.style.transform = t;
      raf(follow);
    })();

    document.addEventListener("mouseout", function (e) {
      if (!e.relatedTarget && !e.toElement) cursor.classList.add("is-hidden");
    });
    document.addEventListener("mouseover", function () { cursor.classList.remove("is-hidden"); });

    var interactive = document.querySelectorAll(
      "a, button, .btn, .sector, .gallery-item, .collab-logo"
    );
    interactive.forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        cursor.classList.add("is-hover");
        var l = el.getAttribute("data-cursor");
        if (l) { cursor.classList.add("has-label"); label.textContent = l; }
      });
      el.addEventListener("mouseleave", function () {
        cursor.classList.remove("is-hover", "has-label");
        label.textContent = "";
      });
    });
  }

  /* =======================================================================
     7. BOUTONS MAGNÉTIQUES
     ======================================================================= */
  if (finePointer) {
    var MAG_MAX = 6; // déplacement max en px, peu importe la taille du bouton
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        // position relative au centre, normalisée à [-1, 1]
        var nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        var ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
        el.style.transform = "translate(" + (nx * MAG_MAX).toFixed(1) + "px," + (ny * MAG_MAX).toFixed(1) + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* =======================================================================
     8. CARTES TILT 3D
     ======================================================================= */
  if (finePointer) {
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      var max = 7;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "perspective(720px) rotateX(" + (-py * max).toFixed(2) +
                             "deg) rotateY(" + (px * max).toFixed(2) + "deg) translateY(-6px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* =======================================================================
     9. MARQUEES RÉACTIFS À LA VITESSE DE SCROLL (skew "awwwards")
        Le skew est appliqué au conteneur, pas à la piste animée → pas de conflit.
     ======================================================================= */
  var skewTargets = document.querySelectorAll(".collab-marquee");
  if (skewTargets.length) {
    var lastY = window.scrollY, vel = 0;
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      vel = y - lastY;
      lastY = y;
    }, { passive: true });
    (function skewLoop() {
      vel *= 0.88;
      var sk = Math.max(-9, Math.min(9, vel * 0.35));
      var v = "skewX(" + sk.toFixed(2) + "deg)";
      skewTargets.forEach(function (t) { t.style.transform = v; });
      raf(skewLoop);
    })();
  }
})();
