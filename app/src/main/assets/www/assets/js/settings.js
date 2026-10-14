// ============================================================
// CYBER HAYAT — Settings drawer (language, sync status, local data).
// Shared across every page. Light theme only; no API keys in the app —
// the AI model is configured server-side in the Apps Script backend.
// ============================================================
(function(){
  "use strict";
  const LANG_KEY = "ch_lang";

  window.CH_LANGUAGES = [
    { code: "en", label: "English" },
    { code: "ur", label: "اردو (Urdu)" },
    { code: "sd", label: "سنڌي (Sindhi)" },
    { code: "pa", label: "پنجابی (Punjabi)" },
    { code: "ps", label: "پښتو (Pashto)" },
    { code: "bal", label: "بلوچی (Balochi)" },
    { code: "skr", label: "سرائیکی (Saraiki)" },
    { code: "hns", label: "ہندکو (Hindko)" },
    { code: "brh", label: "براہوئی (Brahui)" }
  ];

  // Dark theme was removed — clear any old preference.
  try{ localStorage.removeItem("ch_theme"); }catch(e){}
  document.documentElement.removeAttribute("data-theme");

  document.addEventListener("DOMContentLoaded", init);

  function init(){
    injectDrawer();
    const backdrop = document.getElementById("settingsBackdrop");
    const drawer = document.getElementById("settingsDrawer");
    const closeBtn = document.getElementById("settingsClose");
    function open(){ refreshSync(); backdrop.classList.add("open"); drawer.classList.add("open"); }
    function close(){ backdrop.classList.remove("open"); drawer.classList.remove("open"); }
    document.querySelectorAll("[data-settings-toggle]").forEach(b => b.addEventListener("click", open));
    closeBtn && closeBtn.addEventListener("click", close);
    backdrop && backdrop.addEventListener("click", close);
    document.addEventListener("keydown", e => { if(e.key === "Escape") close(); });

    const langSelect = document.getElementById("langSelect");
    if(langSelect){
      langSelect.innerHTML = window.CH_LANGUAGES.map(l => `<option value="${l.code}">${l.label}</option>`).join("");
      langSelect.value = localStorage.getItem(LANG_KEY) || "en";
      langSelect.addEventListener("change", ()=>{
        localStorage.setItem(LANG_KEY, langSelect.value);
        document.dispatchEvent(new CustomEvent("ch:lang-changed"));
      });
    }

    const syncBtn = document.getElementById("settingsSyncNow");
    syncBtn && syncBtn.addEventListener("click", async ()=>{
      if(window.CH_SUBMIT && window.CH_SUBMIT.flush){ await window.CH_SUBMIT.flush(true); }
      refreshSync();
    });
    const clearBtn = document.getElementById("settingsClearChats");
    clearBtn && clearBtn.addEventListener("click", ()=>{
      if(confirm("Delete all chat history stored on this device?")){
        localStorage.removeItem("ch_chats"); localStorage.removeItem("ch_chat_current");
        window.CH_SUBMIT && window.CH_SUBMIT.toast("Chat history deleted.");
        document.dispatchEvent(new CustomEvent("ch:chats-cleared"));
      }
    });
    document.addEventListener("ch:queue-changed", refreshSync);
    window.addEventListener("online", refreshSync);
    window.addEventListener("offline", refreshSync);
  }

  function refreshSync(){
    const el = document.getElementById("settingsSyncStatus");
    if(!el) return;
    let n = 0; try{ n = JSON.parse(localStorage.getItem("ch_queue") || "[]").length; }catch(e){}
    const net = navigator.onLine ? "Online" : "Offline";
    el.textContent = net + " · " + (n ? n + " item" + (n>1?"s":"") + " waiting to sync" : "everything synced");
    el.classList.toggle("is-live", navigator.onLine && !n);
  }

  function injectDrawer(){
    if(document.getElementById("settingsDrawer")) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
<div class="settings-backdrop" id="settingsBackdrop"></div>
<aside class="settings-drawer" id="settingsDrawer" aria-label="Settings">
  <div class="settings-head">
    <h2 data-i18n="settings.title">Settings</h2>
    <button class="settings-close" id="settingsClose" aria-label="Close settings">
      <svg class="svg-icon stroke" viewBox="0 0 24 24" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
  <div class="settings-body">
    <div class="settings-section">
      <div class="settings-section-title" data-i18n="settings.language">Language</div>
      <div class="field">
        <label for="langSelect" data-i18n="settings.languageLabel">Assistant &amp; interface language</label>
        <select id="langSelect"></select>
        <span class="hint" data-i18n="settings.languageHint">Changes the site interface and the language the Chatbot replies in.</span>
      </div>
    </div>
    <div class="settings-divider"></div>
    <div class="settings-section">
      <div class="settings-section-title">Offline &amp; sync</div>
      <div class="settings-row"><span class="settings-row-sub" id="settingsSyncStatus">—</span></div>
      <div class="key-row">
        <button type="button" id="settingsSyncNow" class="btn btn-primary btn-sm">Sync now</button>
        <button type="button" id="settingsClearChats" class="btn btn-outline btn-sm">Delete chat history</button>
      </div>
    </div>
    <div class="settings-divider"></div>
    <div class="settings-note">
      The app works fully offline. Reports and forms you submit while offline are kept on this device and sent
      automatically when you reconnect. Language and chat history are stored only on this device.
    </div>
  </div>
</aside>`;
    document.body.appendChild(wrap);
  }
})();
