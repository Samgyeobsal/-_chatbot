"use client"

import { useState, useRef, useEffect } from "react"

interface Message {
  role: "user" | "assistant"
  content: string
}

type Theme = "white" | "blue" | "dark"

const themes = {
  white: {
    bg: "bg-gray-50",
    header: "bg-gray-50",
    badgeBg: "bg-emerald-50 border-emerald-200",
    badgeDot: "bg-emerald-500",
    badgeText: "text-emerald-700",
    title: "text-gray-800",
    subtitle: "text-gray-400",
    chatBubbleAI: "bg-white border border-gray-200 text-gray-800 shadow-sm",
    chatBubbleUser: "bg-emerald-500 text-white",
    aiBadge: "bg-emerald-100 border-emerald-200",
    loadingBubble: "bg-white border border-gray-200 shadow-sm",
    dot: "bg-emerald-400",
    suggestionBtn: "bg-white border border-gray-200 text-gray-500 hover:text-emerald-600 hover:border-emerald-300 shadow-sm",
    footer: "bg-gray-50 border-t border-gray-100",
    input: "bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-emerald-400",
    footerText: "text-gray-300",
    themeBtnBg: "bg-white border border-gray-200 shadow-sm",
    themeBtnText: "text-gray-600",
  },
  blue: {
    bg: "bg-[#0a0f1e]",
    header: "bg-transparent",
    badgeBg: "bg-white/5 border-white/10",
    badgeDot: "bg-emerald-400",
    badgeText: "text-white/60",
    title: "text-white",
    subtitle: "text-white/40",
    chatBubbleAI: "bg-white/5 border border-white/10 text-white/90",
    chatBubbleUser: "bg-emerald-600 text-white",
    aiBadge: "bg-emerald-500/20 border-emerald-500/30",
    loadingBubble: "bg-white/5 border border-white/10",
    dot: "bg-emerald-400",
    suggestionBtn: "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-emerald-500/50",
    footer: "bg-[#0a0f1e]/80 backdrop-blur border-t border-white/5",
    input: "bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-emerald-500/50",
    footerText: "text-white/20",
    themeBtnBg: "bg-white/10 border border-white/20",
    themeBtnText: "text-white/70",
  },
  dark: {
    bg: "bg-gray-950",
    header: "bg-gray-950",
    badgeBg: "bg-gray-800 border-gray-700",
    badgeDot: "bg-emerald-400",
    badgeText: "text-gray-400",
    title: "text-gray-100",
    subtitle: "text-gray-500",
    chatBubbleAI: "bg-gray-800 border border-gray-700 text-gray-100",
    chatBubbleUser: "bg-emerald-600 text-white",
    aiBadge: "bg-gray-700 border-gray-600",
    loadingBubble: "bg-gray-800 border border-gray-700",
    dot: "bg-emerald-400",
    suggestionBtn: "bg-gray-800 border border-gray-700 text-gray-400 hover:text-emerald-400 hover:border-emerald-700",
    footer: "bg-gray-950 border-t border-gray-800",
    input: "bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:border-emerald-500",
    footerText: "text-gray-600",
    themeBtnBg: "bg-gray-800 border border-gray-700",
    themeBtnText: "text-gray-400",
  },
}

const themeOptions: { key: Theme; label: string; color: string }[] = [
  { key: "white", label: "화이트", color: "bg-gray-100 border-gray-300" },
  { key: "blue",  label: "블루",   color: "bg-[#1a2744] border-blue-400" },
  { key: "dark",  label: "다크",   color: "bg-gray-800 border-gray-600" },
]

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "안녕하세요! 저는 공익활동 추천 도우미예요 😊\n\n어떤 분야에 관심이 있으신가요? 환경, 아동, 노인, 장애인, 교육 등 다양한 활동이 있어요. 또는 사시는 지역을 알려주시면 근처 활동을 찾아드릴게요!"
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState<Theme>("white")
  const [themeOpen, setThemeOpen] = useState(false)
  const [dbStatus, setDbStatus] = useState<"checking" | "ready" | "unavailable">("checking")
  const [suggestions, setSuggestions] = useState<string[]>(["환경 관련 활동 찾아줘", "서울 근처 봉사활동", "교육 관련 모집 중인 곳", "채용 공고 알려줘"])
  const bottomRef = useRef<HTMLDivElement>(null)
  const t = themes[theme]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/status")
        const data = await res.json()
        setDbStatus(data.ready ? "ready" : "unavailable")
      } catch {
        setDbStatus("unavailable")
      }
    }
    checkStatus()
    const interval = setInterval(checkStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: "user", content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }])
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions)
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "오류가 발생했어요. 다시 시도해주세요." }])
    } finally {
      setLoading(false)
    }
  }

  function formatMessage(text: string) {
    return text.split("\n").map((line, i) => (
      <span key={i}>
        {line.split(/(https?:\/\/[^\s]+)/g).map((part, j) =>
          part.match(/^https?:\/\//) ? (
            <a key={j} href={part} target="_blank" rel="noopener noreferrer"
               className="underline underline-offset-2 opacity-80 hover:opacity-100 break-all">
              {part}
            </a>
          ) : part
        )}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    ))
  }

  return (
    <div className={`min-h-screen ${t.bg} flex flex-col transition-colors duration-300`}>
      {theme === "blue" && (
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_#1a2744_0%,_#0a0f1e_60%)] pointer-events-none" />
      )}

      {/* 헤더 */}
      <div className={`relative z-10 text-center pt-8 pb-4 px-4 ${t.header} transition-colors duration-300`}>
        {/* 테마 선택 버튼 */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setThemeOpen(prev => !prev)}
            className={`flex items-center gap-1.5 ${t.themeBtnBg} ${t.themeBtnText} rounded-full px-3 py-1.5 text-xs font-medium transition-all`}
          >
            <span>테마</span>
            <svg className={`w-3 h-3 transition-transform ${themeOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {themeOpen && (
            <div className={`absolute right-0 mt-1 w-32 rounded-xl shadow-lg border overflow-hidden z-50 ${theme === "white" ? "bg-white border-gray-200" : theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-[#1a2744] border-white/20"}`}>
              {themeOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => { setTheme(opt.key); setThemeOpen(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-all ${
                    theme === opt.key
                      ? theme === "white" ? "bg-emerald-50 text-emerald-700" : "bg-emerald-500/20 text-emerald-400"
                      : theme === "white" ? "text-gray-600 hover:bg-gray-50" : theme === "dark" ? "text-gray-400 hover:bg-gray-700" : "text-white/60 hover:bg-white/10"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border ${opt.color} shrink-0`} />
                  {opt.label}
                  {theme === opt.key && <span className="ml-auto">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <img src="/logo.png" alt="공익잇다 로고" className="h-12 mx-auto mb-3 object-contain" />
        <h1 className={`text-2xl font-bold tracking-tight ${t.title}`}>
          공익잇다 <span className="text-emerald-500">AI 추천서비스</span>
        </h1>
        <p className={`text-sm mt-1 ${t.subtitle}`}>경기도 공익활동 DB 기반 맞춤 추천</p>

        {/* DB 상태 알약 */}
        <div className="flex justify-center mt-3">
          {dbStatus === "checking" && (
            <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs text-yellow-600 font-medium">DB 상태 확인 중...</span>
            </div>
          )}
          {dbStatus === "ready" && (
            <div className={`inline-flex items-center gap-2 border rounded-full px-4 py-1.5 ${t.badgeBg}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className={`text-xs font-medium ${t.badgeText}`}>DB 상태 : 준비됨</span>
            </div>
          )}
          {dbStatus === "unavailable" && (
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-xs text-red-500 font-medium">DB 상태 : 준비되지 않음</span>
            </div>
          )}
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="relative z-10 flex-1 w-full max-w-2xl mx-auto px-4 py-4">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center mr-2 mt-1 shrink-0 text-sm ${t.aiBadge}`}>
                  🤝
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-colors duration-300 ${
                msg.role === "user" ? `${t.chatBubbleUser} rounded-tr-sm` : `${t.chatBubbleAI} rounded-tl-sm`
              }`}>
                {formatMessage(msg.content)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center mr-2 shrink-0 text-sm ${t.aiBadge}`}>
                🤝
              </div>
              <div className={`rounded-2xl rounded-tl-sm px-4 py-3 ${t.loadingBubble}`}>
                <div className="flex gap-1 items-center h-4">
                  <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${t.dot}`} style={{ animationDelay: "0ms" }} />
                  <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${t.dot}`} style={{ animationDelay: "150ms" }} />
                  <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${t.dot}`} style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map(q => (
                <button
                  key={q}
                  onClick={() => {
                    const userMsg: Message = { role: "user", content: q }
                    const newMessages = [...messages, userMsg]
                    setMessages(newMessages)
                    setSuggestions([])
                    setLoading(true)
                    fetch("/api/chat", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ messages: newMessages })
                    })
                      .then(res => res.json())
                      .then(data => {
                        setMessages(prev => [...prev, { role: "assistant", content: data.reply }])
                        if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
                          setSuggestions(data.suggestions)
                        }
                      })
                      .catch(() => {
                        setMessages(prev => [...prev, { role: "assistant", content: "오류가 발생했어요. 다시 시도해주세요." }])
                      })
                      .finally(() => setLoading(false))
                  }}
                  className={`text-xs border rounded-full px-3 py-1.5 transition-all ${t.suggestionBtn}`}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* 입력창 - 하단 고정 */}
      <div className={`relative z-10 sticky bottom-0 w-full px-4 py-4 transition-colors duration-300 ${t.footer}`}>
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="관심 분야나 지역을 알려주세요..."
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-colors ${t.input}`}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-5 py-3 text-sm font-medium transition-colors"
          >
            전송
          </button>
        </div>
        <p className={`text-center text-xs mt-2 ${t.footerText}`}>
          경기도공익활동지원센터 DB 기반 · AI 답변은 참고용입니다
        </p>
      </div>
    </div>
  )
}
