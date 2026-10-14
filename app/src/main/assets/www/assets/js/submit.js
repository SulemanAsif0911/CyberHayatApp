// ============================================================
// CYBER HAYAT — submission layer
// One-time email + consent gate, toast notifications, and the
// helper that POSTs form/chat data to the Apps Script backend
// (see assets/js/config.js for the endpoint).
// ============================================================
(function(){
  "use strict";

  const EMAIL_KEY = "ch_user_email";
  const CONSENT_KEY = "ch_consent_ts";

  function hasConsent(){
    return !!(localStorage.getItem(EMAIL_KEY) && localStorage.getItem(CONSENT_KEY));
  }
  function getEmail(){ return localStorage.getItem(EMAIL_KEY) || ""; }

  function injectModal(){
    if(document.getElementById("consentModal")) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
<div class="consent-backdrop" id="consentBackdrop"></div>
<div class="consent-modal" id="consentModal" role="dialog" aria-modal="true" aria-labelledby="consentTitle">
  <img src="assets/img/logo.png" alt="" class="consent-mark" />
  <h2 id="consentTitle">Before you continue</h2>
  <p>
    Cyber Hayat keeps a private record of reports, signups, and chatbot conversations so our support
    team can follow up and, where needed, connect you with the right authorities. We'll only ask for
    your email <strong>once</strong> — to confirm what you send us and reach you if it's urgent.
  </p>
  <div class="field">
    <label for="consentEmail">Your email</label>
    <input type="email" id="consentEmail" placeholder="you@example.com" autocomplete="email" required>
  </div>
  <label class="field-check">
    <input type="checkbox" id="consentCheck">
    I understand this data is stored by the Cyber Hayat team to provide support (see
    <a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a>), and I consent to being
    emailed a confirmation.
  </label>
  <div class="consent-actions">
    <button type="button" id="consentCancel" class="btn btn-outline btn-sm">Not now</button>
    <button type="button" id="consentSubmit" class="btn btn-primary btn-sm">Continue</button>
  </div>
</div>`;
    document.body.appendChild(wrap);
  }

  let pendingResolve = null;
  let pendingRefocusEl = null;

  function openModal(refocusEl){
    injectModal();
    pendingRefocusEl = refocusEl || null;
    document.getElementById("consentBackdrop").classList.add("open");
    document.getElementById("consentModal").classList.add("open");
    setTimeout(()=> document.getElementById("consentEmail").focus(), 50);
  }
  function closeModal(){
    const backdrop = document.getElementById("consentBackdrop");
    const modal = document.getElementById("consentModal");
    if(backdrop) backdrop.classList.remove("open");
    if(modal) modal.classList.remove("open");
  }

  function wireModalOnce(){
    document.addEventListener("click", (e)=>{
      if(e.target.id === "consentCancel" || e.target.id === "consentBackdrop"){
        closeModal();
        if(pendingRefocusEl) pendingRefocusEl.blur();
        pendingResolve = null;
      }
      if(e.target.id === "consentSubmit"){
        const emailInput = document.getElementById("consentEmail");
        const check = document.getElementById("consentCheck");
        const email = (emailInput.value || "").trim();
        const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if(!validEmail){ emailInput.focus(); emailInput.classList.add("is-error"); return; }
        if(!check.checked){ check.closest("label").classList.add("is-error"); return; }
        localStorage.setItem(EMAIL_KEY, email);
        localStorage.setItem(CONSENT_KEY, Date.now().toString());
        closeModal();
        toast("Thanks — we'll only ask for this once.");
        if(pendingResolve){ pendingResolve(email); pendingResolve = null; }
        if(pendingRefocusEl){ pendingRefocusEl.focus(); pendingRefocusEl = null; }
      }
    });
  }

  function requireConsent(onGranted, refocusEl){
    if(hasConsent()){ onGranted(getEmail()); return; }
    pendingResolve = onGranted;
    openModal(refocusEl);
  }

  /* ---------- guard tracked forms: ask before the visitor can type ---------- */
  function guardForms(){
    document.addEventListener("focusin", (e)=>{
      if(hasConsent()) return;
      const form = e.target.closest("[data-track-form]");
      if(!form) return;
      const target = e.target;
      target.blur();
      requireConsent(()=>{}, target);
    }, true);
  }

  /* ---------- toast ---------- */
  let toastTimer = null;
  function toast(message, kind){
    let el = document.getElementById("chToast");
    if(!el){
      el = document.createElement("div");
      el.id = "chToast";
      el.className = "ch-toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.className = "ch-toast open" + (kind ? " " + kind : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> el.classList.remove("open"), 3600);
  }

  /* ---------- backend submission (offline-first) ---------- */
  const QKEY = "ch_queue";
  function readQ(){ try{ return JSON.parse(localStorage.getItem(QKEY) || "[]"); }catch(e){ return []; } }
  function writeQ(q){
    try{ localStorage.setItem(QKEY, JSON.stringify(q)); }catch(e){}
    document.dispatchEvent(new CustomEvent("ch:queue-changed"));
  }
  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  async function post(body, timeoutMs){
    const cfg = window.CH_CONFIG || {};
    if(!cfg.APPS_SCRIPT_URL) throw new Error("not-configured");
    const ctl = ("AbortController" in window) ? new AbortController() : null;
    const t = ctl ? setTimeout(()=> ctl.abort(), timeoutMs || 20000) : null;
    try{
      const res = await fetch(cfg.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // simple request: no CORS preflight
        body: JSON.stringify(body),
        signal: ctl ? ctl.signal : undefined
      });
      const data = await res.json();
      return data;
    } finally { if(t) clearTimeout(t); }
  }

  let flushing = false;
  async function flush(manual){
    if(flushing || !navigator.onLine) return;
    flushing = true;
    try{
      let q = readQ();
      while(q.length){
        let r;
        try{ r = await post(q[0], 20000); }catch(e){ break; }
        if(r && (r.ok || r.error === "duplicate")){ q.shift(); writeQ(q); }
        else if(r && (r.error === "invalid secret" || r.error === "unknown type")){ q.shift(); writeQ(q); } // never retry hopeless items
        else break;
      }
      if(manual && !readQ().length) toast("All data synced.");
    } finally { flushing = false; }
  }

  async function send(type, payload){
    const cfg = window.CH_CONFIG || {};
    const body = Object.assign({
      type, email: getEmail(), secret: cfg.SHARED_SECRET || "", qid: uid(),
      page: location.pathname.split("/").pop() || "index.html"
    }, payload);
    // Always store first, then try to deliver: nothing is lost offline.
    const q = readQ(); q.push(body); writeQ(q);
    if(navigator.onLine) await flush(false);
    const pending = readQ().some(x => x.qid === body.qid);
    return { ok: !pending, queued: pending };
  }

  /* Live AI answer (Llama via the backend). Never queued. */
  async function chat(messages, lang, sessionId){
    const cfg = window.CH_CONFIG || {};
    if(!navigator.onLine) throw new Error("offline");
    const data = await post({ action: "chat", secret: cfg.SHARED_SECRET || "", sessionId, lang, messages }, 30000);
    if(!data || !data.ok || !data.reply) throw new Error((data && data.error) || "no-reply");
    return data;
  }

  window.addEventListener("online", ()=> flush(false));
  document.addEventListener("DOMContentLoaded", ()=> setTimeout(()=> flush(false), 1500));

  window.CH_SUBMIT = { hasConsent, getEmail, requireConsent, send, chat, flush, toast };

  document.addEventListener("DOMContentLoaded", ()=>{
    wireModalOnce();
    guardForms();
  });
})();
