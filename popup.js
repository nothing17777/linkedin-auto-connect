const btn = document.getElementById("btn");
const status = document.getElementById("status");
let running = false;

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
  chrome.runtime.sendMessage({ cmd: "launch", max, dmin, dmax });
  status.textContent = "Opening LinkedIn...";
};

const poll = async () => render(await send({ cmd: "status" }));
poll();
setInterval(poll, 700);
