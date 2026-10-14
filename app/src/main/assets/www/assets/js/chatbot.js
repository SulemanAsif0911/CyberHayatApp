// ============================================================
// CYBER HAYAT — Assistant
// Live answers from a hosted Llama model (through the Apps Script
// backend, so no API key is stored in the app). When offline or the
// model is unreachable, the built-in guidance library answers instead.
// ============================================================
(function(){
  "use strict";
  const $ = id => document.getElementById(id);
  const LS_CHATS = "ch_chats", LS_CUR = "ch_chat_current";

  const T = {
    en:{ ph:"Describe what happened…", wTitle:"How can I help you today?", wSub:"Private, practical guidance on cyber harassment — saving evidence, securing accounts and reporting to the right place.",
         online:"AI assistant · online", offline:"Offline guidance · no internet", ready:"Built-in guidance", typing:"Thinking",
         note:"Showing built-in guidance because the live assistant is unavailable.", histTitle:"Chat history", empty:"No saved chats yet.", del:"Delete", newChat:"New chat",
         you:"You", bot:"Assistant" },
    ur:{ ph:"بتائیں کیا ہوا ہے…", wTitle:"آج میں آپ کی کیا مدد کر سکتا ہوں؟", wSub:"سائبر ہراسانی پر نجی اور عملی رہنمائی — ثبوت محفوظ کرنا، اکاؤنٹس محفوظ بنانا اور درست جگہ رپورٹ کرنا۔",
         online:"اے آئی اسسٹنٹ · آن لائن", offline:"آف لائن رہنمائی · انٹرنیٹ نہیں", ready:"بلٹ اِن رہنمائی", typing:"سوچ رہا ہوں",
         note:"لائیو اسسٹنٹ دستیاب نہیں، اس لیے بلٹ اِن رہنمائی دکھائی جا رہی ہے۔", histTitle:"چیٹ ہسٹری", empty:"ابھی کوئی محفوظ چیٹ نہیں۔", del:"حذف", newChat:"نئی چیٹ",
         you:"آپ", bot:"اسسٹنٹ" }
  };
  const lang = () => localStorage.getItem("ch_lang") || "en";
  const t = k => (T[lang()] || T.en)[k] || T.en[k];
  const kbLang = () => (lang() === "ur" ? "ur" : "en");

  /* ---------- storage ---------- */
  const readChats = () => { try{ return JSON.parse(localStorage.getItem(LS_CHATS) || "[]"); }catch(e){ return []; } };
  const writeChats = c => { try{ localStorage.setItem(LS_CHATS, JSON.stringify(c.slice(0, 30))); }catch(e){} };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  let chat = null;

  function loadCurrent(){
    const id = localStorage.getItem(LS_CUR);
    const c = readChats().find(x => x.id === id);
    chat = c || newChatObj();
  }
  function newChatObj(){ return { id: uid(), title: "", ts: Date.now(), messages: [], started: false }; }
  function persist(){
    const all = readChats().filter(x => x.id !== chat.id);
    if(chat.messages.length) all.unshift(chat);
    writeChats(all);
    localStorage.setItem(LS_CUR, chat.id);
  }

  /* ---------- rendering ---------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  function inline(s){
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\b(complaint\.(?:nccia|fia)\.gov\.pk|StopNCII\.org|takeitdown\.ncmec\.org)\b/gi, m => `<a href="https://${m.toLowerCase()}" target="_blank" rel="noopener">${m}</a>`);
  }
  function md(text){
    const lines = String(text).replace(/\r/g, "").split("\n");
    let out = "", list = null;
    const close = () => { if(list){ out += `</${list}>`; list = null; } };
    for(const raw of lines){
      const l = raw.trim();
      let m;
      if((m = l.match(/^[-•*]\s+(.*)/))){ if(list !== "ul"){ close(); out += "<ul>"; list = "ul"; } out += `<li>${inline(m[1])}</li>`; }
      else if((m = l.match(/^\d+[.)]\s+(.*)/))){ if(list !== "ol"){ close(); out += "<ol>"; list = "ol"; } out += `<li>${inline(m[1])}</li>`; }
      else if(!l){ close(); }
      else { close(); out += `<p>${inline(l)}</p>`; }
    }
    close();
    return out;
  }
  const hhmm = ts => new Date(ts).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });

  function row(m){
    const div = document.createElement("div");
    div.className = "cb-row " + (m.role === "user" ? "user" : "bot");
    const bubble = document.createElement("div");
    bubble.className = "cb-bubble" + (m.crisis ? " cb-crisis" : "");
    bubble.setAttribute("dir", "auto");
    bubble.innerHTML = m.role === "user" ? `<p>${esc(m.content).replace(/\n/g, "<br>")}</p>` : md(m.content);
    const wrap = document.createElement("div");
    wrap.style.minWidth = "0"; wrap.style.maxWidth = "100%";
    wrap.appendChild(bubble);
    const meta = document.createElement("div");
    meta.className = "cb-meta";
    meta.textContent = hhmm(m.ts) + (m.src === "offline" ? " · offline" : "");
    wrap.appendChild(meta);
    if(m.role !== "user"){ const av = document.createElement("img"); av.className = "cb-mini"; av.src = "assets/img/logo.png"; av.alt = ""; div.appendChild(av); }
    div.appendChild(wrap);
    return div;
  }

  function welcome(){
    const box = document.createElement("div");
    box.className = "cb-welcome";
    const starters = (window.CH_KB && window.CH_KB.STARTERS[kbLang()]) || [];
    box.innerHTML = `<img src="assets/img/logo.png" alt=""><h2>${esc(t("wTitle"))}</h2><p>${esc(t("wSub"))}</p>
      <div class="cb-topics">${starters.map((s, i) => `<button type="button" class="cb-topic" data-i="${i}">${esc(s[0])}</button>`).join("")}</div>`;
    box.querySelectorAll(".cb-topic").forEach(b => b.addEventListener("click", () => submit(starters[+b.dataset.i][1])));
    return box;
  }

  function render(){
    const list = $("cbMessages");
    list.innerHTML = "";
    if(!chat.messages.length) list.appendChild(welcome());
    else chat.messages.forEach(m => list.appendChild(row(m)));
    $("cbInput").placeholder = t("ph");
    toBottom();
  }
  const toBottom = () => requestAnimationFrame(() => { const l = $("cbMessages"); l.scrollTop = l.scrollHeight; });

  function status(){
    const el = $("cbStatus"), txt = $("cbStatusText");
    const cfg = window.CH_CONFIG || {};
    const live = navigator.onLine && !!cfg.APPS_SCRIPT_URL;
    el.classList.toggle("is-online", live);
    el.classList.toggle("is-offline", !navigator.onLine);
    txt.textContent = live ? t("online") : (!navigator.onLine ? t("offline") : t("ready"));
  }

  /* ---------- sending ---------- */
  let busy = false;
  function typingRow(){
    const d = document.createElement("div");
    d.className = "cb-row bot"; d.id = "cbTyping";
    d.innerHTML = `<img class="cb-mini" src="assets/img/logo.png" alt=""><div class="cb-bubble" aria-label="${esc(t("typing"))}"><span class="cb-typing"><i></i><i></i><i></i></span></div>`;
    return d;
  }

  function submit(text){
    text = (text || "").trim();
    if(!text || busy) return;
    const go = () => run(text);
    if(window.CH_SUBMIT && !window.CH_SUBMIT.hasConsent()) window.CH_SUBMIT.requireConsent(go, $("cbInput"));
    else go();
  }

  async function run(text){
    busy = true; $("cbSend").disabled = true;
    const now = Date.now();
    if(!chat.title) chat.title = text.slice(0, 48);
    chat.messages.push({ role:"user", content:text, ts:now });
    $("cbInput").value = ""; autosize(); persist(); render();

    if(!chat.started){
      chat.started = true;
      window.CH_SUBMIT && window.CH_SUBMIT.send("chatbot_started", { sessionId: chat.id });
    }

    let reply, src = "llama", crisis = false;
    const kb = window.CH_KB;
    if(kb.isCrisis(text)){
      const a = kb.answer(text, kbLang()); reply = a.text; src = "offline"; crisis = true;
    } else {
      const list = $("cbMessages"); const tp = typingRow(); list.appendChild(tp); toBottom();
      try{
        const hist = chat.messages.slice(-10).map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
        const r = await window.CH_SUBMIT.chat(hist, lang(), chat.id);
        reply = r.reply;
      }catch(e){
        const a = kb.answer(text, kbLang()); reply = a.text; src = "offline";
        if(navigator.onLine && (window.CH_CONFIG || {}).APPS_SCRIPT_URL && a.id !== "crisis") reply += "\n\n_" + t("note") + "_";
      }
      tp.remove();
    }
    reply = reply.replace(/\n\n_(.+?)_$/s, "\n\n$1");
    chat.messages.push({ role:"assistant", content:reply, ts:Date.now(), src, crisis });
    persist(); render(); status();
    window.CH_SUBMIT && window.CH_SUBMIT.send("chatbot_conversation", { sessionId: chat.id, userMessage: text, assistantReply: reply, source: src });
    busy = false; $("cbSend").disabled = !$("cbInput").value.trim();
  }

  /* ---------- history sheet ---------- */
  function openSheet(){
    const items = readChats();
    $("cbSheetList").innerHTML = items.length ? items.map(c => `
      <div class="cb-hist"><button type="button" class="open-chat" data-id="${c.id}"><strong dir="auto">${esc(c.title || t("newChat"))}</strong><small>${new Date(c.ts).toLocaleString()}</small></button>
      <button type="button" class="del" data-del="${c.id}">${esc(t("del"))}</button></div>`).join("")
      : `<div class="cb-empty">${esc(t("empty"))}</div>`;
    $("cbSheetList").querySelectorAll("[data-id]").forEach(b => b.addEventListener("click", () => {
      const c = readChats().find(x => x.id === b.dataset.id); if(c){ chat = c; persist(); render(); closeSheet(); }
    }));
    $("cbSheetList").querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => {
      writeChats(readChats().filter(x => x.id !== b.dataset.del));
      if(chat.id === b.dataset.del){ chat = newChatObj(); render(); }
      openSheet();
    }));
    $("cbSheetBackdrop").classList.add("open"); $("cbSheet").classList.add("open");
  }
  function closeSheet(){ $("cbSheetBackdrop").classList.remove("open"); $("cbSheet").classList.remove("open"); }

  function autosize(){
    const el = $("cbInput"); el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px";
    $("cbSend").disabled = busy || !el.value.trim();
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadCurrent(); render(); status();
    $("cbForm").addEventListener("submit", e => { e.preventDefault(); submit($("cbInput").value); });
    $("cbInput").addEventListener("input", autosize);
    $("cbInput").addEventListener("keydown", e => {
      if(e.key === "Enter" && !e.shiftKey && !matchMedia("(pointer:coarse)").matches){ e.preventDefault(); submit($("cbInput").value); }
    });
    $("cbNewBtn").addEventListener("click", () => { if(busy) return; chat = newChatObj(); localStorage.setItem(LS_CUR, chat.id); render(); $("cbInput").focus(); });
    $("cbHistoryBtn").addEventListener("click", openSheet);
    $("cbSheetClose").addEventListener("click", closeSheet);
    $("cbSheetBackdrop").addEventListener("click", closeSheet);
    $("cbInput").addEventListener("focus", () => setTimeout(toBottom, 300));
    window.addEventListener("resize", toBottom);
    window.addEventListener("online", status); window.addEventListener("offline", status);
    document.addEventListener("ch:lang-changed", () => { render(); status(); });
    document.addEventListener("ch:chats-cleared", () => { chat = newChatObj(); render(); });
  });
})();
