// ============================================================
// CYBER HAYAT — i18n engine
// Translates every element carrying data-i18n / data-i18n-placeholder
// across the site when the language is changed in Settings.
//
// Full interface coverage: English (en) and Urdu (ur).
// Growing coverage: Sindhi (sd), Punjabi (pa), Pashto (ps) — core
// navigation, chrome, and chatbot strings are translated; long-form
// page copy still falls back to English until reviewed.
// Balochi (bal), Saraiki (skr), Hindko (hns), Brahui (brh) currently
// apply to the Chatbot's Gemini replies only (Gemini speaks these
// natively) — interface translation for them is not yet available.
// ============================================================
(function(){
  "use strict";

  const LANG_KEY = "ch_lang";
  const RTL_LANGS = ["ur","sd","pa","ps","bal","skr","hns","brh"];
  const FULL_UI_LANGS = ["en","ur","sd","pa","ps"];

  const DICTS = {

    en: {
      "nav.home":"Home", "nav.guide":"Guide", "nav.chatbot":"Chatbot",
      "nav.resources":"Resources", "nav.helplines":"Helplines",
      "cta.helplines":"Helplines", "cta.getHelp":"Get Help Now",
      "footer.tagline":"A student-led cyber safety initiative from the University of Central Punjab, helping people recognize cyber harassment, protect evidence, and reach the right support channels in Pakistan.",
      "footer.platform":"Platform", "footer.organization":"Organization", "footer.urgent":"Urgent",
      "footer.legalRights":"Legal Rights", "footer.copyright":"© 2026 Cyber Hayat PK · Students of University of Central Punjab. Stay safe. Protect yourself.",
      "footer.privacy":"Privacy Policy", "footer.terms":"Terms of Use",
      "settings.title":"Settings", "settings.appearance":"Appearance",
      "settings.darkMode":"Dark mode", "settings.darkModeSub":"Darkens the theme across the site.",
      "settings.language":"Language", "settings.languageLabel":"Assistant & interface language",
      "settings.languageHint":"Changes the site interface and the language the Chatbot replies in.",
      "settings.gemini":"Gemini AI Connection", "settings.geminiKeyLabel":"Your Gemini API key",
      "settings.geminiKeyHint":"Stored only in this browser. Get a free key at Google AI Studio.",
      "settings.modelLabel":"Model", "settings.save":"Save", "settings.clear":"Clear",
      "settings.notConnected":"Not connected — guide-only mode",
      "settings.connected":"Connected — live Gemini answers enabled",
      "settings.account":"Account & Chat History Sync",
      "settings.accountNote":"Sign in with Google to sync your chatbot history to a Google Sheet you control. This needs a one-time setup by the site admin: a Google OAuth Client ID and a target Sheet ID.",
      "settings.clientIdLabel":"Google OAuth Client ID", "settings.sheetIdLabel":"Google Sheet ID",
      "settings.saveConfig":"Save Config",
      "settings.footNote":"Dark mode, language, and your Gemini key are stored only in this browser. Chat records and form submissions are handled separately by the Cyber Hayat support team — see the Privacy Policy for details.",
      "chat.title":"Cyber Hayat Assistant",
      "chat.subtitle":"Private guidance for cyber harassment — powered by Gemini, connected in Settings ⚙️",
      "chat.monitored":"Monitored for urgent cases",
      "chat.footHint":"Conversations may be reviewed by our support team for urgent cases.",
      "chat.newChat":"New chat", "chat.newChatTitle":"New Chat",
      "chat.signIn":"Sign in with Google", "chat.signOut":"Sign out",
      "chat.confidential":"Reviewed for safety · not public",
      "chat.greeting":"Tell me what's happening — I'll walk you through saving evidence, securing your accounts, and reaching the right support channel.",
      "chat.q.blackmail":"Blackmailed", "chat.q.fake":"Fake account", "chat.q.stalking":"Being stalked",
      "chat.q.doxing":"Info shared", "chat.q.unsafe":"Unsafe now",
      "chat.inputPlaceholder":"Type your question…",
      "chat.footnote":"🔒 A record of this chat is kept by our support team for your safety.",
      "chat.dangerLink":"In danger right now? Go to Helplines →",
      "hero.home.eyebrow":"Awareness & Defense",
      "hero.guide.eyebrow":"Watch & Learn", "hero.guide.title":"The Cyber Hayat Awareness Guide",
      "hero.resources.eyebrow":"Cyber Safety Action Center", "hero.resources.title":"Practical tools for every step of the process.",
      "hero.helplines.eyebrow":"Urgent Contacts", "hero.helplines.title":"Help is one call away.",
      "hero.privacy.eyebrow":"Your Data", "hero.privacy.title":"Privacy Policy",
      "hero.terms.eyebrow":"Using This Platform", "hero.terms.title":"Terms of Use"
    },

    ur: {
      "nav.home":"ہوم", "nav.guide":"رہنما", "nav.chatbot":"چیٹ بوٹ",
      "nav.resources":"وسائل", "nav.helplines":"ہیلپ لائنز",
      "cta.helplines":"ہیلپ لائنز", "cta.getHelp":"ابھی مدد لیں",
      "footer.tagline":"یونیورسٹی آف سنٹرل پنجاب کے طلبہ کی جانب سے ایک سائبر سیفٹی مہم، جو لوگوں کو سائبر ہراسانی پہچاننے، ثبوت محفوظ کرنے، اور پاکستان میں درست مدد تک پہنچنے میں مدد دیتی ہے۔",
      "footer.platform":"پلیٹ فارم", "footer.organization":"تنظیم", "footer.urgent":"ہنگامی",
      "footer.legalRights":"قانونی حقوق", "footer.copyright":"© 2026 سائبر حیات پی کے · یونیورسٹی آف سنٹرل پنجاب کے طلبہ۔ محفوظ رہیں، اپنی حفاظت کریں۔",
      "footer.privacy":"پرائیویسی پالیسی", "footer.terms":"شرائطِ استعمال",
      "settings.title":"سیٹنگز", "settings.appearance":"ظاہری شکل",
      "settings.darkMode":"ڈارک موڈ", "settings.darkModeSub":"پوری ویب سائٹ کا تھیم گہرا کر دیتا ہے۔",
      "settings.language":"زبان", "settings.languageLabel":"اسسٹنٹ اور انٹرفیس کی زبان",
      "settings.languageHint":"ویب سائٹ کا انٹرفیس اور چیٹ بوٹ کے جوابات کی زبان تبدیل کرتا ہے۔",
      "settings.gemini":"جیمینائی اے آئی کنکشن", "settings.geminiKeyLabel":"آپ کی جیمینائی اے پی آئی کی",
      "settings.geminiKeyHint":"صرف اسی براؤزر میں محفوظ ہوتی ہے۔ مفت کی Google AI Studio سے حاصل کریں۔",
      "settings.modelLabel":"ماڈل", "settings.save":"محفوظ کریں", "settings.clear":"صاف کریں",
      "settings.notConnected":"منسلک نہیں — صرف رہنما موڈ",
      "settings.connected":"منسلک ہے — براہ راست جیمینائی جوابات فعال",
      "settings.account":"اکاؤنٹ اور چیٹ ہسٹری سنک",
      "settings.accountNote":"اپنی چیٹ بوٹ ہسٹری کو اپنی Google Sheet کے ساتھ سنک کرنے کے لیے Google سے سائن ان کریں۔ اس کے لیے سائٹ ایڈمن کو ایک بار Google OAuth Client ID اور ایک Sheet ID سیٹ اپ کرنا ہوگا۔",
      "settings.clientIdLabel":"Google OAuth Client ID", "settings.sheetIdLabel":"Google Sheet ID",
      "settings.saveConfig":"کنفیگ محفوظ کریں",
      "settings.footNote":"ڈارک موڈ، زبان، اور آپ کی جیمینائی کی صرف اسی براؤزر میں محفوظ ہوتی ہے۔ چیٹ ریکارڈز اور فارم جمع کرائے گئے ڈیٹا کو سائبر حیات سپورٹ ٹیم علیحدہ طور پر سنبھالتی ہے — تفصیلات کے لیے پرائیویسی پالیسی دیکھیں۔",
      "chat.title":"سائبر حیات اسسٹنٹ",
      "chat.subtitle":"سائبر ہراسانی کے لیے نجی رہنمائی — جیمینائی سے تقویت یافتہ، سیٹنگز ⚙️ میں منسلک کریں",
      "chat.monitored":"ہنگامی کیسز کے لیے نگرانی کی جاتی ہے",
      "chat.footHint":"ہنگامی کیسز کے لیے گفتگو ہماری سپورٹ ٹیم دیکھ سکتی ہے۔",
      "chat.newChat":"نئی چیٹ", "chat.newChatTitle":"نئی چیٹ",
      "chat.signIn":"Google سے سائن ان کریں", "chat.signOut":"سائن آؤٹ",
      "chat.confidential":"حفاظتی جائزہ · عوامی نہیں",
      "chat.greeting":"مجھے بتائیں کیا ہو رہا ہے — میں آپ کو ثبوت محفوظ کرنے، اکاؤنٹس محفوظ بنانے، اور درست مدد تک پہنچنے میں رہنمائی دوں گا۔",
      "chat.q.blackmail":"بلیک میل", "chat.q.fake":"جعلی اکاؤنٹ", "chat.q.stalking":"پیچھا کرنا",
      "chat.q.doxing":"معلومات لیک", "chat.q.unsafe":"ابھی غیر محفوظ",
      "chat.inputPlaceholder":"اپنا سوال لکھیں…",
      "chat.footnote":"🔒 اس چیٹ کا ریکارڈ ہماری سپورٹ ٹیم آپ کی حفاظت کے لیے رکھتی ہے۔",
      "chat.dangerLink":"ابھی خطرے میں ہیں؟ ہیلپ لائنز پر جائیں ←",
      "hero.home.eyebrow":"آگاہی اور تحفظ",
      "hero.guide.eyebrow":"دیکھیں اور سیکھیں", "hero.guide.title":"سائبر حیات آگاہی رہنما",
      "hero.resources.eyebrow":"سائبر سیفٹی ایکشن سینٹر", "hero.resources.title":"ہر مرحلے کے لیے عملی اوزار۔",
      "hero.helplines.eyebrow":"ہنگامی رابطے", "hero.helplines.title":"مدد صرف ایک کال کی دوری پر ہے۔",
      "hero.privacy.eyebrow":"آپ کا ڈیٹا", "hero.privacy.title":"پرائیویسی پالیسی",
      "hero.terms.eyebrow":"اس پلیٹ فارم کا استعمال", "hero.terms.title":"شرائطِ استعمال"
    },

    sd: {
      "nav.home":"گھر", "nav.guide":"گائيڊ", "nav.chatbot":"چيٽ بوٽ",
      "nav.resources":"وسيلا", "nav.helplines":"مدد لائينون",
      "cta.helplines":"مدد لائينون", "cta.getHelp":"ھاڻي مدد وٺو",
      "footer.platform":"پليٽ فارم", "footer.organization":"تنظيم", "footer.urgent":"عاجل",
      "footer.legalRights":"قانوني حق", "footer.privacy":"رازداري پاليسي", "footer.terms":"استعمال جون شرطون",
      "settings.title":"سيٽنگون", "settings.appearance":"ظاھري شڪل",
      "settings.darkMode":"ڊارڪ موڊ", "settings.darkModeSub":"سڄي ويب سائيٽ جو رنگ ڪارو ڪري ٿو۔",
      "settings.language":"ٻولي", "settings.languageLabel":"اسسٽنٽ ۽ انٽرفيس جي ٻولي",
      "settings.save":"سيڊ ڪريو", "settings.clear":"صاف ڪريو",
      "chat.title":"سائبر حيات اسسٽنٽ",
      "chat.newChat":"نئين چيٽ", "chat.newChatTitle":"نئين چيٽ",
      "chat.signIn":"Google سان سائن ان ڪريو", "chat.signOut":"سائن آئوٽ",
      "chat.greeting":"ٻڌايو ڇا پيو ٿئي — مان توهان کي ثبوت سانڀڻ، اڪائونٽ محفوظ ڪرڻ، ۽ صحيح مدد تائين پھچڻ ۾ رھنمائي ڪندس۔",
      "chat.inputPlaceholder":"پنھنجو سوال لکو…",
      "hero.helplines.title":"مدد فقط ھڪ ڪال جي مفاصلي تي آھي۔"
    },

    pa: {
      "nav.home":"گھر", "nav.guide":"گائیڈ", "nav.chatbot":"چیٹ بوٹ",
      "nav.resources":"وسیلے", "nav.helplines":"ہیلپ لائناں",
      "cta.helplines":"ہیلپ لائناں", "cta.getHelp":"ہُنے مدد لَوو",
      "footer.platform":"پلیٹ فارم", "footer.organization":"تنظیم", "footer.urgent":"ہنگامی",
      "footer.legalRights":"قانونی حق", "footer.privacy":"پرائیویسی پالیسی", "footer.terms":"شرطاں",
      "settings.title":"سیٹنگز", "settings.appearance":"دِکھ",
      "settings.darkMode":"ڈارک موڈ", "settings.darkModeSub":"ساری ویب سائٹ دا تھیم ہنیرا کر دیندا اے۔",
      "settings.language":"بولی", "settings.languageLabel":"اسسٹنٹ تے انٹرفیس دی بولی",
      "settings.save":"سیو کرو", "settings.clear":"صاف کرو",
      "chat.title":"سائبر حیات اسسٹنٹ",
      "chat.newChat":"نویں چیٹ", "chat.newChatTitle":"نویں چیٹ",
      "chat.signIn":"Google نال سائن ان کرو", "chat.signOut":"سائن آؤٹ",
      "chat.greeting":"دَسو کی ہو رہیا اے — میں تہانوں ثبوت سنبھالݨ، اکاؤنٹ محفوظ کرن، تے صحیح مدد تک پہنچݨ وچ رہنمائی کراں گا۔",
      "chat.inputPlaceholder":"اپݨا سوال لکھو…",
      "hero.helplines.title":"مدد بس اک کال دوری تے اے۔"
    },

    ps: {
      "nav.home":"کور", "nav.guide":"لارښود", "nav.chatbot":"چیټ بوټ",
      "nav.resources":"سرچینې", "nav.helplines":"مرستې لاینونه",
      "cta.helplines":"مرستې لاینونه", "cta.getHelp":"اوس مرسته واخلئ",
      "footer.platform":"پلیټ فارم", "footer.organization":"سازمان", "footer.urgent":"بيړنی",
      "footer.legalRights":"قانوني حقونه", "footer.privacy":"محرمیت تګلاره", "footer.terms":"د کارونې شرایط",
      "settings.title":"ترتیبات", "settings.appearance":"بڼه",
      "settings.darkMode":"تیاره حالت", "settings.darkModeSub":"د ټول سایټ موضوع تیارږي۔",
      "settings.language":"ژبه", "settings.languageLabel":"د مرستیال او انٹرفیس ژبه",
      "settings.save":"خوندي کړئ", "settings.clear":"پاک کړئ",
      "chat.title":"د سایبر حیات مرستیال",
      "chat.newChat":"نوی خبرې اترې", "chat.newChatTitle":"نوی خبرې اترې",
      "chat.signIn":"د Google سره ننوځئ", "chat.signOut":"وتل",
      "chat.greeting":"ما ته ووایاست چې څه روان دي — زه به تاسو سره د شواهدو ساتلو، حسابونو خوندي کولو، او سمې مرستې ته رسیدو کې لارښوونه وکړم۔",
      "chat.inputPlaceholder":"خپل پوښتنه ولیکئ…",
      "hero.helplines.title":"مرسته یوازې یو زنګ لرې ده۔"
    }
  };

  function getLang(){ return localStorage.getItem(LANG_KEY) || "en"; }

  function translate(key, lang){
    const dict = DICTS[lang] || DICTS.en;
    return dict[key] || DICTS.en[key] || null;
  }

  function apply(){
    const lang = getLang();
    const isRtl = RTL_LANGS.includes(lang);
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");
    document.documentElement.classList.toggle("ch-rtl", isRtl);

    document.querySelectorAll("[data-i18n]").forEach(el=>{
      const key = el.getAttribute("data-i18n");
      const text = translate(key, lang);
      if(text !== null) el.textContent = text;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>{
      const key = el.getAttribute("data-i18n-placeholder");
      const text = translate(key, lang);
      if(text !== null) el.setAttribute("placeholder", text);
    });

    updateLanguageBanner(lang);
  }

  function updateLanguageBanner(lang){
    let banner = document.getElementById("langCoverageBanner");
    if(!FULL_UI_LANGS.includes(lang) || lang === "en"){
      if(banner) banner.remove();
      return;
    }
    // Full-UI languages beyond English still show nothing extra;
    // only warn for chatbot-only languages.
    if(banner) banner.remove();
  }

  function updateChatOnlyBanner(){
    const lang = getLang();
    let banner = document.getElementById("langCoverageBanner");
    const chatOnly = ["bal","skr","hns","brh"];
    if(chatOnly.includes(lang)){
      if(!banner){
        banner = document.createElement("div");
        banner.id = "langCoverageBanner";
        banner.className = "notice-box";
        banner.style.cssText = "position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:150;max-width:34rem;margin-inline:auto;";
        document.body.appendChild(banner);
      }
      banner.textContent = "This language currently applies to Chatbot replies only — the site interface will show in English until translation is reviewed.";
    } else if(banner){
      banner.remove();
    }
  }

  window.CH_I18N = { apply, translate, getLang, LANGS: DICTS };

  document.addEventListener("DOMContentLoaded", ()=>{
    apply();
    updateChatOnlyBanner();
    document.addEventListener("ch:lang-changed", ()=>{ apply(); updateChatOnlyBanner(); });
  });
})();
