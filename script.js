// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Scroll reveal animation
const revealEls = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
revealEls.forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 0.08}s`;
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

function drawStars(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach((s) => {
    const twinkle = 0.5 + 0.5 * Math.sin(time * 0.001 * s.speed + s.offset);
    const opacity = s.baseOpacity * twinkle;

    if (s.glow) {
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius * 10);
      grad.addColorStop(0, `rgba(243, 238, 216, ${opacity * 0.9})`);
      grad.addColorStop(1, "rgba(243, 238, 216, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius * 10, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.fillStyle = s.glow
      ? `rgba(248, 245, 232, ${opacity})`
      : `rgba(243, 238, 216, ${opacity * 0.85})`;
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
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
