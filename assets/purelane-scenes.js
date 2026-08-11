/**
 * Purelane — Scenes & UI JS
 * - Scroll-based background scene switching
 * - IntersectionObserver reveal animation (.rv → .rv.in)
 * - Nav pill scroll behaviour (.header.up)
 * - Respects prefers-reduced-motion
 */

(function () {
  'use strict';

  /* ── Motion preference ── */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================================================================
     1. REVEAL ANIMATION
     Adds `.in` to any element with class `.rv` when it enters the
     viewport (threshold 15%).
  ================================================================ */
  function initReveal() {
    const items = document.querySelectorAll('.rv');
    if (!items.length) return;

    if (prefersReduced) {
      items.forEach(el => el.classList.add('in'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    items.forEach(el => observer.observe(el));
  }

  /* ================================================================
     2. BACKGROUND SCENE SWITCHER
     Reads `data-scene="N"` on sections.
     When a section is >40% in view, activates `.scene[data-id="N"]`.
     Falls back gracefully if no .scenes container exists.
  ================================================================ */
  function initScenes() {
    const scenes = document.querySelectorAll('.scene');
    const triggers = document.querySelectorAll('[data-scene]');

    if (!scenes.length || !triggers.length) return;

    /* Activate first scene on load */
    const firstScene = document.querySelector('.scene[data-id="1"]') || scenes[0];
    if (firstScene) firstScene.classList.add('on');

    if (prefersReduced) return;

    function activateScene(id) {
      scenes.forEach(s => {
        s.classList.toggle('on', s.dataset.id === String(id));
      });
    }

    const sceneObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.dataset.scene;
            activateScene(id);
          }
        });
      },
      { threshold: 0.4 }
    );

    triggers.forEach(el => sceneObserver.observe(el));
  }

  /* ================================================================
     3. NAV PILL SCROLL CLASS
     Adds `.up` to `.header` when page is scrolled past 60px.
     This lets CSS compact/style the nav differently.
  ================================================================ */
  function initNav() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastY = 0;
    let ticking = false;

    function onScroll() {
      const y = window.scrollY;

      if (!ticking) {
        requestAnimationFrame(() => {
          if (y > 60) {
            header.classList.add('up');
          } else {
            header.classList.remove('up');
          }

          /* Hide nav on scroll down, show on scroll up */
          if (y > lastY && y > 200) {
            header.classList.add('hidden');
          } else {
            header.classList.remove('hidden');
          }

          lastY = y;
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ================================================================
     4. CART — Shopify Cart API helper
     Handles "Add to cart" buttons with data-product-id attr.
     POST to /cart/add.js, then updates cart count.
  ================================================================ */
  function initCart() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-atc]');
      if (!btn) return;

      const variantId = btn.dataset.variantId || btn.dataset.productId;
      if (!variantId) return;

      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Adding…';

      fetch(window.Shopify ? window.Shopify.routes.root + 'cart/add.js' : '/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: 1 })
      })
        .then(r => r.json())
        .then(() => {
          btn.textContent = 'Added!';
          updateCartCount();
          setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
          }, 2000);
        })
        .catch(() => {
          btn.textContent = 'Error — retry';
          btn.disabled = false;
        });
    });
  }

  function updateCartCount() {
    fetch('/cart.js')
      .then(r => r.json())
      .then(cart => {
        const badges = document.querySelectorAll('[data-cart-count]');
        badges.forEach(b => {
          b.textContent = cart.item_count;
          b.hidden = cart.item_count === 0;
        });
      })
      .catch(() => {});
  }

  /* ================================================================
     5. MARQUEE PAUSE ON HOVER
     Toggles animation-play-state for .revtrack on hover of parent.
  ================================================================ */
  function initMarquee() {
    const rails = document.querySelectorAll('.revwrap');
    rails.forEach(rail => {
      rail.addEventListener('mouseenter', () => {
        rail.querySelectorAll('.revtrack').forEach(t => {
          t.style.animationPlayState = 'paused';
        });
      });
      rail.addEventListener('mouseleave', () => {
        rail.querySelectorAll('.revtrack').forEach(t => {
          t.style.animationPlayState = 'running';
        });
      });
    });
  }

  /* ================================================================
     6. TICKER ANIMATION — ensure seamless on load
  ================================================================ */
  function initTicker() {
    const ticker = document.querySelector('.ticker-inner');
    if (!ticker || prefersReduced) return;
    /* CSS animation handles the scroll; JS just ensures the clone exists */
    const clone = ticker.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    ticker.parentNode.insertBefore(clone, ticker.nextSibling);
  }

  /* ================================================================
     INIT — run everything on DOMContentLoaded
  ================================================================ */
  function init() {
    initReveal();
    initScenes();
    initNav();
    initCart();
    initMarquee();
    initTicker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
