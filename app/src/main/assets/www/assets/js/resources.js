// ============================================================
// CYBER HAYAT — Resources page tools
// Incident reports, ambassador signups, story submissions, and
// complaint-letter saves go to the org's Google Sheet via the
// Apps Script backend (assets/js/submit.js), gated behind the
// one-time email/consent modal. Checklist, password quiz, and
// letter generation/download stay fully local — no data leaves
// the browser until the person explicitly submits something.
// ============================================================
(function(){
  "use strict";

  function $(id){ return document.getElementById(id); }
  function downloadText(filename, text){
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
  function genId(prefix){
    return prefix + "-" + Math.random().toString(36).slice(2,6).toUpperCase() + "-" + Date.now().toString(36).slice(-4).toUpperCase();
  }
  function withConsent(triggerEl, fn){
    if(window.CH_SUBMIT){
      window.CH_SUBMIT.requireConsent(fn, triggerEl);
    } else {
      fn(null);
    }
  }

  document.addEventListener("DOMContentLoaded", ()=>{

    /* ---------------- 01 Incident report ---------------- */
    const incSaveBtn = $("incSaveBtn"), incExportBtn = $("incExportBtn"), incResult = $("incResult");
    let lastDraft = null;
    incSaveBtn && incSaveBtn.addEventListener("click", ()=>{
      const type = $("incType").value;
      const ack = $("incAck").checked;
      if(!type){ incResult.textContent = "Please choose a harassment type first."; return; }
      if(!ack){ incResult.textContent = "Please confirm the acknowledgement checkbox."; return; }

      withConsent(incSaveBtn, async ()=>{
        const id = genId("CH-CASE");
        const draft = {
          caseId: id, harassmentType: type, platform: $("incPlatform").value, incidentDate: $("incDate").value,
          contact: $("incContact").value, description: $("incDesc").value
        };
        localStorage.setItem("ch_incident_" + id, JSON.stringify({ ...draft, savedAt: new Date().toISOString() }));
        lastDraft = draft;
        incResult.textContent = `Submitted. Your case reference is ${id} — a confirmation is on its way to your email.`;
        const res = await window.CH_SUBMIT.send("incident_report", draft);
        if(res && res.offline){
          incResult.textContent += " (Saved on this device — the support-team backend isn't connected yet.)";
        } else if(res && res.ok === false){
          window.CH_SUBMIT.toast("Couldn't reach the support team backend — your case ID is still saved locally.", "error");
        } else {
          window.CH_SUBMIT.toast("Report sent — check your email for confirmation.");
        }
      });
    });
    incExportBtn && incExportBtn.addEventListener("click", ()=>{
      const d = lastDraft;
      if(!d){ incResult.textContent = "Submit a report first, then download a copy."; return; }
      const text = `CYBER HAYAT — INCIDENT REPORT
Case reference: ${d.caseId}
Harassment type: ${d.harassmentType}
Platform: ${d.platform || "—"}
Approximate date: ${d.incidentDate || "—"}
Alternate contact: ${d.contact || "—"}

Description:
${d.description || "—"}
`;
      downloadText(d.caseId + ".txt", text);
    });

    /* ---------------- 02 Case tracker (local lookup) ---------------- */
    const trackBtn = $("trackBtn"), trackInput = $("trackInput"), trackResult = $("trackResult");
    trackBtn && trackBtn.addEventListener("click", ()=>{
      const id = (trackInput.value || "").trim();
      if(!id){ trackResult.textContent = "Enter a case reference or official number first."; return; }
      const local = localStorage.getItem("ch_incident_" + id);
      if(local){
        const d = JSON.parse(local);
        trackResult.textContent = `Found on this device — ${d.harassmentType}, submitted ${new Date(d.savedAt).toLocaleString()}. Our support team has a copy on file; they'll reach out by email if they need more information.`;
      } else if(/^[a-z0-9\-]{4,}$/i.test(id)){
        trackResult.textContent = `No local record matches "${id}" on this device. If this is an official FIA/NCCIA acknowledgement number, please track it directly through their portal.`;
      } else {
        trackResult.textContent = "That doesn't look like a valid reference. Double-check and try again.";
      }
    });

    /* ---------------- 05 Evidence checklist generator (local) ---------------- */
    const CHECKLISTS = {
      stalking: ["Screenshot every unwanted message with timestamps.","Log the platforms and accounts used to contact you.","Note any real-world locations mentioned or implied.","Save location-sharing or tagging patterns that suggest tracking.","Record dates of repeated contact to show a pattern."],
      blackmail: ["Save the threatening messages and any deadlines mentioned.","Screenshot the account/profile making the threat.","Save any payment demands, wallet addresses, or account numbers.","Do not send more content or make any payment.","Note every platform the threat has appeared on."],
      fake: ["Screenshot the fake profile's photo, bio, and posts.","Copy the exact profile URL.","Screenshot any messages sent from the fake account.","List real contacts who may have been contacted by the impersonator.","Report inside the platform in addition to saving evidence."],
      doxing: ["Screenshot the post exposing your information.","Save the direct link before it can be deleted.","Screenshot supporting comments or shares that spread it.","Note which specific details were exposed (address, number, photos).","Ask trusted contacts not to engage with or reshare the post."],
      bullying: ["Screenshot every bullying message or post.","Save usernames and platform names involved.","Note dates/times to show frequency or escalation.","Keep any group chat context that shows coordinated bullying.","Avoid replying publicly — document, then report."]
    };
    const checklistBtn = $("checklistBtn"), checklistResult = $("checklistResult");
    checklistBtn && checklistBtn.addEventListener("click", ()=>{
      const type = $("checklistType").value;
      const items = CHECKLISTS[type] || [];
      checklistResult.innerHTML = "<strong>Evidence checklist:</strong><ul style='margin-top:.5rem;padding-left:1.1rem;'>" +
        items.map(i => `<li style="margin-bottom:.35rem;">${i}</li>`).join("") + "</ul>";
    });

    /* ---------------- 06 Password + security quiz (fully local) ---------------- */
    const pwInput = $("pwInput"), pwResult = $("pwResult");
    pwInput && pwInput.addEventListener("input", ()=>{
      const v = pwInput.value;
      if(!v){ pwResult.textContent = "Password feedback will appear here."; return; }
      let score = 0;
      if(v.length >= 8) score++;
      if(v.length >= 12) score++;
      if(/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
      if(/[0-9]/.test(v)) score++;
      if(/[^A-Za-z0-9]/.test(v)) score++;
      const labels = ["Very weak","Weak","Fair","Good","Strong","Very strong"];
      const label = labels[score];
      const tips = [];
      if(v.length < 12) tips.push("use at least 12 characters");
      if(!/[^A-Za-z0-9]/.test(v)) tips.push("add a symbol");
      if(!/[0-9]/.test(v)) tips.push("add a number");
      if(!(/[A-Z]/.test(v) && /[a-z]/.test(v))) tips.push("mix upper and lower case");
      pwResult.textContent = `${label}.` + (tips.length ? " Try to " + tips.join(", ") + "." : " Nicely done.");
    });

    const quizChecks = document.querySelectorAll(".quiz-check");
    const quizResult = $("quizResult");
    function updateQuiz(){
      const total = quizChecks.length;
      const checked = Array.from(quizChecks).filter(c=>c.checked).length;
      const pct = Math.round((checked/total)*100);
      quizResult.textContent = `Security score: ${checked}/${total} (${pct}%). ` +
        (pct === 100 ? "Excellent account hygiene." : pct >= 50 ? "Good start — close the remaining gaps when you can." : "Consider tightening these settings soon.");
    }
    quizChecks.forEach(c => c.addEventListener("change", updateQuiz));

    /* ---------------- 07 Complaint letter (local generator + optional save) ---------------- */
    const ltGenBtn = $("ltGenBtn"), ltDownloadBtn = $("ltDownloadBtn"), ltSendBtn = $("ltSendBtn"), ltResult = $("ltResult");
    function letterFields(){
      return {
        name: $("ltName").value || "[Your name]",
        city: $("ltCity").value || "[City]",
        incidentType: $("ltType").value || "[Incident type]",
        platform: $("ltPlatform").value || "[Platform]",
        account: $("ltAccount").value || "[Account/number involved]",
        incidentDate: $("ltDate").value || "[Date]",
        summary: $("ltSummary").value || "[Brief summary of what happened]",
        evidence: $("ltEvidence").value || "[List of screenshots, links, dates]"
      };
    }
    function buildLetter(f){
      return `To: [Relevant Officer / NCCIA / FIA Cyber Crime Wing]
From: ${f.name}, ${f.city}

Subject: Complaint regarding ${f.incidentType} on ${f.platform}

Respected Sir/Madam,

I am writing to formally report an incident of ${f.incidentType} that occurred on ${f.platform} on or around ${f.incidentDate}, involving the account/number: ${f.account}.

Summary of incident:
${f.summary}

Evidence attached/available:
${f.evidence}

I request that appropriate action be taken under the relevant provisions of the Prevention of Electronic Crimes Act (PECA) 2016, and that I be kept informed of the progress of this complaint.

Sincerely,
${f.name}
`;
    }
    ltGenBtn && ltGenBtn.addEventListener("click", ()=>{ ltResult.textContent = buildLetter(letterFields()); });
    ltDownloadBtn && ltDownloadBtn.addEventListener("click", ()=>{
      downloadText("cyber-hayat-complaint-letter.txt", buildLetter(letterFields()));
    });
    ltSendBtn && ltSendBtn.addEventListener("click", ()=>{
      withConsent(ltSendBtn, async ()=>{
        const f = letterFields();
        const res = await window.CH_SUBMIT.send("complaint_letter", f);
        ltResult.textContent = buildLetter(f);
        if(res && res.offline){
          window.CH_SUBMIT.toast("Saved on this device — the support-team backend isn't connected yet.");
        } else if(res && res.ok === false){
          window.CH_SUBMIT.toast("Couldn't reach the support team backend.", "error");
        } else {
          window.CH_SUBMIT.toast("A copy was sent to our support team and your email.");
        }
      });
    });

    /* ---------------- 08 Stories + ambassador signup ---------------- */
    const storyBtn = $("storyBtn"), storyResult = $("storyResult");
    storyBtn && storyBtn.addEventListener("click", ()=>{
      const theme = $("storyTheme").value, outcome = $("storyOutcome").value, draft = $("storyDraft").value;
      if(!draft){ storyResult.textContent = "Write a short story before sending."; return; }
      withConsent(storyBtn, async ()=>{
        const res = await window.CH_SUBMIT.send("story_submission", { theme, outcome, story: draft });
        storyResult.textContent = "Thank you for sharing — your story has been sent to our team.";
        $("storyDraft").value = "";
        if(res && res.offline) window.CH_SUBMIT.toast("Saved locally — backend not connected yet.");
        else if(res && res.ok === false) window.CH_SUBMIT.toast("Couldn't reach the backend just now.", "error");
        else window.CH_SUBMIT.toast("Story sent — thank you.");
      });
    });

    const ambBtn = $("ambBtn"), ambResult = $("ambResult");
    ambBtn && ambBtn.addEventListener("click", ()=>{
      const name = $("ambName").value;
      if(!name){ ambResult.textContent = "Please add your name to apply."; return; }
      withConsent(ambBtn, async ()=>{
        const payload = { name, university: $("ambUni").value, city: $("ambCity").value, contact: $("ambContact").value, why: $("ambWhy").value };
        const res = await window.CH_SUBMIT.send("ambassador_signup", payload);
        ambResult.textContent = `Thanks, ${name} — your application has been sent to our team.`;
        if(res && res.offline) window.CH_SUBMIT.toast("Saved locally — backend not connected yet.");
        else if(res && res.ok === false) window.CH_SUBMIT.toast("Couldn't reach the backend just now.", "error");
        else window.CH_SUBMIT.toast("Application sent — check your email.");
      });
    });

  });
})();
