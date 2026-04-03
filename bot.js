/* bot.js — Xpenza Sassy Multi-Mood AI Buddy */
/* Now supports: Savage / Sweet / Balanced / Chaotic / Professional */

(() => {
  // DOM
  const toggle = document.getElementById('xpb-toggle');
  const panel = document.getElementById('xpb-panel');
  const closeBtn = document.getElementById('xpb-close');
  const messages = document.getElementById('xpb-messages');
  const form = document.getElementById('xpb-form');
  const input = document.getElementById('xpb-input');
  const analyzeBtn = document.getElementById('xpb-analyze');
  const tipBtn = document.getElementById('xpb-tip');
  const moodSelect = document.getElementById('xpb-mood');

  // STORAGE KEYS
  const EXP_KEY = 'xpenza_expenses';
  const BUDGET_KEY = 'xpenza_budget';
  const MOOD_KEY = 'xpenza_mood';

  // load saved mood
  moodSelect.value = localStorage.getItem(MOOD_KEY) || "balanced";

  moodSelect.addEventListener("change", () => {
    localStorage.setItem(MOOD_KEY, moodSelect.value);
  });

  // small utils
  const wait = ms => new Promise(res => setTimeout(res, ms));
  const escapeHtml = (str) =>
    str.replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;");

  function loadExpenses() {
    let user = JSON.parse(localStorage.getItem("loggedUser") || "{}");
    return JSON.parse(localStorage.getItem("xpenza_expenses_" + user.email) || "[]");
  }
  function loadBudget() {
    let user = JSON.parse(localStorage.getItem("loggedUser") || "{}");
    return Number(localStorage.getItem("xpenza_budget_" + user.email) || 0);
  }

  // PERSONALITY DICTIONARY
  const PERSONALITIES = {
    savage: {
      openers: [
        "hey broke bestie 😭 what's the damage today?",
        "yo… your wallet told me it’s tired of your nonsense.",
        "spill tea, i'm ready to judge 💅"
      ],
      roasts: [
        "bestie… you spent ₹{amt} on {name}? JAIL. 💀",
        "your spending habits need a hard reboot.",
        "stop buying stuff u DON'T need omg 😭",
        "i love u but financially? a mess."
      ],
      tips: [
        "stop impulse buying — breathe for 8 seconds first 💀",
        "put your card in rice.",
        "just because it's on sale doesn't mean it's free 😭"
      ]
    },

    sweet: {
      openers: [
        "hey love! how can I help today? 💗",
        "hii cutie, let's fix your money gently 🧁",
        "tell me anything! I'm here for you 💕"
      ],
      roasts: [
        "oh babe… ₹{amt} on {name}? let's be a little mindful 💗",
        "it's okay, everyone slips sometimes! 💞",
        "you’re trying your best and I’m proud of you 💕"
      ],
      tips: [
        "try setting tiny goals — you’ll do amazing 💖",
        "proud of you for even checking your spending! 💗",
        "you deserve stability AND treats 💕 balance both!"
      ]
    },

    balanced: {
      openers: [
        "hey! ready for some helpful sass?",
        "hii— I got tea AND logic for you.",
        "what’s up? want a roast or a tip?"
      ],
      roasts: [
        "hmm… ₹{amt} on {name}? questionable behavior 😭",
        "your wallet is side-eyeing you rn.",
        "interesting purchase… bold of you 😮‍💨"
      ],
      tips: [
        "make a small weekly spending cap.",
        "use the 50/30/20 rule — it works wonders!",
        "delay impulse buys by 24 hours."
      ]
    },

    chaotic: {
      openers: [
        "HEHEHE MONEY TIME >:D",
        "i crave financial chaos. tell me your crimes.",
        "what did you buy this time you silly gremlin 😈"
      ],
      roasts: [
        "₹{amt} on {name}? YOU GREMLIN. I LOVE IT 😭",
        "more spending??? YES FEED ME CHAOS 😈🔥",
        "your bank account is screaming and I’m laughing >:D"
      ],
      tips: [
        "BUY… nothing. hoard money like a dragon 🐉",
        "gremlin mode off. responsible mode on. temporarily.",
        "eat the receipt. no proof = no guilt 😈"
      ]
    },

    pro: {
      openers: [
        "Hello. How may I assist with your finances today?",
        "Greetings. Ready to review your spending.",
        "I'm here to help you optimize your budget."
      ],
      roasts: [
        "You spent ₹{amt} on {name}. This is financially suboptimal.",
        "Consider reducing discretionary purchases to improve stability.",
        "Your expense pattern suggests overspending in certain areas."
      ],
      tips: [
        "Track expenses weekly for better control.",
        "Set realistic budget targets and review monthly.",
        "Automate savings for consistency."
      ]
    }
  };

  // MESSAGING UI
  function addMessage(text, who = "bot") {
    const el = document.createElement("div");
    el.className = "xpb-msg " + (who === "bot" ? "bot" : "user");
    el.innerHTML = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  async function botReply(text, delay = 900) {
    const typing = document.createElement("div");
    typing.className = "xpb-msg bot";
    typing.innerHTML =
      '<span class="typing-dots"><span></span><span></span><span></span></span>';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    await wait(delay);
    typing.remove();

    addMessage(text, "bot");
  }

  // ANALYSIS ENGINE
  function analyze() {
    const ex = loadExpenses();
    if (!ex.length)
      return { ok: false, msg: "No expenses yet! Add one first 🌚" };

    const total = ex.reduce((s, e) => s + Number(e.amount), 0);

    const byCat = {};
    ex.forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount);
    });

    const topCat = Object.keys(byCat).sort(
      (a, b) => byCat[b] - byCat[a]
    )[0];

    const largest = ex.slice().sort((a, b) => b.amount - a.amount)[0];

    return { ok: true, total, topCat, largest, count: ex.length };
  }

  // PERSONALITY RESPONSE BUILDER
  function generateRoast(analysis) {
    const mood = moodSelect.value;
    const p = PERSONALITIES[mood];
    const tmpl = p.roasts[Math.floor(Math.random() * p.roasts.length)];

    return tmpl
      .replace("{amt}", Number(analysis.largest.amount).toFixed(0))
      .replace("{name}", analysis.largest.name);
  }

  function randomOpener() {
    const mood = moodSelect.value;
    const p = PERSONALITIES[mood];
    return p.openers[Math.floor(Math.random() * p.openers.length)];
  }

  function randomTip() {
    const mood = moodSelect.value;
    const p = PERSONALITIES[mood];
    return p.tips[Math.floor(Math.random() * p.tips.length)];
  }

  // PANEL ACTIONS
  toggle.addEventListener("click", () => {
    const open = panel.style.display === "flex";
    panel.style.display = open ? "none" : "flex";
    if (!open) addMessage(randomOpener(), "bot");
  });

  closeBtn.addEventListener("click", () => {
    panel.style.display = "none";
  });

  // FORM INPUT
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const txt = input.value.trim();
    if (!txt) return;

    addMessage(escapeHtml(txt), "user");
    input.value = "";

    const lower = txt.toLowerCase();

    if (
      lower.includes("analyze") ||
      lower.includes("spend") ||
      lower.includes("total")
    ) {
      const a = analyze();
      if (!a.ok) return botReply(a.msg);

      await botReply("Checking your receipts…", 700);
      await botReply(
        `You have ${a.count} expenses. Total: ₹${a.total.toFixed(
          2
        )}. Top category: ${a.topCat}. Biggest purchase: ${a.largest.name} ₹${Number(
          a.largest.amount
        ).toFixed(2)}`
      );

      return botReply(generateRoast(a), 900);
    }

    if (lower.includes("tip") || lower.includes("save")) {
      return botReply(randomTip());
    }

    // fallback
    botReply("noted! say 'analyze' or 'tip' if you need help ✨");
  });

  // BUTTON ACTIONS
  analyzeBtn.addEventListener("click", async () => {
    addMessage("Analyze my spending", "user");
    const a = analyze();
    if (!a.ok) return botReply(a.msg);

    await botReply("Processing analysis…", 700);
    await botReply(
      `You have ${a.count} expenses. Total: ₹${a.total.toFixed(
        2
      )}. Top category: ${a.topCat}. Biggest: ${a.largest.name} ₹${Number(
        a.largest.amount
      ).toFixed(2)}`
    );

    botReply(generateRoast(a));
  });

  tipBtn.addEventListener("click", () => {
    addMessage("Give me a tip", "user");
    botReply(randomTip());
  });
})();


