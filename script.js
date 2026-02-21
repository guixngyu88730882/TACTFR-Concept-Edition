// ========================================================================
// TACTFR — Main Controller
// ========================================================================
(function () {
  'use strict';

  // ═══════════════ PRELOADER ═══════════════
  const preloader = document.getElementById('preloader');
  const preloaderFill = document.getElementById('preloaderFill');
  let loadProgress = 0;

  const loadInterval = setInterval(() => {
    loadProgress += Math.random() * 15 + 5;
    if (loadProgress >= 100) {
      loadProgress = 100;
      clearInterval(loadInterval);
      setTimeout(() => preloader.classList.add('done'), 400);
    }
    preloaderFill.style.width = loadProgress + '%';
  }, 200);

  // ═══════════════ CUSTOM CURSOR ═══════════════
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');
  let mx = 0, my = 0, rx = 0, ry = 0;

  if (window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      cursorDot.style.left = mx + 'px';
      cursorDot.style.top = my + 'px';
    });

    (function animRing() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      cursorRing.style.left = rx + 'px';
      cursorRing.style.top = ry + 'px';
      requestAnimationFrame(animRing);
    })();

    document.querySelectorAll('a, button, .fcard, .gallery-inner, .tcard, .video-placeholder, input, select').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  // ═══════════════ KINETIC LINES CANVAS ═══════════════
  const canvas = document.getElementById('kineticCanvas');
  const ctx = canvas.getContext('2d');
  let W, H;
  let scrollY = 0, scrollVelocity = 0, lastScrollY = 0;
  const lines = [];
  const LINE_COUNT = 50;

  function resizeCanvas() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  class KineticLine {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.length = Math.random() * 80 + 30;
      this.angle = Math.random() * Math.PI * 2;
      this.speed = Math.random() * 0.5 + 0.1;
      this.drift = (Math.random() - 0.5) * 0.002;
      this.alpha = Math.random() * 0.12 + 0.02;
      this.maxAlpha = this.alpha;
      this.width = Math.random() * 1 + 0.3;
      this.hue = 220 + Math.random() * 20;
    }

    update() {
      // React to scroll velocity
      const sv = Math.abs(scrollVelocity);
      const boostAlpha = Math.min(sv * 0.008, 0.25);
      const boostLength = Math.min(sv * 0.5, 60);
      const boostSpeed = Math.min(sv * 0.02, 2);

      this.alpha = this.maxAlpha + boostAlpha;
      const currentLength = this.length + boostLength;
      const currentSpeed = this.speed + boostSpeed;

      this.angle += this.drift;
      this.x += Math.cos(this.angle) * currentSpeed;
      this.y += Math.sin(this.angle) * currentSpeed + scrollVelocity * 0.03;

      // Wrap around
      if (this.x < -100) this.x = W + 100;
      if (this.x > W + 100) this.x = -100;
      if (this.y < -100) this.y = H + 100;
      if (this.y > H + 100) this.y = -100;

      // Draw
      const ex = this.x + Math.cos(this.angle) * currentLength;
      const ey = this.y + Math.sin(this.angle) * currentLength;

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(ex, ey);

      const gradient = ctx.createLinearGradient(this.x, this.y, ex, ey);
      gradient.addColorStop(0, `hsla(${this.hue}, 70%, 60%, 0)`);
      gradient.addColorStop(0.5, `hsla(${this.hue}, 70%, 60%, ${this.alpha})`);
      gradient.addColorStop(1, `hsla(${this.hue}, 70%, 60%, 0)`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = this.width;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  function initLines() {
    for (let i = 0; i < LINE_COUNT; i++) {
      lines.push(new KineticLine());
    }
  }

  function drawLines() {
    ctx.clearRect(0, 0, W, H);
    lines.forEach(l => l.update());
    requestAnimationFrame(drawLines);
  }

  // Scroll velocity tracking
  function trackScroll() {
    scrollY = window.scrollY;
    scrollVelocity = scrollY - lastScrollY;
    lastScrollY = scrollY;
    requestAnimationFrame(trackScroll);
  }

  resizeCanvas();
  initLines();
  drawLines();
  trackScroll();
  window.addEventListener('resize', () => {
    resizeCanvas();
    lines.forEach(l => l.reset());
  });

  // ═══════════════ NAV ═══════════════
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // Mobile menu
  const burger = document.getElementById('navBurger');
  const mobileNav = document.getElementById('mobileNav');

  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    mobileNav.classList.toggle('open');
    document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
  });

  mobileNav.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // ═══════════════ SCROLL PROGRESS ═══════════════
  const scrollBar = document.getElementById('scrollBar');
  window.addEventListener('scroll', () => {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (window.scrollY / docH) * 100;
    scrollBar.style.width = progress + '%';
  }, { passive: true });

  // ═══════════════ SCROLL REVEAL ═══════════════
  const reveals = document.querySelectorAll('.scroll-reveal');

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.getAttribute('data-delay');
        if (delay) {
          entry.target.style.setProperty('--scroll-delay', delay + 's');
        }
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => revealObs.observe(el));

  // ═══════════════ HERO ENTRANCE DELAYS ═══════════════
  document.querySelectorAll('.anim-in').forEach(el => {
    const d = el.getAttribute('data-delay') || '0';
    el.style.animationDelay = d + 's';
  });

  // ═══════════════ COUNTER ANIMATION ═══════════════
  function animateCounter(el, target, duration = 2000) {
    const isDecimal = String(target).includes('.');
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = target * eased;

      if (isDecimal) {
        el.textContent = current.toFixed(1);
      } else {
        el.textContent = Math.round(current).toLocaleString();
      }

      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Observe hero stats
  const heroStats = document.querySelector('.hero-stats');
  let heroStatsAnimated = false;

  if (heroStats) {
    const statsObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !heroStatsAnimated) {
          heroStatsAnimated = true;
          document.querySelectorAll('.hstat-num[data-count]').forEach(el => {
            const target = parseFloat(el.dataset.count);
            animateCounter(el, target);
          });
        }
      });
    }, { threshold: 0.5 });
    statsObs.observe(heroStats);
  }

  // ═══════════════ METRIC BARS ═══════════════
  const metricBars = document.querySelectorAll('.metric-bar');

  const metricObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const width = bar.dataset.width;
        bar.style.setProperty('--target-width', width);
        bar.classList.add('animated');
      }
    });
  }, { threshold: 0.3 });

  metricBars.forEach(bar => metricObs.observe(bar));

  // ═══════════════ TESTIMONIALS — Duplicate for infinite scroll ═══════════════
  const marqueeTrack = document.getElementById('marqueeTrack');
  if (marqueeTrack) {
    const items = marqueeTrack.innerHTML;
    marqueeTrack.innerHTML = items + items; // duplicate
  }

  // ═══════════════ FEATURE CARDS — Tilt on hover ═══════════════
  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.fcard').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `translateY(-4px) perspective(600px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) perspective(600px) rotateY(0) rotateX(0)';
        card.style.transition = 'transform 0.5s ease';
      });

      card.addEventListener('mouseenter', () => {
        card.style.transition = 'transform 0.1s ease-out';
      });
    });
  }

  // ═══════════════ GALLERY ITEMS — Stagger animation ═══════════════
  document.querySelectorAll('.gallery-item').forEach(item => {
    const delay = item.querySelector('.scroll-reveal')?.getAttribute('data-delay');
    if (delay) item.style.setProperty('--scroll-delay', delay + 's');
  });

  // ═══════════════ SMOOTH ANCHOR SCROLL ═══════════════
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ═══════════════ ACTIVE NAV LINK ═══════════════
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 150) {
        current = s.id;
      }
    });
    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === '#' + current;
      link.style.color = isActive ? 'var(--text)' : '';
      const after = link.querySelector('::after');
    });
  }, { passive: true });

  // ═══════════════ PARALLAX ON HERO ELEMENTS ═══════════════
  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    const heroContent = document.querySelector('.hero-content');
    if (heroContent && sy < window.innerHeight) {
      heroContent.style.transform = `translateY(${sy * 0.15}px)`;
      heroContent.style.opacity = 1 - (sy / window.innerHeight) * 0.8;
    }
  }, { passive: true });

  // ═══════════════ MAGNETIC EFFECT ON CTA BUTTONS ═══════════════
  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.btn-hero-primary, .nav-cta, .dl-btn-primary').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15 - 2}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
        btn.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      });

      btn.addEventListener('mouseenter', () => {
        btn.style.transition = 'transform 0.1s ease-out';
      });
    });
  }

  // ═══════════════ RESIZE HANDLER FOR LINES ═══════════════
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeCanvas();
    }, 250);
  });

  // ═══════════════ VIDEO PLAY BUTTON ═══════════════
  const videoPlaceholder = document.getElementById('videoPlaceholder');
  const videoWrapper = document.getElementById('videoWrapper');
  const playBtn = document.getElementById('playBtn');

  if (videoPlaceholder && videoWrapper) {
    videoPlaceholder.addEventListener('click', () => {
      // Replace placeholder with iframe
      videoWrapper.innerHTML = '<iframe src="https://player.bilibili.com/player.html?bvid=BV1UkccziEqd&page=1&high_quality=1&danmaku=0&autoplay=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups" style="width:100%;height:100%;aspect-ratio:16/9;border-radius:16px;"></iframe>';
    });
  }

})();