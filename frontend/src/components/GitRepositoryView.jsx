import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, GitPullRequest, Key, FolderOpen, FileCode, CheckCircle2, RefreshCw, Send, GitCommit } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function GitRepositoryView({ onSelectFile }) {
  const [repoUrl, setRepoUrl] = useState(localStorage.getItem('nexus_git_url') || '');
  const [token, setToken] = useState(localStorage.getItem('nexus_git_token') || '');
  const [branch, setBranch] = useState(localStorage.getItem('nexus_git_branch') || 'main');
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState([]);
  const [commits, setCommits] = useState([]);
  const [repoTab, setRepoTab] = useState('files'); // 'files' or 'commits'

  useEffect(() => {
    if (localStorage.getItem('nexus_git_connected') === 'true') {
      setIsConnected(true);
      fetchFilesAndCommits(repoUrl, branch, token);
    }
  }, []);

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!repoUrl || !token) return setError('Repo URL and Token are required.');
    
    setIsLoading(true);
    setError('');
    
    try {
      const success = await fetchFilesAndCommits(repoUrl, branch, token);
      if (success) {
        localStorage.setItem('nexus_git_url', repoUrl);
        localStorage.setItem('nexus_git_token', token);
        localStorage.setItem('nexus_git_branch', branch);
        localStorage.setItem('nexus_git_connected', 'true');
        setIsConnected(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilesAndCommits = async (url, branch, tkn) => {
    try {
      const resFiles = await fetch(`${BACKEND_URL}/api/git/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: url, branch, token: tkn })
      });
      const dataFiles = await resFiles.json();
      if (!resFiles.ok) throw new Error(dataFiles.error || 'Failed to connect to repository.');
      
      setFiles(dataFiles.files);

      const resCommits = await fetch(`${BACKEND_URL}/api/git/commits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: url, token: tkn })
      });
      const dataCommits = await resCommits.json();
      if (resCommits.ok) {
        setCommits(dataCommits.commits || []);
      }

      return true;
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
      localStorage.removeItem('nexus_git_connected');
      return false;
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setFiles([]);
    localStorage.removeItem('nexus_git_connected');
  };

  return (
    <div className="flex-1 flex flex-col min-h-[600px] h-full relative">
      <div className="absolute inset-0 bg-slate-900/60 border border-slate-800/60 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
              <GitPullRequest className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Git Repository Link</h2>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Automated Pull Requests & Code Fetching</p>
            </div>
          </div>
          {isConnected && (
            <button onClick={handleDisconnect} className="text-[10px] font-mono text-slate-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg border border-slate-700/40 bg-slate-800/40">
              Disconnect Repo
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-800">
          <AnimatePresence mode="wait">
            {!isConnected ? (
              <motion.div key="connect" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-md mx-auto mt-10">
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-6 shadow-2xl">
                  <form onSubmit={handleConnect} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 mb-1.5 ml-1">Repository URL</label>
                      <div className="relative">
                        <FolderOpen className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="https://github.com/username/repo"
                          className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 mb-1.5 ml-1">Branch</label>
                      <div className="relative">
                        <GitBranch className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" value={branch} onChange={e => setBranch(e.target.value)} placeholder="main"
                          className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 mb-1.5 ml-1">Personal Access Token (PAT)</label>
                      <div className="relative">
                        <Key className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="ghp_xxxxxxxxxxxx"
                          className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors" />
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-[10px] text-red-400 font-mono text-center">
                        {error}
                      </div>
                    )}

                    <button type="submit" disabled={isLoading}
                      className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed">
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Connect & Index Repository</>}
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div key="tree" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Repository Connected: {repoUrl.split('/').slice(-2).join('/')}
                </div>
                
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col h-[400px]">
                  <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between">
                    <div className="flex bg-slate-950 rounded-lg p-1">
                      <button onClick={() => setRepoTab('files')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-mono transition-colors ${repoTab === 'files' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}>
                        <FolderOpen className="w-3.5 h-3.5" /> Files
                      </button>
                      <button onClick={() => setRepoTab('commits')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-mono transition-colors ${repoTab === 'commits' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}>
                        <GitCommit className="w-3.5 h-3.5" /> Commits Tree
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-800">
                    {repoTab === 'files' ? (
                      <>
                        {files.map((file, idx) => (
                          <button key={idx} onClick={() => onSelectFile(file)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-800/50 transition-colors group">
                            <FileCode className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                            <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">{file.path}</span>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">
                              <Send className="w-3 h-3" /> Load in Workspace
                            </div>
                          </button>
                        ))}
                        {files.length === 0 && !isLoading && (
                          <div className="h-full flex items-center justify-center text-[10px] font-mono text-slate-600">No supported files found in repository.</div>
                        )}
                      </>
                    ) : (
                      <div className="font-mono text-[11px] leading-tight px-3 py-2">
                        {commits.map((c, idx) => (
                          <div key={idx} className="flex hover:bg-slate-800/30 px-2 py-1 rounded transition-colors group">
                            <span className="text-emerald-500 whitespace-pre mr-4">{c.graph}</span>
                            <span className="text-slate-500 mr-3 shrink-0">{c.hash.substring(0, 7)}</span>
                            <span className="text-cyan-400 mr-3 truncate w-32 shrink-0">{c.author}</span>
                            <span className="text-slate-300 truncate flex-1 group-hover:text-white transition-colors">{c.message}</span>
                          </div>
                        ))}
                        {commits.length === 0 && !isLoading && (
                          <div className="h-full flex items-center justify-center text-[10px] font-mono text-slate-600 mt-10">No commit history found.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
