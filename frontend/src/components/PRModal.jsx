import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, GitPullRequest, GitMerge, Loader2 } from 'lucide-react';

export default function PRModal({ pr, activeRun, onClose }) {
  const [repo, setRepo] = useState(() => {
    const savedUrl = localStorage.getItem('nexus_git_url');
    if (savedUrl) {
      const match = savedUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) return `${match[1]}/${match[2].replace('.git', '')}`;
    }
    return 'anni88git/codenexus';
  });
  const [filePath, setFilePath] = useState(activeRun?.fileName || 'src/App.jsx');
  const [commitDirectly, setCommitDirectly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successUrl, setSuccessUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('nexus_token');
      const [repoOwner, repoName] = repo.split('/');
      
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://codenexus-laa2.onrender.com';
      const res = await fetch(`${BACKEND_URL}/api/github/pr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          repoOwner, repoName, filePath,
          newCode: activeRun?.patchedCode || '',
          prTitle: `🤖 Fix issue in ${filePath}`,
          commitMessage: `Auto-patch applied by The Window AI to ${filePath}`,
          token: localStorage.getItem('nexus_git_token') || undefined,
          commitDirectly
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create PR');
      
      setSuccessUrl(data.prUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#0a0a0a]/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative w-full max-w-lg bg-[#111111] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#111111]/50">
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-200">Ship to GitHub (Auto-PR)</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        
        {successUrl ? (
          <div className="p-6 space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
              <GitMerge className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">
              {commitDirectly ? 'Committed Directly!' : 'Pull Request Created!'}
            </h3>
            <p className="text-sm text-slate-400">
              {commitDirectly 
                ? 'The code patch has been successfully pushed to the repository\'s default branch.' 
                : 'The code patch has been pushed and a PR is waiting for your review.'}
            </p>
            <a href={successUrl} target="_blank" rel="noopener noreferrer" className="block w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-colors">
              View on GitHub
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Repository (owner/repo)</label>
              <input type="text" value={repo} onChange={e => setRepo(e.target.value)} required placeholder="e.g. facebook/react" className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Target File Path</label>
              <input type="text" value={filePath} onChange={e => setFilePath(e.target.value)} required placeholder="e.g. src/index.js" className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500" />
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="directCommit" checked={commitDirectly} onChange={e => setCommitDirectly(e.target.checked)} className="w-4 h-4 rounded border-slate-700 bg-[#0a0a0a] text-emerald-500 focus:ring-emerald-500" />
              <label htmlFor="directCommit" className="text-xs text-slate-300 cursor-pointer">Auto-Push directly to branch (Skip PR)</label>
            </div>
            
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">{error}</div>}
            
            <button type="submit" disabled={loading} className={`w-full mt-2 flex items-center justify-center gap-2 py-2.5 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 ${commitDirectly ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (commitDirectly ? <GitMerge className="w-4 h-4" /> : <GitPullRequest className="w-4 h-4" />)}
              {commitDirectly ? 'Commit Directly to Repo' : 'Create Pull Request'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
