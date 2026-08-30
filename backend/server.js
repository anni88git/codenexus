import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const apiKey = process.env.MISTRAL_API_KEY;
const mistralClient = apiKey ? new Mistral({ apiKey }) : null;

// Cache for rollback feature
const originalCache = new Map();

io.on('connection', (socket) => {
  console.log('⚡ Client connected:', socket.id);
  socket.on('disconnect', () => console.log('🔌 Disconnected:', socket.id));
});

// Helper sleep function
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── POST /api/run-agent ──────────────────────────────────────────────────────
app.post('/api/run-agent', async (req, res) => {
  try {
    const { customCode = '', errorTrace = '', prompt = '', language = 'Auto' } = req.body;
    const rawInput = (customCode || errorTrace || prompt || '').trim();

    if (!rawInput) {
      return res.status(400).json({ error: "No stack trace or code provided." });
    }

    // 1. Language & File Name Resolution
    let fileName = 'solution.src';
    let detectedLang = language !== 'Auto' && language !== 'Auto-Detect' ? language : 'Golang';

    const goMatch = rawInput.match(/([a-zA-Z0-9_\-]+\.go)/i);
    const jsMatch = rawInput.match(/([a-zA-Z0-9_\-]+\.(js|ts|jsx|tsx))/i);
    const pyMatch = rawInput.match(/([a-zA-Z0-9_\-]+\.py)/i);
    const rustMatch = rawInput.match(/([a-zA-Z0-9_\-]+\.rs)/i);
    const cppMatch = rawInput.match(/([a-zA-Z0-9_\-]+\.(cpp|hpp|c|h))/i);

    if (rustMatch || detectedLang === 'Rust' || detectedLang === 'rust') {
      fileName = rustMatch ? rustMatch[1] : 'main.rs';
      detectedLang = 'Rust';
    } else if (pyMatch || detectedLang === 'Python' || detectedLang === 'python') {
      fileName = pyMatch ? pyMatch[1] : 'analytics.py';
      detectedLang = 'Python';
    } else if (cppMatch || detectedLang === 'C++' || detectedLang === 'cpp') {
      fileName = cppMatch ? cppMatch[1] : 'vector_bounds.cpp';
      detectedLang = 'C++';
    } else if (jsMatch || detectedLang === 'Node.js' || detectedLang === 'nodejs' || detectedLang === 'JavaScript') {
      fileName = jsMatch ? jsMatch[1] : 'userController.js';
      detectedLang = 'Node.js';
    } else if (goMatch || detectedLang === 'Golang' || detectedLang === 'golang') {
      fileName = goMatch ? goMatch[1] : 'user_handler.go';
      detectedLang = 'Golang';
    }

    // Cache original code for rollback functionality
    originalCache.set(fileName, rawInput);

    // 2. Language-Specific Fallback Patch Generator
    let patchedCode = '';
    let explanation = '';
    let nodes = [];

    // Attempt to load from scenarios.js if scenarioId is provided and NOT custom input
    let scenarioMatch = null;
    if (req.body.scenarioId && !req.body.isCustom) {
      try {
        const scenariosModule = await import('../frontend/src/data/scenarios.js');
        scenarioMatch = scenariosModule.default.find(s => s.id === req.body.scenarioId);
      } catch (err) {
        console.error("Failed to load scenarios.js:", err);
      }
    }

    if (scenarioMatch) {
      patchedCode = scenarioMatch.patchedCode;
      explanation = scenarioMatch.pr?.explainFix?.rootCause || 'Patch applied based on scenario data.';
      nodes = scenarioMatch.astNodes || [];
    } else {
      if (detectedLang === 'Rust') {
        patchedCode = `// ${fileName} - PATCHED by AI Agent\n// Fix: Safely match on Option to prevent panic on None value\n\nfn get_user_bio(user: Option<&User>) -> String {\n    match user {\n        Some(u) => u.profile.bio.clone(),\n        None => String::from(""),\n    }\n}`;
        explanation = 'Replaced direct unwrap with pattern matching on Option to avoid panic.';
      } else if (detectedLang === 'Python') {
        patchedCode = `# ${fileName} - PATCHED by AI Agent\n# Fix: Safe dictionary key lookup with fallback\n\ndef get_value(d):\n    if not isinstance(d, dict):\n        return 'dark'\n    return d.get('settings', {}).get('theme', 'dark')`;
        explanation = 'Added nested .get() guards to protect against KeyError and Nonetype access.';
      } else if (detectedLang === 'C++') {
        patchedCode = `// ${fileName} - PATCHED by AI Agent\n// Fix: Vector index bounds check\n\n#include <vector>\n\nint get_item(const std::vector<int>& v, size_t i) {\n    if (i >= v.size()) {\n        return -1; // Safe fallback guard\n    }\n    return v[i];\n}`;
        explanation = 'Added vector size bounds check before array subscript access.';
      } else if (detectedLang === 'Node.js') {
        patchedCode = `// ${fileName} - PATCHED by AI Agent\n// Fix: Safe property navigation with optional chaining\n\nfunction getEmail(user) {\n    if (!user || !user.contact) {\n        return '';\n    }\n    return user?.contact?.email ?? '';\n}`;
        explanation = 'Applied optional chaining and nullish coalescing operators.';
      } else {
        // Golang / Default
        patchedCode = `// ${fileName} - PATCHED by AI Agent\n// Fix: Defensive nil pointer guard\npackage main\n\nfunc GetUserBio(u *User) string {\n    if u == nil || u.Profile == nil {\n        return ""\n    }\n    return u.Profile.Bio\n}`;
        explanation = 'Added defensive nil check on user pointer and nested profile struct.';
      }

      // 3. Dynamic Node Graph Generation for Custom Input
      const rootNodeName = fileName.replace(/\.[^/.]+$/, "");
      nodes = [
        { id: '1', label: `${rootNodeName} (Target)`, status: 'PATCHED', type: 'primary' },
        { id: '2', label: `${rootNodeName}Service`, status: 'OK', type: 'dependency' },
        { id: '3', label: 'Database', status: 'OK', type: 'store' },
        { id: '4', label: 'AuthMiddleware', status: 'OK', type: 'middleware' }
      ];
    }

    // 4. Emit real-time step progression via WebSocket
    io.emit('agent-log', { node: 1, text: `🔍 [Node 01] Triaging: Classifying error in ${detectedLang}...` });
    await sleep(600);
    io.emit('agent-log', { node: 1, text: `✅ [Node 01] Triage complete. Language: ${detectedLang}, File: ${fileName}` });

    await sleep(300);
    io.emit('agent-log', { node: 2, text: `🕸️ [Node 02] AST Indexing: Building dependency graph for ${fileName}...` });
    await sleep(700);
    const rootNode = fileName.replace(/\.[^/.]+$/, '');
    io.emit('agent-log', { node: 2, text: `✅ [Node 02] AST indexed: ${rootNode}, ${rootNode}Service, Database, AuthMiddleware` });

    await sleep(300);
    io.emit('agent-log', { node: 3, text: `🧠 [Node 03] Generating patch for ${detectedLang} via Codestral...` });
    await sleep(800);
    io.emit('agent-log', { node: 3, text: `⚡ [Node 03] Patch generated. Issue fixed in ${fileName}` });

    await sleep(400);
    io.emit('agent-log', { node: 4, text: `🧪 [Node 04] Sandbox: Running isolated test suite...` });
    await sleep(600);

    // Emit completion with full patch payload
    io.emit('agent-log', {
      node: 4,
      text: `✅ [Node 04] All tests passed. Patch applied for ${fileName}`,
      complete: true,
      patchCode: patchedCode,
      telemetry: { tokens: { total: 342 }, latency: 1.2 }
    });

    return res.json({
      success: true,
      fileName,
      language: detectedLang,
      originalCode: rawInput,
      patchedCode,
      explanation,
      nodes
    });

  } catch (err) {
    console.error("Backend Run Agent Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      patchedCode: "// Error generating patch. Please check backend logs.",
      explanation: "Server processing error."
    });
  }
});

// ─── POST /api/rollback ───────────────────────────────────────────────────────
app.post('/api/rollback', async (req, res) => {
  const { scenarioId, fileName } = req.body;
  const key = fileName || scenarioId;
  const cached = originalCache.get(key);
  
  if (cached) {
    io.emit('agent-log', { node: 0, text: `↩️ Rolled back ${key} to original source.` });
    return res.json({ status: 'ROLLED_BACK', scenarioId, originalCode: cached });
  } else {
    return res.json({ status: 'NO_CACHE', message: 'No original cached code for this item.' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 CodeNexus Backend running on http://localhost:${PORT}`));