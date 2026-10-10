import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Bot, Check, X, Terminal, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://codenexus-laa2.onrender.com';

function guessFileName(codeStr, fallbackName, workspaceFiles) {
  if (!codeStr) return fallbackName;
  const lines = codeStr.split('\n');
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('<!--') || line.startsWith('#')) {
      const cleaned = line.replace(/(\/\/|\/\*|\*\/|<!--|-->|#)/g, '').trim();
      if (workspaceFiles && workspaceFiles.find(f => (f.customRelativePath || f.webkitRelativePath || f.name) === cleaned || f.name === cleaned)) {
        return cleaned;
      }
      if (cleaned.match(/^[a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+$/)) {
        return cleaned;
      }
    }
  }
  return fallbackName;
}

function parseMessage(text) {
  const parts = [];
  const regex = /```([^\n]*?)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    const header = match[1] || '';
    const colonIdx = header.indexOf(':');
    const lang = colonIdx !== -1 ? header.substring(0, colonIdx).trim() : header.trim();
    const fname = colonIdx !== -1 ? header.substring(colonIdx + 1).trim() : undefined;
    parts.push({ type: 'code', language: lang, fileName: fname, content: match[2].trim() });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex);
    const unclosedIndex = remaining.indexOf('```');
    if (unclosedIndex !== -1) {
      if (unclosedIndex > 0) {
        parts.push({ type: 'text', content: remaining.substring(0, unclosedIndex) });
      }
      const firstLineEnd = remaining.indexOf('\n', unclosedIndex);
      if (firstLineEnd !== -1) {
        const header = remaining.substring(unclosedIndex + 3, firstLineEnd);
        const colonIdx = header.indexOf(':');
        const lang = colonIdx !== -1 ? header.substring(0, colonIdx) : header;
        const fname = colonIdx !== -1 ? header.substring(colonIdx + 1) : undefined;
        parts.push({ type: 'code', language: lang, fileName: fname?.trim(), content: remaining.substring(firstLineEnd + 1).trim() });
      } else {
        parts.push({ type: 'code', content: '' });
      }
    } else {
      parts.push({ type: 'text', content: remaining });
    }
  }

  return parts;
}

export default function AntigravityChat({ activeCode, activeFileName, language, onApplyCode, onClose, hideClose, selectedModel = 'Codestral', onModelChange, workspaceFiles, workspaceId = 'default' }) {
  const storageKey = `nexus_chat_messages_${workspaceId}`;
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { 
        setMessages(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    setMessages([
      { role: 'assistant', text: `Hello! I'm your ${selectedModel} Assistant. Ask me anything about your code.` }
    ]);
  }, [storageKey, selectedModel]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Generating...');
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

  useEffect(() => {
    if (isLoading) {
      setLoadingText('Initializing...');
    }
  }, [isLoading]);

  useEffect(() => {
    if (endOfMessagesRef.current && endOfMessagesRef.current.parentNode) {
      endOfMessagesRef.current.parentNode.scrollTop = endOfMessagesRef.current.parentNode.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e, customInput = null) => {
    if (e) e.preventDefault();
    const textToSend = customInput !== null ? customInput : input;
    if (!textToSend.trim() || isLoading) return;

    if (workspaceFiles && workspaceFiles.length > 0 && typeof workspaceFiles[0].text !== 'function') {
      const newMessages = [...messages, 
        { role: 'user', text: textToSend.trim() },
        { role: 'assistant', text: `⚠️ **Browser Security Lock**\n\nI cannot read your files because you refreshed the page. Your browser wiped my permission to access your local hard drive.\n\nPlease click the **Attach Workspace Folder** button above and re-select your folder so I can see your code!` }
      ];
      setMessages(newMessages);
      setInput('');
      return;
    }

    const newMessages = [...messages, { role: 'user', text: textToSend.trim() }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const formattedMessages = newMessages.map(m => ({ 
        role: m.role, 
        content: m.role === 'assistant' ? m.text.replace(/```[\s\S]*?```/g, '[Code block omitted for brevity]') : m.text 
      }));
      
      let fullContext = `### Currently Open File: ${activeFileName || 'untitled.src'}\n\n${activeCode || ''}`;
      
      let workspaceContext = '';
      if (workspaceFiles && workspaceFiles.length > 0) {
        workspaceContext = '\n\n### Available Files in Workspace:\n';
        for (const f of workspaceFiles) {
          workspaceContext += `- ${f.customRelativePath || f.name}\n`;
        }
        
        workspaceContext += '\n\n### File Contents (Prioritized by relevance):\n';
        
        // 🔥 Smart Sort: Put files mentioned in the user's prompt FIRST!
        const promptStr = textToSend.toLowerCase();
        const sortedFiles = [...workspaceFiles].sort((a, b) => {
          const aMatch = promptStr.includes(a.name.toLowerCase()) ? 1 : 0;
          const bMatch = promptStr.includes(b.name.toLowerCase()) ? 1 : 0;
          return bMatch - aMatch;
        });

        for (const f of sortedFiles) {
          if (workspaceContext.length > 10000) {
              workspaceContext += `\n...[Remaining file contents omitted to fit within token limit]...`;
              break;
          }
          try {
            if (f.name.match(/\.(png|jpg|jpeg|gif|svg|ico|mp4|webm|zip|tar|gz|pdf|bin|lock)$/i)) continue;
            
            if (typeof f.text !== 'function') {
              workspaceContext += `\n--- File: ${f.customRelativePath || f.name} ---\n[SYSTEM NOTICE: Cannot read this file because the page was refreshed. You MUST explicitly tell the user: "Please click the 'Attach Workspace Folder' button again so I can read your files!"]\n`;
              continue;
            }
            
            if (f.size > 30000) continue;
            
            const text = await f.text();
            if (workspaceContext.length + text.length > 10000) {
                workspaceContext += `\n...[Remaining file contents omitted to fit within token limit]...`;
                break;
            }
            workspaceContext += `\n--- File: ${f.customRelativePath || f.name} ---\n${text}\n`;
          } catch(e) {}
        }
      }
      
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: formattedMessages,
          contextCode: fullContext + workspaceContext,
          language: language || 'Auto',
          model: selectedModel,
          mode: 'Software Dev',
          stream: true
        })
      });
      
      if (!res.ok) throw new Error('Failed to fetch chat response');
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      setMessages(prev => [...prev, { role: 'assistant', text: '' }]);
      
      let fullText = '';
      let currentFileName = activeFileName || 'untitled.src';
      let lastExtractedCode = '';
      
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line
        
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.status) {
                setLoadingText(data.status);
              } else if (data.text) {
                fullText += data.text;
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].text = fullText;
                  return newMsgs;
                });
                
                // Stream live to file editor
                const parts = parseMessage(fullText);
                const codeParts = parts.filter(p => p.type === 'code');
                if (codeParts.length > 0) {
                  const lastCodePart = codeParts[codeParts.length - 1];
                  const rawCode = lastCodePart.content;
                  if (rawCode !== lastExtractedCode) {
                    lastExtractedCode = rawCode;
                    const fName = lastCodePart.fileName || guessFileName(rawCode, currentFileName, workspaceFiles);
                    if (onApplyCode) onApplyCode(rawCode, fName, false);
                  }
                }
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {}
          }
        }
      }
      
      // Stream finished
      if (lastExtractedCode && onApplyCode) {
        const parts = parseMessage(fullText);
        const codeParts = parts.filter(p => p.type === 'code');
        for (const part of codeParts) {
          const fName = part.fileName || guessFileName(part.content, currentFileName, workspaceFiles);
          onApplyCode(part.content, fName, true);
        }
        
        setMessages(prev => {
          const newMsgs = [...prev];
          if (!newMsgs[newMsgs.length - 1].text.includes('[TASK_EXECUTED]')) {
             newMsgs[newMsgs.length - 1].text += '\n\n[TASK_EXECUTED]';
          }
          return newMsgs;
        });
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: `❌ Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-96 shrink-0 h-full bg-[#0d0d0d] border-l border-slate-800/60 flex flex-col z-20"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60 bg-black/40">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-500" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-cyan-400">Agent Chat</span>
            <div className="relative flex items-center">
              <select
                value={selectedModel}
                onChange={(e) => onModelChange && onModelChange(e.target.value)}
                className="text-[9px] font-mono bg-[#111] text-slate-300 border border-slate-700 rounded pl-1.5 pr-5 py-0.5 focus:outline-none cursor-pointer mt-0.5 shadow-xl appearance-none relative z-10"
              >
                <option value="Codestral">Codestral (Mistral)</option>
                <option value="Llama-3-70B">Llama 3 70B</option>
                <option value="Qwen-2.5">Qwen 2.5 Coder</option>
                <option value="DeepSeek-Coder">DeepSeek Coder</option>
              </select>
              <div className="absolute right-1.5 top-1 z-20 pointer-events-none">
                <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
              </div>
            </div>
          </div>
        </div>
        {!hideClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase">
              {msg.role === 'user' ? (
                <><User className="w-3 h-3" /> You</>
              ) : (
                <><Bot className="w-3 h-3 text-cyan-500" /> Assistant</>
              )}
            </div>
            
            <div className={`max-w-[90%] text-sm leading-relaxed ${msg.role === 'user' ? 'bg-cyan-950/40 border border-cyan-900 text-cyan-100 rounded-2xl rounded-tr-sm px-4 py-2' : ''}`}>
              {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap">{msg.text}</div>
              ) : (
                <div className="space-y-3 w-full">
                  {parseMessage(msg.text).map((part, j) => {
                    if (part.type === 'text') {
                      if (!part.content.trim()) return null;
                      const optionRegex = /\[Option:\s*([^\]]+)\]/g;
                      const hasTaskExecuted = part.content.includes('[TASK_EXECUTED]') || part.content.includes('✅ **Task Executed!**');
                      let rawText = part.content.replaceAll('[TASK_EXECUTED]', '');
                      rawText = rawText.replaceAll('✅ **Task Executed!**', '');
                      
                      const pieces = [];
                      let lastIdx = 0;
                      let match;
                      while ((match = optionRegex.exec(rawText)) !== null) {
                        if (match.index > lastIdx) {
                          pieces.push({ type: 'string', val: rawText.substring(lastIdx, match.index) });
                        }
                        pieces.push({ type: 'button', val: match[1] });
                        lastIdx = optionRegex.lastIndex;
                      }
                      if (lastIdx < rawText.length) {
                         pieces.push({ type: 'string', val: rawText.substring(lastIdx) });
                      }

                      return (
                         <div key={j} className="text-slate-300">
                            {pieces.map((p, k) => p.type === 'string' ? (
                               <div key={k} className="markdown-body text-sm font-sans [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4 [&_code]:bg-slate-800/60 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-cyan-300 [&_code]:font-mono [&_code]:text-[11px] [&_strong]:text-slate-100">
                                  <ReactMarkdown>{p.val}</ReactMarkdown>
                               </div>
                            ) : (
                               <button key={k} onClick={() => handleSend(null, p.val)} className="inline-block mt-2 mb-1 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 px-3 py-1.5 rounded-lg text-xs mr-2 cursor-pointer transition-colors shadow-sm font-semibold">
                                 {p.val}
                               </button>
                            ))}
                            {hasTaskExecuted && (
                               <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Task Executed</span>
                               </div>
                            )}
                         </div>
                      );
                    }
                    if (part.type === 'code') {
                       let fName = part.fileName || guessFileName(part.content, activeFileName || 'untitled.src', workspaceFiles);

                       return (
                         <div key={j} className="flex items-center gap-2 mt-2 px-3 py-2 bg-blue-950/30 border border-blue-900/50 rounded-lg w-fit shadow-lg">
                           <Terminal className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                           <span className="text-xs font-mono text-blue-300">Writing to {fName}...</span>
                         </div>
                       );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (!messages[messages.length - 1] || messages[messages.length - 1].role !== 'assistant' || messages[messages.length - 1].text === '') && (
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Bot className="w-3 h-3 animate-pulse" /> {loadingText}
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-3 border-t border-slate-800/60 bg-black/40 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2 bg-[#1a1a1a] border border-slate-700/50 rounded-xl px-2 py-1.5 focus-within:border-cyan-500/50 transition-colors">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or request a change..."
            className="flex-1 bg-transparent text-sm text-slate-200 focus:outline-none px-2"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center hover:bg-cyan-600/30 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
