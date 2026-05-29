"use client";

import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = [
  "Plan a 5-day Ladakh trip",
  "Best time to visit Goa?",
  "Budget trip to Manali",
  "Kedarnath trek guide",
  "Hidden gems in Meghalaya",
];

const WELCOME = {
  role: "assistant",
  content:
    "Namaste! 🙏 I'm **Yatra AI**, your personal India travel guide. I can help you plan itineraries, estimate budgets, find hidden gems, and make your trip unforgettable.\n\nWhat adventure are you dreaming of? 🏔️🏖️",
};

function formatMessage(text) {
  // Convert **bold** and newlines to styled spans
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

export default function TravelBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput("");
    setShowSuggestions(false);
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.role !== "assistant" || m !== WELCOME)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err.message || "Sorry, I ran into an issue. Please check your API key or try again. 🙏",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Floating Trigger Button ─────────── */}
      <button
        className={`yatra-bot-trigger ${open ? "active" : ""}`}
        onClick={() => setOpen(!open)}
        aria-label="Open Yatra AI travel assistant"
        id="yatra-bot-trigger"
      >
        <span className="yatra-bot-trigger-icon">
          {open ? "✕" : "✨"}
        </span>
        {!open && <span className="yatra-bot-trigger-label">Yatra AI</span>}
        {!open && <span className="yatra-bot-pulse" />}
      </button>

      {/* ── Chat Window ─────────────────────── */}
      <div className={`yatra-bot-window ${open ? "open" : ""}`} id="yatra-bot-window">
        {/* Header */}
        <div className="yatra-bot-header">
          <div className="yatra-bot-header-info">
            <div className="yatra-bot-avatar">✨</div>
            <div>
              <div className="yatra-bot-name">Yatra AI</div>
              <div className="yatra-bot-status">
                <span className="yatra-bot-online-dot" />
                India Travel Expert
              </div>
            </div>
          </div>
          <button
            className="yatra-bot-close"
            onClick={() => setOpen(false)}
            aria-label="Close chatbot"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="yatra-bot-messages" id="yatra-bot-messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`yatra-bot-msg ${msg.role === "user" ? "user" : "assistant"}`}
            >
              {msg.role === "assistant" && (
                <div className="yatra-bot-msg-avatar">✨</div>
              )}
              <div
                className="yatra-bot-msg-bubble"
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
              />
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="yatra-bot-msg assistant">
              <div className="yatra-bot-msg-avatar">✨</div>
              <div className="yatra-bot-typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions */}
        {showSuggestions && (
          <div className="yatra-bot-suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="yatra-bot-suggestion-chip"
                onClick={() => sendMessage(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="yatra-bot-input-row">
          <input
            ref={inputRef}
            className="yatra-bot-input"
            placeholder="Ask about any destination..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            id="yatra-bot-input"
          />
          <button
            className="yatra-bot-send"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            id="yatra-bot-send"
          >
            {loading ? (
              <span className="yatra-send-spinner" />
            ) : (
              "➤"
            )}
          </button>
        </div>
      </div>

      {/* Backdrop (mobile) */}
      {open && (
        <div className="yatra-bot-backdrop" onClick={() => setOpen(false)} />
      )}
    </>
  );
}
