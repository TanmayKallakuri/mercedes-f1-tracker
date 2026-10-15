"use client";

import { useState } from "react";
import { useEveAgent } from "eve/react";

const SUGGESTIONS = [
  "Where do Mercedes stand in the constructors' championship?",
  "Can Antonelli clinch the title in Austin?",
  "How did Russell do in Singapore?",
  "When is the next race and what time does it start?",
  "Who is ahead in the Antonelli vs Russell head to head?",
];

export function Chat() {
  const agent = useEveAgent();
  const [draft, setDraft] = useState("");
  const isBusy = agent.status === "submitted" || agent.status === "streaming";
  const isResuming = agent.status === "resuming";

  function submit(text: string) {
    const message = text.trim();
    if (!message || isResuming) return;
    void agent.send(message, isBusy ? { turnPolicy: "steer" } : undefined);
    setDraft("");
  }

  const messages = agent.data.messages;

  return (
    <main className="ask">
      <header>
        <span className="eyebrow">Silver Arrows 2026 · eve agent</span>
        <h1>Ask the agent</h1>
        <a className="btn" href="/">Back to tracker</a>
        <span className={`status ${isBusy ? "live" : ""}`}>{agent.status}</span>
      </header>

      <section className="thread" aria-live="polite">
        {messages.length === 0 && (
          <p className="empty">
            Live answers from the eve agent behind this site. It calls its own tools (standings, Mercedes results, next race, title math) against the live F1 data feed, so every number is fetched at the moment you ask.
          </p>
        )}
        {messages.map((m) => (
          <article key={m.id} className={`msg ${m.role}`}>
            <span className="role">{m.role === "user" ? "You" : "Agent"}</span>
            {m.parts.map((part: any, i: number) => {
              if (part.type === "text") return <span key={part.id ?? i}>{part.text}</span>;
              if (typeof part.type === "string" && part.type.startsWith("tool")) {
                const name = part.toolName ?? part.type.replace(/^tool-?/, "");
                return <span key={part.id ?? i} className="tool">tool: {name || "call"}</span>;
              }
              return null;
            })}
          </article>
        ))}
        {agent.error && <p className="error">{String(agent.error.message ?? agent.error)}</p>}
      </section>

      {messages.length === 0 && (
        <div className="chips">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip" type="button" onClick={() => submit(s)}>{s}</button>
          ))}
        </div>
      )}

      <form className="composer" onSubmit={(e) => { e.preventDefault(); submit(draft); }}>
        <input id="askInput" name="message" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about the Mercedes season" disabled={isResuming} autoComplete="off" />
        <button className="btn primary" type="submit" disabled={isResuming || !draft.trim()}>Send</button>
      </form>
    </main>
  );
}
