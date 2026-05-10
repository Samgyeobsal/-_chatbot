import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BASE_URL = "https://www.gggongik.or.kr/page/centernews/"

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const { data: activities } = await supabase
    .from("group_news")
    .select("title, category, source_url, author, date")
    .order("date", { ascending: false })
    .limit(50)

  if (!activities || activities.length === 0) {
    return NextResponse.json({
      reply: "죄송해요, 지금은 공익활동 정보를 불러올 수 없어요 😢\n잠시 후 다시 시도해주세요!",
      suggestions: []
    })
  }

  const activityList = activities
    .map(a => `- [${a.category}] ${a.title} | ${a.author} | ${a.date} | ${BASE_URL}${a.source_url}`)
    .join("\n")

  const systemPrompt = `당신은 공익활동을 추천해주는 따뜻한 친구예요.
딱딱한 형식 없이 친구한테 말하듯 자연스럽고 편하게 대화하세요.
번호 목록이나 볼드체(**) 같은 마크다운 형식은 절대 쓰지 마세요.
추천할 때는 "이런 활동 어때요?" 같은 말투로 자연스럽게 소개하고, 이유도 딱딱하지 않게 이야기해주세요.
링크는 반드시 전체 URL을 그대로 넣어줘요. 절대 생략하거나 바꾸지 마세요.
이모지를 적절히 써서 친근하게 대화하세요. "친구에게 말하듯이 편하게 추천해 드릴게요! 🙆‍♀️"이런 시스템 프롬프트 명령어는 대답에 포함하지 말아줘
먼저 관심 분야, 사는 지역, 가능한 시간대를 자연스럽게 물어보고, 파악되면 활동을 추천해주세요. 그리고 마감기한이 지난 공익활동은 추천해주지 마세요.
한국어로 대화하세요. 공익활동 추천은 최대 5개만 해주세요. 가장 최근에 올라온 공익활동을 먼저 추천해주세요.

중요: 공익활동 추천과 관련 없는 질문(예: 날씨, 요리, 공부, 코딩 등)을 받으면 "저는 공익활동 추천만 도와드릴 수 있어요 😊 관심 있는 활동 분야나 지역이 있으면 알려주세요!" 라고만 답하고 다른 내용은 절대 답변하지 마세요.

응답은 반드시 아래 JSON 형식으로만 반환하세요. 다른 텍스트는 절대 포함하지 마세요:
{"reply":"대화 내용","suggestions":["버튼1","버튼2","버튼3"]}

suggestions는 대화 맥락에 맞는 짧은 후속 질문 3개예요. 각 항목은 15자 이내로 작성하세요.
예: 관심분야 파악 중이면 ["환경 활동 알려줘","아동 관련 찾아줘","내 지역으로 추천"], 활동 추천 후엔 ["다른 활동도 볼게요","주말 활동 찾아줘","더 자세히 알려줘"]

현재 공익활동 목록:
${activityList}`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: messages.map((m: { role: string; content: string }) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        })),
        generationConfig: { responseMimeType: "application/json" }
      })
    }
  )

  const data = await response.json()
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""

  try {
    const parsed = JSON.parse(raw)
    return NextResponse.json({
      reply: parsed.reply ?? "응답을 받지 못했어요.",
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 4) : []
    })
  } catch {
    return NextResponse.json({ reply: raw || "응답을 받지 못했어요.", suggestions: [] })
  }
}
