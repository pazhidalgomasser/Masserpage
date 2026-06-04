/* =========================================================
   MASSER — script.js
   ========================================================= */

/* ╔══════════════════════════════════════════════════════╗
   ║  CONFIGURACIÓN  —  edita estos 2 valores               ║
   ╚══════════════════════════════════════════════════════╝ */

// 1) URL del backend (Google Apps Script) que envía el correo.
//    La pegas después de publicar el Apps Script (termina en /exec).
//    Mientras esté vacía, el formulario avisa que falta configurar.
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwy4LQ2ZxFX-BKumeljmFlHSX__Yt3ZvFdgdnrvfKj8Wq45Q75_PiEZQiDs_CIKSZCHBg/exec";

// 2) Número de WhatsApp (formato internacional, sin + ni espacios)
const WHATSAPP_NUMBER = "56966593109";

/* ─────────────────────────────────────────────────────── */

const WA_MSG = "Hola Masser, vengo desde el sitio web y me gustaría cotizar un proyecto.";

document.addEventListener("DOMContentLoaded", () => {
  /* ---- Nav: estado al hacer scroll ---- */
  const nav = document.querySelector(".nav");
  const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 30);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Menú móvil ---- */
  const burger = document.querySelector(".hamburger");
  const closeMenu = () => document.body.classList.remove("menu-open");
  if (burger) burger.addEventListener("click", () => document.body.classList.toggle("menu-open"));
  document.querySelectorAll(".drawer a, .scrim").forEach(el => el.addEventListener("click", closeMenu));
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });

  /* ---- Año en footer ---- */
  document.querySelectorAll(".year").forEach(el => el.textContent = new Date().getFullYear());

  /* ---- WhatsApp ---- */
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WA_MSG)}`;
  document.querySelectorAll("[data-wa]").forEach(a => {
    a.setAttribute("href", waHref);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
    a.addEventListener("click", () => fireEvent("lead_whatsapp", { origen: location.pathname }));
  });

  /* ---- Reveal al hacer scroll ---- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  /* ---- Formulario de contacto ---- */
  initForm();
});

/* Evento para GA4 / Google Ads (no falla si gtag aún no está) */
function fireEvent(name, params) {
  if (typeof gtag === "function") gtag("event", name, params || {});
}

function initForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const msg = form.querySelector(".form-msg");
  const btn = form.querySelector("button[type=submit]");
  const btnText = btn ? btn.textContent : "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (msg) { msg.className = "form-msg"; msg.textContent = ""; }

    const data = Object.fromEntries(new FormData(form).entries());

    // Honeypot anti-spam
    if (data._gotcha) return;

    if (!data.nombre || !data.email || !data.mensaje) {
      showMsg(msg, "err", "Por favor completa nombre, correo y mensaje.");
      return;
    }

    if (!APPS_SCRIPT_URL) {
      showMsg(msg, "err", "El formulario aún no está conectado. Configura APPS_SCRIPT_URL en assets/script.js.");
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = "Enviando…"; }

    try {
      const body = new URLSearchParams(data).toString();
      const r = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body
      });
      let ok = r.ok;
      try { const j = await r.json(); ok = ok && j && j.ok; } catch (_) {}

      if (ok) {
        // Conversión para GA4 / Google Ads
        fireEvent("lead_contacto", {
          tipo_proyecto: data.tipo || "no_especificado",
          metodo: "formulario_web"
        });
        form.reset();
        showMsg(msg, "ok", "¡Gracias! Recibimos tu mensaje y te contactaremos a la brevedad.");
      } else {
        throw new Error("Respuesta no OK");
      }
    } catch (err) {
      showMsg(msg, "err", "Hubo un problema al enviar. Inténtalo otra vez o escríbenos por WhatsApp.");
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = btnText; }
    }
  });
}

function showMsg(el, type, text) {
  if (!el) { alert(text); return; }
  el.className = "form-msg " + type;
  el.textContent = text;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}
