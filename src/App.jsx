import { useState, useRef, useEffect } from 'react';
import { sampleDocuments, DOC_TYPE_STYLES } from './data/sampleDocuments';

// ─── Mock responses keyed to topics ───────────────────────────────────────────
const MOCK_RESPONSES = [
  {
    triggers: ['price', 'pricing', 'cost', 'discount', 'expensive', 'cheaper', 'budget', 'procurement'],
    response: `Based on your **Q2 Loss Analysis — Enterprise Deals**, here's how to handle price pushback:

**Don't negotiate against yourself.** Before offering any concession, ask what specific benchmark they're comparing you to.

**Reframe to cost-per-outcome:**
- Lead with TCO over 3 years (reps who did this closed at full price in 4 of 6 analyzed wins)
- "Our seat price is higher, but clients average 23% faster ramp time — that's 6–8 weeks of recovered quota per rep annually"

**Introduce implementation risk as a cost:**
- Highlight delayed productivity costs from longer competitor timelines

**Alternatives to discounting:**
- Phase the rollout
- Bundle in success services
- Structure milestone-based payments

**Source:** Q2 Loss Analysis — Enterprise Deals (Price objections = 38% of losses this quarter)`,
  },
  {
    triggers: ['vendor x', 'vendorx', 'competitor', 'competition', 'battlecard', 'compete'],
    response: `From your **Competitive Battlecard — Vendor X**:

**Quick positioning:** Vendor X is a content management platform. You are a live-rep intelligence layer. These are not the same purchase.

**Their key weaknesses:**
- No enterprise SSO/SCIM below top tier
- Reporting locked behind $35k+ tier
- Offshore support with 48hr SLA
- EU data residency issues (lost 3 mutual prospects in Q2)

**If price comes up:**
> "Vendor X's $12k price doesn't include the reporting and integrations your team needs — by the time you're fully operational you're at $30k+."

**Trap question to ask the prospect:**
> "When your rep is 3 minutes from a call and the prospect just sent an email about a competitor you've never heard of — what does your team do right now?"

**Proof points:** Acme Corp saw 40% reduction in time-to-report after switching.

**Source:** Competitive Battlecard — Vendor X`,
  },
  {
    triggers: ['techcorp', 'renewal', 'renew', 'roi', 'churn', 'expand', 'upsell', 'contract'],
    response: `From your **Renewal Call Notes — TechCorp Account**:

**Account snapshot:** $48k ARR, 3-year customer, expansion potential to $72k (Analytics module). Champion: Dana W., VP Sales Ops.

**Key risk:** New CFO, unknown disposition.

**On "not getting expected ROI":**
- Dana needs help building the CFO's business case
- Lead with: team went from **4-hour → 45-minute** weekly reporting cycles
- Send the ROI summary template pre-populated with their actual usage data

**On "need a price reduction":**
- Standard negotiating position — they've renewed twice without a discount
- Counter-offer: 3-year lock at current pricing (no future increases)
- Do not exceed 5% discount without VP approval

**On "pause until Q1":**
- Delay tactic — counter with Q1 start at current price only if signed by Oct 15
- Otherwise Q1 = list price (+8%)

**Expansion play:** Demo Analytics module in the same renewal call. Dana manually pulls 3 reports/week it would automate.

**Source:** Renewal Call Notes — TechCorp Account`,
  },
  {
    triggers: ['champion', 'left', 'multi-thread', 'stakeholder', 'executive', 'sponsor'],
    response: `From your **Q2 Loss Analysis — Enterprise Deals**:

**Champion attrition was responsible for 12% of losses** last quarter — and 80% of those deals had no multi-threading in place.

**Rep coaching note:** Always identify a second champion within 30 days of first contact.

**Key win pattern:** Reps who scheduled an executive briefing in the first two calls won at **2.3x the rate** of those who didn't. Getting exec exposure early insulates you from champion turnover.

**Source:** Q2 Loss Analysis — Enterprise Deals`,
  },
  {
    triggers: ['timing', 'budget freeze', 'q4', 'next quarter', 'pause', 'delay', 'not now'],
    response: `From your **Q2 Loss Analysis — Enterprise Deals**:

**Timing/budget freeze accounted for 18% of Q2 losses.**

**Winning counter:** Offer a pilot scoped to one team at a reduced commitment, then expand in Q1. This keeps the deal alive, gives you a proof point, and positions you ahead of next year's budget cycle.

Q4 is historically weak for new spend approvals — this isn't unique to your deals. The teams that convert do so by shrinking initial scope to something that fits within existing discretionary spend.

**Source:** Q2 Loss Analysis — Enterprise Deals`,
  },
  {
    triggers: ['already have', 'existing solution', 'salesforce', 'spreadsheet', 'current tool'],
    response: `From your **Q2 Loss Analysis — Enterprise Deals**:

**"We already have a solution" drove 24% of Q2 losses** — typically existing tools like Salesforce or homegrown spreadsheets.

**Winning counter:** Don't argue against their existing tool. Instead, ask:
> "What gaps does your current solution leave?"

The answer is almost always one of three things: **reporting**, **onboarding time**, or **cross-team visibility** — all areas where you're demonstrably stronger.

Make their current tool the foil, not the enemy.

**Source:** Q2 Loss Analysis — Enterprise Deals`,
  },
];

const FALLBACK_RESPONSE = (docs) =>
  `I don't have specific information on that in the current knowledge base.

Your knowledge base currently contains:
${docs.map((d) => `• **${d.title}** (${d.type})`).join('\n')}

Consider adding a document that covers this topic using the **+ Add doc** tab. Paste in a battlecard, call transcript, loss analysis, or any relevant sales content and I'll be able to answer questions from it immediately.`;

const getMockResponse = (question, docs) => {
  const q = question.toLowerCase();
  for (const entry of MOCK_RESPONSES) {
    if (entry.triggers.some((t) => q.includes(t))) return entry.response;
  }
  return FALLBACK_RESPONSE(docs);
};

// ─── Claude API ────────────────────────────────────────────────────────────────
const buildSystemPrompt = (docs) =>
  `You are an objection-handling assistant for a B2B sales team. Answer strictly from the knowledge base below.

RULES:
- Only use information from the documents below. Do not use general sales knowledge.
- If not covered, say: "I don't have information on that in the current knowledge base."
- Always cite the source document by name.
- Be concise — the rep may be mid-call.
- Use the company's specific language, numbers, and proof points.

KNOWLEDGE BASE:
${docs.map((d) => `\n--- ${d.title} (${d.type}) ---\n${d.content}`).join('\n')}`;

// ─── Shared components ─────────────────────────────────────────────────────────
function DocBadge({ type }) {
  const style = DOC_TYPE_STYLES[type] || DOC_TYPE_STYLES['Other'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {type}
    </span>
  );
}

// ─── Ask Tab ───────────────────────────────────────────────────────────────────
const SUGGESTED = [
  { icon: '💰', label: 'How do we handle price pushback?' },
  { icon: '🎯', label: "What's our position against Vendor X?" },
  { icon: '📋', label: "TechCorp renewal — what's the plan?" },
];

function AskTab({ docs }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_ANTHROPIC_API_KEY || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [showKeyText, setShowKeyText] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = text.trim();
    if (!userText || loading) return;

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    if (!apiKey) {
      // Simulate realistic delay then return smart mock
      const delay = 900 + Math.random() * 600;
      setTimeout(() => {
        setMessages([...newMessages, { role: 'assistant', content: getMockResponse(userText, docs) }]);
        setLoading(false);
      }, delay);
      return;
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: buildSystemPrompt(docs),
          messages: newMessages,
        }),
      });
      const data = await response.json();
      if (data.content?.[0]?.text) {
        setMessages([...newMessages, { role: 'assistant', content: data.content[0].text }]);
      } else {
        throw new Error(data.error?.message || 'Unexpected response');
      }
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  // Simple markdown-ish renderer for bold and bullet lists
  const renderContent = (text) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((p, j) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={j} className="font-semibold">{p.slice(2, -2)}</strong>
          : p
      );
      return <span key={i}>{rendered}{i < lines.length - 1 && <br />}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* API key bar */}
      <div className="border-b border-slate-200 bg-white px-4 py-2 flex items-center gap-2 flex-shrink-0">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${apiKey ? 'bg-emerald-500' : 'bg-amber-400'}`} />
        <span className={`text-xs font-medium flex-1 truncate ${apiKey ? 'text-emerald-600' : 'text-amber-600'}`}>
          {apiKey ? 'Live mode' : 'Demo mode'}
        </span>
        <button onClick={() => setShowKeyInput((v) => !v)} className="text-xs text-slate-400 active:text-indigo-600 transition-colors font-medium flex-shrink-0">
          {showKeyInput ? 'Close' : apiKey ? 'Change key' : 'Connect API'}
        </button>
      </div>

      {showKeyInput && (
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex gap-2 flex-shrink-0">
          <div className="flex-1 relative">
            <input
              type={showKeyText ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 font-mono bg-white"
            />
            <button type="button" onClick={() => setShowKeyText((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showKeyText
                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              }
            </button>
          </div>
          <button onClick={() => setShowKeyInput(false)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors font-semibold">Save</button>
        </div>
      )}

      {/* Thread */}
      <div className="flex-1 overflow-y-auto chat-scrollbar px-4 py-6 space-y-5" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-4">
            {/* Hero icon */}
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 8px 32px rgba(79,70,229,0.35)' }}>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
            <h3 className="text-slate-900 font-bold text-xl mb-2 tracking-tight">What objection are you facing?</h3>
            <p className="text-slate-500 text-sm mb-7 max-w-xs leading-relaxed">
              Get answers from your team's own playbooks, battlecards, and call notes — not generic advice.
            </p>
            <div className="flex flex-col gap-2.5 w-full max-w-sm">
              {SUGGESTED.map((q) => (
                <button
                  key={q.label}
                  onClick={() => sendMessage(q.label)}
                  className="group text-left bg-white border border-slate-200 rounded-2xl px-4 py-3.5 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg leading-none">{q.icon}</span>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700 transition-colors">{q.label}</span>
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 ml-auto flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl flex-shrink-0 mt-0.5 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
            )}
            <div
              className={`max-w-[83%] rounded-2xl px-4 py-3.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'text-white rounded-tr-sm'
                  : 'text-slate-700 rounded-tl-sm border border-slate-100'
              }`}
              style={
                msg.role === 'user'
                  ? { background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 4px 14px rgba(79,70,229,0.25)' }
                  : { background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)' }
              }
            >
              {renderContent(msg.content)}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl flex-shrink-0 mt-0.5 flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #334155, #475569)', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                R
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="rounded-2xl rounded-tl-sm px-5 py-4 border border-slate-100" style={{ background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="typing-dot w-2 h-2 rounded-full bg-indigo-400" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
                <span className="text-xs text-slate-400 ml-2 font-medium">Searching knowledge base</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-4 pt-3 flex-shrink-0" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="flex gap-2 items-end rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-indigo-400 focus-within:shadow-md transition-all" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask about any objection or deal situation…"
            className="flex-1 resize-none text-sm focus:outline-none disabled:opacity-50 placeholder-slate-400 bg-transparent"
            style={{ lineHeight: '1.5', maxHeight: '120px', fontSize: '16px' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-all active:scale-95"
            style={{ background: input.trim() ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : '#e2e8f0', boxShadow: input.trim() ? '0 4px 12px rgba(79,70,229,0.3)' : 'none' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">Grounded in your knowledge base only</p>
      </div>
    </div>
  );
}

// ─── Docs Tab ──────────────────────────────────────────────────────────────────
const DOC_BORDER = {
  'Battlecard': '#10b981',
  'Loss Analysis': '#3b82f6',
  'Renewal Playbook': '#f59e0b',
  'Call Notes': '#ec4899',
  'Other': '#94a3b8',
};

function DocsTab({ docs, onDelete }) {
  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-slate-600 font-semibold text-sm">Knowledge base is empty</p>
        <p className="text-slate-400 text-sm mt-1">Add your first document to get started.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 overflow-y-auto doc-scrollbar flex-1" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide px-1 mb-1">{docs.length} document{docs.length !== 1 ? 's' : ''} loaded</p>
      {docs.map((doc) => (
        <div
          key={doc.id}
          className="bg-white rounded-2xl overflow-hidden group transition-all duration-200 hover:-translate-y-0.5"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)', borderLeft: `3px solid ${DOC_BORDER[doc.type] || DOC_BORDER['Other']}` }}
        >
          <div className="p-4 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <DocBadge type={doc.type} />
              </div>
              <h3 className="text-slate-800 font-semibold text-sm mb-1.5 leading-snug">{doc.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{doc.content.substring(0, 130)}…</p>
            </div>
            <button
              onClick={() => onDelete(doc.id)}
              className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
              title="Remove document"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Add Doc Tab ───────────────────────────────────────────────────────────────
function AddDocTab({ onAdd }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Battlecard');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required.';
    if (!content.trim()) errs.content = 'Content is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onAdd({ id: Date.now(), title: title.trim(), type, content: content.trim() });
    setTitle(''); setType('Battlecard'); setContent(''); setErrors({});
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  const fieldClass = (err) =>
    `w-full text-sm border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 placeholder-slate-400 transition-colors ${
      err ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200 bg-white'
    }`;

  return (
    <div className="p-4 overflow-y-auto doc-scrollbar flex-1" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <svg className="w-4.5 h-4.5 text-white w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-slate-900 font-bold text-base leading-tight">Add to knowledge base</h2>
              <p className="text-slate-400 text-xs mt-0.5">Paste any sales content — it's queryable instantly</p>
            </div>
          </div>

          {success && (
            <div className="mb-4 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 text-sm font-medium">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Document added — query it in the Ask tab now.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Title <span className="text-rose-400 normal-case font-normal">required</span></label>
              <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })); }} placeholder="e.g. Competitive Battlecard — Vendor Y" className={fieldClass(errors.title)} />
              {errors.title && <p className="text-rose-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Document type</label>
              <div className="relative">
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white appearance-none pr-8">
                  <option>Battlecard</option>
                  <option>Loss Analysis</option>
                  <option>Renewal Playbook</option>
                  <option>Call Notes</option>
                  <option>Other</option>
                </select>
                <svg className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Content <span className="text-rose-400 normal-case font-normal">required</span></label>
              <textarea value={content} onChange={(e) => { setContent(e.target.value); setErrors((p) => ({ ...p, content: undefined })); }} rows={10} placeholder="Paste your battlecard, call notes, loss analysis, or other content here…" className={`${fieldClass(errors.content)} resize-y`} />
              {errors.content && <p className="text-rose-500 text-xs mt-1">{errors.content}</p>}
            </div>

            <button type="submit" className="w-full py-3 text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.99]" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}>
              Add to knowledge base
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [docs, setDocs] = useState(sampleDocuments);
  const [activeTab, setActiveTab] = useState('ask');

  const handleDelete = (id) => setDocs((prev) => prev.filter((d) => d.id !== id));
  const handleAdd = (doc) => { setDocs((prev) => [...prev, doc]); setActiveTab('docs'); };

  const TABS = [
    { id: 'ask', label: 'Ask', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
    { id: 'docs', label: `Docs · ${docs.length}`, icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { id: 'add', label: 'Add doc', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> },
  ];

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: '#0f172a' }}>
      {/* ── Premium dark header ── */}
      <header className="flex-shrink-0 px-4 pb-0" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <div className="max-w-2xl mx-auto">
          {/* Brand row — single line, compact */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 4px 12px rgba(79,70,229,0.4)' }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-base tracking-tight leading-none">Objection Intelligence</h1>
              <p className="text-slate-500 text-xs mt-0.5 truncate">Arden Ridge · The Resilient Seller</p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
              <span className="text-slate-300 text-xs font-medium">{docs.length}</span>
            </div>
          </div>

          {/* Tab bar — equal width tabs, bigger touch targets */}
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-all"
                style={{
                  borderColor: activeTab === tab.id ? '#6366f1' : 'transparent',
                  color: activeTab === tab.id ? '#a5b4fc' : '#475569',
                  background: activeTab === tab.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 overflow-hidden max-w-2xl w-full mx-auto flex flex-col min-h-0 bg-white" style={{ borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
        {activeTab === 'ask' && <AskTab docs={docs} />}
        {activeTab === 'docs' && <DocsTab docs={docs} onDelete={handleDelete} />}
        {activeTab === 'add' && <AddDocTab onAdd={handleAdd} />}
      </main>
    </div>
  );
}
