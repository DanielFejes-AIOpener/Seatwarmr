require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
// Use a different default port to avoid clashing with any other dev server you might be running
const PORT = process.env.PORT || 3000;

const PREF_FILE = path.join(__dirname, "preferences.txt");
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

function ensurePrefFile() {
    if (!fs.existsSync(PREF_FILE)) {
        fs.writeFileSync(PREF_FILE, "", "utf8");
    }
}

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serves chat.html and other static files

app.post("/api/chat", async (req, res) => {
    const { messages, max_tokens, temperature } = req.body || {};

    console.log("[/api/chat] Incoming request");

    if (!Array.isArray(messages)) {
        console.warn("[/api/chat] Invalid messages payload:", messages);
        return res.status(400).json({ error: "messages array is required" });
    }

    const apiKey = process.env.OPEN_ROUTER_API_KEY;
    if (!apiKey) {
        console.error("[/api/chat] Missing OPEN_ROUTER_API_KEY env var");
        return res.status(500).json({ error: "OPEN_ROUTER_API_KEY is not configured" });
    }

    console.log("[/api/chat] Using OPEN_ROUTER_API_KEY prefix:", apiKey.slice(0, 10));

    try {
        console.log("[/api/chat] Sending request to OpenRouter with", messages.length, "messages");
        const orRes = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost",
                "X-Title": "Vibe Dating Chat Demo"
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages,
                max_tokens: max_tokens || 256,
                temperature: typeof temperature === "number" ? temperature : 0.9
            })
        });

        console.log("[/api/chat] OpenRouter status:", orRes.status);

        if (!orRes.ok) {
            const text = await orRes.text().catch(() => "");
            console.error("OpenRouter error:", orRes.status, text);
            return res.status(502).json({ error: "Failed calling OpenRouter" });
        }

        const data = await orRes.json();
        console.log("[/api/chat] OpenRouter raw response (truncated):", JSON.stringify(data).slice(0, 400));

        const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

        if (!reply) {
            console.error("[/api/chat] No reply field in OpenRouter response");
            return res.status(502).json({ error: "No reply from OpenRouter model" });
        }

        console.log("[/api/chat] Reply length:", reply.length);
        res.json({ reply });
    } catch (err) {
        console.error("Error in /api/chat:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/api/preferences/analyze", async (req, res) => {
    const { aiMessage, userMessage } = req.body || {};
    console.log("[/api/preferences/analyze] Incoming", {
        aiMessageSnippet: (aiMessage || "").slice(0, 80),
        userMessageSnippet: (userMessage || "").slice(0, 80)
    });

    if (!userMessage || typeof userMessage !== "string") {
        return res.status(400).json({ error: "userMessage is required" });
    }

    const apiKey = process.env.OPEN_ROUTER_API_KEY;
    if (!apiKey) {
        console.error("[/api/preferences/analyze] Missing OPEN_ROUTER_API_KEY env var");
        return res.status(500).json({ error: "OPEN_ROUTER_API_KEY is not configured" });
    }

    const PREF_TOOL = [
        {
            type: "function",
            function: {
                name: "save_preference",
                description:
                    "Persist a concise statement that describes what the user likes or wants in a romantic partner or relationship, based on the current exchange.",
                parameters: {
                    type: "object",
                    properties: {
                        summary: {
                            type: "string",
                            description:
                                "One short sentence summarizing a concrete partner or relationship preference. Example: 'Prefers partners who are goofy and don’t take life too seriously.'"
                        }
                    },
                    required: ["summary"]
                }
            }
        }
    ];

    const systemPrompt = [
        "You analyze a single turn of a playful dating-app style chat between two people.",
        "You see the AI's last question/message (if any) and the human's reply.",
        "Your ONLY job is to decide whether the reply expresses a concrete preference about what they like or want in a romantic partner or relationship.",
        "If there is a clear preference, call the save_preference tool exactly once with a short, plain-text summary.",
        "If there is no clear partner preference, do NOT call any tools and simply reply with the text: NO_PREFERENCE."
    ].join(" ");

    const contents = [
        {
            role: "system",
            content: systemPrompt
        },
        {
            role: "user",
            content: [
                "Here is the latest exchange in the chat.",
                "",
                "AI just said:",
                `\"\"\"${aiMessage || ""}\"\"\"`,
                "",
                "User replied:",
                `\"\"\"${userMessage}\"\"\"`
            ].join("\n")
        }
    ];

    try {
        console.log("[/api/preferences/analyze] Sending to OpenRouter");
        const orRes = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost",
                "X-Title": "Vibe Dating Preferences Tool"
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: contents,
                tools: PREF_TOOL,
                tool_choice: "auto",
                max_tokens: 128,
                temperature: 0
            })
        });

        console.log("[/api/preferences/analyze] OpenRouter status:", orRes.status);
        if (!orRes.ok) {
            const text = await orRes.text().catch(() => "");
            console.error("OpenRouter error in /api/preferences/analyze:", orRes.status, text);
            return res.status(502).json({ error: "Failed calling OpenRouter for preferences" });
        }

        const data = await orRes.json();
        console.log("[/api/preferences/analyze] Raw OR response (truncated):", JSON.stringify(data).slice(0, 400));
        const choice = data.choices && data.choices[0];
        const message = choice && choice.message;

        let saved = false;
        let summaryFromTool = null;

        const toolCalls = message && message.tool_calls;
        console.log("[/api/preferences/analyze] toolCalls:", toolCalls && toolCalls.length);
        if (Array.isArray(toolCalls) && toolCalls.length > 0) {
            for (const call of toolCalls) {
                console.log("[/api/preferences/analyze] Handling tool call:", call && call.function && call.function.name);
                if (!call || !call.function) continue;
                if (call.function.name !== "save_preference") continue;

                try {
                    const args = typeof call.function.arguments === "string"
                        ? JSON.parse(call.function.arguments)
                        : call.function.arguments || {};
                    const summary = (args.summary || "").toString().trim();
                    console.log("[/api/preferences/analyze] Parsed summary:", summary);
                    if (!summary) continue;

                    ensurePrefFile();
                    const line = `[${new Date().toISOString()}] user: ${summary.replace(/\s+/g, " ").trim()}\n`;
                    fs.appendFileSync(PREF_FILE, line, "utf8");
                    console.log("[/api/preferences/analyze] Wrote preference line to", PREF_FILE);
                    saved = true;
                    summaryFromTool = summary;
                } catch (err) {
                    console.error("Failed to handle save_preference tool call:", err);
                }
            }
        }

        // If no tool call, check for explicit NO_PREFERENCE or text content
        let modelText = "";
        if (message && typeof message.content === "string") {
            modelText = message.content;
        } else if (message && Array.isArray(message.content)) {
            // Some OpenAI-style models return an array of parts
            modelText = message.content.map((p) => p.text || "").join(" ").trim();
        }

        const noPreference = !saved && modelText.toUpperCase().includes("NO_PREFERENCE");
        console.log("[/api/preferences/analyze] Result:", { saved, summaryFromTool, noPreference, modelTextSnippet: modelText.slice(0, 120) });

        res.json({
            saved,
            summary: summaryFromTool,
            rawModelText: modelText,
            noPreference
        });
    } catch (err) {
        console.error("Error in /api/preferences/analyze:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/preferences", (req, res) => {
    try {
        ensurePrefFile();
        const content = fs.readFileSync(PREF_FILE, "utf8");
        res.json({ content });
    } catch (err) {
        console.error("Error reading preferences:", err);
        res.status(500).json({ error: "Failed to read preferences" });
    }
});

app.post("/api/preferences", (req, res) => {
    const { speaker, message } = req.body || {};

    if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "message is required" });
    }

    try {
        ensurePrefFile();
        const line = `[${new Date().toISOString()}] ${speaker || "user"}: ${message.replace(/\s+/g, " ").trim()}\n`;
        fs.appendFileSync(PREF_FILE, line, "utf8");
        res.json({ ok: true });
    } catch (err) {
        console.error("Error writing preferences:", err);
        res.status(500).json({ error: "Failed to write preferences" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/chat.html`);
});


