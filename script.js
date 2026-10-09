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
