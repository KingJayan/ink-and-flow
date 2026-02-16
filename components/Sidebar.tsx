import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, FileText, Settings, X, Type, LogIn, LogOut,
  User as UserIcon, Folder as FolderIcon, MoreVertical,
  ChevronRight, ChevronDown, Download, Upload, Trash2, FolderInput, Sparkles, Cloud, Clock
} from 'lucide-react';
import { Document, EditorSettings, Folder } from '../types';
import { User } from 'firebase/auth';
import { readImportFile } from '../services/fileService';
import { pickGoogleDoc } from '../services/googleDriveService';
import { Logo } from './Logo';

interface SidebarProps {
  documents: Document[];
  folders: Folder[];
  activeDocId: string | null;
  onSelectDoc: (id: string) => void;
  onCreateDoc: (folderId?: string) => void;
  onCreateFolder: (name: string) => void;
  onDeleteDoc: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveDoc: (docId: string, folderId: string | null) => void;
  onImportDoc: (title: string, content: string) => void;
  onExportDoc: (doc: Document, format: 'txt' | 'md' | 'html') => void;
  onSaveVersion: (doc: Document) => void;
  onViewHistory: (doc: Document) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  settings: EditorSettings;
  onUpdateSettings: (settings: Partial<EditorSettings>) => void;
  user: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  documents,
  folders,
  activeDocId,
  onSelectDoc,
  onCreateDoc,
  onCreateFolder,
  onDeleteDoc,
  onDeleteFolder,
  onMoveDoc,
  onImportDoc,
  onExportDoc,
  onSaveVersion,
  onViewHistory,
  isOpen,
  toggleSidebar,
  settings,
  onUpdateSettings,
  user,
  onLoginClick,
  onLogoutClick
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newFolderName, setNewFolderName] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleFolder = (folderId: string) => {
    const next = new Set(expandedFolders);
    if (next.has(folderId)) next.delete(folderId);
    else next.add(folderId);
    setExpandedFolders(next);
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName && newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { content, title } = await readImportFile(file);
        onImportDoc(title, content);
      } catch (err) {
        console.error("Import failed", err);
        alert("Failed to import file. Please ensure it is a valid text or markdown file.");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGoogleImport = async () => {
    if (!user) return;
    setIsImporting(true);
    try {
      const { title, content } = await pickGoogleDoc();
      onImportDoc(title, content);
    } catch (err) {
      console.error("Google Drive Import failed", err);
      // TODO: Add toast notification
      alert("Failed to import from Google Drive. Please check console for details.");
    } finally {
      setIsImporting(false);
    }
  };

  const renderDocItem = (doc: Document) => (
    <div key={doc.id} className="relative group px-2">
      <button
        onClick={() => onSelectDoc(doc.id)}
        className={`
          w-full text-left p-3 rounded-lg transition-all duration-200 flex items-start gap-3 border
          ${activeDocId === doc.id
            ? 'bg-white dark:bg-white/10 border-wash-stone/30 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none translate-x-1'
            : 'border-transparent hover:bg-white/40 dark:hover:bg-white/5 hover:border-wash-stone/10 dark:hover:border-white/5 text-ink/70 dark:text-white/60'}
        `}
      >
        <div className={`mt-0.5 p-1 rounded-md ${activeDocId === doc.id ? 'bg-navy/5 dark:bg-blue-500/10 text-navy dark:text-blue-400' : 'text-ink-faint dark:text-white/30'}`}>
          <FileText size={14} />
        </div>
        <div className="overflow-hidden w-full min-w-0">
          <h3 className={`font-serif font-medium truncate text-sm ${activeDocId === doc.id ? 'text-ink dark:text-white' : 'dark:text-white/70'}`}>
            {doc.title || 'Untitled Draft'}
          </h3>
          <p className="text-[11px] text-ink-faint dark:text-white/30 truncate mt-0.5 font-sans opacity-80">
            {doc.preview || 'No content...'}
          </p>
        </div>
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === doc.id ? null : doc.id); }}
        className={`absolute right-4 top-3.5 p-1 rounded-md text-ink-faint dark:text-white/30 hover:text-navy dark:hover:text-white hover:bg-wash-stone/20 dark:hover:bg-white/10 transition-all ${menuOpenId === doc.id ? 'opacity-100 bg-wash-stone/20 dark:bg-white/10' : 'opacity-0 group-hover:opacity-100'}`}
      >
        <MoreVertical size={14} />
      </button>

      {menuOpenId === doc.id && (
        <div className="absolute right-2 top-8 z-50 w-44 bg-white dark:bg-[#252530] rounded-lg shadow-xl border border-wash-stone/20 dark:border-white/10 py-1 animate-fade-in origin-top-right">
          {folders.length > 0 && (
            <div className="border-b border-wash-stone/10 dark:border-white/5 pb-1 mb-1">
              <div className="px-3 py-1.5 text-[10px] uppercase text-ink-faint dark:text-white/30 font-bold tracking-wider">Move to</div>
              <button onClick={() => { onMoveDoc(doc.id, null); setMenuOpenId(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-wash-beige/30 dark:hover:bg-white/5 dark:text-white/70 flex items-center gap-2"><FolderIcon size={12} /> Root</button>
              {folders.map(f => (
                <button key={f.id} onClick={() => { onMoveDoc(doc.id, f.id); setMenuOpenId(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-wash-beige/30 dark:hover:bg-white/5 dark:text-white/70 flex items-center gap-2 truncate"><FolderIcon size={12} /> {f.name}</button>
              ))}
            </div>
          )}

          <div className="border-b border-wash-stone/10 dark:border-white/5 pb-1 mb-1">
            <button onClick={() => onExportDoc(doc, 'txt')} className="w-full text-left px-3 py-2 text-xs hover:bg-wash-beige/30 dark:hover:bg-white/5 dark:text-white/70 flex items-center gap-2"><Download size={12} /> Export TXT</button>
            <button onClick={() => onExportDoc(doc, 'md')} className="w-full text-left px-3 py-2 text-xs hover:bg-wash-beige/30 dark:hover:bg-white/5 dark:text-white/70 flex items-center gap-2"><Download size={12} /> Export Markdown</button>
            <button onClick={() => window.print()} className="w-full text-left px-3 py-2 text-xs hover:bg-wash-beige/30 dark:hover:bg-white/5 dark:text-white/70 flex items-center gap-2"><Download size={12} /> Export PDF</button>
          </div>

          <div className="border-b border-wash-stone/10 dark:border-white/5 pb-1 mb-1">
            <button onClick={() => onSaveVersion(doc)} className="w-full text-left px-3 py-2 text-xs hover:bg-wash-beige/30 dark:hover:bg-white/5 dark:text-white/70 flex items-center gap-2"><Clock size={12} /> Save Version</button>
            <button onClick={() => onViewHistory(doc)} className="w-full text-left px-3 py-2 text-xs hover:bg-wash-beige/30 dark:hover:bg-white/5 dark:text-white/70 flex items-center gap-2"><Clock size={12} /> View History</button>
          </div>

          <button onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc.id); setMenuOpenId(null); }} className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"><Trash2 size={12} /> Delete</button>
        </div>
      )}

      {menuOpenId === doc.id && <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />}
    </div>
  );

  return (
    <>
      <div
        className={`fixed inset-0 bg-ink/20 dark:bg-black/40 backdrop-blur-[1px] z-20 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      <aside
        className={`
          fixed md:relative z-30 h-full bg-desk/95 dark:bg-[#16161c]/95 border-r border-wash-stone/20 dark:border-white/5
          transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
          flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]
          ${isOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden'}
        `}
      >
        {/* Brand Header */}
        <div className="p-6 flex-shrink-0 flex items-center justify-between border-b border-wash-stone/10 dark:border-white/5 group">
          <Logo size={28} withText={true} />
        </div>

        {showSettings ? (
          <div className="flex-1 flex flex-col p-4 animate-fade-in overflow-y-auto bg-white/40 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between mb-8 pb-2 border-b border-wash-stone/20 dark:border-white/5">
              <h2 className="font-serif font-bold text-ink dark:text-white text-lg">Preferences</h2>
              <button onClick={() => setShowSettings(false)} className="text-ink-faint dark:text-white/40 hover:text-ink dark:hover:text-white transition-colors p-1 hover:bg-wash-stone/20 dark:hover:bg-white/10 rounded"><X size={18} /></button>
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-navy dark:text-blue-400 uppercase tracking-widest"><Type size={14} /><span>Typography</span></div>
                <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-wash-stone/20 dark:border-white/5 shadow-sm space-y-6">
                  <div>
                    <label className="text-sm font-medium text-ink dark:text-white/80 block mb-3">Font Family</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => onUpdateSettings({ fontFamily: 'serif' })}
                        className={`px-3 py-2 rounded-lg text-sm border font-serif ${settings.fontFamily === 'serif' ? 'bg-navy text-white border-navy' : 'bg-white dark:bg-white/5 text-ink dark:text-white/70 border-wash-stone/30 dark:border-white/10 hover:border-navy'}`}
                      >
                        Serif
                      </button>
                      <button
                        onClick={() => onUpdateSettings({ fontFamily: 'sans' })}
                        className={`px-3 py-2 rounded-lg text-sm border font-sans ${settings.fontFamily === 'sans' ? 'bg-navy text-white border-navy' : 'bg-white dark:bg-white/5 text-ink dark:text-white/70 border-wash-stone/30 dark:border-white/10 hover:border-navy'}`}
                      >
                        Sans
                      </button>
                      <button
                        onClick={() => onUpdateSettings({ fontFamily: 'mono' })}
                        className={`px-3 py-2 rounded-lg text-sm border font-mono ${settings.fontFamily === 'mono' ? 'bg-navy text-white border-navy' : 'bg-white dark:bg-white/5 text-ink dark:text-white/70 border-wash-stone/30 dark:border-white/10 hover:border-navy'}`}
                      >
                        Mono
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-medium text-ink dark:text-white/80">Size</label>
                      <span className="text-xs font-mono bg-desk dark:bg-white/5 px-2 py-1 rounded text-ink-faint dark:text-white/40">{settings.fontSize}px</span>
                    </div>
                    <input type="range" min="14" max="24" value={settings.fontSize} onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })} className="w-full accent-navy h-1 bg-wash-stone/30 dark:bg-white/10 rounded-lg cursor-pointer" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-medium text-ink dark:text-white/80">Spacing</label>
                      <span className="text-xs font-mono bg-desk dark:bg-white/5 px-2 py-1 rounded text-ink-faint dark:text-white/40">{settings.lineHeight}</span>
                    </div>
                    <input type="range" min="1" max="2" step="0.1" value={settings.lineHeight} onChange={(e) => onUpdateSettings({ lineHeight: Number(e.target.value) })} className="w-full accent-navy h-1 bg-wash-stone/30 dark:bg-white/10 rounded-lg cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-navy dark:text-blue-400 uppercase tracking-widest"><Sparkles size={14} /><span>Intelligence</span></div>
                <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-wash-stone/20 dark:border-white/5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-ink dark:text-white/80 block">Contextual Menu</label>
                      <span className="text-[10px] text-ink-faint dark:text-white/30">Show 'Refine' on text selection</span>
                    </div>
                    <button
                      onClick={() => onUpdateSettings({ enableAiRefinement: !settings.enableAiRefinement })}
                      className={`relative w-10 h-6 transition-colors rounded-full ${settings.enableAiRefinement ? 'bg-sage' : 'bg-wash-stone/30 dark:bg-white/10'}`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.enableAiRefinement ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-navy dark:text-blue-400 uppercase tracking-widest"><Type size={14} /><span>Editor</span></div>
                <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-wash-stone/20 dark:border-white/5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-ink dark:text-white/80 block">Dark Mode</label>
                      <span className="text-[10px] text-ink-faint dark:text-white/30">Easier on the eyes at night</span>
                    </div>
                    <button
                      onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
                      className={`relative w-10 h-6 transition-colors rounded-full ${settings.darkMode ? 'bg-navy' : 'bg-wash-stone/30 dark:bg-white/10'}`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.darkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-ink dark:text-white/80 block">Typewriter Mode</label>
                      <span className="text-[10px] text-ink-faint dark:text-white/30">Keep cursor centered on screen</span>
                    </div>
                    <button
                      onClick={() => onUpdateSettings({ typewriterMode: !settings.typewriterMode })}
                      className={`relative w-10 h-6 transition-colors rounded-full ${settings.typewriterMode ? 'bg-sage' : 'bg-wash-stone/30 dark:bg-white/10'}`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.typewriterMode ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-navy dark:text-blue-400 uppercase tracking-widest"><UserIcon size={14} /><span>Account</span></div>
                <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-wash-stone/20 dark:border-white/5 shadow-sm">
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs">{user.email?.[0].toUpperCase()}</div>
                        <div className="text-sm text-ink dark:text-white truncate flex-1 font-medium">{user.email}</div>
                      </div>
                      <button onClick={onLogoutClick} className="text-xs flex items-center justify-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 py-2.5 rounded-lg w-full transition-colors border border-red-100 dark:border-red-500/20 font-medium"><LogOut size={14} /> Sign Out</button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-ink-faint dark:text-white/30 mb-3">Sync your drafts across devices.</p>
                      <button onClick={onLoginClick} className="text-xs flex items-center justify-center gap-2 bg-navy text-white hover:bg-navy/90 py-2.5 rounded-lg w-full transition-colors font-medium shadow-sm"><LogIn size={14} /> Log In / Sign Up</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-4 flex gap-2">
              <button
                onClick={() => onCreateDoc()}
                className="flex-1 flex items-center justify-center gap-2 bg-navy text-white py-2.5 px-3 rounded-xl shadow-md hover:shadow-lg hover:bg-navy/90 transition-all font-medium text-sm active:scale-[0.98]"
                aria-label="Create New Draft"
              >
                <Plus size={16} />
                <span>New Draft</span>
              </button>
              {user && (
                <button
                  onClick={() => setNewFolderName('New Folder')}
                  className="flex-shrink-0 w-10 flex items-center justify-center bg-white dark:bg-white/5 border border-wash-stone/30 dark:border-white/10 text-ink dark:text-white/60 rounded-xl hover:bg-wash-stone/10 dark:hover:bg-white/10 transition-colors"
                  title="New Folder"
                  aria-label="Create New Folder"
                >
                  <FolderInput size={18} />
                </button>
              )}
            </div>

            {newFolderName !== null && (
              <form onSubmit={handleCreateFolder} className="px-4 mb-2 animate-fade-in">
                <div className="flex items-center gap-1 bg-white dark:bg-white/5 p-1 rounded-lg border border-sage/50 dark:border-white/10 shadow-sm">
                  <input
                    autoFocus
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onBlur={() => !newFolderName.trim() && setNewFolderName(null)}
                    className="w-full text-sm px-2 py-1 focus:outline-none bg-transparent dark:text-white"
                    placeholder="Folder name..."
                  />
                  <button type="submit" className="text-navy dark:text-blue-400 hover:bg-wash-stone/20 dark:hover:bg-white/10 p-1 rounded"><Plus size={14} /></button>
                  <button type="button" onClick={() => setNewFolderName(null)} className="text-ink-faint dark:text-white/30 hover:text-red-500 p-1 rounded"><X size={14} /></button>
                </div>
              </form>
            )}

            <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">

              {folders.map(folder => {
                const folderDocs = documents.filter(d => d.folderId === folder.id);
                const isExpanded = expandedFolders.has(folder.id);

                return (
                  <div key={folder.id} className="mb-1">
                    <div
                      className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 cursor-pointer text-ink/80 dark:text-white/60 hover:text-ink dark:hover:text-white select-none transition-colors"
                      onClick={() => toggleFolder(folder.id)}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {isExpanded ? <ChevronDown size={14} className="text-ink-faint dark:text-white/30" /> : <ChevronRight size={14} className="text-ink-faint dark:text-white/30" />}
                        <FolderIcon size={14} className={`transition-colors ${isExpanded ? 'text-sage' : 'text-wash-stone dark:text-white/20'}`} />
                        <span className="text-sm font-medium truncate">{folder.name}</span>
                      </div>
                      {user && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-ink-faint dark:text-white/30 hover:text-red-600 dark:hover:text-red-400 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="ml-3 pl-2 border-l border-wash-stone/20 dark:border-white/5 space-y-0.5 mt-1 animate-slide-up">
                        {folderDocs.length === 0 && <div className="text-[11px] text-ink-faint dark:text-white/20 italic p-2 pl-3">Empty folder</div>}
                        {folderDocs.map(renderDocItem)}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Root Documents */}
              {documents.filter(d => !d.folderId).length > 0 && (
                <div className="mt-2 pt-2">
                  {folders.length > 0 && <div className="px-4 pb-2 text-[10px] font-bold text-ink-faint dark:text-white/20 uppercase tracking-wider opacity-60">Everything Else</div>}
                  {documents.filter(d => !d.folderId).map(renderDocItem)}
                </div>
              )}

              {documents.length === 0 && folders.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-ink-faint dark:text-white/20 text-sm text-center opacity-60 mt-10">
                  <FileText size={32} className="mb-2 opacity-20" />
                  <p>Your library is empty.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-wash-stone/10 dark:border-white/5 mt-auto space-y-2 bg-white/30 dark:bg-white/[0.02] backdrop-blur-sm">
              <input
                type="file"
                accept=".txt,.md"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div className={`grid ${user ? 'grid-cols-2' : 'grid-cols-2'} gap-2`}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 text-ink-faint dark:text-white/40 hover:text-ink dark:hover:text-white text-xs transition-colors p-2 rounded-lg hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-wash-stone/20 dark:hover:border-white/10"
                  title="Import Text File"
                >
                  <Upload size={14} />
                  <span>Import</span>
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center justify-center gap-2 text-ink-faint dark:text-white/40 hover:text-ink dark:hover:text-white text-xs transition-colors p-2 rounded-lg hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-wash-stone/20 dark:hover:border-white/10"
                >
                  <Settings size={14} />
                  <span>Settings</span>
                </button>
              </div>

              {user && (
                <button
                  onClick={handleGoogleImport}
                  disabled={isImporting}
                  className="w-full flex items-center justify-center gap-2 text-navy/80 dark:text-blue-400/80 hover:text-navy dark:hover:text-blue-400 text-xs transition-colors p-2 rounded-lg bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-wash-stone/10 dark:border-white/5 hover:border-wash-stone/20 dark:hover:border-white/10"
                >
                  {isImporting ? <Sparkles size={14} className="animate-spin" /> : <Cloud size={14} />}
                  <span>Import from Google Docs</span>
                </button>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
};