const GROW = "https://www.linkedin.com/mynetwork/grow/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(opts) {
  const tab = { id: opts.tabId };

  // Wait for the page to finish loading, then give LinkedIn's UI time to render suggestions.
  await new Promise((resolve) => {
    const onUpd = (id, info) => {
      if (id === tab.id && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(onUpd);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(onUpd);
    setTimeout(resolve, 15000);
  });
  await sleep(3000);

  for (let i = 0; i < 20; i++) {
    try {
      await chrome.tabs.sendMessage(tab.id, { cmd: "start", ...opts });
      return;
    } catch {
      await sleep(500);
    }
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.cmd === "launch") launch(msg);
});
