const btn = document.getElementById("btn");
const status = document.getElementById("status");
let running = false;
let launching = false;

async function send(msg) {
  const [tab] = await chrome.tabs.query({ url: "https://www.linkedin.com/mynetwork/*" });
  if (!tab) return { running: false, sent: 0, text: "Idle" };
  try {
    return await chrome.tabs.sendMessage(tab.id, msg);
  } catch {
    return null;
  }
}

function render(s) {
  if (!s) {
    status.textContent = "Starting... (reload the LinkedIn tab if stuck)";
    return;
  }
  running = s.running;
  btn.textContent = running ? "Stop" : "Start";
  status.textContent = s.text;
}

btn.onclick = async () => {
  const max = Math.max(1, parseInt(document.getElementById("max").value, 10) || 20);
  let dmin = parseFloat(document.getElementById("dmin").value) || 0.5;
  let dmax = parseFloat(document.getElementById("dmax").value) || 3;
  if (dmax < dmin) [dmin, dmax] = [dmax, dmin];
  if (running) return render(await send({ cmd: "stop" }));
  launching = true;
  status.textContent = "Opening LinkedIn...";
  const GROW = "https://www.linkedin.com/mynetwork/grow/";
  const [existing] = await chrome.tabs.query({ url: "https://www.linkedin.com/mynetwork/*" });
  const tab = existing
    ? await chrome.tabs.update(existing.id, { url: GROW, active: true })
    : await chrome.tabs.create({ url: GROW, active: true });
  chrome.runtime.sendMessage({ cmd: "launch", tabId: tab.id, max, dmin, dmax });
};

const poll = async () => {
  if (!launching) render(await send({ cmd: "status" }));
};
poll();
setInterval(poll, 700);
