// Gate hero text visibility until the star-formation intro finishes
document.body.classList.add("intro-active");

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// About photo 3D tilt — follows cursor position, resets on leave
const photoFrame = document.querySelector(".about__photo-frame");
if (photoFrame) {
  const maxTilt = 14;
  photoFrame.addEventListener("mousemove", (e) => {
    const rect = photoFrame.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 2 * maxTilt;
    const rotateX = (0.5 - y) * 2 * maxTilt;
    photoFrame.style.transition = "transform 0.1s ease-out";
    photoFrame.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
  });
  photoFrame.addEventListener("mouseleave", () => {
    photoFrame.style.transition = "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)";
    photoFrame.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
  });
}

// Theme toggle (dark / beige light mode)
const themeToggle = document.getElementById("theme-toggle");
const root = document.documentElement;
if (localStorage.getItem("theme") === "light") {
  root.setAttribute("data-theme", "light");
}
themeToggle.addEventListener("click", () => {
  const isLight = root.getAttribute("data-theme") === "light";
  if (isLight) {
    root.removeAttribute("data-theme");
    localStorage.setItem("theme", "dark");
  } else {
    root.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
  }
});

// Scroll reveal animation
const revealEls = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-visible", entry.isIntersecting);
    });
  },
  { threshold: 0.15 }
);
revealEls.forEach((el, i) => {
  if (!el.closest(".hero")) {
    el.style.transitionDelay = `${(i % 4) * 0.08}s`;
  }
  observer.observe(el);
});

// Starfield background
const canvas = document.getElementById("stars-canvas");
const ctx = canvas.getContext("2d");
let stars = [];

function makeStars() {
  const area = canvas.width * canvas.height;
  const count = Math.round(area / 9000);
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.3 + 0.4,
    baseOpacity: Math.random() * 0.6 + 0.25,
    speed: Math.random() * 1.2 + 0.3,
    offset: Math.random() * Math.PI * 2,
    glow: Math.random() < 0.06,
  }));
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  makeStars();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let mouseX = -9999;
let mouseY = -9999;
window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});
window.addEventListener("mouseleave", () => {
  mouseX = -9999;
  mouseY = -9999;
});

const CURSOR_GLOW_RADIUS = 140;

// Intro: starfield particles converge into the hero name, hold, then
// smoothly dissolve into the real gradient-text title in place.
const CONVERGE_MS = 1500;
const HOLD_MS = 450;
const FADE_MS = 400;
const STAR_WHITE = [243, 238, 216];
const STAR_GOLD = [231, 182, 76];
let introState = null;

function lerp(a, b, t) {
  return a + (b - a) * t;
}
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function lerpColor(c1, c2, t) {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
}

function startStarIntro() {
  const titleEl = document.querySelector(".hero__title");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !titleEl) {
    document.body.classList.remove("intro-active");
    return;
  }

  const rect = titleEl.getBoundingClientRect();
  const computed = getComputedStyle(titleEl);
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = canvas.width;
  sampleCanvas.height = canvas.height;
  const sctx = sampleCanvas.getContext("2d");
  sctx.fillStyle = "#fff";
  sctx.textAlign = "center";
  sctx.textBaseline = "middle";
  sctx.font = `${computed.fontWeight} ${parseFloat(computed.fontSize)}px ${computed.fontFamily}`;
  sctx.fillText(titleEl.textContent.trim(), rect.left + rect.width / 2, rect.top + rect.height / 2);

  const imgData = sctx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
  const step = 4;
  const points = [];
  for (let y = 0; y < sampleCanvas.height; y += step) {
    for (let x = 0; x < sampleCanvas.width; x += step) {
      if (imgData[(y * sampleCanvas.width + x) * 4 + 3] > 128) {
        points.push({ x, y });
      }
    }
  }

  if (!points.length) {
    document.body.classList.remove("intro-active");
    return;
  }

  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }

  const particles = points.map((p) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.max(canvas.width, canvas.height) * (0.6 + Math.random() * 0.6);
    return {
      startX: p.x + Math.cos(angle) * dist,
      startY: p.y + Math.sin(angle) * dist,
      targetX: p.x,
      targetY: p.y,
      delay: Math.random() * 350,
      radius: Math.random() * 1.1 + 0.5,
    };
  });

  introState = { particles, startTime: performance.now() };

  // Start fading the real text in just as the particles begin to dissolve,
  // so the two crossfade into each other at the same spot.
  window.setTimeout(() => {
    document.body.classList.remove("intro-active");
  }, CONVERGE_MS + HOLD_MS);

  window.setTimeout(() => {
    introState = null;
  }, CONVERGE_MS + HOLD_MS + FADE_MS + 150);
}

function drawIntroParticles(now) {
  if (!introState) return;
  const elapsed = now - introState.startTime;
  introState.particles.forEach((p) => {
    let x, y, opacity, color;
    if (elapsed < CONVERGE_MS + p.delay) {
      const localT = Math.min(1, Math.max(0, (elapsed - p.delay) / CONVERGE_MS));
      const e = easeOutCubic(localT);
      x = lerp(p.startX, p.targetX, e);
      y = lerp(p.startY, p.targetY, e);
      opacity = localT;
      color = lerpColor(STAR_WHITE, STAR_GOLD, e);
    } else if (elapsed < CONVERGE_MS + HOLD_MS) {
      x = p.targetX;
      y = p.targetY;
      opacity = 0.85 + 0.15 * Math.sin(elapsed * 0.01 + p.delay);
      color = STAR_GOLD;
    } else {
      const t2 = Math.min(1, (elapsed - CONVERGE_MS - HOLD_MS) / FADE_MS);
      const e = easeInOutCubic(t2);
      x = p.targetX;
      y = p.targetY;
      opacity = 1 - e;
      color = STAR_GOLD;
    }
    ctx.beginPath();
    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${Math.max(0, opacity)})`;
    ctx.arc(x, y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    requestAnimationFrame(() => requestAnimationFrame(startStarIntro));
  });
} else {
  window.addEventListener("load", startStarIntro);
}

function drawStars(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach((s) => {
    const twinkle = 0.5 + 0.5 * Math.sin(time * 0.001 * s.speed + s.offset);
    let opacity = s.baseOpacity * twinkle;

    const dx = s.x - mouseX;
    const dy = s.y - mouseY;
    const proximity = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / CURSOR_GLOW_RADIUS);
    const boost = proximity * proximity;
    const radius = s.radius * (1 + boost * 2.2);
    opacity = Math.min(1, opacity * (1 + boost * 1.1));

    if (s.glow || boost > 0.05) {
      const glowRadius = s.radius * (s.glow ? 10 : 6 + boost * 6);
      const glowOpacity = s.glow ? opacity * 0.9 : opacity * 0.6 * boost;
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowRadius);
      grad.addColorStop(0, `rgba(243, 238, 216, ${glowOpacity})`);
      grad.addColorStop(1, "rgba(243, 238, 216, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.fillStyle = s.glow
      ? `rgba(248, 245, 232, ${opacity})`
      : `rgba(243, 238, 216, ${opacity * 0.85})`;
    ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
  drawIntroParticles(time);
  requestAnimationFrame(drawStars);
}
requestAnimationFrame(drawStars);

// Scroll-progress dots
const dots = document.querySelectorAll(".scroll-dots__dot");
const dotSections = document.querySelectorAll("#top, #about, #work, #contact");
const dotObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        dots.forEach((dot) => {
          dot.classList.toggle("is-active", dot.dataset.target === id);
        });
      }
    });
  },
  { threshold: 0.5 }
);
dotSections.forEach((section) => dotObserver.observe(section));

// Hero scroll-linked parallax exit — content drifts apart, scales down and
// fades with depth as you scroll past, instead of a flat scroll-off.
const heroEl = document.getElementById("top");
const heroTitle = document.querySelector(".hero__title");
const heroRole = document.querySelector(".hero__role");
const heroTagline = document.querySelector(".hero__tagline");
const heroScrollIndicator = document.querySelector(".hero .scroll-indicator");
const heroCta = document.querySelector(".hero__cta");
const heroContactBtn = document.querySelector(".hero__contact-btn");

const parallaxTransformTargets = [
  { el: heroTitle, yMul: 60, xMul: -20, scaleMul: 0.1 },
  { el: heroRole, yMul: 95, xMul: 25, scaleMul: 0.14 },
  { el: heroTagline, yMul: 130, xMul: -35, scaleMul: 0.18 },
  { el: heroCta, yMul: 150, xMul: 40, scaleMul: 0.16 },
];
const parallaxOpacityOnlyTargets = [heroScrollIndicator, heroContactBtn];

let parallaxTicking = false;
function updateHeroParallax() {
  parallaxTicking = false;
  if (!heroEl || document.body.classList.contains("intro-active")) return;

  const progress = Math.min(1, Math.max(0, window.scrollY / (heroEl.offsetHeight * 0.9)));
  const eased = progress * progress;
  const opacity = Math.max(0, 1 - progress * 1.3);

  parallaxTransformTargets.forEach(({ el, yMul, xMul, scaleMul }) => {
    if (!el) return;
    const translateY = -eased * yMul;
    const translateX = eased * xMul;
    const scale = 1 - eased * scaleMul;
    el.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    el.style.opacity = opacity;
  });
  parallaxOpacityOnlyTargets.forEach((el) => {
    if (!el) return;
    el.style.opacity = opacity;
  });
}
window.addEventListener(
  "scroll",
  () => {
    if (!parallaxTicking) {
      parallaxTicking = true;
      requestAnimationFrame(updateHeroParallax);
    }
  },
  { passive: true }
);

// Auto-fetch latest YouTube Shorts into the "My Work" grid
(async function loadLatestShorts() {
  const API_KEY = "AIzaSyAHY-NLVGlrbll9KDNBidLnDe047Dy51Ps";
  const UPLOADS_PLAYLIST_ID = "UUiYuZEnkdxPYBjrofgot6VA";
  const VIDEO_COUNT = 3;
  const workGrid = document.getElementById("work-grid");
  if (!workGrid) return;

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=6&playlistId=${UPLOADS_PLAYLIST_ID}&key=${API_KEY}`
    );
    if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
    const data = await res.json();

    const videos = (data.items || [])
      .map((item) => ({
        videoId: item.snippet.resourceId.videoId,
        publishedAt: item.snippet.publishedAt,
        title: item.snippet.title,
      }))
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, VIDEO_COUNT);

    if (videos.length === 0) return;

    workGrid.innerHTML = videos
      .map(
        (v) => `
        <div class="work-card reveal is-visible">
          <iframe src="https://www.youtube.com/embed/${v.videoId}" title="${v.title.replace(/"/g, "&quot;")}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
        </div>`
      )
      .join("");
  } catch (err) {
    console.warn("Could not auto-load latest YouTube Shorts, keeping static fallback.", err);
  }
})();
