
/* ============================================================
   LHSChatGPT — app.js
   Full application logic: state, chat, UI, API simulation
   ============================================================ */

'use strict';

/* ── State ──────────────────────────────────────────────────── */
const State = {
  chats: [],
  activeChatId: null,
  model: 'pro',
  theme: 'dark',
  isStreaming: false,
  isRecording: false,
  uploadedFiles: [],
  optimizerMode: 'enhance',
  settings: {
    streaming: true,
    markdown: true,
    soundEffects: false,
    memory: true,
    autoTitle: true,
    contextAware: true
  }
};

/* ── Model Config ───────────────────────────────────────────── */
const MODELS = {
  lite:  { name: 'LHS-GPT Lite',  icon: '⚡', badge: 'LITE',  desc: 'Fast & efficient for everyday tasks', badgeClass: 'badge-lite' },
  pro:   { name: 'LHS-GPT Pro',   icon: '🧠', badge: 'PRO',   desc: 'Balanced power and intelligence',     badgeClass: 'badge-pro'  },
  ultra: { name: 'LHS-GPT Ultra', icon: '🔥', badge: 'ULTRA', desc: 'Maximum capability & reasoning',      badgeClass: 'badge-ultra'}
};

/* ── Optimizer Templates ────────────────────────────────────── */
const OPTIMIZER_TEMPLATES = {
  enhance:  (p) => `You are an expert in the following domain. ${p} Please provide a comprehensive, well-structured, and detailed response with examples where appropriate.`,
  concise:  (p) => `In 2-3 sentences, answer clearly and directly: ${p}`,
  creative: (p) => `Think outside the box and give a uniquely creative, imaginative, and original response to: ${p}`,
  technical:(p) => `As a senior engineer/developer, provide a technically detailed, precise, and implementation-ready response for: ${p}`,
  academic: (p) => `Provide an academically rigorous, evidence-based, and well-cited analysis of: ${p}`
};

/* ── AI Response Samples ────────────────────────────────────── */
const AI_RESPONSES = [
  `## Great question! 🎯

Here's a comprehensive breakdown:

**Key Points:**
- The concept you're asking about has multiple dimensions worth exploring
- Modern approaches combine theoretical foundations with practical applications
- Research in this area has evolved significantly over the past decade

\`\`\`python
# Example implementation
def solution(input_data):
    """
    Processes input and returns optimized result
    """
    result = []
    for item in input_data:
        processed = transform(item)
        result.append(processed)
    return result
\`\`\`

> **Pro tip:** Always consider edge cases when implementing this pattern.

The most important thing to remember is that **context matters** — the best approach depends on your specific requirements and constraints. Would you like me to dive deeper into any particular aspect?`,

  `I'd be happy to help with that! Let me walk you through the approach:

**Step-by-step breakdown:**

1. **Understand the fundamentals** — Start with core principles
2. **Analyze the context** — Every situation has unique constraints  
3. **Choose the right tool** — Match solutions to problems
4. **Iterate and refine** — Continuous improvement is key

Here's a practical example to illustrate:

\`\`\`javascript
// Modern JavaScript approach
const solution = async (data) => {
  const result = await Promise.all(
    data.map(item => processItem(item))
  );
  return result.filter(Boolean);
};
\`\`\`

The beauty of this approach is its **scalability** — it works equally well for small prototypes and production systems.

Is there a specific part you'd like me to elaborate on?`,

  `Excellent! Here's what you need to know:

The answer involves three interconnected concepts:

| Concept | Description | Importance |
|---------|-------------|------------|
| Foundation | Core principles | ⭐⭐⭐⭐⭐ |
| Application | Real-world usage | ⭐⭐⭐⭐ |
| Optimization | Performance tuning | ⭐⭐⭐ |

**Why this matters:**
- It directly impacts performance and scalability
- Understanding the *why* helps you make better decisions
- The patterns here apply across many domains

*Remember:* The best solution is the one that works for your specific context. Don't over-engineer — start simple and add complexity only when needed.`,

  `That's a fascinating topic! Here's my analysis:

**Overview**

The question touches on fundamental principles that have been debated and refined over decades. Modern thinking on this has evolved considerably.

**Key Considerations:**

- **Performance**: Always measure before optimizing. Premature optimization is the root of many engineering problems.
- **Maintainability**: Code is read far more often than it's written — optimize for readability.
- **Scalability**: Think about how your solution will behave under 10x or 100x the current load.

\`\`\`bash
# Quick diagnostic command
$ analyze --verbose --output=json | jq '.results[]'
\`\`\`

**My Recommendation:** Start with the simplest approach that could possibly work. You can always add sophistication later once you understand the actual bottlenecks.

Let me know if you want me to go deeper on any of these points! 🚀`,

  `Here's a thoughtful response to your query:

The topic you've raised connects to several important ideas in modern thinking. Let me break it down:

**The Core Insight**

At its essence, the answer involves balancing competing forces — often what seems like a simple question reveals genuine complexity when examined closely.

**Practical Implications:**
1. Short-term vs long-term tradeoffs
2. Individual vs collective considerations  
3. Known vs unknown constraints

**What the research says:**
Recent studies have shown that the most effective approaches combine:
- Systematic analysis
- Creative problem-solving
- Iterative refinement

> "The measure of intelligence is the ability to change." — *Albert Einstein*

I hope this gives you a solid foundation. What aspect would you like to explore further?`
];

/* ── Utility ────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const dateLabel = () => {
  const d = new Date();
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Markdown Renderer ──────────────────────────────────────── */
function renderMarkdown(text) {
  if (!State.settings.markdown) return escapeHtml(text).replace(/\n/g, '<br>');

  // Code blocks first
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const id = uid();
    return `<div class="code-block-wrap">
      <div class="code-block-header">
        <span>${lang || 'code'}</span>
        <button class="code-copy-btn" onclick="copyCode('${id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          Copy
        </button>
      </div>
      <pre><code id="code-${id}">${escapeHtml(code.trim())}</code></pre>
    </div>`;
  });

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  text = text.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Headers
  text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Blockquote
  text = text.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // HR
  text = text.replace(/^---+$/gm, '<hr>');

  // Unordered list
  text = text.replace(/((?:^[-*+] .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^[-*+] /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered list
  text = text.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // Table
  text = text.replace(/(\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n?)+)/g, (table) => {
    const rows = table.trim().split('\n');
    const header = rows[0].split('|').filter(Boolean).map(c => `<th>${c.trim()}</th>`).join('');
    const body = rows.slice(2).map(r => {
      const cells = r.split('|').filter(Boolean).map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
  });

  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Paragraphs (double newline)
  const parts = text.split(/\n\n+/);
  text = parts.map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.match(/^<(h[123]|ul|ol|blockquote|table|div|hr)/)) return p;
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return text;
}

function copyCode(id) {
  const el = document.getElementById('code-' + id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => showToast('Code copied!', 'success'));
}

/* ── LocalStorage ───────────────────────────────────────────── */
function saveState() {
  localStorage.setItem('lhs_chats', JSON.stringify(State.chats));
  localStorage.setItem('lhs_model', State.model);
  localStorage.setItem('lhs_theme', State.theme);
  localStorage.setItem('lhs_settings', JSON.stringify(State.settings));
}

function loadState() {
  const chats = localStorage.getItem('lhs_chats');
  if (chats) State.chats = JSON.parse(chats);
  const model = localStorage.getItem('lhs_model');
  if (model) State.model = model;
  const theme = localStorage.getItem('lhs_theme');
  if (theme) State.theme = theme;
  const settings = localStorage.getItem('lhs_settings');
  if (settings) State.settings = { ...State.settings, ...JSON.parse(settings) };
}

/* ── Theme ──────────────────────────────────────────────────── */
function applyTheme(theme) {
  State.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    btn.innerHTML = theme === 'dark'
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
  }
  saveState();
}

/* ── Chat CRUD ──────────────────────────────────────────────── */
function createNewChat(firstMessage) {
  const id = uid();
  const title = firstMessage
    ? firstMessage.slice(0, 42) + (firstMessage.length > 42 ? '…' : '')
    : 'New Chat';
  const chat = { id, title, messages: [], model: State.model, pinned: false, createdAt: Date.now() };
  State.chats.unshift(chat);
  State.activeChatId = id;
  renderChatHistory();
  saveState();
  return chat;
}

function getActiveChat() {
  return State.chats.find(c => c.id === State.activeChatId);
}

function deleteChat(id, e) {
  if (e) e.stopPropagation();
  State.chats = State.chats.filter(c => c.id !== id);
  if (State.activeChatId === id) {
    State.activeChatId = State.chats[0]?.id || null;
    if (State.activeChatId) {
      loadChat(State.activeChatId);
    } else {
      showWelcome();
    }
  }
  renderChatHistory();
  saveState();
  showToast('Chat deleted', 'info');
}

function pinChat(id, e) {
  if (e) e.stopPropagation();
  const chat = State.chats.find(c => c.id === id);
  if (!chat) return;
  chat.pinned = !chat.pinned;
  State.chats.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  renderChatHistory();
  saveState();
  showToast(chat.pinned ? 'Chat pinned' : 'Chat unpinned', 'success');
}

function openRename(id, e) {
  if (e) e.stopPropagation();
  const chat = State.chats.find(c => c.id === id);
  if (!chat) return;
  const modal = document.getElementById('rename-modal');
  const input = document.getElementById('rename-input');
  modal._chatId = id;
  input.value = chat.title;
  modal.classList.add('visible');
  setTimeout(() => input.focus(), 50);
}

function confirmRename() {
  const modal = document.getElementById('rename-modal');
  const input = document.getElementById('rename-input');
  const chat = State.chats.find(c => c.id === modal._chatId);
  if (chat && input.value.trim()) {
    chat.title = input.value.trim();
    renderChatHistory();
    saveState();
    showToast('Chat renamed', 'success');
  }
  closeRenameModal();
}

function closeRenameModal() {
  document.getElementById('rename-modal').classList.remove('visible');
}

function loadChat(id) {
  State.activeChatId = id;
  const chat = getActiveChat();
  if (!chat) return;
  renderChatHistory();
  showChatArea();
  const area = document.getElementById('messages-area');
  const inner = area.querySelector('.messages-inner');
  inner.innerHTML = '';
  chat.messages.forEach(msg => appendMessageDOM(msg, false));
  scrollToBottom();
  if (window.innerWidth <= 768) closeMobileSidebar();
}

/* ── Render Chat History ────────────────────────────────────── */
function renderChatHistory(filter) {
  const container = document.getElementById('chat-history');
  container.innerHTML = '';

  let filtered = State.chats;
  if (filter && filter.trim()) {
    const q = filter.toLowerCase();
    filtered = State.chats.filter(c => c.title.toLowerCase().includes(q));
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:.8rem">No chats found</div>';
    return;
  }

  // Group by today / yesterday / older
  const groups = { Today: [], Yesterday: [], Older: [] };
  const now2 = new Date();
  filtered.forEach(c => {
    const d = new Date(c.createdAt);
    const diff = Math.floor((now2 - d) / 86400000);
    if (diff === 0) groups.Today.push(c);
    else if (diff === 1) groups.Yesterday.push(c);
    else groups.Older.push(c);
  });

  Object.entries(groups).forEach(([label, chats]) => {
    if (!chats.length) return;
    const lbl = document.createElement('div');
    lbl.className = 'history-label';
    lbl.textContent = label;
    container.appendChild(lbl);

    chats.forEach(chat => {
      const item = document.createElement('div');
      item.className = 'chat-item' + (chat.id === State.activeChatId ? ' active' : '') + (chat.pinned ? ' pinned' : '');
      item.dataset.id = chat.id;

      let title = chat.title;
      if (filter && filter.trim()) {
        const re = new RegExp(`(${escapeHtml(filter.trim())})`, 'gi');
        title = title.replace(re, '<mark class="chat-highlight">$1</mark>');
      }

      item.innerHTML = `
        <span class="chat-item-icon">${chat.pinned ? '📌' : '💬'}</span>
        <span class="chat-item-title">${title}</span>
        <div class="chat-item-actions">
          <button class="chat-action-btn" title="Pin" onclick="pinChat('${chat.id}',event)">${chat.pinned ? '📌' : '📍'}</button>
          <button class="chat-action-btn" title="Rename" onclick="openRename('${chat.id}',event)">✏️</button>
          <button class="chat-action-btn" title="Delete" onclick="deleteChat('${chat.id}',event)">🗑️</button>
        </div>`;
      item.addEventListener('click', () => loadChat(chat.id));
      container.appendChild(item);
    });
  });
}

/* ── Model Selector ─────────────────────────────────────────── */
function setModel(key) {
  State.model = key;
  const m = MODELS[key];
  document.getElementById('model-btn-text').textContent = m.name;
  const badge = document.getElementById('model-btn-badge');
  badge.textContent = m.badge;
  badge.className = `model-badge ${m.badgeClass}`;
  document.querySelectorAll('.model-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.model === key);
  });
  document.getElementById('model-selector').classList.remove('open');
  saveState();
}

/* ── Welcome / Chat Area Toggle ─────────────────────────────── */
function showWelcome() {
  document.getElementById('welcome-screen').style.display = 'flex';
  document.getElementById('messages-area').classList.remove('visible');
}

function showChatArea() {
  document.getElementById('welcome-screen').style.display = 'none';
  document.getElementById('messages-area').classList.add('visible');
}

/* ── Send Message ───────────────────────────────────────────── */
async function sendMessage() {
  const input = document.getElementById('prompt-input');
  const text = input.value.trim();
  if (!text && State.uploadedFiles.length === 0) return;
  if (State.isStreaming) return;

  const messageText = text;
  input.value = '';
  input.style.height = 'auto';
  document.getElementById('send-btn').classList.remove('ready');

  // Create chat if none
  if (!State.activeChatId) {
    createNewChat(messageText);
    showChatArea();
  } else {
    showChatArea();
  }

  const chat = getActiveChat();
  if (!chat) return;

  // Build message
  const userMsg = {
    id: uid(),
    role: 'user',
    content: messageText,
    files: [...State.uploadedFiles],
    time: now()
  };
  chat.messages.push(userMsg);
  appendMessageDOM(userMsg, true);

  // Clear uploaded files
  State.uploadedFiles = [];
  document.getElementById('file-chips').innerHTML = '';
  document.getElementById('file-chips').classList.remove('has-files');

  scrollToBottom();

  // Update title if auto-title and first message
  if (State.settings.autoTitle && chat.messages.length === 1) {
    chat.title = messageText.slice(0, 42) + (messageText.length > 42 ? '…' : '');
    renderChatHistory();
  }

  // Show typing
  const typingEl = showTyping();
  State.isStreaming = true;

  // Simulate API call
  await simulateResponse(chat, typingEl, messageText);

  State.isStreaming = false;
  saveState();
}

async function simulateResponse(chat, typingEl, userPrompt) {
  // Simulate network delay
  await sleep(800 + Math.random() * 600);
  typingEl.remove();

  const response = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];

  const aiMsg = {
    id: uid(),
    role: 'ai',
    content: response,
    model: State.model,
    time: now()
  };
  chat.messages.push(aiMsg);

  if (State.settings.streaming) {
    await streamMessage(aiMsg, response);
  } else {
    appendMessageDOM(aiMsg, true);
  }

  scrollToBottom();
}

async function streamMessage(msg, fullText) {
  const area = document.getElementById('messages-area').querySelector('.messages-inner');
  const group = document.createElement('div');
  group.className = 'msg-group ai';
  group.dataset.id = msg.id;

  const sender = document.createElement('div');
  sender.className = 'msg-sender';
  sender.innerHTML = `<span class="msg-sender-avatar ai-avatar">L</span> LHS-GPT · ${MODELS[msg.model]?.name || 'AI'} · <span style="opacity:.6">${msg.time}</span>`;

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble streaming-cursor';

  group.appendChild(sender);
  group.appendChild(bubble);
  area.appendChild(group);
  scrollToBottom();

  // Stream character by character (word chunks for performance)
  const words = fullText.split(' ');
  let accumulated = '';
  for (let i = 0; i < words.length; i++) {
    accumulated += (i === 0 ? '' : ' ') + words[i];
    bubble.innerHTML = renderMarkdown(accumulated);
    if (i % 3 === 0) scrollToBottom();
    await sleep(18 + Math.random() * 25);
  }

  bubble.classList.remove('streaming-cursor');
  bubble.innerHTML = renderMarkdown(fullText);

  // Add actions
  const actions = buildMsgActions(msg.id, 'ai');
  group.appendChild(actions);
  scrollToBottom();
}

/* ── Append Message DOM ─────────────────────────────────────── */
function appendMessageDOM(msg, animate) {
  const area = document.getElementById('messages-area').querySelector('.messages-inner');
  const group = document.createElement('div');
  group.className = `msg-group ${msg.role}`;
  group.dataset.id = msg.id;
  if (animate) group.style.animation = 'fadeIn .25s ease';

  if (msg.role === 'user') {
    const sender = document.createElement('div');
    sender.className = 'msg-sender';
    sender.innerHTML = `<span class="msg-sender-avatar user-avatar-msg">U</span> You · <span style="opacity:.6">${msg.time}</span>`;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    if (msg.files && msg.files.length) {
      msg.files.forEach(f => {
        const chip = document.createElement('div');
        chip.className = 'file-chip-msg';
        chip.innerHTML = `<span class="file-chip-icon">${getFileIcon(f.name)}</span> ${f.name}`;
        bubble.appendChild(chip);
      });
    }

    const textNode = document.createElement('div');
    textNode.innerHTML = escapeHtml(msg.content).replace(/\n/g, '<br>');
    bubble.appendChild(textNode);

    const actions = buildMsgActions(msg.id, 'user');
    group.appendChild(sender);
    group.appendChild(bubble);
    group.appendChild(actions);

  } else {
    const sender = document.createElement('div');
    sender.className = 'msg-sender';
    sender.innerHTML = `<span class="msg-sender-avatar ai-avatar">L</span> LHS-GPT · ${MODELS[msg.model]?.name || 'AI'} · <span style="opacity:.6">${msg.time}</span>`;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = renderMarkdown(msg.content);

    const actions = buildMsgActions(msg.id, 'ai');
    group.appendChild(sender);
    group.appendChild(bubble);
    group.appendChild(actions);
  }

  area.appendChild(group);
}

function buildMsgActions(msgId, role) {
  const actions = document.createElement('div');
  actions.className = 'msg-actions';

  if (role === 'ai') {
    actions.innerHTML = `
      <button class="msg-action-btn" onclick="likeMsg('${msgId}')" id="like-${msgId}" title="Helpful">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
        Like
      </button>
      <button class="msg-action-btn" onclick="dislikeMsg('${msgId}')" id="dislike-${msgId}" title="Not helpful">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>
        Dislike
      </button>
      <button class="msg-action-btn" onclick="copyMsg('${msgId}')" title="Copy">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        Copy
      </button>
      <button class="msg-action-btn" onclick="regenerateMsg('${msgId}')" title="Regenerate">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
        Regenerate
      </button>`;
  } else {
    actions.innerHTML = `
      <button class="msg-action-btn" onclick="copyMsg('${msgId}')" title="Copy">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        Copy
      </button>
      <button class="msg-action-btn" onclick="editMsg('${msgId}')" title="Edit">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Edit
      </button>`;
  }
  return actions;
}

/* ── Message Actions ────────────────────────────────────────── */
function likeMsg(id) {
  const btn = document.getElementById('like-' + id);
  if (!btn) return;
  btn.classList.toggle('liked');
  document.getElementById('dislike-' + id)?.classList.remove('disliked');
  showToast('Thanks for the feedback!', 'success');
}

function dislikeMsg(id) {
  const btn = document.getElementById('dislike-' + id);
  if (!btn) return;
  btn.classList.toggle('disliked');
  document.getElementById('like-' + id)?.classList.remove('liked');
  showToast('Feedback noted', 'info');
}

function copyMsg(id) {
  const chat = getActiveChat();
  if (!chat) return;
  const msg = chat.messages.find(m => m.id === id);
  if (!msg) return;
  navigator.clipboard.writeText(msg.content).then(() => showToast('Message copied!', 'success'));
}

async function regenerateMsg(id) {
  if (State.isStreaming) return;
  const chat = getActiveChat();
  if (!chat) return;
  const idx = chat.messages.findIndex(m => m.id === id);
  if (idx < 0) return;

  // Remove msg and re-stream
  const group = document.querySelector(`.msg-group[data-id="${id}"]`);
  group?.remove();
  chat.messages.splice(idx, 1);

  State.isStreaming = true;
  const typingEl = showTyping();
  await simulateResponse(chat, typingEl, 'Regenerating…');
  State.isStreaming = false;
  saveState();
  showToast('Response regenerated', 'success');
}

function editMsg(id) {
  const chat = getActiveChat();
  if (!chat) return;
  const msg = chat.messages.find(m => m.id === id);
  if (!msg) return;
  const input = document.getElementById('prompt-input');
  input.value = msg.content;
  input.focus();
  autoResize(input);
  document.getElementById('send-btn').classList.add('ready');
  showToast('Message loaded for editing', 'info');
}

/* ── Typing Indicator ───────────────────────────────────────── */
function showTyping() {
  const area = document.getElementById('messages-area').querySelector('.messages-inner');
  const el = document.createElement('div');
  el.className = 'msg-group ai';
  el.id = 'typing-indicator';
  el.innerHTML = `
    <div class="msg-sender">
      <span class="msg-sender-avatar ai-avatar">L</span> LHS-GPT is thinking…
    </div>
    <div class="typing-indicator">
      <div class="typing-dots">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>`;
  area.appendChild(el);
  scrollToBottom();
  return el;
}

/* ── Scroll ─────────────────────────────────────────────────── */
function scrollToBottom() {
  const area = document.getElementById('messages-area');
  area.scrollTop = area.scrollHeight;
}

/* ── Sleep ──────────────────────────────────────────────────── */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ── New Chat ───────────────────────────────────────────────── */
function startNewChat() {
  State.activeChatId = null;
  showWelcome();
  renderChatHistory();
  document.getElementById('prompt-input').value = '';
  document.getElementById('send-btn').classList.remove('ready');
  document.getElementById('file-chips').innerHTML = '';
  document.getElementById('file-chips').classList.remove('has-files');
  State.uploadedFiles = [];
  if (window.innerWidth <= 768) closeMobileSidebar();
}

/* ── Optimizer ──────────────────────────────────────────────── */
function toggleOptimizer() {
  const panel = document.getElementById('optimizer-panel');
  const btn = document.getElementById('optimizer-btn');
  const isVisible = panel.classList.contains('visible');
  if (isVisible) {
    panel.classList.remove('visible');
    btn.classList.remove('active');
  } else {
    const input = document.getElementById('prompt-input');
    const preview = document.getElementById('optimizer-preview');
    preview.textContent = input.value.trim()
      ? OPTIMIZER_TEMPLATES[State.optimizerMode](input.value.trim()).slice(0, 200) + '…'
      : 'Type a prompt first, then select an optimizer mode to preview the enhanced version.';
    panel.classList.add('visible');
    btn.classList.add('active');
  }
}

function selectOptimizerMode(mode) {
  State.optimizerMode = mode;
  document.querySelectorAll('.optimizer-mode-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.mode === mode);
  });
  const input = document.getElementById('prompt-input');
  const preview = document.getElementById('optimizer-preview');
  preview.textContent = input.value.trim()
    ? OPTIMIZER_TEMPLATES[mode](input.value.trim()).slice(0, 200) + '…'
    : 'Type a prompt first, then select a mode to preview.';
}

function applyOptimizer() {
  const input = document.getElementById('prompt-input');
  const original = input.value.trim();
  if (!original) { showToast('Type a prompt first', 'error'); return; }
  input.value = OPTIMIZER_TEMPLATES[State.optimizerMode](original);
  autoResize(input);
  document.getElementById('send-btn').classList.add('ready');
  closeOptimizer();
  showToast('Prompt optimized! ✨', 'success');
}

function closeOptimizer() {
  document.getElementById('optimizer-panel').classList.remove('visible');
  document.getElementById('optimizer-btn').classList.remove('active');
}

/* ── File Upload ────────────────────────────────────────────── */
function openUploadModal() {
  document.getElementById('upload-modal').classList.add('visible');
}

function closeUploadModal() {
  document.getElementById('upload-modal').classList.remove('visible');
}

function getFileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  const icons = { pdf: '📄', docx: '📝', doc: '📝', txt: '📃', csv: '📊', xlsx: '📊', xls: '📊', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', mp3: '🎵', mp4: '🎥' };
  return icons[ext] || '📁';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function handleFileSelect(files) {
  const list = document.getElementById('upload-list');
  Array.from(files).forEach(file => {
    const allowed = ['pdf','doc','docx','txt','csv','xlsx','xls','png','jpg','jpeg','gif'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) { showToast(`${ext.toUpperCase()} not supported`, 'error'); return; }

    const item = document.createElement('div');
    item.className = 'upload-item';
    item.innerHTML = `
      <div class="upload-item-icon">${getFileIcon(file.name)}</div>
      <div class="upload-item-info">
        <div class="upload-item-name">${file.name}</div>
        <div class="upload-item-size">${formatFileSize(file.size)}</div>
        <div class="upload-progress"><div class="upload-progress-bar"></div></div>
      </div>`;
    list.appendChild(item);
  });
}

function confirmUpload() {
  const items = document.querySelectorAll('.upload-item-name');
  const chips = document.getElementById('file-chips');

  items.forEach(item => {
    const name = item.textContent;
    if (State.uploadedFiles.some(f => f.name === name)) return;
    State.uploadedFiles.push({ name });

    const chip = document.createElement('div');
    chip.className = 'file-chip';
    chip.innerHTML = `${getFileIcon(name)} ${name} <button class="file-chip-remove" onclick="removeFile('${name}',this)">✕</button>`;
    chips.appendChild(chip);
  });

  if (State.uploadedFiles.length) chips.classList.add('has-files');
  document.getElementById('upload-list').innerHTML = '';
  closeUploadModal();
  if (State.uploadedFiles.length) showToast(`${State.uploadedFiles.length} file(s) attached`, 'success');
}

function removeFile(name, btn) {
  State.uploadedFiles = State.uploadedFiles.filter(f => f.name !== name);
  btn.closest('.file-chip').remove();
  if (!State.uploadedFiles.length) document.getElementById('file-chips').classList.remove('has-files');
}

/* ── Voice Input ────────────────────────────────────────────── */
let recognition = null;
let voiceTimeout = null;

function toggleVoice() {
  if (State.isRecording) {
    stopVoice();
  } else {
    openVoiceModal();
  }
}

function openVoiceModal() {
  const modal = document.getElementById('voice-modal');
  modal.classList.add('visible');
  startRecognition();
}

function closeVoiceModal() {
  stopVoice();
  document.getElementById('voice-modal').classList.remove('visible');
}

function startRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('Voice input not supported in this browser', 'error');
    closeVoiceModal();
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  State.isRecording = true;
  document.getElementById('voice-mic-btn').classList.add('recording');
  document.getElementById('voice-orb').classList.add('recording');
  document.getElementById('voice-status').textContent = 'Listening…';
  document.getElementById('voice-hint').textContent = 'Speak clearly into your microphone';

  recognition.onresult = (e) => {
    let interim = '';
    let final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) final += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    document.getElementById('voice-transcript').textContent = (final || interim) || '';
  };

  recognition.onend = () => {
    if (State.isRecording) recognition.start();
  };

  recognition.onerror = () => {
    stopVoice();
    showToast('Voice recognition error', 'error');
  };

  recognition.start();
}

function stopVoice() {
  State.isRecording = false;
  if (recognition) { recognition.stop(); recognition = null; }
  document.getElementById('voice-mic-btn')?.classList.remove('recording');
  document.getElementById('voice-orb')?.classList.remove('recording');
}

function acceptVoice() {
  const transcript = document.getElementById('voice-transcript').textContent;
  if (transcript.trim()) {
    document.getElementById('prompt-input').value = transcript;
    autoResize(document.getElementById('prompt-input'));
    document.getElementById('send-btn').classList.add('ready');
    showToast('Voice transcribed!', 'success');
  }
  closeVoiceModal();
}

/* ── Settings ───────────────────────────────────────────────── */
function openSettings() {
  document.getElementById('settings-panel').classList.add('open');
}

function closeSettings() {
  document.getElementById('settings-panel').classList.remove('open');
}

function updateSetting(key, value) {
  State.settings[key] = value;
  saveState();
}

/* ── Sidebar ────────────────────────────────────────────────── */
function toggleSidebar() {
  if (window.innerWidth <= 768) {
    toggleMobileSidebar();
  } else {
    const app = document.getElementById('app');
    app.classList.toggle('sidebar-collapsed');
  }
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  sidebar.classList.toggle('mobile-open');
  overlay.classList.toggle('visible');
}

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('overlay').classList.remove('visible');
}

/* ── Toast ──────────────────────────────────────────────────── */
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'toastSlide .3s ease reverse'; setTimeout(() => toast.remove(), 300); }, 3000);
}

/* ── Auto-resize textarea ───────────────────────────────────── */
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 200) + 'px';
}

/* ── Suggestion Cards ───────────────────────────────────────── */
function useSuggestion(text) {
  const input = document.getElementById('prompt-input');
  input.value = text;
  autoResize(input);
  document.getElementById('send-btn').classList.add('ready');
  input.focus();
}

/* ── Init ───────────────────────────────────────────────────── */
function init() {
  loadState();
  applyTheme(State.theme);
  setModel(State.model);

  // Render history
  renderChatHistory();

  // Setup textarea
  const promptInput = document.getElementById('prompt-input');
  promptInput.addEventListener('input', () => {
    autoResize(promptInput);
    const sendBtn = document.getElementById('send-btn');
    sendBtn.classList.toggle('ready', promptInput.value.trim().length > 0 || State.uploadedFiles.length > 0);
  });
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Search
  document.getElementById('search-input').addEventListener('input', (e) => {
    renderChatHistory(e.target.value);
  });

  // Model selector close on outside click
  document.addEventListener('click', (e) => {
    const sel = document.getElementById('model-selector');
    if (!sel.contains(e.target)) sel.classList.remove('open');
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); startNewChat(); }
    if (e.key === 'Escape') {
      closeOptimizer();
      closeSettings();
      closeUploadModal();
      closeVoiceModal();
      closeRenameModal();
    }
  });

  // Drag and drop on drop zone
  const dropZone = document.getElementById('drop-zone');
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      handleFileSelect(e.dataTransfer.files);
    });
    dropZone.addEventListener('click', () => document.getElementById('file-input').click());
  }

  // Settings toggles
  document.querySelectorAll('[data-setting]').forEach(el => {
    const key = el.dataset.setting;
    el.checked = !!State.settings[key];
    el.addEventListener('change', () => updateSetting(key, el.checked));
  });

  // Load active chat or show welcome
  if (State.activeChatId && State.chats.length) {
    loadChat(State.activeChatId);
  } else {
    showWelcome();
  }

  console.log('%cLHSChatGPT Loaded 🚀', 'color:#10b981;font-size:16px;font-weight:bold');
}

document.addEventListener('DOMContentLoaded', init);
