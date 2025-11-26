const GROQ_API_KEY = ""; // Substitua pela sua chave
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// const patterns = [
//   // typosquatting Steam Community
//   "steammcommunity","steamcomnunity","steamcommunnity","steamcommunlty",
//   "steamcommuity","steamcommun1ty","steancommunity","stearncommunity",

//   // login / steam guard falsos
//   "steam-secure","steam-security","steam-safe","steamverify","steam-verification",
//   "steamguard-reset","steamguard-support","steam-auth","steamlogin","mobile-steamguard",

//   // trade scam
//   "tradeoffer-secure","tradeoffer-confirm","tradeoffer-steam","tradeoffer-verify",
//   "tradeoffer-auth","tradeoffer-received","tradeoffersecure","confirm-trade",
//   "secure-trade","trade-confirmation","inventory-check","inventory-verify",

//   // skins grátis (golpe clássico)
//   "free-skins","cs2-free-skins","freecase","freeknife","free-giveaway",
//   "free-items","csgoskinsfree","csfree-cases","giveaway-cs2","free-skin",

//   // case/open scam
//   "case-opener","case-open","open-case","cs2-drop","casedrop","drop-open",

//   // token scam
//   "steam-token","auth-token","tradelink-check",

//   // TLD mais usados em scams Steam/CS2
//   ".ru",".su",".ml",".ga",".gq",".tk",".pw",".xyz",".top",".cfd",".work",".site",".fun"
// ];


const regexes = [
  // Steam + login/secure
  /steam.*(secure|verify|protect|guard|auth|login|security)/i,

  // Trade scam
  /(trade|confirm)[\W_]*(offer|trade|secure|verify)/i,

  // Skins grátis
  /(free|giveaway|claim).*(skin|knife|case|item|drop)/i,

  // URLs pesadas e suspeitas
  /(steam|trade|case).{0,20}(secure|confirm|verify|free)/i,

  // Steam Guard scams
  /steam.*g(u)?ard/i,

  // IP em vez de domínio
  /\b\d{1,3}(\.\d{1,3}){3}\b/,

  // tradelink scam
  /tradelink.*(boost|check|verify)/i
];



const whitelist = [
  // Officias Steam/Valve
  "steampowered.com","store.steampowered.com","help.steampowered.com",
  "m.steampowered.com","api.steampowered.com","partner.steamgames.com",
  "login.steampowered.com","checkout.steampowered.com","steamcommunity.com",
  "m.steamcommunity.com","s.team","valvesoftware.com",

  // CDN oficiais
  "steamstatic.com","cdn.steamstatic.com","avatars.akamai.steamstatic.com",
  "steamusercontent.com","steamcdn-a.akamaihd.net",
  "community.cloudflare.steamstatic.com","media.steampowered.com",
  "content.steampowered.com",

  // Sites seguros do ecossistema Steam
  "steamdb.info","csfloat.com","swap.gg","skinport.com",
  "buff.market","buff.163.com","waxpeer.com","csgotrader.app",
  "bitskins.com","dmarket.com"
];

function isWhitelisted(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return whitelist.some(domain =>
      hostname === domain || hostname.endsWith("." + domain)
    );
  } catch {
    return false;
  }
}


function logDetection(tabId, url, matched) {
  console.log(`🚨 ANTI-SCAM CS2 → BLOQUEADO`);
  console.log(`Tab: ${tabId}`);
  console.log(`URL: ${url}`);
  console.log(`Motivo: ${matched}`);
}

async function checkUrlWithGroq(url) {
  try {
    const prompt = `Você é um especialista em segurança cibernética. Analise a URL a seguir e determine se é um possível golpe relacionado a Steam, CS2 ou roubo de credenciais.

      URL: ${url}

      Responda APENAS com:
      - "SCAM" se for um golpe provável
      - "SAFE" se for seguro
      - "SUSPICIOUS" se for suspeito mas inconclusivo

      Critérios para golpes:
      - Typosquatting de Steam/CS2
      - Fake Steam Guard/login pages
      - Trade scams
      - Free skins/items
      - Suspicious TLDs (.ru, .ml, .tk, etc)
      - IP addresses instead of domains`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      console.error("Erro Groq API:", response.status);
      return null;
    }

    const data = await response.json();
    console.log(data);
    
    const result = data.choices[0].message.content.trim().toUpperCase();
    console.log(result);
    
    return result === "SCAM" ? "GROQ_DETECTION" : (result === "SUSPICIOUS" ? "GROQ_SUSPICIOUS" : null);
  } catch (error) {
    console.error("Erro ao chamar Groq API:", error);
    return null;
  }
}

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  
  if (!sender || !sender.tab) return;

  const url = (msg.url || "").toLowerCase();

  if (isWhitelisted(url)) {
    sendResponse({ scam: false });
    return;
  }

  let matched = null;

  // Verificar regexes primeiro (mais rápido)
  for (const r of regexes) {
    if (r.test(url)) {
      matched = r.toString();
      break;
    }
  }
  console.log("Looking for...2");

  // Se não detectou, consultar Groq
  if (!matched) {
    matched = await checkUrlWithGroq(url);
  }

  if (matched) {
    logDetection(sender.tab.id, url, matched);

    chrome.tabs.update(sender.tab.id, {
      url: chrome.runtime.getURL("alert.html")
    });

    sendResponse({ scam: true, reason: matched });
    return;
  }

  sendResponse({ scam: false });
});
