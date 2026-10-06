(() => {
  if (window.__lacLoaded) return;
  window.__lacLoaded = true;

  // Connect buttons: aria-label="Invite <Name> to connect" (from the page DOM).
  const CONNECT_SEL = 'button[aria-label*="to connect" i]';
  const findConnect = () =>
    [...document.querySelectorAll(CONNECT_SEL)].filter((b) => !b.dataset.lacDone && !b.disabled);
  const OVERHEAD = 400; // fixed click/scroll waits per invite (ms)
  let minDelay = 100;
  let maxDelay = 2600;

  let running = false;
  let sent = 0;
  let text = "Idle";

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);

  chrome.runtime.onMessage.addListener((msg, _s, reply) => {
    if (msg.cmd === "start" && !running) {
      minDelay = Math.max(0, msg.dmin * 1000 - OVERHEAD);
      maxDelay = Math.max(minDelay, msg.dmax * 1000 - OVERHEAD);
      run(msg.max);
    }
    if (msg.cmd === "stop") running = false;
    reply({ running, sent, text });
  });

  function limitReached() {
    const t = document.body.innerText.toLowerCase();
    return t.includes("weekly invitation limit") || t.includes("reached the weekly");
  }

  async function dismissDialog() {
    // If LinkedIn asks "Add a note?", send without one.
    const b = [...document.querySelectorAll("dialog[open] button, [role=dialog] button")].find((x) =>
      /send without a note/i.test(x.textContent + x.getAttribute("aria-label"))
    );
    if (b) {
      b.click();
      await sleep(500);
    }
  }

  async function run(max) {
    running = true;
    sent = 0;
    text = "Started...";
    let empty = 0;
    let hitLimit = false;

    while (running && sent < max && empty < 12) {
      const target = findConnect()[0];
      if (!target) {
        empty++;
        text = `Sent ${sent}/${max} — looking for Connect buttons (${empty}/12)...`;
        const more = [...document.querySelectorAll("button")].find((b) => /^show more$/i.test(b.textContent.trim()));
        if (more) more.click();
        window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
        await sleep(2500);
        continue;
      }
      empty = 0;
      target.dataset.lacDone = "1";
      target.scrollIntoView({ block: "center" });
      await sleep(100);
      target.click();
      await sleep(300);
      await dismissDialog();
      if (limitReached()) {
        hitLimit = true;
        break;
      }
      sent++;
      text = `Sent ${sent}/${max}`;
      await sleep(rand(minDelay, maxDelay));
    }

    running = false;
    text = hitLimit ? `LinkedIn limit hit. Sent ${sent}.` : `Done. Sent ${sent}.`;
  }
})();
