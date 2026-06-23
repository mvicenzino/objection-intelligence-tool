import { useState, useRef, useEffect } from 'react';
import { sampleDocuments, DOC_TYPE_STYLES } from './data/sampleDocuments';

const SUGGESTED_QUESTIONS = [
  'How do we handle price pushback?',
  "What's our position against Vendor X?",
  "TechCorp renewal — what's the plan?",
];

const buildSystemPrompt = (docs) =>
  `You are an objection-handling assistant for a B2B sales team. You answer questions strictly based on the company's internal knowledge base provided below.

CRITICAL RULES:
- Only use information from the documents below. Do not use general sales knowledge or outside information.
- If a question isn't covered by the documents, say clearly: "I don't have information on that in the current knowledge base. Consider adding a document that covers this topic."
- When you answer, cite which document(s) you're drawing from by name.
- Keep answers concise and practical — a rep may be mid-call.
- Use the company's specific language, numbers, and proof points from the documents.

KNOWLEDGE BASE:
${docs.map((d) => `\n--- ${d.title} (${d.type}) ---\n${d.content}`).join('\n')}`;

function DocBadge({ type }) {
  const style = DOC_TYPE_STYLES[type] || DOC_TYPE_STYLES['Other'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {type}
    </span>
  );
}

function AskTab({ docs }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_ANTHROPIC_API_KEY || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
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
      setTimeout(() => {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content:
              '⚠️ No API key configured. Enter your Anthropic API key above to enable live responses.\n\nThis is a demo prototype — in production the API call routes through a secure backend server, not directly from the browser.',
          },
        ]);
        setLoading(false);
      }, 800);
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
        throw new Error(data.error?.message || 'Unexpected response format');
      }
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `Error: ${err.message}. Check your API key and try again.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* API key status bar */}
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-slate-500 flex-1 flex items-center gap-1.5">
          {apiKey ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block flex-shrink-0" />
              API key active
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block flex-shrink-0" />
              No API key — responses are mocked
            </>
          )}
        </span>
        <button
          onClick={() => setShowKeyInput((v) => !v)}
          className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors"
        >
          {showKeyInput ? 'Hide' : apiKey ? 'Change key' : 'Add API key'}
        </button>
      </div>

      {showKeyInput && (
        <div className="border-b border-slate-100 bg-white px-4 py-3 flex gap-2 flex-shrink-0">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            className="flex-1 text-sm border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 font-mono"
          />
          <button
            onClick={() => setShowKeyInput(false)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            Save
          </button>
        </div>
      )}

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto chat-scrollbar px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-slate-800 font-semibold text-base mb-1">Ask anything about objection handling</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-xs leading-relaxed">
              Answers are grounded only in your team's own documents — not generic sales advice.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    inputRef.current?.focus();
                  }}
                  className="text-left text-sm bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/50 transition-all shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-indigo-200">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm shadow-sm'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-slate-600 text-xs font-bold">
                R
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-1">Searching knowledge base…</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-slate-100 bg-white px-4 py-3 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask a question about objection handling…"
            className="flex-1 resize-none text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 disabled:opacity-50 placeholder-slate-400"
            style={{ lineHeight: '1.5', maxHeight: '128px' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Grounded in your knowledge base only · Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function DocsTab({ docs, onDelete }) {
  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-slate-600 font-medium text-sm">No documents yet</p>
        <p className="text-slate-400 text-sm mt-1">Add one to get started.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 overflow-y-auto doc-scrollbar flex-1">
      {docs.map((doc) => (
        <div
          key={doc.id}
          className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <DocBadge type={doc.type} />
              </div>
              <h3 className="text-slate-800 font-semibold text-sm mb-1.5 leading-snug">{doc.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                {doc.content.substring(0, 140).trim()}…
              </p>
            </div>
            <button
              onClick={() => onDelete(doc.id)}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
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

function AddDocTab({ onAdd }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Battlecard');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required.';
    if (!content.trim()) newErrors.content = 'Content is required.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onAdd({ id: Date.now(), title: title.trim(), type, content: content.trim() });
    setTitle('');
    setType('Battlecard');
    setContent('');
    setErrors({});
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <div className="p-4 overflow-y-auto doc-scrollbar flex-1">
      <div className="max-w-lg mx-auto">
        <div className="mb-5">
          <h2 className="text-slate-800 font-semibold text-base">Add to knowledge base</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Paste a battlecard, call transcript, loss analysis, or any sales enablement content.
          </p>
        </div>

        {success && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Document added. You can now query it in the Ask tab.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="e.g. Competitive Battlecard — Vendor Y"
              className={`w-full text-sm border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 placeholder-slate-400 transition-colors ${
                errors.title ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
              }`}
            />
            {errors.title && <p className="text-rose-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Document type</label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white appearance-none pr-8 transition-colors"
              >
                <option>Battlecard</option>
                <option>Loss Analysis</option>
                <option>Renewal Playbook</option>
                <option>Call Notes</option>
                <option>Other</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Content <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setErrors((prev) => ({ ...prev, content: undefined }));
              }}
              rows={10}
              placeholder="Paste your battlecard, call notes, loss analysis, or other content here…"
              className={`w-full text-sm border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 placeholder-slate-400 resize-y transition-colors ${
                errors.content ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
              }`}
            />
            {errors.content && <p className="text-rose-500 text-xs mt-1">{errors.content}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
          >
            Add to knowledge base
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [docs, setDocs] = useState(sampleDocuments);
  const [activeTab, setActiveTab] = useState('ask');

  const handleDelete = (id) => setDocs((prev) => prev.filter((d) => d.id !== id));

  const handleAdd = (doc) => {
    setDocs((prev) => [...prev, doc]);
    setActiveTab('docs');
  };

  const TABS = [
    { id: 'ask', label: 'Ask' },
    { id: 'docs', label: `Docs (${docs.length})` },
    { id: 'add', label: '+ Add doc' },
  ];

  return (
    <div className="flex flex-col bg-slate-50" style={{ height: '100dvh' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-5 pt-4 pb-0 flex-shrink-0 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h1 className="text-slate-900 font-bold text-lg tracking-tight">Objection Intelligence</h1>
              </div>
              <p className="text-slate-400 text-xs mt-0.5 ml-9">Arden Ridge Consulting · The Resilient Seller</p>
            </div>
            <div className="text-right mt-0.5">
              <p className="text-slate-400 text-xs">
                {docs.length} {docs.length === 1 ? 'document' : 'documents'} in knowledge base
              </p>
            </div>
          </div>

          {/* Tab bar */}
          <nav className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all mr-1 ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden max-w-2xl w-full mx-auto flex flex-col min-h-0">
        {activeTab === 'ask' && <AskTab docs={docs} />}
        {activeTab === 'docs' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <DocsTab docs={docs} onDelete={handleDelete} />
          </div>
        )}
        {activeTab === 'add' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <AddDocTab onAdd={handleAdd} />
          </div>
        )}
      </main>
    </div>
  );
}
