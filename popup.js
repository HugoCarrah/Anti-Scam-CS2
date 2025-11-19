document.addEventListener("DOMContentLoaded", () => {
  const log = document.getElementById("log");

  chrome.storage.local.get({ detections: [] }, (res) => {
    const list = res.detections;
    if (!list.length) {
      log.textContent = "Nenhuma detecção.";
      return;
    }

    log.innerHTML =
      "<ol>" +
      list
        .slice(0, 10)
        .map(
          (d) =>
            `<li><small>${new Date(d.time).toLocaleString()}</small><br><code>${
              d.url
            }</code></li>`
        )
        .join("") +
      "</ol>";
  });

  document.getElementById("clear").onclick = () => {
    chrome.storage.local.set({ detections: [] }, () => location.reload());
  };
});
