import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateGeminiResponse = async (apiKey, history, userMessage, currentEvents, globalContext = []) => {
    console.log("🚀 Gemini API Request Started");
    console.log("🔑 Using API Key:", apiKey ? (apiKey.substring(0, 10) + "..." + apiKey.substring(apiKey.length - 5)) : "None");

    const genAI = new GoogleGenerativeAI(apiKey);

    // List of models to try in order. 
    const modelsToTry = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-exp",
        "gemini-2.5-flash",
        "gemini-1.5-flash",
        "gemini-pro"
    ];

    let lastError = null;

    // Calculate today's date in KST (Korea Standard Time)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kstOffset = 9 * 60 * 60 * 1000;
    const today = new Date(utc + kstOffset);

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const dayName = today.toLocaleDateString('ko-KR', { weekday: 'long' });

    // Simplify events to save tokens
    const eventContext = [...currentEvents]
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .map(e => {
            const date = new Date(e.start);
            const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
            const dateStr = date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' });
            return `- [${dateStr} ${timeStr}] ${e.title} (${e.recurrence || 'once'})`;
        })
        .join('\n');

    // Format global context
    const globalContextStr = globalContext.length > 0
        ? globalContext.map(msg => `[${msg.sessionTitle}] ${msg.role}: ${msg.text}`).join('\n')
        : "No recent cross-session context.";

    const systemPrompt = `
You are an intelligent Calendar Assistant. Your goal is to help the user manage their schedule naturally and accurately.
Today is ${todayStr} (${dayName}).
**IMPORTANT: All times are in KST (Korea Standard Time). Do not convert to UTC.**

Current Schedule:
${eventContext || "No events scheduled."}

Recent User Interactions (Cross-Session Context):
${globalContextStr}

YOUR PROCESS:
1. **Analyze**: Understand the user's intent. Use the "Recent User Interactions" to understand broader context or recurring themes if the user asks for recommendations based on past conversations.
2. **Smart Scheduling & Conflict Resolution**:
   - **CRITICAL**: Check "Current Schedule" above. DO NOT suggest times that overlap with existing events.
   - If a requested time is busy, find the *nearest available slot* and explain why (e.g., "오후 2시는 [기존 일정]이 있어서 3시로 잡아드렸어요.").
   - If the user doesn't specify a time, find a **FREE SLOT** in the "Current Schedule".
   - **Business Hours**: Prefer Mon-Fri, 09:00 - 18:00 for meetings/work.
   - **Personal Time**: Prefer evenings/weekends for gym, movies, etc.
3. **Goal-Oriented Scheduling**:
   - When the user mentions a **goal** (e.g., "pass TOEIC", "get fit", "learn programming"), break it down into **concrete, achievable tasks**.
   - **Be realistic**: Don't overload the schedule. Suggest 1-2 hours per day max for intensive study.
   - **Progressive approach**: Start with easier/shorter sessions, gradually increase intensity.
   - **Include rest**: Leave buffer days (e.g., lighter load on weekends).
   - **Suggest variety**: Mix different types of activities (e.g., vocab + listening + practice tests).
4. **Recurrence Handling**:
   - "Every day" -> recurrence: "daily"
   - "Weekdays" (Mon-Fri) -> recurrence: "weekday"
   - "Weekends" (Sat-Sun) -> recurrence: "weekend"
   - "Every Monday" -> recurrence: "weekly" (Start date MUST be a Monday)
   - "Every other week" -> recurrence: "biweekly"
   - **Bounded Recurrence**: If the user says "for 1 week" or "until Dec 7th", set "recurrenceEnd" to the last date (YYYY-MM-DD).
5. **Duration Inference** (if not specified):
   - "Meeting", "Interview" -> 1 hour
   - "Quick chat", "Call" -> 30 mins
   - "Lunch", "Dinner" -> 1 hour
   - "Gym", "Exercise" -> 1.5 hours
   - "Focus time", "Study" -> 2 hours
   - Default -> 1 hour
   - **IMPORTANT**: You MUST calculate the "end" time based on the start time and duration.
6. **Reason**: Decide the best action (create/update/delete).
7. **Output**: Generate the response with a JSON block at the end.

EXAMPLES:
- User: "Schedule a team meeting next Tuesday."
  -> (Finds free slot on next Tuesday, e.g., 14:00)
  -> Action: "create", title: "Team Meeting", start: "2024-11-26T14:00:00", end: "2024-11-26T15:00:00", description: "Team meeting (suggested time)"
- User: "I want to exercise every weekday morning at 7am."
  -> Action: "create", title: "Exercise", start: "2024-11-25T07:00:00", end: "2024-11-25T08:30:00", recurrence: "weekday" (Start date must be a weekday)
- User: "Study TOEIC every day from Dec 1st to Dec 7th."
  -> Action: "create", title: "TOEIC Study", start: "2024-12-01T09:00:00", end: "2024-12-01T11:00:00", recurrence: "daily", recurrenceEnd: "2024-12-07"
- User: "Cancel the meeting on 2024-11-25."
  -> Action: "update", excludedDate: "2024-11-25"
- User: "I don't want to wake up at 7am on weekends anymore." (Event is Daily)
  -> Action: "update", recurrence: "weekday"

Rules:
1. Converse naturally in Korean. Explain *why* you chose a specific time if you inferred it (e.g., "화요일 오후 2시가 비어있어서 추천해드려요.").
2. **CRITICAL**: The text response MUST match the JSON data. If you say 2 PM in text, the JSON must be 14:00.
3. **CRITICAL**: Always provide a JSON block at the very end.
4. The JSON block must be wrapped in triple backticks (\`\`\`json ... \`\`\`).
5. The JSON block must follow this schema:
\`\`\`json
[
  {
    "action": "create" | "delete" | "update",
    "title": "Event Title",
    "start": "YYYY-MM-DDTHH:mm:ss",
    "end": "YYYY-MM-DDTHH:mm:ss", // Required. Calculate based on duration.
    "recurrence": "none" | "daily" | "weekday" | "weekend" | "weekly" | "biweekly" | "monthly" | "custom",
    "recurrenceDays": [0, 1, 2, 3, 4, 5, 6], // Required if recurrence is "custom". 0=Sun, 1=Mon...
    "recurrenceEnd": "YYYY-MM-DD",
    "excludedDays": [0, 1, ...],
    "excludedDate": "YYYY-MM-DD",
    "description": "Reason for change or detail",
    "originalTitle": "Exact title of event to delete/update",
    "colorId": "1" | "2" | ... | "11" // Optional. Google Calendar Color ID.
  }
]
\`\`\`

**Color Mapping (Google Calendar IDs):**
- "Blue" (Default/Blueberry) -> "9"
- "Green" (Sage/Basil) -> "2" or "10"
- "Purple" (Grape) -> "3"
- "Red" (Tomato) -> "11"
- "Yellow" (Banana) -> "5"
- "Orange" (Tangerine) -> "6"
- "Gray" (Graphite) -> "8"
- "Pink" (Flamingo) -> "4"

**Recurrence Rules:**
- "Every day" -> recurrence: "daily"
- "Weekdays" -> recurrence: "weekday"
- "Weekends" -> recurrence: "weekend"
- "Every Monday" -> recurrence: "weekly"
- "Mon, Wed, Fri" -> recurrence: "custom", recurrenceDays: [1, 3, 5]
- "Tue, Thu" -> recurrence: "custom", recurrenceDays: [2, 4]

**Intelligent Recurrence Recommendation:**
- If the user asks for "3 times a week" without specifying days, YOU MUST suggest specific days (e.g., Mon, Wed, Fri) and use \`recurrence: "custom"\` with \`recurrenceDays\`.
- Do NOT create multiple separate weekly events for a pattern like Mon/Wed/Fri. Use ONE event with \`recurrence: "custom"\`.

**Color Logic:**
- If the user asks to "mark [Topic] events in [Color]", add \`"colorId": "[ID]"\` to all created/updated events matching that topic.
- Example: "Mark TOEIC events in yellow" -> Use \`"colorId": "5"\` for TOEIC events.

**Description Logic:**
- When UPDATING an event (e.g., changing color or time), DO NOT add or change the \`description\` unless the user explicitly asks to add details.
- Keep the description field empty or null if it's just a color/time change.
`;

    const validHistory = history
        .filter(msg => msg.text && msg.text.trim().length > 0)
        .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

    for (const modelName of modelsToTry) {
        try {
            console.log(`Attempting to use model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const chat = model.startChat({
                history: validHistory,
                generationConfig: {
                    maxOutputTokens: 4000,
                },
            });

            const result = await chat.sendMessage(systemPrompt + "\nUser: " + userMessage);
            const response = await result.response;
            const text = response.text();

            // Parse JSON if present
            let cleanText = text;
            let suggestedEvents = null;

            // Regex to find the start of the JSON block
            const jsonStartRegex = /```(?:json)?\s*\[/;
            const jsonStartMatch = text.match(jsonStartRegex);

            if (jsonStartMatch) {
                // Cut off the text at the start of the JSON block
                cleanText = text.substring(0, jsonStartMatch.index).trim();

                // Try to extract the full JSON block
                const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    try {
                        suggestedEvents = JSON.parse(jsonMatch[1]);
                        console.log("🤖 AI Raw JSON:", suggestedEvents);
                    } catch (e) {
                        console.error("Failed to parse Gemini JSON", e);
                    }
                } else {
                    // Fallback: Try to parse from the start match to the end or try to repair
                    // If no closing backticks, it might be truncated. 
                    // We try to find the array part.
                    const arrayStartIndex = text.indexOf('[', jsonStartMatch.index);
                    if (arrayStartIndex !== -1) {
                        const potentialJson = text.substring(arrayStartIndex).replace(/```$/, '');
                        try {
                            suggestedEvents = JSON.parse(potentialJson);
                        } catch (e) {
                            console.error("Failed to parse truncated/malformed JSON", e);
                        }
                    }
                }
            } else {
                // Fallback for no backticks but array presence
                const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]$/);
                if (arrayMatch) {
                    cleanText = text.replace(arrayMatch[0], '').trim();
                    try {
                        suggestedEvents = JSON.parse(arrayMatch[0]);
                    } catch (e) {
                        console.error("Failed to parse fallback JSON", e);
                    }
                }
            }

            if (!cleanText && suggestedEvents) {
                cleanText = "일정을 생성했습니다. 아래 버튼을 눌러 확인해보세요.";
            }

            return {
                text: cleanText,
                events: suggestedEvents
            };

        } catch (error) {
            console.warn(`Model ${modelName} failed: `, error.message);
            lastError = error;
            continue;
        }
    }

    // If we get here, all models failed
    console.error("All Gemini models failed. Last error:", lastError);

    // Diagnostic check: List available models
    let diagnosticMsg = "";
    try {
        console.log("🔍 Running diagnostic check...");
        const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const listData = await listResponse.json();

        if (!listResponse.ok) {
            diagnosticMsg = `\n\n[진단 결과]: API 상태 확인 실패\nStatus: ${listResponse.status}\nMessage: ${listData.error?.message || 'Unknown error'}`;
        } else {
            const availableModels = listData.models ? listData.models.map(m => m.name.replace('models/', '')).join(', ') : '';
            if (availableModels) {
                diagnosticMsg = `\n\n[진단 결과]: 사용 가능한 모델 목록을 확인했습니다.\n감지된 모델: ${availableModels}\n\n코드에서 이 모델들을 사용하도록 업데이트했습니다. 다시 시도해보세요.`;
            } else {
                diagnosticMsg = `\n\n[진단 결과]: API 연결은 성공했으나, 사용 가능한 모델이 없습니다.`;
            }
        }
    } catch (diagError) {
        diagnosticMsg = `\n\n[진단 결과]: 네트워크 진단 실패 (${diagError.message})`;
    }

    let errorMsg = `오류가 발생했습니다 (${lastError?.message})`;
    if (lastError?.message.includes("404")) {
        errorMsg = "API가 활성화되지 않았거나 모델을 찾을 수 없습니다.\n(Google Cloud Console에서 'Generative Language API'를 사용 설정해야 할 수도 있습니다)";
    } else if (lastError?.message.includes("403")) {
        errorMsg = "API 키 권한이 없거나 만료되었습니다. (403 Forbidden)";
    } else if (lastError?.message.includes("400")) {
        errorMsg = "요청 형식이 잘못되었습니다. (400 Bad Request)";
    }

    return {
        text: `⚠️ ${errorMsg}${diagnosticMsg}\n\n1. Google AI Studio에서 새 키를 발급받아보세요.\n2. 'Generative Language API'가 활성화되어 있는지 확인하세요.`,
        error: true
    };
};
