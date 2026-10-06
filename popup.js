const btn = document.getElementById("btn");
const status = document.getElementById("status");
let running = false;

async function send(msg) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    return await chrome.tabs.sendMessage(tab.id, msg);
  } catch {
    return null;
  }
}

function render(s) {
  if (!s) {
    status.textContent = "Open linkedin.com/mynetwork/grow/ (then reload it).";
    btn.disabled = true;
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
  render(await send(running ? { cmd: "stop" } : { cmd: "start", max, dmin, dmax }));
};

const poll = async () => render(await send({ cmd: "status" }));
poll();
setInterval(poll, 700);
