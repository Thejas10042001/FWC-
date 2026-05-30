import React, { useState } from "react";
import { Sparkles, Send, MessageSquare, ArrowRight, HelpCircle, ShieldAlert } from "lucide-react";

export default function HRAssistant() {
  const [messages, setMessages] = useState<Array<{ sender: "AI" | "User"; text: string }>>([
    { sender: "AI", text: "Hello! I am Aether AI HelpDesk. Ask me anything about corporate leaves, insurance caps, ESI or PF structures, and payroll. I retrieve certified policies to provide answers!" }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifying, setNotifying] = useState("");

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal) return;

    const userText = inputVal;
    setInputVal("");
    setMessages(prev => [...prev, { sender: "User", text: userText }]);
    setLoading(true);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMessages(prev => [...prev, { sender: "AI", text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: "AI", text: "I ran into a connection glitch reaching corporate policy logs. Please try checking your question." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: "AI", text: "Aether AI gateway offline." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (qText: string) => {
    setInputVal(qText);
  };

  return (
    <div className="font-sans space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-950">AI Institutional HelpDesk</h2>
        <p className="text-xs text-slate-500">Conversational policy lookups grounded in enterprise manuals using Gemini.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Grounding & Help parameters */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest">Grounding constraints</span>
              <p className="text-xs text-slate-600 leading-relaxed font-serif italic mb-1">
                "System instructions enforce answering policy details (leaves, pay PF/ESI caps, on-board rules) with zero hallucinations allowed."
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Institutional Hotkeys</span>
              <div className="space-y-2">
                <button
                  onClick={() => handleQuickQuestion("What are my Casual, Sick and Earned leave balances?")}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs text-slate-700 transition"
                >
                  "Check my current leave quotas."
                </button>
                <button
                  onClick={() => handleQuickQuestion("How is PF and ESI calculated on my base salary?")}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs text-slate-700 transition"
                >
                  "How are my PF structure computed?"
                </button>
                <button
                  onClick={() => handleQuickQuestion("What designation and joining date are logged in my file?")}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs text-slate-700 transition"
                >
                  "Verify my personal designation logs."
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-indigo-50 border border-indigo-150 rounded-xl text-xs text-indigo-800 leading-relaxed">
            Policy updates occur on semi-annual board cycles. Contact administration for structural amendments.
          </div>
        </div>

        {/* Messaging Box Console */}
        <div className="lg:col-span-2 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[520px] overflow-hidden">
          {/* Messages track */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans bg-slate-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${m.sender === "User" ? "ml-auto flex-row-reverse" : ""}`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none ${
                  m.sender === "AI" ? "bg-slate-900 text-white" : "bg-teal-500 text-slate-950"
                }`}>
                  {m.sender === "AI" ? "AI" : "U"}
                </div>
                <div className={`p-4 rounded-xl text-xs leading-relaxed ${
                  m.sender === "AI" 
                    ? "bg-white border border-slate-250/60 text-slate-800 shadow-xs" 
                    : "bg-teal-200/50 border border-teal-200/60 text-slate-900"
                }`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{m.sender === "AI" ? "HelpDesk" : "You"}</span>
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs select-none">AI</div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-slate-900 rounded-full animate-bounce"></span>
                  <span className="h-1.5 w-1.5 bg-slate-900 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-1.5 w-1.5 bg-slate-900 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
          </div>

          {/* entry controls form */}
          <form onSubmit={handleSendMessage} className="bg-white p-4 border-t border-slate-200 shrink-0">
            <div className="flex gap-2.5">
              <input
                type="text"
                required
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask policies, tax calculations, vacation limits..."
                className="flex-grow px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-slate-900/10 focus:border-slate-900 text-slate-800 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !inputVal}
                className="px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center"
              >
                <Send className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
