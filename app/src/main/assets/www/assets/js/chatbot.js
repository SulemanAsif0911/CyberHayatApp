// ============================================================
// CYBER HAYAT — Guided Support Chatbot
// - Gemini key/model live in the shared Settings drawer.
// - History is saved locally as sessions (left sidebar).
// - The first message of every new session is gated behind the
//   one-time email/consent modal (assets/js/submit.js). Once
//   given, every exchange is logged to the org's Google Sheet via
//   the Apps Script backend, and one "your conversation has
//   started" email is sent per session — not per message.
// ============================================================
(function(){
  "use strict";

  const KEY_STORAGE    = "ch_gemini_key";
  const MODEL_STORAGE  = "ch_gemini_model";
  const LANG_KEY       = "ch_lang";
  const SESSIONS_KEY   = "ch_chat_sessions";
  const DEFAULT_MODEL  = "gemini-2.5-flash";

  const LANG_NAMES = {
    en: "English", ur: "Urdu", sd: "Sindhi", pa: "Punjabi",
    ps: "Pashto", bal: "Balochi", skr: "Saraiki", hns: "Hindko", brh: "Brahui"
  };

  const SYSTEM_INSTRUCTION_BASE = `You are the Cyber Hayat Assistant, a calm, trauma-informed cyber-safety
guide for people in Pakistan facing online harassment, blackmail, stalking, doxing, fake accounts,
or hate speech. You are not a lawyer, police officer, or therapist.

How to respond:
- Be warm, brief, and practical. Use short paragraphs or bullet steps, not long essays.
- Always ground advice in the same order: (1) safety first, (2) save evidence before blocking,
  (3) secure the account (password, 2FA, privacy settings), (4) report through the correct official
  channel, (5) suggest emotional support if relevant.
- Official Pakistan channels to reference when relevant: FIA Cyber Crime Wing complaint portal
  (complaint.fia.gov.pk), NCCIA complaint portal (complaint.nccia.gov.pk), Digital Rights Foundation
  helpdesk (helpdesk@digitalrightsfoundation.pk, helpline 0800-39393), Punjab Commission on the
  Status of Women helpline (1043), NCCIA helpline (1799), FIA helpline (9911).
- Mention Pakistan's PECA 2016 (Prevention of Electronic Crimes Act) only in general, non-legal-advice
  terms, and tell the person to confirm specifics with a lawyer or the official portals.
- If someone describes immediate physical danger, a threat to life, sextortion with a countdown, or a
  minor being exploited, tell them clearly to contact local emergency services / a trusted adult right
  now, in addition to any other guidance.
- Never ask for or encourage sharing explicit images, passwords, CNIC numbers, or other sensitive
  identifiers in the chat.
- Do not provide legal verdicts, do not guarantee outcomes, and do not shame the person for what
  happened to them.
- Keep responses under ~180 words unless the person asks for something longer.`;

  const QUICK_PROMPTS = {
    blackmail: "I am being blackmailed with private photos or messages. What should I do right now?",
    fake: "Someone made a fake account impersonating me. How do I get it taken down and report it?",
    stalking: "Someone keeps monitoring and messaging me across accounts and I think I'm being stalked online. What steps should I take?",
    doxing: "My private information (address/phone/photos) was shared publicly without my consent. What do I do?",
    unsafe: "I feel unsafe right now because of something happening online. I need help immediately."
  };

  const FALLBACK_REPLIES = {
    blackmail: `Here's what to do right now:
• Do not pay, and do not send any more content — it rarely stops the threats.
• Save everything: screenshots, usernames, account links, phone numbers, and timestamps, before blocking.
• Report at complaint.fia.gov.pk or complaint.nccia.gov.pk — sextortion is treated seriously under PECA 2016.
• Tell one trusted person so you're not carrying this alone.
• If you feel unsafe immediately, use the Helplines page — PCSW 1043 or NCCIA 1799 are staffed for this.`,
    fake: `Steps to take:
• Screenshot the fake profile, its posts, and any messages before it changes.
• Copy the profile URL, then use the platform's built-in "report impersonation" flow.
• File a complaint at complaint.nccia.gov.pk — identity misuse falls under PECA 2016.
• Turn on two-factor authentication on your real accounts so it's harder to imitate you again.`,
    stalking: `What helps most:
• Log dates, times, screenshots, and platforms for every unwanted contact — patterns matter for a report.
• Tighten privacy settings and stop sharing real-time location publicly.
• Block only after you've saved the evidence, not before.
• Report to NCCIA (1799) — repeated unwanted monitoring or contact can qualify as cyber stalking.`,
    doxing: `Right away:
• Screenshot the post, the comments, and anything sharing your details, and note the link.
• Ask close contacts not to engage with or share the post further.
• Report the content to the platform directly, and to NCCIA if it's putting your safety at risk.
• Consider tightening what's publicly visible across your other accounts.`,
    unsafe: `If you are in immediate physical danger, please contact local emergency services or a trusted
adult near you right now — this chat can't reach you in real time.

Once you're safe: save evidence of what's happening, and call the Punjab Women's Helpline (1043) or the
NCCIA helpline (1799) — both are set up to guide you through the next step.`
  };

  const DEFAULT_FALLBACK = `I couldn't reach Gemini for a live answer, but here's the general guide path:
1. Save evidence (screenshots, links, usernames, dates) before you block anyone.
2. Secure your accounts — new passwords, two-factor authentication, tighter privacy settings.
3. Report through the official channel that fits: FIA (complaint.fia.gov.pk), NCCIA
   (complaint.nccia.gov.pk), or the Digital Rights Foundation helpdesk.
4. If you're in danger right now, use the Helplines page — help is one call away.

Connect a Gemini API key in Settings (⚙️) for a live, tailored answer to your exact situation.`;

  document.addEventListener("DOMContentLoaded", init);

  function uid(){ return "s-" + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

  function loadSessions(){
    try{ return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]"); }catch(e){ return []; }
  }
  function saveSessions(sessions){
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }

  function init(){
    const messagesEl = document.getElementById("chatMessages");
    const formEl     = document.getElementById("chatForm");
    const inputEl    = document.getElementById("chatInput");
    const historyListEl = document.getElementById("chatHistoryList");
    const newChatBtn = document.getElementById("newChatBtn");
    const titleEl    = document.getElementById("chatSessionTitle");

    if(!messagesEl || !formEl) return; // not on chatbot page

    const EMPTY_STATE_HTML = `
      <div class="chat-empty-state" id="chatEmptyState">
        <img src="assets/img/logo.png" alt="" />
        <p data-i18n="chat.greeting">Tell me what's happening — I'll walk you through saving evidence, securing your accounts, and reaching the right support channel.</p>
        <div class="quick-topics-row">
          <button class="quick-chip" data-quick-prompt="blackmail">🔒 <span data-i18n="chat.q.blackmail">Blackmailed</span></button>
          <button class="quick-chip" data-quick-prompt="fake">👤 <span data-i18n="chat.q.fake">Fake account</span></button>
          <button class="quick-chip" data-quick-prompt="stalking">👁️ <span data-i18n="chat.q.stalking">Being stalked</span></button>
          <button class="quick-chip" data-quick-prompt="doxing">📍 <span data-i18n="chat.q.doxing">Info shared</span></button>
          <button class="quick-chip" data-quick-prompt="unsafe">🚨 <span data-i18n="chat.q.unsafe">Unsafe now</span></button>
        </div>
      </div>`;

    let sessions = loadSessions();
    let activeId = null;
    let history = []; // { role: 'user'|'model', parts:[{text}] }
    let sessionStartLogged = {}; // sessionId -> bool, so "chatbot_started" only fires once per session

    function newSession(){
      const s = { id: uid(), title: "New Chat", messages: [], updatedAt: Date.now() };
      sessions.unshift(s);
      saveSessions(sessions);
      activeId = s.id;
      history = [];
      renderMessagesFromScratch();
      renderHistoryList();
    }

    function renderMessagesFromScratch(){
      messagesEl.innerHTML = EMPTY_STATE_HTML;
      if(titleEl) titleEl.setAttribute("data-i18n", "chat.newChatTitle");
      if(window.CH_I18N) window.CH_I18N.apply();
      else if(titleEl) titleEl.textContent = "New Chat";
    }

    function loadSession(id){
      const s = sessions.find(x => x.id === id);
      if(!s) return;
      activeId = id;
      history = s.messages.map(m => ({ role: m.role, parts:[{ text: m.text }] }));
      messagesEl.innerHTML = "";
      if(s.messages.length === 0){
        renderMessagesFromScratch();
      } else {
        s.messages.forEach(m => appendMessageEl(m.role === "user" ? "user" : "bot", m.text));
      }
      if(titleEl){ titleEl.removeAttribute("data-i18n"); titleEl.textContent = s.title || "Chat"; }
      sessionStartLogged[id] = s.messages.length > 0; // already-logged sessions won't re-fire the start email
      renderHistoryList();
    }

    function renderHistoryList(){
      if(!historyListEl) return;
      if(sessions.length === 0){
        historyListEl.innerHTML = `<div class="history-empty">No conversations yet — start typing below.</div>`;
        return;
      }
      historyListEl.innerHTML = sessions.map(s => `
        <div class="history-item ${s.id === activeId ? "is-active" : ""}" data-session="${s.id}">
          <div class="history-item-title">${escapeHtml(s.title || "New Chat")}</div>
          <div class="history-item-date">${new Date(s.updatedAt).toLocaleString()}</div>
          <button class="history-item-delete" data-delete-session="${s.id}" aria-label="Delete conversation">
            <svg class="svg-icon stroke" viewBox="0 0 24 24" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `).join("");
      historyListEl.querySelectorAll("[data-session]").forEach(el=>{
        el.addEventListener("click", (e)=>{
          if(e.target.closest("[data-delete-session]")) return;
          loadSession(el.getAttribute("data-session"));
        });
      });
      historyListEl.querySelectorAll("[data-delete-session]").forEach(btn=>{
        btn.addEventListener("click", (e)=>{
          e.stopPropagation();
          const id = btn.getAttribute("data-delete-session");
          sessions = sessions.filter(s => s.id !== id);
          saveSessions(sessions);
          if(activeId === id){
            if(sessions.length){ loadSession(sessions[0].id); } else { newSession(); }
          } else {
            renderHistoryList();
          }
        });
      });
    }

    function persistCurrentSession(){
      let s = sessions.find(x => x.id === activeId);
      if(!s){
        s = { id: activeId || uid(), title: "New Chat", messages: [], updatedAt: Date.now() };
        activeId = s.id;
        sessions.unshift(s);
      }
      s.messages = history.map(h => ({ role: h.role === "user" ? "user" : "model", text: h.parts[0].text }));
      const firstUserMsg = s.messages.find(m => m.role === "user");
      if(firstUserMsg) s.title = firstUserMsg.text.slice(0, 46) + (firstUserMsg.text.length > 46 ? "…" : "");
      s.updatedAt = Date.now();
      saveSessions(sessions);
      if(titleEl){ titleEl.removeAttribute("data-i18n"); titleEl.textContent = s.title; }
      renderHistoryList();
    }

    newChatBtn && newChatBtn.addEventListener("click", newSession);

    if(sessions.length){
      loadSession(sessions[0].id);
    } else {
      newSession();
    }

    messagesEl.addEventListener("click", (e)=>{
      const btn = e.target.closest("[data-quick-prompt]");
      if(!btn) return;
      const topic = btn.getAttribute("data-quick-prompt");
      const text = QUICK_PROMPTS[topic] || btn.textContent.trim();
      guardedSend(text, topic);
    });

    formEl.addEventListener("submit", (e)=>{
      e.preventDefault();
      const text = inputEl.value.trim();
      if(!text) return;
      guardedSend(text, null);
    });

    // The email/consent gate: first send of any session waits for
    // consent (submit.js), then proceeds. Subsequent sends in the
    // same browser go straight through since consent is remembered.
    function guardedSend(text, topicKey){
      if(window.CH_SUBMIT){
        window.CH_SUBMIT.requireConsent(()=>{
          inputEl.value = "";
          sendMessage(text, topicKey);
        }, inputEl);
      } else {
        inputEl.value = "";
        sendMessage(text, topicKey);
      }
    }

    async function sendMessage(text, topicKey){
      appendMessageEl("user", text);
      history.push({ role:"user", parts:[{ text }] });
      persistCurrentSession();
      const typingId = addTyping();

      const key = localStorage.getItem(KEY_STORAGE);
      const model = localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL;

      let reply;
      try{
        if(!key) throw new Error("no-key");
        reply = await callGemini(key, model, history);
      }catch(err){
        reply = (topicKey && FALLBACK_REPLIES[topicKey]) ? FALLBACK_REPLIES[topicKey] : DEFAULT_FALLBACK;
        if(key && err.message !== "no-key"){
          reply = `Gemini couldn't answer that just now (${err.message}). Here's the standard guide instead:\n\n${reply}`;
        }
      }

      removeTyping(typingId);
      appendMessageEl("bot", reply);
      history.push({ role:"model", parts:[{ text: reply }] });
      persistCurrentSession();
      logToBackend(text, reply);
    }

    function logToBackend(userText, botReply){
      if(!window.CH_SUBMIT) return;
      const email = window.CH_SUBMIT.getEmail();
      if(!email) return; // no consent given — nothing leaves the device

      if(!sessionStartLogged[activeId]){
        sessionStartLogged[activeId] = true;
        window.CH_SUBMIT.send("chatbot_started", { sessionId: activeId });
      }
      window.CH_SUBMIT.send("chatbot_conversation", {
        sessionId: activeId, userMessage: userText, assistantReply: botReply
      });
    }

    async function callGemini(key, model, historyTurns){
      const lang = localStorage.getItem(LANG_KEY) || "en";
      const langName = LANG_NAMES[lang] || "English";
      const sys = SYSTEM_INSTRUCTION_BASE + (lang !== "en" ? `\n\nReply in ${langName}, unless the person writes in a different language — then match their language.` : "");
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      const body = {
        systemInstruction: { role:"system", parts:[{ text: sys }] },
        contents: historyTurns,
        generationConfig: { temperature:0.6, maxOutputTokens:420 }
      };
      const res = await fetch(url, {
        method:"POST",
        headers:{ "Content-Type":"application/json", "x-goog-api-key": key },
        body: JSON.stringify(body)
      });
      if(!res.ok){
        let msg = "request failed (" + res.status + ")";
        try{ const j = await res.json(); if(j?.error?.message) msg = j.error.message; }catch(e){}
        throw new Error(msg);
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.map(p=>p.text).join("") || "";
      if(!text) throw new Error("empty response");
      return text;
    }

    function appendMessageEl(role, text){
      const emptyState = document.getElementById("chatEmptyState");
      if(emptyState) emptyState.remove();
      const row = document.createElement("div");
      row.className = "msg-row " + (role === "user" ? "user" : "bot");
      const avatar = document.createElement("div");
      avatar.className = "msg-avatar";
      avatar.innerHTML = role === "user"
        ? '<svg class="svg-icon stroke" viewBox="0 0 24 24" width="15" height="15"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1.6-3.6 5-5.5 7.5-5.5s5.9 1.9 7.5 5.5"/></svg>'
        : '<img src="assets/img/logo.png" alt="" />';
      const bubble = document.createElement("div");
      bubble.className = "msg " + (role === "user" ? "user" : "bot");
      bubble.innerHTML = formatText(text);
      if(role === "user"){ row.appendChild(bubble); row.appendChild(avatar); }
      else { row.appendChild(avatar); row.appendChild(bubble); }
      messagesEl.appendChild(row);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function addTyping(){
      const row = document.createElement("div");
      const id = "typing-" + Date.now();
      row.id = id;
      row.className = "msg-row bot";
      row.innerHTML = '<div class="msg-avatar"><img src="assets/img/logo.png" alt="" /></div><div class="msg bot"><span class="typing-dots"><span></span><span></span><span></span></span></div>';
      messagesEl.appendChild(row);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return id;
    }
    function removeTyping(id){
      const el = document.getElementById(id);
      if(el) el.remove();
    }

    function escapeHtml(s){
      return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    }

    function formatText(text){
      const esc = escapeHtml(text);
      const lines = esc.split("\n");
      let html = "";
      let inList = false;
      lines.forEach(line=>{
        const trimmed = line.trim();
        if(/^[•\-\*]\s+/.test(trimmed)){
          if(!inList){ html += "<ul>"; inList = true; }
          html += "<li>" + trimmed.replace(/^[•\-\*]\s+/, "") + "</li>";
        } else if(/^\d+[\.\)]\s+/.test(trimmed)){
          if(!inList){ html += "<ul>"; inList = true; }
          html += "<li>" + trimmed.replace(/^\d+[\.\)]\s+/, "") + "</li>";
        } else {
          if(inList){ html += "</ul>"; inList = false; }
          if(trimmed) html += "<p>" + trimmed + "</p>";
        }
      });
      if(inList) html += "</ul>";
      return html || esc;
    }
  }
})();
