const GROW = "https://www.linkedin.com/mynetwork/grow/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tryStart = async (tabId, opts) => {
  try {
    await chrome.tabs.sendMessage(tabId, { ...opts, cmd: "start" });
    return true;
  } catch {
    return false;
  }
};

const focus = async (tab) => {
  await chrome.tabs.update(tab.id, { active: true });
  await chrome.windows.update(tab.windowId, { focused: true });
};

const waitLoaded = (tabId) =>
  new Promise((resolve) => {
    const onUpd = (id, info) => {
      if (id === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(onUpd);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(onUpd);
    setTimeout(resolve, 15000);
  });

async function launch(opts) {
  // 1. Already on the Grow page? Just run it.
  const growTabs = await chrome.tabs.query({ url: GROW + "*" });
  let here = growTabs.find((t) => t.active) || growTabs[0];
  if (here) {
    if (await tryStart(here.id, opts)) return focus(here);
    // Content script missing (tab opened before install/reload): reload and retry below.
    await focus(here);
    await chrome.tabs.reload(here.id);
    await waitLoaded(here.id);
  } else {
    // 2. Not there: reuse another My Network tab, or open a new one.
    const [other] = await chrome.tabs.query({ url: "https://www.linkedin.com/mynetwork/*" });
    here = other
      ? await chrome.tabs.update(other.id, { url: GROW, active: true })
      : await chrome.tabs.create({ url: GROW, active: true });
    await waitLoaded(here.id);
  }
  await sleep(3000); // let LinkedIn render the suggestions
  for (let i = 0; i < 20; i++) {
    if (await tryStart(here.id, opts)) return;
    await sleep(500);
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.cmd === "launch") launch(msg);
});
