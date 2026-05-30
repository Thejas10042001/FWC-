import React, { useState, useEffect, useRef } from "react";
import { Candidate } from "../types";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Play, 
  Sparkles, 
  ArrowRight, 
  Cpu, 
  CornerDownRight, 
  CheckCircle2 
} from "lucide-react";

interface VoiceInterviewProps {
  candidates: Candidate[];
}

export default function VoiceInterview({ candidates }: VoiceInterviewProps) {
  const [selectedCandidateId, setSelectedCandidateId] = useState(candidates[0]?.candidateId || "");
  const [status, setStatus] = useState("Idle");
  
  // Script dialog states
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [audioBase64, setAudioBase64] = useState("");
  const [userAnswerText, setUserAnswerText] = useState("");
  const [transcriptLog, setTranscriptLog] = useState<Array<{ sender: "AI" | "Candidate"; text: string }>>([]);
  
  // Mic state StT indicators
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifying, setNotifying] = useState("");

  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API for Speech-to-Text fallback integration
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsRecording(true);
        setStatus("Listening for speech input...");
      };

      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setUserAnswerText(prev => prev ? `${prev} ${text}`.trim() : text);
      };

      rec.onerror = (err: any) => {
        console.error("Speech Recognition Error:", err);
        setNotifying("Microphone input delay or denied. Feel free to type text instead.");
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
        setStatus("Recorded.");
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleToggleRecord = () => {
    if (!recognitionRef.current) {
      setNotifying("Web Speech API is not natively supported in this environment browser frame. Please type manually inside text fields.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setNotifying("");
      recognitionRef.current.start();
    }
  };

  // Play synthetic voice question base64 URI
  const playAudio = (base64: string) => {
    if (!base64) return;
    try {
      const dataUri = `data:audio/mp3;base64,${base64}`;
      const audio = new Audio(dataUri);
      audio.play();
    } catch (err) {
      console.error("Audio playback error:", err);
      setNotifying("Audio reproduction skipped by browser frame policies.");
    }
  };

  // Start interview request
  const handleStartInterview = async () => {
    if (!selectedCandidateId) return;
    setLoading(true);
    setTranscriptLog([]);
    setNotifying("Warming up Gemini synthetic audio voice...");

    try {
      const response = await fetch("/api/voice-interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: selectedCandidateId })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCurrentQuestion(data.question);
        setAudioBase64(data.audioBase64);
        setTranscriptLog([{ sender: "AI", text: data.question }]);
        playAudio(data.audioBase64);
        setStatus("Interview Active");
        setNotifying("AI Speak simulation playing...");
      }
    } catch (err) {
      setNotifying("Voice generator currently offline.");
    } finally {
      setLoading(false);
    }
  };

  // Answer and progress to next question
  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswerText || !selectedCandidateId) return;
    setLoading(true);
    setNotifying("Evaluating response and synthesizing next technical question...");

    // Log answer
    const currentAnswer = userAnswerText;
    setTranscriptLog(prev => [...prev, { sender: "Candidate", text: currentAnswer }]);
    setUserAnswerText("");

    try {
      const response = await fetch("/api/voice-interview/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: selectedCandidateId,
          lastAnswer: currentAnswer
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCurrentQuestion(data.question);
        setAudioBase64(data.audioBase64);
        setTranscriptLog(prev => [...prev, { sender: "AI", text: data.question }]);
        playAudio(data.audioBase64);
        setNotifying("");
      }
    } catch (err) {
      setNotifying("Voice query evaluation error.");
    } finally {
      setLoading(false);
    }
  };

  const selectedCandidateObj = candidates.find(c => c.candidateId === selectedCandidateId);

  return (
    <div className="font-sans space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-1000">AI Voice Interview Simulator (StT/TtS Sandbox)</h2>
        <p className="text-xs text-slate-500">
          Conduct synthetic technical interviews using Gemini Voice generator. Speak using your microphone or submit text.
        </p>
      </div>

      {notifying && (
        <div className="bg-slate-900 border border-slate-800 text-teal-400 text-xs font-mono p-3 rounded-xl flex items-center gap-2">
          <Sparkles className="h-4 w-4 animate-spin text-teal-400" />
          <span>{notifying}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Setup Parameters Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Voice synthesis standard</span>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">Model: gemini-3.5-flash-tts</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Select Interview Candidate</label>
            <select
              value={selectedCandidateId}
              onChange={(e) => {
                setSelectedCandidateId(e.target.value);
                setStatus("Idle");
                setCurrentQuestion("");
                setTranscriptLog([]);
              }}
              className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
            >
              <option value="">-- Choose applicant --</option>
              {candidates.map(c => (
                <option key={c.candidateId} value={c.candidateId}>{c.fullName} ({c.jobTitle})</option>
              ))}
            </select>
          </div>

          {selectedCandidateObj && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-slate-600">
                <p><strong>Position applied:</strong> {selectedCandidateObj.jobTitle}</p>
                <p><strong>Status stage:</strong> {selectedCandidateObj.stage}</p>
              </div>

              {status === "Idle" ? (
                <button
                  type="button"
                  onClick={handleStartInterview}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow cursor-pointer transition active:scale-95"
                >
                  <Play className="h-4 w-4 fill-current shrink-0" />
                  Initiate AI Voice Interview
                </button>
              ) : (
                <div className="p-3 bg-emerald-500/[0.04] border border-emerald-500/10 text-emerald-800 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-[11px]">AI Session Active Connection</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dialog & Chat Console */}
        <div className="lg:col-span-2 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[520px] overflow-hidden">
          {/* Header */}
          <div className="bg-white p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-900 text-white rounded-lg animate-pulse">
                <Volume2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-800">Direct Technical Audio Feed</h3>
                <p className="text-[9px] text-slate-400">Streamed from Aether AI Voice Gateway</p>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full select-none">
              {status}
            </span>
          </div>

          {/* Transcript Logs */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans bg-slate-50/50">
            {transcriptLog.map((log, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[85%] ${log.sender === "Candidate" ? "ml-auto flex-row-reverse" : ""}`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                  log.sender === "AI" ? "bg-slate-900 text-white" : "bg-emerald-500 text-slate-950"
                }`}>
                  {log.sender === "AI" ? "AI" : "C"}
                </div>
                <div className={`p-4.5 rounded-2xl text-xs leading-relaxed font-serif ${
                  log.sender === "AI" 
                    ? "bg-white border border-slate-200 text-slate-800 shadow-xs" 
                    : "bg-emerald-500/10 border border-emerald-500/15 text-slate-900"
                }`}>
                  <p className="font-sans font-bold text-[10px] text-slate-400 uppercase mb-1">{log.sender}</p>
                  <p className="whitespace-pre-line">"{log.text}"</p>
                  
                  {log.sender === "AI" && idx === transcriptLog.length - 1 && audioBase64 && (
                    <button
                      onClick={() => playAudio(audioBase64)}
                      className="mt-3 flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[9px] font-bold text-slate-700 transition"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      Replay sound
                    </button>
                  )}
                </div>
              </div>
            ))}

            {transcriptLog.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2.5">
                <Mic className="h-10 w-10 text-slate-300" />
                <p className="text-xs">Start AI session in the left-hand parameters deck to compile technical questions.</p>
              </div>
            )}
          </div>

          {/* Form answers inputs bar */}
          {status === "Interview Active" && (
            <form onSubmit={handleAnswerSubmit} className="bg-white p-4 border-t border-slate-200 shrink-0 space-y-3">
              <div className="flex gap-2.5">
                {/* Micro Input trigger */}
                <button
                  type="button"
                  onClick={handleToggleRecord}
                  title="Speak through mic"
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-center shrink-0 ${
                    isRecording 
                      ? "bg-rose-500 border-rose-500 text-white animate-pulse shadow-md shadow-rose-300" 
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100/50 text-slate-600"
                  }`}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                <input
                  type="text"
                  required
                  value={userAnswerText}
                  onChange={(e) => setUserAnswerText(e.target.value)}
                  placeholder={isRecording ? "Speak now or type matching details..." : "Type candidate responses..."}
                  className="flex-grow px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-slate-900/10 focus:border-slate-900 text-slate-800"
                />

                <button
                  type="submit"
                  disabled={loading || !userAnswerText}
                  className="px-4 py-2.5 bg-slate-900 border border-transparent rounded-xl text-white hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 shrink-0 transition"
                >
                  <span>Transmit</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                Click microphone to record vocally or type freely inside the entry field buffer.
              </p>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
