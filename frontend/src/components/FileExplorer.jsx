import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, File, FileCode, FileJson, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'c':
    case 'cpp':
    case 'py':
      return <FileCode className="w-3.5 h-3.5 text-blue-400" />;
    case 'json':
      return <FileJson className="w-3.5 h-3.5 text-yellow-400" />;
    case 'md':
    case 'txt':
      return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
      return <ImageIcon className="w-3.5 h-3.5 text-purple-400" />;
    default:
      return <File className="w-3.5 h-3.5 text-slate-500" />;
  }
}

function buildFileTree(files) {
  const root = { name: 'root', isFile: false, children: {} };
  files.forEach(file => {
    const path = file.customRelativePath || file.webkitRelativePath || file.name;
    const parts = path.split('/');
    let current = root;
    parts.forEach((part, i) => {
      if (!current.children[part]) {
        current.children[part] = { 
          name: part, 
          isFile: i === parts.length - 1, 
          file: i === parts.length - 1 ? file : null,
          children: {},
          path: parts.slice(0, i + 1).join('/')
        };
      }
      current = current.children[part];
    });
  });
  return root;
}

function FileTreeNode({ node, level, onSelectFile, modifiedFiles }) {
  const [isOpen, setIsOpen] = useState(level < 2); // Auto-open first two levels

  if (node.isFile) {
    const isModified = modifiedFiles?.has(node.path);
    return (
      <button 
        onClick={() => onSelectFile && onSelectFile(node.file)}
        className="w-full flex items-center gap-2 py-1 px-2 hover:bg-[#1a1a1a] text-left transition-colors group cursor-pointer relative"
        style={{ paddingLeft: `${level * 12 + 16}px` }}
      >
        {getFileIcon(node.name)}
        <span className={`text-[11px] font-mono truncate transition-colors ${isModified ? 'text-green-400 group-hover:text-green-300' : 'text-slate-300 group-hover:text-white'}`}>
          {node.name}
        </span>
        {isModified && (
          <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        )}
      </button>
    );
  }

  const childrenNodes = Object.values(node.children).sort((a, b) => {
    if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
    return a.isFile ? 1 : -1; // Folders first
  });

  return (
    <div>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1.5 py-1 px-2 hover:bg-[#1a1a1a] text-left transition-colors cursor-pointer"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
        <Folder className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[11px] text-slate-200 font-mono truncate">{node.name}</span>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {childrenNodes.map(child => (
              <FileTreeNode key={child.path} node={child} level={level + 1} onSelectFile={onSelectFile} modifiedFiles={modifiedFiles} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FileExplorer({ files, onSelectFile, onRemoveFolder, modifiedFiles }) {
  const tree = useMemo(() => buildFileTree(files), [files]);
  
  if (!files || files.length === 0) return null;

  // We skip rendering the artificial 'root' node and just render its children
  const topLevelNodes = Object.values(tree.children).sort((a, b) => {
    if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
    return a.isFile ? 1 : -1;
  });

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden border-b border-[#222] pb-2 max-h-[35vh] scrollbar-thin scrollbar-thumb-slate-800">
      <div className="text-[8px] font-mono text-slate-500 uppercase tracking-[0.2em] px-4 py-2 sticky top-0 bg-black/90 backdrop-blur z-10 flex items-center justify-between group">
        <span>Workspace Explorer</span>
        <div className="flex items-center gap-2">
          <span className="text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded">{files.length} files</span>
          {onRemoveFolder && (
            <button 
              onClick={onRemoveFolder}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 text-red-400 transition-all"
              title="Remove Folder"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          )}
        </div>
      </div>
      <div className="py-1">
        {topLevelNodes.map(node => (
          <FileTreeNode key={node.path} node={node} level={0} onSelectFile={onSelectFile} modifiedFiles={modifiedFiles} />
        ))}
      </div>
    </div>
  );
}
