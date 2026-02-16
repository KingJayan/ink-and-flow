import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { ChatSidebar } from './components/ChatSidebar';
import { LandingPage } from './components/LandingPage';
import { ErrorPage } from './components/Error';
import { TipTapEditor } from './components/Editor/TipTapEditor';
import { Document, Folder } from './types';
import { PanelLeftClose, PanelLeftOpen, Sparkles, Lock, Moon, Sun } from 'lucide-react';
import { $user, $settings, updateSettings, signOut } from './stores/authStore';
import { AuthModal } from './components/AuthModal';
import { HistoryModal } from './components/HistoryModal';
import { SearchPalette } from './components/SearchPalette';
import { PomodoroTimer } from './components/PomodoroTimer';
import { ToneAnalyzer } from './components/ToneAnalyzer';
import {
  subscribeToDocuments,
  createDocument,
  updateDocument as updateFirestoreDoc,
  deleteDocument,
  subscribeToFolders,
  createFolder,
  deleteFolder,
  saveDocumentVersion,
} from './services/firestoreService';
import { exportDocument } from './services/fileService';

const INITIAL_DOC: Document = {
  id: 'doc-1',
  title: 'The Art of Fluidity',
  content: `
    <h1>The Art of Fluidity</h1>
    <p>Water does not resist. Water flows. When you plunge your hand into it, all you feel is a caress. Water is not a solid wall, it will not stop you. But water always goes where it wants to go, and nothing in the end can stand against it.</p>
    <p>In writing, we seek this same property. We want words that move around obstacles, sentences that cascade into paragraphs with the inevitability of a river finding the sea.</p>
  `,
  lastModified: Date.now(),
  preview: 'Water does not resist. Water flows...',
  folderId: null
};

const App: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([INITIAL_DOC]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeDocId, setActiveDocId] = useState<string>('doc-1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [historyDocId, setHistoryDocId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const user = useStore($user);
  const settings = useStore($settings);
  const navigate = useNavigate();

  // Mobile resize listener
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dark mode class toggle on <html>
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Cmd+K search palette shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (user) {
      setHasStarted(true);
      const unsubscribeDocs = subscribeToDocuments(user.uid, (docs) => {
        setDocuments(docs);
        if (docs.length > 0 && !docs.find(d => d.id === activeDocId)) {
          setActiveDocId(docs[0].id);
        }
      });
      const unsubscribeFolders = subscribeToFolders(user.uid, (folders) => setFolders(folders));
      return () => {
        unsubscribeDocs();
        unsubscribeFolders();
      };
    } else {
      const savedDocs = localStorage.getItem('ink-flow-docs');
      if (savedDocs) {
        try {
          const parsed = JSON.parse(savedDocs);
          setDocuments(parsed);
          if (parsed.length > 0 && !parsed.find((d: Document) => d.id === activeDocId)) {
            setActiveDocId(parsed[0].id);
          }
        } catch (e) {
          console.error("Failed to load local docs", e);
        }
      }
      setFolders([]);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('ink-flow-docs', JSON.stringify(documents));
    }
  }, [documents, user]);

  useEffect(() => {
    if (!user && isChatOpen) setIsChatOpen(false);
  }, [user, isChatOpen]);

  useEffect(() => {
    if (user || hasStarted) {
      navigate('/editor');
    }
  }, [user, hasStarted]);

  const activeDoc = documents.find(d => d.id === activeDocId) || documents[0];

  const handleChatToggle = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsChatOpen(!isChatOpen);
  };

  const handleCreateDoc = async (folderId?: string) => {
    if (user) {
      const newDoc = await createDocument(user.uid, folderId || null);
      setActiveDocId(newDoc.id);
    } else {
      const newDoc: Document = {
        id: `doc-${Date.now()}`,
        title: '',
        content: '',
        lastModified: Date.now(),
        preview: 'Empty draft...',
        folderId: folderId || null
      };
      setDocuments(prev => [newDoc, ...prev]);
      setActiveDocId(newDoc.id);
    }
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleUpdateDoc = async (content: string, preview: string) => {
    setIsSaving(true);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const title = tempDiv.querySelector('h1')?.textContent ||
      tempDiv.textContent?.slice(0, 40) || 'Untitled';

    if (user && activeDoc) {
      await updateFirestoreDoc(activeDoc.id, { content, preview, title });
    } else {
      setDocuments(prev => prev.map(d => {
        if (d.id === activeDocId) {
          return { ...d, content, preview, title, lastModified: Date.now() };
        }
        return d;
      }));
      // Simulate network delay for local save feeling
      await new Promise(r => setTimeout(r, 500));
    }
    setIsSaving(false);
  };

  const handleDeleteDoc = async (id: string) => {
    if (confirm('Delete this document?')) {
      if (user) {
        await deleteDocument(id);
      } else {
        const remaining = documents.filter(d => d.id !== id);
        setDocuments(remaining);
        if (remaining.length > 0) setActiveDocId(remaining[0].id);
        else handleCreateDoc();
      }
    }
  };

  const handleMoveDoc = async (docId: string, folderId: string | null) => {
    if (user) {
      await updateFirestoreDoc(docId, { folderId });
    } else {
      alert("Please log in to organize documents.");
    }
  };

  const handleCreateFolder = async (name: string) => {
    if (user) {
      await createFolder(user.uid, name);
    } else {
      alert("Please log in to create folders.");
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (confirm('Delete folder? Documents will move to root.')) {
      if (user) {
        await deleteFolder(id);
        const docsInFolder = documents.filter(d => d.folderId === id);
        await Promise.all(docsInFolder.map(d => updateFirestoreDoc(d.id, { folderId: null })));
      }
    }
  };

  const handleImport = async (title: string, content: string) => {
    if (user) {
      const newDoc = await createDocument(user.uid, null);
      await updateFirestoreDoc(newDoc.id, { title, content, preview: content.slice(0, 100) });
      setActiveDocId(newDoc.id);
    } else {
      const newDoc: Document = {
        id: `doc-${Date.now()}`,
        title,
        content,
        lastModified: Date.now(),
        preview: content.slice(0, 100),
        folderId: null
      };
      setDocuments(prev => [newDoc, ...prev]);
      setActiveDocId(newDoc.id);
    }
  };

  const handleSaveVersion = async (doc: Document) => {
    if (user) {
      try {
        await saveDocumentVersion(doc.id, doc.content, doc.title);
        alert('Version saved successfully!');
      } catch (e) {
        console.error("Failed to save version", e);
        alert('Failed to save version.');
      }
    } else {
      alert("Please log in to save versions.");
    }
  };

  const handleRestoreVersion = async (content: string, title: string) => {
    // Just update local/firestore state like a regular update
    if (historyDocId) {
      const preview = content.slice(0, 100);
      if (user) {
        await updateFirestoreDoc(historyDocId, { content, title, preview });
      } else {
        // Local logic isn't really used since we only save versions for logged in users
        // But for completeness:
        setDocuments(prev => prev.map(d => {
          if (d.id === historyDocId) {
            return { ...d, content, preview, title, lastModified: Date.now() };
          }
          return d;
        }));
      }
    }
  };

  return (
    <>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {historyDocId && (
        <HistoryModal
          isOpen={!!historyDocId}
          documentId={historyDocId}
          onClose={() => setHistoryDocId(null)}
          onRestore={handleRestoreVersion}
        />
      )}

      <Routes>
        <Route path="/" element={
          user || hasStarted ? <Navigate to="/editor" /> : <LandingPage onStartGuest={() => setHasStarted(true)} onLogin={() => setIsAuthModalOpen(true)} />
        } />

        <Route path="/editor" element={
          (!user && !hasStarted) ? <Navigate to="/" /> : (
            <div className={`flex h-screen w-full bg-desk dark:bg-[#121218] bg-paper-texture text-ink dark:text-white/90 overflow-hidden selection:bg-wash-beige dark:selection:bg-white/20 selection:text-ink dark:selection:text-white`}>
              <div className={`${isFocusMode ? 'hidden' : 'block'} h-full flex-shrink-0 transition-all duration-300`}>
                <Sidebar
                  documents={documents}
                  folders={folders}
                  activeDocId={activeDocId}
                  onSelectDoc={(id) => {
                    setActiveDocId(id);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  onCreateDoc={handleCreateDoc}
                  onCreateFolder={handleCreateFolder}
                  onDeleteDoc={handleDeleteDoc}
                  onDeleteFolder={handleDeleteFolder}
                  onMoveDoc={handleMoveDoc}
                  onImportDoc={handleImport}
                  onExportDoc={exportDocument}
                  onSaveVersion={handleSaveVersion}
                  onViewHistory={(doc) => setHistoryDocId(doc.id)}
                  isOpen={isSidebarOpen}
                  toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                  settings={settings}
                  onUpdateSettings={updateSettings}
                  user={user}
                  onLoginClick={() => setIsAuthModalOpen(true)}
                  onLogoutClick={() => {
                    signOut();
                    setHasStarted(false);
                    navigate('/');
                  }}
                />
              </div>

              <main className={`flex-1 h-full flex flex-col relative transition-all duration-500 ease-out ${isChatOpen ? 'mr-80 md:mr-96' : ''}`}>
                <header className={`flex-shrink-0 h-16 flex items-center px-4 md:px-8 justify-between z-20 transition-opacity duration-300 ${isFocusMode ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                  <div className="flex items-center gap-4">
                    {!isFocusMode && (
                      <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-ink-faint dark:text-white/40 hover:text-navy dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 backdrop-blur-sm"
                        title="Toggle Sidebar"
                        aria-label="Toggle Navigation Sidebar"
                        aria-expanded={isSidebarOpen}
                      >
                        {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                      </button>
                    )}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-ink-faint dark:text-white/30 font-bold uppercase tracking-widest opacity-60">
                        {isSaving ? 'Saving...' : (activeDoc?.lastModified ? 'Saved to Cloud' : 'Local Draft')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Search Button */}
                    <button
                      onClick={() => setIsSearchOpen(true)}
                      className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-all ${settings.darkMode
                          ? 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
                          : 'bg-white/60 border-wash-stone/20 text-ink-faint hover:text-ink hover:border-wash-stone/40'
                        }`}
                      title="Search Documents (Ctrl+K)"
                    >
                      <span>Search</span>
                      <kbd className="text-[10px] font-mono opacity-50">⌘K</kbd>
                    </button>

                    {/* Tone Analyzer */}
                    <ToneAnalyzer
                      content={activeDoc?.content || ''}
                      title={activeDoc?.title || ''}
                      isDark={settings.darkMode}
                    />

                    {/* Pomodoro Timer */}
                    <PomodoroTimer isDark={settings.darkMode} />

                    {/* Dark Mode Toggle */}
                    <button
                      onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                      className={`p-2 rounded-lg transition-all ${settings.darkMode
                          ? 'text-amber-300 hover:bg-white/10'
                          : 'text-ink-faint hover:text-ink hover:bg-wash-stone/20'
                        }`}
                      title={settings.darkMode ? 'Light Mode' : 'Dark Mode'}
                      aria-label="Toggle Dark Mode"
                    >
                      {settings.darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <div className={`flex items-center gap-3 px-3 py-1.5 rounded-full border ${settings.darkMode
                        ? 'bg-white/5 border-white/10'
                        : 'bg-white/40 border-white/50'
                      } backdrop-blur-sm`}>
                      <div className="w-2 h-2 rounded-full bg-sage shadow-[0_0_8px_rgba(152,168,162,0.8)] animate-pulse"></div>
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${settings.darkMode ? 'text-white/40' : 'text-ink-faint'
                        }`}>AI Active</div>
                    </div>

                    <button
                      onClick={handleChatToggle}
                      className={`
                          flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 group shadow-sm
                          ${isChatOpen
                          ? 'bg-navy text-white shadow-lg shadow-navy/20'
                          : settings.darkMode
                            ? 'bg-white/5 border border-white/10 text-white hover:border-white/20 hover:shadow-md'
                            : 'bg-white border border-wash-stone/30 text-ink hover:border-navy/30 hover:shadow-md'}
                       `}
                      title={!user ? "Sign in to use Assistant" : "Toggle Assistant"}
                      aria-label="Toggle AI Assistant"
                      aria-expanded={isChatOpen}
                    >
                      {!user && <Lock size={14} className={`${settings.darkMode ? 'text-white/40' : 'text-ink-faint'} group-hover:text-navy`} />}
                      {user && <Sparkles size={16} />}
                      <span className="hidden sm:inline font-serif italic">Assistant</span>
                    </button>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col items-center">
                  {activeDoc ? (
                    <TipTapEditor
                      key={activeDoc.id}
                      document={activeDoc}
                      documents={documents}
                      onSelectDoc={setActiveDocId}
                      onUpdate={handleUpdateDoc}
                      settings={settings}
                      onUpdateSettings={updateSettings}
                      isFocusMode={isFocusMode}
                      toggleFocusMode={() => setIsFocusMode(!isFocusMode)}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-ink-faint gap-4">
                      <div className="w-16 h-16 rounded-full bg-wash-stone/10 flex items-center justify-center">
                        <Sparkles size={24} className="opacity-50" />
                      </div>
                      <p className="font-serif italic text-lg">Select a document to begin.</p>
                    </div>
                  )}
                </div>
              </main>

              <ChatSidebar
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                documentContext={{ title: activeDoc?.title || '', content: activeDoc?.content || '' }}
              />

              {/* Search Palette */}
              <SearchPalette
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                documents={documents}
                onSelectDoc={(id) => {
                  setActiveDocId(id);
                  setIsSearchOpen(false);
                }}
              />
            </div>
          )
        } />

        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </>
  );
};

export default App;