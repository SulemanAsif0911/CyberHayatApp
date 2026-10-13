// ============================================================
// CYBER HAYAT — Settings drawer (dark mode, language, Gemini key).
// Shared across every page.
//
// Note: there is intentionally no Google Sheet / account option
// here. Where chatbot conversations and form submissions are
// stored is an org-level decision (configured once by the site
// admin in assets/js/config.js + the Apps Script backend), not
// something a visitor should be able to see or change from a
// public settings panel.
// ============================================================
(function(){
  "use strict";

  const THEME_KEY   = "ch_theme";
  const LANG_KEY    = "ch_lang";
  const KEY_STORAGE = "ch_gemini_key";
  const MODEL_STORAGE = "ch_gemini_model";
  const DEFAULT_MODEL = "gemini-2.5-flash";

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

  function applyTheme(theme){
    document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
  }

  // apply theme immediately (before DOM paint of body) to avoid flash
  applyTheme(localStorage.getItem(THEME_KEY) || "light");

  document.addEventListener("DOMContentLoaded", init);

  function init(){
    injectDrawer();

    const toggleBtns = document.querySelectorAll("[data-settings-toggle]");
    const backdrop = document.getElementById("settingsBackdrop");
    const drawer = document.getElementById("settingsDrawer");
    const closeBtn = document.getElementById("settingsClose");

    function open(){ backdrop.classList.add("open"); drawer.classList.add("open"); }
    function close(){ backdrop.classList.remove("open"); drawer.classList.remove("open"); }

    toggleBtns.forEach(b => b.addEventListener("click", open));
    closeBtn && closeBtn.addEventListener("click", close);
    backdrop && backdrop.addEventListener("click", close);
    document.addEventListener("keydown", e => { if(e.key === "Escape") close(); });

    // ---- dark mode ----
    const themeSwitch = document.getElementById("themeSwitch");
    const currentTheme = localStorage.getItem(THEME_KEY) || "light";
    if(themeSwitch) themeSwitch.checked = currentTheme === "dark";
    themeSwitch && themeSwitch.addEventListener("change", ()=>{
      const theme = themeSwitch.checked ? "dark" : "light";
      localStorage.setItem(THEME_KEY, theme);
      applyTheme(theme);
    });

    // ---- language ----
    const langSelect = document.getElementById("langSelect");
    if(langSelect){
      langSelect.innerHTML = window.CH_LANGUAGES.map(l => `<option value="${l.code}">${l.label}</option>`).join("");
      langSelect.value = localStorage.getItem(LANG_KEY) || "en";
      langSelect.addEventListener("change", ()=>{
        localStorage.setItem(LANG_KEY, langSelect.value);
        document.dispatchEvent(new CustomEvent("ch:lang-changed"));
        refreshGeminiStatus();
      });
    }

    // ---- gemini key/model ----
    const keyInput = document.getElementById("settingsGeminiKey");
    const modelInput = document.getElementById("settingsGeminiModel");
    const saveBtn = document.getElementById("settingsSaveGemini");
    const clearBtn = document.getElementById("settingsClearGemini");
    const statusEl = document.getElementById("settingsGeminiStatus");

    function refreshGeminiStatus(){
      if(!statusEl) return;
      const hasKey = !!localStorage.getItem(KEY_STORAGE);
      const lang = localStorage.getItem(LANG_KEY) || "en";
      const key = hasKey ? "settings.connected" : "settings.notConnected";
      const text = (window.CH_I18N && window.CH_I18N.translate(key, lang)) ||
        (hasKey ? "Connected — live Gemini answers enabled" : "Not connected — guide-only mode");
      statusEl.setAttribute("data-i18n", key);
      statusEl.textContent = text;
      statusEl.classList.toggle("is-live", hasKey);
    }

    if(keyInput) keyInput.value = localStorage.getItem(KEY_STORAGE) || "";
    if(modelInput) modelInput.value = localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL;
    refreshGeminiStatus();

    saveBtn && saveBtn.addEventListener("click", ()=>{
      localStorage.setItem(KEY_STORAGE, (keyInput.value || "").trim());
      localStorage.setItem(MODEL_STORAGE, (modelInput.value || DEFAULT_MODEL).trim());
      refreshGeminiStatus();
      document.dispatchEvent(new CustomEvent("ch:gemini-updated"));
      window.CH_SUBMIT && window.CH_SUBMIT.toast("Gemini settings saved.");
    });
    clearBtn && clearBtn.addEventListener("click", ()=>{
      localStorage.removeItem(KEY_STORAGE);
      keyInput.value = "";
      refreshGeminiStatus();
      document.dispatchEvent(new CustomEvent("ch:gemini-updated"));
    });
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
      <div class="settings-section-title" data-i18n="settings.appearance">Appearance</div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label" data-i18n="settings.darkMode">Dark mode</div>
          <div class="settings-row-sub" data-i18n="settings.darkModeSub">Darkens the theme across the site.</div>
        </div>
        <label class="switch"><input type="checkbox" id="themeSwitch"><span class="knob"></span></label>
      </div>
    </div>

    <div class="settings-divider"></div>

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
      <div class="settings-section-title" data-i18n="settings.gemini">Gemini AI Connection</div>
      <div class="settings-row">
        <span class="settings-row-sub" id="settingsGeminiStatus" data-i18n="settings.notConnected">Not connected</span>
        <span class="model-pill">Gemini</span>
      </div>
      <div class="field">
        <label for="settingsGeminiKey" data-i18n="settings.geminiKeyLabel">Your Gemini API key</label>
        <input type="password" id="settingsGeminiKey" placeholder="Paste your Gemini API key" autocomplete="off">
        <span class="hint" data-i18n="settings.geminiKeyHint">Stored only in this browser. Get a free key at Google AI Studio.</span>
      </div>
      <div class="field">
        <label for="settingsGeminiModel" data-i18n="settings.modelLabel">Model</label>
        <input list="settingsModelOptions" id="settingsGeminiModel" placeholder="gemini-2.5-flash">
        <datalist id="settingsModelOptions">
          <option value="gemini-2.5-flash">
          <option value="gemini-2.5-flash-lite">
          <option value="gemini-3.5-flash">
        </datalist>
      </div>
      <div class="key-row">
        <button type="button" id="settingsSaveGemini" class="btn btn-primary btn-sm" data-i18n="settings.save">Save</button>
        <button type="button" id="settingsClearGemini" class="btn btn-outline btn-sm" data-i18n="settings.clear">Clear</button>
      </div>
    </div>

    <div class="settings-divider"></div>

    <div class="settings-note" data-i18n="settings.footNote">
      Dark mode, language, and your Gemini key are stored only in this browser (localStorage). Chat
      records and form submissions are handled separately by the Cyber Hayat support team — see the
      Privacy Policy for details.
    </div>
  </div>
</aside>`;
    document.body.appendChild(wrap);
  }
})();
