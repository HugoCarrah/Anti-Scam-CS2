const patterns = [
  // typosquatting Steam Community
  "steammcommunity","steamcomnunity","steamcommunnity","steamcommunlty",
  "steamcommuity","steamcommun1ty","steancommunity","stearncommunity",

  // login / steam guard falsos
  "steam-secure","steam-security","steam-safe","steamverify","steam-verification",
  "steamguard-reset","steamguard-support","steam-auth","steamlogin","mobile-steamguard",

  // trade scam
  "tradeoffer-secure","tradeoffer-confirm","tradeoffer-steam","tradeoffer-verify",
  "tradeoffer-auth","tradeoffer-received","tradeoffersecure","confirm-trade",
  "secure-trade","trade-confirmation","inventory-check","inventory-verify",

  // skins grátis (golpe clássico)
  "free-skins","cs2-free-skins","freecase","freeknife","free-giveaway",
  "free-items","csgoskinsfree","csfree-cases","giveaway-cs2","free-skin",

  // case/open scam
  "case-opener","case-open","open-case","cs2-drop","casedrop","drop-open",

  // token scam
  "steam-token","auth-token","tradelink-check",

  // TLD mais usados em scams Steam/CS2
  ".ru",".su",".ml",".ga",".gq",".tk",".pw",".xyz",".top",".cfd",".work",".site",".fun"
];


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

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!sender || !sender.tab) return;

  const url = (msg.url || "").toLowerCase();

  if (isWhitelisted(url)) {
    sendResponse({ scam: false });
    return;
  }

  let matched = null;

  for (const p of patterns) {
    if (url.includes(p)) {
      matched = p;
      break;
    }
  }

  if (!matched) {
    for (const r of regexes) {
      if (r.test(url)) {
        matched = r.toString();
        break;
      }
    }
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
