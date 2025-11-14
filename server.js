const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const PREF_FILE = path.join(__dirname, "preferences.txt");

function ensurePrefFile() {
    if (!fs.existsSync(PREF_FILE)) {
        fs.writeFileSync(PREF_FILE, "", "utf8");
    }
}

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serves chat.html and other static files

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


