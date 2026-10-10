import React from 'react';
import { motion } from 'framer-motion';
import { Code, Terminal, Bot, Sparkles, Folder, Cpu, GitMerge, FileCode, ChevronRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import AntigravityChat from './AntigravityChat';
import { get, set } from '../idb.js';

function computeDiff(a = '', b = '') {
  if (!a && !b) return [];
  const aL = a.split('\n'), bL = b.split('\n');
  const m = aL.length, n = bL.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = aL[i-1] === bL[j-1] ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j], dp[i][j-1]);
  const diff = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aL[i-1] === bL[j-1]) { diff.unshift({ type:'unchanged', line:aL[i-1] }); i--; j--; }
    else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) { diff.unshift({ type:'added', line:bL[j-1] }); j--; }
    else { diff.unshift({ type:'removed', line:aL[i-1] }); i--; }
  }
  return diff;
}

function DiffLine({ e, lineNum }) {
  const pfx = e.type === 'removed' ? '−' : e.type === 'added' ? '+' : ' ';
  const rowBg = e.type === 'removed' ? 'bg-red-950/30' : e.type === 'added' ? 'bg-emerald-950/30' : '';
  const txt = e.type === 'removed' ? 'text-red-300' : e.type === 'added' ? 'text-emerald-300' : 'text-slate-400';
  return (
    <div className={`flex items-start min-h-[20px] ${rowBg}`}>
      <span className="select-none w-10 text-right pr-3 text-slate-700 text-[10px] font-mono shrink-0 leading-5">
        {e.type !== 'blank' && lineNum != null ? lineNum : ''}
      </span>
      <span className={`w-4 text-center text-[10px] select-none shrink-0 font-mono leading-5 ${e.type === 'blank' ? 'opacity-0' : e.type === 'removed' ? 'text-red-500' : e.type === 'added' ? 'text-emerald-500' : 'text-slate-700'}`}>
        {e.type === 'blank' ? ' ' : pfx}
      </span>
      <span className={`flex-1 text-[11.5px] leading-5 whitespace-pre ${txt} font-mono px-1`}>{e.line || ' '}</span>
    </div>
  );
}

const getFilesRecursively = async (dirHandle, path = '') => {
  let files = [];
  const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.cache', 'coverage']);
  
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      file.handle = entry;
      // Define a non-configurable property safely
      if (!Object.getOwnPropertyDescriptor(file, 'webkitRelativePath')) {
        Object.defineProperty(file, 'webkitRelativePath', {
          value: path + entry.name,
          writable: false,
          configurable: true // Add configurable to prevent crashes if overridden later
        });
      } else {
        file.customRelativePath = path + entry.name;
      }
      files.push(file);
    } else if (entry.kind === 'directory') {
      if (!ignoreDirs.has(entry.name)) {
        files = files.concat(await getFilesRecursively(entry, path + entry.name + '/'));
      }
    }
  }
  return files;
};

export default function AntigravityIDEView({ customCode, setCustomCode, language, activeRun, setActiveRun, onAttachFolder, workspaceFiles, onFileModified }) {
  const code = activeRun?.patchedCode !== undefined ? activeRun.patchedCode : customCode;
  const originalCode = activeRun?.originalCode !== undefined ? activeRun.originalCode : customCode;
  const [selectedModel, setSelectedModel] = React.useState('Codestral');
  const [viewMode, setViewMode] = React.useState('edit'); // edit or diff
  const [savedDirName, setSavedDirName] = React.useState('');
  const codeScrollRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  
  React.useEffect(() => {
    get('dirHandle').then(handle => {
      if (handle && handle.name) setSavedDirName(handle.name);
    }).catch(() => {});
  }, []);

  const [diffHistory, setDiffHistory] = React.useState({});

  React.useEffect(() => {
    // If user clicks a file in the sidebar, activeRun's originalCode and patchedCode are set to the current disk content.
    // We intercept this and restore the originalCode from diffHistory if available, so they don't lose the diff view.
    if (activeRun && activeRun.originalCode === activeRun.patchedCode && activeRun.fileName) {
       if (diffHistory[activeRun.fileName] && diffHistory[activeRun.fileName] !== activeRun.originalCode) {
          setActiveRun(prev => ({ ...prev, originalCode: diffHistory[activeRun.fileName] }));
       }
    }
  }, [activeRun?.fileName, activeRun?.originalCode, activeRun?.patchedCode, diffHistory, setActiveRun]);
  const [isChatCollapsed, setIsChatCollapsed] = React.useState(false);
  
  const diff = React.useMemo(() => computeDiff(originalCode || '', code || ''), [originalCode, code]);
  
  const handleChange = (e) => {
    if (activeRun) {
      setActiveRun(prev => ({ ...prev, patchedCode: e.target.value }));
    } else {
      setCustomCode(e.target.value);
    }
  };

  return (
    <div className="flex h-full w-full bg-[#0a0a0a] overflow-hidden">
      {/* Editor Pane */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-800/60 min-w-0">
        <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-[#111] border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-500" />
            <span className="text-xs font-mono font-medium text-slate-300">
              {activeRun?.fileName || 'untitled.src'}
            </span>
            <span className="ml-2 text-[9px] font-mono text-cyan-400/50 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900/30">
              {language?.label || 'Auto'}
            </span>
            <div className="flex bg-[#1a1a1a] border border-slate-700/50 rounded overflow-hidden ml-4">
              <button 
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1 text-[10px] font-mono transition-colors ${viewMode === 'edit' ? 'bg-[#333] text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Edit
              </button>
              <button 
                onClick={() => setViewMode('diff')}
                className={`flex items-center gap-1 px-3 py-1 text-[10px] font-mono transition-colors ${viewMode === 'diff' ? 'bg-[#333] text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <GitMerge className="w-3 h-3" /> Diff
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">

            <button
              onClick={async () => {
                if (window.showDirectoryPicker) {
                  try {
                    const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
                    await set('dirHandle', dirHandle);
                    setSavedDirName(dirHandle.name);
                    const files = await getFilesRecursively(dirHandle, dirHandle.name + '/');
                    onAttachFolder && onAttachFolder(files);
                  } catch (e) {
                    console.error(e);
                  }
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/5 rounded-xl transition-all duration-200 shadow-sm"
            >
              <Folder className="w-4 h-4 text-white/80" />
              Attach Workspace Folder
            </button>

            <input
              type="file"
              ref={fileInputRef}
              webkitdirectory=""
              directory=""
              style={{ display: 'none' }}
              onChange={(e) => onAttachFolder && onAttachFolder(e.target.files)}
            />
          </div>
        </div>
        <div className="flex-1 p-0 relative bg-[#050505] flex flex-col">
          {viewMode === 'edit' ? (
            <div className="absolute inset-0 overflow-hidden bg-[#1e1e1e]">
              {!code && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 pointer-events-none select-none">
                  <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center shadow-lg transition-colors duration-500 ${
                    workspaceFiles.length > 0 
                      ? 'bg-cyan-950/30 border-cyan-500/30 shadow-cyan-500/10' 
                      : 'bg-[#1a1a1a] border-transparent'
                  }`}>
                    <Code className={`w-7 h-7 transition-colors duration-500 ${
                      workspaceFiles.length > 0 ? 'text-cyan-400' : 'text-slate-500'
                    }`} />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-slate-400 mb-1">
                      {workspaceFiles.length > 0 ? 'Workspace Attached' : 'No File Selected'}
                    </div>
                    <div className="text-xs text-slate-600 max-w-xs">
                      {workspaceFiles.length > 0 
                        ? 'Select a file from the explorer or ask the agent to start coding.'
                        : 'Attach a folder or ask the AI agent to generate a new codebase.'}
                    </div>
                  </div>
                </div>
              )}
              {code && (
                <div 
                  className="absolute inset-0 p-6 pointer-events-none font-mono"
                  ref={codeScrollRef}
                  style={{ overflow: 'hidden' }}
                >
                  <SyntaxHighlighter
                    language={language?.id || 'javascript'}
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, padding: 0, background: 'transparent', fontSize: '13px', lineHeight: '1.625', fontFamily: 'inherit' }}
                    wrapLines={false}
                  >
                    {code + '\n'}
                  </SyntaxHighlighter>
                </div>
              )}
              <textarea
                value={code}
                onChange={handleChange}
                onScroll={(e) => {
                  if (codeScrollRef.current) {
                    codeScrollRef.current.scrollTop = e.target.scrollTop;
                    codeScrollRef.current.scrollLeft = e.target.scrollLeft;
                  }
                }}
                spellCheck={false}
                className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white font-mono text-[13px] leading-relaxed p-6 resize-none focus:outline-none scrollbar-thin scrollbar-thumb-slate-800"
                placeholder=""
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col min-h-0 bg-[#111111]">
              <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-800/60 bg-[#1a1a1a] gap-4">
                <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/40 px-3 py-1.5 rounded-xl min-w-0 shadow-sm">
                    <FileCode className="w-3.5 h-3.5 text-slate-100 shrink-0" />
                    <span className="text-xs font-mono font-semibold text-slate-200 truncate">{activeRun?.fileName || 'untitled.src'}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950/50 border border-red-500/20 text-red-300">−{diff.filter(d => d.type === 'removed').length}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-500/20 text-emerald-300">+{diff.filter(d => d.type === 'added').length}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-auto py-4 relative scrollbar-thin scrollbar-thumb-slate-800">
                 <div className="w-max min-w-full">
                   {diff.map((e, idx) => <DiffLine key={idx} e={e} lineNum={idx + 1} />)}
                   {diff.length === 0 && <div className="text-slate-500 text-xs font-mono p-6">No changes detected.</div>}
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Agent Pane */}
      <div 
        className={`${isChatCollapsed ? 'w-[48px]' : 'w-[400px]'} shrink-0 h-full flex flex-col bg-[#0d0d0d] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-10 transition-all duration-300 relative`}
      >
         <button 
           onClick={() => setIsChatCollapsed(!isChatCollapsed)}
           className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-[#1a1a1a] border border-[#333] rounded-l-md flex items-center justify-center cursor-pointer hover:bg-[#2a2a2a] z-50 transition-colors shadow-[-2px_0_5px_rgba(0,0,0,0.2)]"
         >
           <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isChatCollapsed ? '' : 'rotate-180'}`} />
         </button>
         
         {!isChatCollapsed && (
           <AntigravityChat 
             hideClose={true}
           activeCode={code} 
           activeFileName={activeRun?.fileName}
           language={language?.id}
           workspaceFiles={workspaceFiles}
           selectedModel={selectedModel}
           onModelChange={setSelectedModel}
           onApplyCode={async (newCode, fileName = 'untitled.src', isFinished = true) => {
             let realOriginalCode = null;
             if ((!activeRun || activeRun.fileName !== fileName) && workspaceFiles) {
               let targetFile = workspaceFiles.find(f => (f.customRelativePath || f.webkitRelativePath) === fileName);
               if (!targetFile && activeRun?.fileName) {
                  targetFile = workspaceFiles.find(f => (f.customRelativePath || f.webkitRelativePath) === activeRun.fileName && f.name === fileName);
               }
               if (!targetFile) {
                  targetFile = workspaceFiles.find(f => f.name === fileName || (f.webkitRelativePath || '').endsWith(fileName));
               }
               if (targetFile) {
                  try {
                    realOriginalCode = await targetFile.text();
                    setDiffHistory(prev => ({ ...prev, [fileName]: prev[fileName] ?? realOriginalCode }));
                  } catch (e) {}
               }
             } else if (activeRun && activeRun.fileName === fileName) {
                setDiffHistory(prev => ({ ...prev, [fileName]: prev[fileName] ?? activeRun.originalCode }));
             }

             setActiveRun(prev => {
               const isSameFile = prev && prev.fileName === fileName;
               const oc = isSameFile ? prev.originalCode : (realOriginalCode !== null ? realOriginalCode : customCode);
               return { originalCode: oc, patchedCode: newCode, fileName };
             });
             
             if (isFinished) {
               setViewMode('diff');
               if (workspaceFiles) {
                 let targetFile = workspaceFiles.find(f => (f.customRelativePath || f.webkitRelativePath) === fileName);
                 if (!targetFile && activeRun?.fileName) {
                    targetFile = workspaceFiles.find(f => (f.customRelativePath || f.webkitRelativePath) === activeRun.fileName && f.name === fileName);
                 }
                 if (!targetFile) {
                    targetFile = workspaceFiles.find(f => f.name === fileName || (f.webkitRelativePath || '').endsWith(fileName));
                 }
                 let fileHandle = targetFile?.handle;
                 let isNewFile = false;
                 
                 if (!fileHandle) {
                    try {
                      const dirHandle = await get('dirHandle');
                      if (dirHandle) {
                        const pathParts = fileName.split(/\/|\\/);
                        let currentDir = dirHandle;
                        if (pathParts[0] === dirHandle.name) pathParts.shift();
                        
                        const newFileName = pathParts.pop();
                        for (const part of pathParts) {
                           currentDir = await currentDir.getDirectoryHandle(part, { create: true });
                        }
                        fileHandle = await currentDir.getFileHandle(newFileName, { create: true });
                        isNewFile = true;
                      }
                    } catch (e) {
                      console.error('Failed to create new file', e);
                    }
                 }

                 if (fileHandle) {
                   try {
                     const writable = await fileHandle.createWritable();
                     await writable.write(newCode);
                     await writable.close();
                     
                     if (typeof onFileModified === 'function') {
                       onFileModified(targetFile?.customRelativePath || targetFile?.webkitRelativePath || targetFile?.name || fileName);
                     }
                     
                     if (isNewFile) {
                        const dirHandle = await get('dirHandle');
                        const files = await getFilesRecursively(dirHandle, dirHandle.name + '/');
                        onAttachFolder && onAttachFolder(files);
                     }
                    } catch (e) {
                      console.error('Failed to write back to file system', e);
                    }
                  }
                }
              } else {
                setViewMode('edit');
              }
            }}
          />
         )}
         {isChatCollapsed && (
            <div className="flex-1 flex flex-col items-center py-6 gap-6 justify-center">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/30 flex items-center justify-center border border-cyan-900/50">
                 <Bot className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="writing-vertical-rl rotate-180 text-[10px] font-mono font-semibold text-slate-500 tracking-[0.3em] whitespace-nowrap">
                 AI AGENT CHAT
              </div>
            </div>
         )}
      </div>
    </div>
  );
}
