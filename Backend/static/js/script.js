// ═══════════════════════════════════════════════════
//  LHSGPT — static/js/script.js
//  Backend URL auto-injected by Jinja2 via window.BACKEND_URL
//  Works on any IP — not hardcoded to localhost
// ═══════════════════════════════════════════════════

// ── Config (injected by Jinja2 in index.html) ─────
const BACKEND = (window.BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

// ── In-memory state (all lost on refresh — by design) ──
const S = {
  userCode   : "",
  appName    : "LHSGPT",
  groupCode  : "LI",
  appkey     : "LHSGPT",
  clientIp   : "192.168.100.1",
  clientHost : "",
  clientBrws : "Chrome-146.0.0.0",
  model      : "groq",          // "groq" | "openai"
  file       : null,
  loading    : false,
  chatId     : null,
  history    : [],              // [{ id, title, msgs }]
  msgs       : [],              // current session messages
};

const MODELS = {
  groq  : { label:"Groq · llama-3.3-70b-versatile", name:"llama-3.3-70b-versatile", color:"var(--groq)"   },
  openai: { label:"OpenAI · gpt-4",                  name:"gpt-4",                   color:"var(--openai)" },
};

const $ = id => document.getElementById(id);

// ── Boot ─────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  pingBackend();
  refreshBadge();
  // Pre-fill backend URL in settings from Jinja2 injected value
  $("s_backendUrl").value = BACKEND;
});

// ── Backend ping ──────────────────────────────────
async function pingBackend() {
  const dot = $("connDot"), lbl = $("connLabel");
  try {
    const r = await fetch(`${BACKEND}/`);
    if (r.ok) {
      dot.className = "conn-dot on";
      lbl.textContent = "Connected";
    } else throw new Error();
  } catch {
    dot.className = "conn-dot off";
    lbl.textContent = "Offline";
  }
}

// ── Model switch ──────────────────────────────────
function switchModel(m) {
  if (S.model === m) return;
  S.model = m;

  ["groq","openai"].forEach(k => {
    $(`opt-${k}`).classList.toggle("active", k === m);
    $(`chk-${k}`).classList.toggle("hidden", k !== m);
  });

  refreshBadge();

  const toast = $("modelToast");
  toast.textContent = `Switched → ${MODELS[m].label}`;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2400);

  if (S.msgs.length) addSysMsg(`Model → ${MODELS[m].label}`);
}

function refreshBadge() {
  const m = MODELS[S.model];
  $("badgeLabel").textContent = m.label;
  const pulse = $("badgePulse");
  pulse.style.background  = m.color;
  pulse.style.boxShadow   = `0 0 5px ${m.color}`;
}

// ── User setup ────────────────────────────────────
function saveUserCode() {
  const v = $("setupUserCode").value.trim();
  if (!v) { $("setupUserCode").focus(); return; }
  setUser(v);
  newChat();
}
function setUser(code) {
  S.userCode = code;
  $("displayUserCode").textContent = code;
  $("userAvatar").textContent      = code[0].toUpperCase();
  $("s_userCode").value            = code;
}

// ── New chat ──────────────────────────────────────
function newChat() {
  if (!S.userCode) {
    $("welcomeScreen").classList.remove("hidden");
    $("messages").innerHTML = "";
    return;
  }
  $("welcomeScreen").classList.add("hidden");
  $("messages").innerHTML = "";
  S.msgs  = [];
  S.chatId = Date.now().toString();
  addSysMsg(`Session started · ${MODELS[S.model].label}`);
}

// ── History ───────────────────────────────────────
function pushHistory(title) {
  if (S.history.find(h => h.id === S.chatId)) return;
  S.history.unshift({ id: S.chatId, title: title.slice(0,42), msgs: S.msgs });
  renderHistory();
}
function renderHistory() {
  const el = $("historyList");
  if (!S.history.length) { el.innerHTML = `<div class="history-empty">No conversations yet</div>`; return; }
  el.innerHTML = S.history.map(h => `
    <div class="history-item ${h.id===S.chatId?'active':''}"
         onclick="loadHistory('${h.id}')" title="${esc(h.title)}">
      💬 ${esc(h.title)}
    </div>`).join("");
}
function loadHistory(id) {
  const h = S.history.find(x => x.id === id);
  if (!h) return;
  S.chatId = id; S.msgs = h.msgs;
  $("welcomeScreen").classList.add("hidden");
  $("messages").innerHTML = "";
  h.msgs.forEach(m => renderMsg(m, false));
  renderHistory(); scrollDown();
}

// ── Chips ─────────────────────────────────────────
function useChip(el) {
  const t = el.textContent.replace(/^[\S]+\s/,"");
  $("chatInput").value = t;
  autoResize($("chatInput"));
  if (S.userCode) $("welcomeScreen").classList.add("hidden");
  $("chatInput").focus();
}

// ── File ──────────────────────────────────────────
function handleFile(inp) {
  const f = inp.files[0]; if (!f) return;
  S.file = f;
  $("fileNm").textContent = f.name;
  $("fileStrip").classList.remove("hidden");
}
function removeFile() {
  S.file = null;
  $("fileInput").value = "";
  $("fileStrip").classList.add("hidden");
}

// ── Optimizer ─────────────────────────────────────
async function optimizePrompt() {
  const inp = $("chatInput");
  const raw = inp.value.trim();
  if (!raw) { inp.placeholder="Enter a prompt to optimize first"; return; }

  const btn = $("optBtn"), lbl = $("optLabel");
  btn.classList.add("busy"); lbl.textContent = "Optimizing...";

  try {
    const r = await fetch(`${BACKEND}/optimize`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ text: raw }),
    });
    const d = await r.json();
    if (r.ok && d.optimized_prompt) {
      inp.value = d.optimized_prompt;
      autoResize(inp);
      toast("✦ Prompt optimized", "ok");
    } else toast("Optimization failed", "err");
  } catch { toast("Backend offline", "err"); }
  finally { btn.classList.remove("busy"); lbl.textContent = "Optimize"; }
}

// ── Send ──────────────────────────────────────────
async function sendMessage() {
  if (S.loading) return;
  const inp  = $("chatInput");
  const text = inp.value.trim();
  if (!text) return;

  if (!S.userCode) {
    toast("Set your User Code first", "err");
    toggleSettings(); return;
  }

  // Hide welcome
  $("welcomeScreen").classList.add("hidden");
  if (!S.chatId) { S.chatId = Date.now().toString(); }

  const uMsg = {
    id:Date.now(), role:"user", text,
    file: S.file?.name||null, time:hhmm(), model:S.model,
  };
  S.msgs.push(uMsg);
  renderMsg(uMsg, true);
  pushHistory(text);

  inp.value = ""; autoResize(inp);
  showTyping(); S.loading = true; $("sendBtn").disabled = true;

  try {
    let aiText, canonical, access;

    if (S.file) {
      aiText = await doExtract(text);
    } else {
      const r = await doConnect(text);
      aiText    = r.aiText;
      canonical = r.canonical;
      access    = r.access;
    }

    removeTyping();
    const aMsg = {
      id:Date.now()+1, role:"ai", text: aiText||"No response from model.",
      time:hhmm(), model:S.model,
      canonical, access,
      file: S.file?.name||null,
    };
    S.msgs.push(aMsg);
    renderMsg(aMsg, true);

    const h = S.history.find(x => x.id === S.chatId);
    if (h) h.msgs = [...S.msgs];

  } catch(e) {
    removeTyping();
    const eMsg = {id:Date.now()+1,role:"ai",text:`⚠ ${e.message}`,time:hhmm(),model:S.model};
    S.msgs.push(eMsg); renderMsg(eMsg,true);
  } finally {
    S.loading=false; $("sendBtn").disabled=false;
    removeFile(); scrollDown();
  }
}

// ── API: /ai/extract ──────────────────────────────
async function doExtract(prompt) {
  const fd = new FormData();
  fd.append("prompt", prompt);
  fd.append("file",   S.file);
  fd.append("model_source", S.model);
  const r = await fetch(`${BACKEND}/ai/extract`, { method:"POST", body:fd });
  const d = await r.json();
  if (!r.ok) throw new Error(d.detail||"Extract failed");
  return d.ai_output;
}

// ── API: /api/genai/lhsgpt/connect ────────────────
async function doConnect(prompt) {
  // unique user_code per message to satisfy DB uniqueness constraint
  const uCode = `${S.userCode}_${Date.now()}`;
  const body = {
    mode: "backend",
    payload_identifier: {
      calling_app_name : S.appName,
      group_code       : S.groupCode,
      appkey           : S.appkey,
      user_code        : uCode,
      user_timestamp   : isoNow(),
      client_ip        : S.clientIp,
      client_hostname  : S.clientHost,
      client_browser   : S.clientBrws,
    },
    payload_data     : { prompt },
    prompt,
    model_source     : S.model,
    model_name       : MODELS[S.model].name,
    app_type         : "api",
    ai_keyword       : "genai",
    app_project_name : "lhsgpt",
    app_endpoint     : "dashboard",
  };

  const r = await fetch(`${BACKEND}/api/genai/lhsgpt/connect`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.detail||"Connect API failed");

  return {
    aiText   : d.ai_output,
    canonical: `https://ai.lighthouseindia.com/api/genai/lhsgpt/dashboard`,
    access   : `${BACKEND}/api/genai/lhsgpt/dashboard`,
  };
}

// ── Render message ────────────────────────────────
function renderMsg(m, animate=true) {
  const box = $("messages");
  const row = document.createElement("div");
  row.className = `msg-row ${m.role}`;
  if (!animate) row.style.animation = "none";
  row.dataset.id = m.id;

  const isAI  = m.role === "ai";
  const avCls = isAI ? "ai" : "usr";
  const avTxt = isAI ? "⬡" : (S.userCode?S.userCode[0].toUpperCase():"U");
  const from  = isAI ? "LHSGPT" : esc(S.userCode||"You");

  const fileBadge = m.file
    ? `<div class="msg-file"><span>📎</span><span>${esc(m.file)}</span></div>` : "";

  let urlCards = "";
  if (isAI && m.canonical) {
    urlCards = `
      <div class="url-card">
        <div class="url-card-lbl">CANONICAL URL</div>
        <a href="${m.canonical}" target="_blank">${m.canonical}</a>
      </div>
      <div class="url-card">
        <div class="url-card-lbl">ACCESS URL</div>
        <a href="${m.access}" target="_blank">${m.access}</a>
      </div>`;
  }

  const mTag = isAI
    ? `<span class="model-tag">${m.model==="groq"?"Groq":"OpenAI"}</span>` : "";

  row.innerHTML = `
    <div class="msg-av ${avCls}">${avTxt}</div>
    <div class="msg-body">
      <div class="msg-from">${from}</div>
      <div class="msg-bbl">${fmt(m.text)}${fileBadge}${urlCards}</div>
      <div class="msg-meta">
        <span class="msg-time">${m.time}</span>${mTag}
      </div>
    </div>`;

  box.appendChild(row);
  if (animate) scrollDown();
}

// ── Typing indicator ──────────────────────────────
function showTyping() {
  const box = $("messages");
  const row = document.createElement("div");
  row.className="typing-row"; row.id="typingRow";
  row.innerHTML=`
    <div class="msg-av ai">⬡</div>
    <div class="typing-bbl">
      <div class="t-dot"></div><div class="t-dot"></div><div class="t-dot"></div>
    </div>`;
  box.appendChild(row); scrollDown();
}
function removeTyping() { const el=$("typingRow"); if(el)el.remove(); }

// ── System msg ────────────────────────────────────
function addSysMsg(txt) {
  const box=$("messages");
  const d=document.createElement("div");
  d.className="sys-msg"; d.textContent=txt;
  box.appendChild(d); scrollDown();
}

// ── Settings modal ────────────────────────────────
function toggleSettings() {
  const m=$("settingsModal");
  const opening = m.classList.contains("hidden");
  m.classList.toggle("hidden");
  if (opening) {
    $("s_userCode").value    = S.userCode;
    $("s_appName").value     = S.appName;
    $("s_groupCode").value   = S.groupCode;
    $("s_clientIp").value    = S.clientIp;
    $("s_browser").value     = S.clientBrws;
    $("s_backendUrl").value  = BACKEND;
  }
}
function saveSettings() {
  const code = $("s_userCode").value.trim();
  if (!code) { $("s_userCode").focus(); return; }

  setUser(code);
  S.appName   = $("s_appName").value   || "LHSGPT";
  S.groupCode = $("s_groupCode").value || "LI";
  S.clientIp  = $("s_clientIp").value  || "192.168.100.1";
  S.clientBrws= $("s_browser").value   || "Chrome-146.0.0.0";
  // Note: BACKEND_URL is injected by server; we don't allow override
  // to avoid CORS issues when running on a specific IP.

  toggleSettings();
  pingBackend();
  toast("Settings saved ✓", "ok");
  if (!S.chatId) newChat();
}

// ── Sidebar (mobile) ──────────────────────────────
function toggleSidebar() {
  const sb=$("sidebar"), ov=$("mobOverlay");
  sb.classList.toggle("open");
  ov.classList.toggle("hidden", !sb.classList.contains("open"));
}

// ── Input helpers ─────────────────────────────────
function handleKey(e) {
  if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}
function autoResize(el) {
  el.style.height="auto";
  el.style.height=Math.min(el.scrollHeight,175)+"px";
}
function scrollDown() {
  const w=$("chatWindow"); w.scrollTop=w.scrollHeight;
}

// ── Toast ─────────────────────────────────────────
function toast(msg, type="ok") {
  const old=document.querySelector(".g-toast"); if(old)old.remove();
  const t=document.createElement("div");
  t.className="g-toast";
  t.style.cssText=`
    position:fixed;bottom:85px;left:50%;transform:translateX(-50%);
    background:${type==="ok"?"var(--surface2)":"rgba(255,83,112,.13)"};
    border:1px solid ${type==="ok"?"var(--border2)":"var(--error)"};
    color:${type==="ok"?"var(--text)":"var(--error)"};
    padding:.45rem 1rem;border-radius:999px;
    font-size:.74rem;font-family:var(--mono);
    z-index:9999;animation:fadeUp .22s ease;
    box-shadow:0 4px 18px rgba(0,0,0,.35);pointer-events:none;
  `;
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2500);
}

// ── Utils ─────────────────────────────────────────
function fmt(s) {
  if (!s) return "";
  return esc(s)
    .replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")
    .replace(/\*(.*?)\*/g,"<em>$1</em>")
    .replace(/`([^`]+)`/g,`<code style="font-family:var(--mono);font-size:.8em;background:var(--surface2);padding:1px 5px;border-radius:4px;color:var(--accent);">$1</code>`)
    .replace(/\n/g,"<br>");
}
function esc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function hhmm() { return new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}); }
function isoNow() { return new Date().toISOString().replace("T"," ").slice(0,19); }