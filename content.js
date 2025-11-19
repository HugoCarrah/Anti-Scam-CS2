(function () {
  chrome.runtime.sendMessage({ url: window.location.href }, () => {});

  document.addEventListener(
    "click",
    function (e) {
      const a = e.target.closest("a");
      if (!a || !a.href) return;

      const href = a.href;

      chrome.runtime.sendMessage({ url: href }, (resp) => {
        if (resp && resp.scam) {
          e.preventDefault();

          if (!document.getElementById("asc2-modal-inline")) {
            const overlay = document.createElement("div");
            overlay.id = "asc2-modal-inline";
            overlay.style.position = "fixed";
            overlay.style.inset = "0";
            overlay.style.background = "rgba(2,6,12,0.9)";
            overlay.style.zIndex = "2147483647";
            overlay.style.display = "flex";
            overlay.style.justifyContent = "center";
            overlay.style.alignItems = "flex-start";
            overlay.style.paddingTop = "80px";

            const box = document.createElement("div");
            box.style.maxWidth = "560px";
            box.style.background = "#071022";
            box.style.color = "#e6f6ff";
            box.style.padding = "20px";
            box.style.borderRadius = "10px";
            box.style.border = "1px solid #ff6b6b";
            box.style.fontFamily = "Arial";

            const h2 = document.createElement("h2");
            h2.style.color = "#ff6b6b";
            h2.textContent = "Esse link provavelmente é um GOLPE";

            const pLinkTitle = document.createElement("p");
            pLinkTitle.textContent = "Link suspeito:";

            const code = document.createElement("code");
            code.style.wordBreak = "break-all";
            code.textContent = href;

            const pRec = document.createElement("p");
            pRec.textContent = "Recomendações:";

            const ul = document.createElement("ul");

            const recs = [
              "NUNCA informe códigos do Steam Guard.",
              "Somente faça trocas em steamcommunity.com.",
              "Ative e confira o Steam Guard Mobile."
            ];

            recs.forEach((t) => {
              const li = document.createElement("li");
              li.textContent = t;
              ul.appendChild(li);
            });

            const btnWrap = document.createElement("div");
            btnWrap.style.textAlign = "right";

            const closeBtn = document.createElement("button");
            closeBtn.id = "asc2-close-inline";
            closeBtn.textContent = "Fechar";

            closeBtn.addEventListener("click", () => overlay.remove());

            btnWrap.appendChild(closeBtn);

            box.appendChild(h2);
            box.appendChild(pLinkTitle);
            box.appendChild(code);
            box.appendChild(pRec);
            box.appendChild(ul);
            box.appendChild(btnWrap);

            overlay.appendChild(box);
            document.body.appendChild(overlay);
          }
        }
      });
    },
    true
  );
})();
