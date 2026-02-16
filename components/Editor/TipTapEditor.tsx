import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Mention from '@tiptap/extension-mention';

import tippy from 'tippy.js';
import { Document, EditorSettings } from '../../types';
import { BubbleMenu } from './BubbleMenu';
import { MentionList } from './MentionList';
import { generateGhostText, continueFromCursor } from '../../services/geminiService';
import { ArrowRight, Loader2, FileCode, Type, Sparkles, Undo, Redo, X, Check, Maximize2, Minimize2, AlignCenter } from 'lucide-react';

interface TipTapEditorProps {
  document: Document;
  documents: Document[]; // List of all documents for mentions
  onUpdate: (content: string, preview: string) => void;
  onSelectDoc: (id: string) => void; // For navigation when clicking mentions
  settings: EditorSettings;
  onUpdateSettings: (settings: Partial<EditorSettings>) => void;
  isFocusMode: boolean;
  toggleFocusMode: () => void;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  document,
  documents,
  onUpdate,
  onSelectDoc,
  settings,
  onUpdateSettings,
  isFocusMode,
  toggleFocusMode
}) => {
  const [ghostText, setGhostText] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref to hold the latest documents list to avoid re-initializing useEditor on every keystroke
  const documentsRef = useRef(documents);
  documentsRef.current = documents;

  const markdownMode = settings.markdownMode || false;

  // When markdownMode changes, useEditor will re-initialize because of the dependency array.
  // We rely on the parent 'document.content' to persist data across these re-inits.
  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      Placeholder.configure({
        placeholder: 'Title your masterpiece...\nJust start writing...',
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: {
          items: ({ query }) => {
            // Use the ref to get the latest documents without triggering re-render of editor
            return documentsRef.current
              .filter(doc => doc.title.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 5);
          },
          render: () => {
            let component: ReactRenderer | null = null;
            let popup: any | null = null;

            return {
              onStart: (props) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect as any,
                  appendTo: () => window.document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },
              onUpdate: (props) => {
                component?.updateProps(props);
                if (!props.clientRect) {
                  return;
                }
                popup?.[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },
              onKeyDown: (props) => {
                if (props.event.key === 'Escape') {
                  popup?.[0].hide();
                  return true;
                }
                return component?.ref?.onKeyDown(props);
              },
              onExit: () => {
                popup?.[0].destroy();
                component?.destroy();
              },
            };
          },
        },
      }),

    ],
    content: document.content,
    enableInputRules: markdownMode,
    enablePasteRules: markdownMode,
    editorProps: {
      attributes: {
        class: 'prose prose-lg focus:outline-none max-w-none min-h-[60vh]',
        spellcheck: 'true',
      },
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement;
        if (target.classList.contains('mention')) {
          const id = target.getAttribute('data-id');
          if (id) {
            onSelectDoc(id);
            return true;
          }
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
      // 2. Clear ghost text on user typing
      if (ghostText && !isAccepting) setGhostText(null);

      const content = editor.getHTML();
      const text = editor.getText();
      const preview = text.slice(0, 100) + (text.length > 100 ? '...' : '');
      onUpdate(content, preview);

      // Typewriter mode: scroll cursor to center
      if (settings.typewriterMode) {
        requestAnimationFrame(() => {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            if (rect && rect.top) {
              const viewportCenter = window.innerHeight / 2;
              const offset = rect.top - viewportCenter;
              if (Math.abs(offset) > 50) {
                window.scrollBy({ top: offset, behavior: 'smooth' });
              }
            }
          }
        });
      }

      // Debounce Ghost Writer trigger
      if (debounceRef.current) clearTimeout(debounceRef.current);

      // 1. Only trigger if enough content exists (> 50 chars)
      if (text.length > 50) {
        debounceRef.current = setTimeout(() => {
          triggerGhostWriter(text, document.title);
        }, 1500);
      }
    },
  }, [markdownMode, document.id]);

  // Sync content if document changes externally (e.g. switching docs)
  useEffect(() => {
    if (editor && document.content !== editor.getHTML()) {
      editor.commands.setContent(document.content);
      setGhostText(null);
    }
  }, [document.id, editor]);

  // Manual Trigger for Ghost Writer (Cmd+J) and Continue From Here (Cmd+Shift+J)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        if (!editor) return;

        if (e.shiftKey) {
          // Cmd+Shift+J: Continue from cursor position
          const { from } = editor.state.selection;
          const fullText = editor.getText();
          const doc = editor.state.doc;
          let charCount = 0;
          let cursorTextPos = 0;
          doc.descendants((node, pos) => {
            if (node.isText && node.text) {
              const nodeEnd = pos + node.text.length;
              if (from >= pos && from <= nodeEnd) {
                cursorTextPos = charCount + (from - pos);
              }
              charCount += node.text.length;
            } else if (node.isBlock && pos > 0) {
              charCount += 1; // newline equivalent
            }
            return true;
          });
          const textBefore = fullText.slice(0, cursorTextPos);
          const textAfter = fullText.slice(cursorTextPos);

          setIsThinking(true);
          const suggestion = await continueFromCursor(textBefore, textAfter, document.title);
          setIsThinking(false);
          if (suggestion) {
            setGhostText(suggestion);
          }
        } else {
          // Cmd+J: Ghost writer from end
          const text = editor.getText();
          triggerGhostWriter(text, document.title);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, document.title]);

  const triggerGhostWriter = async (context: string, title: string) => {
    if (isThinking) return;

    setIsThinking(true);
    const suggestion = await generateGhostText(context, title);
    setIsThinking(false);

    if (suggestion) {
      setGhostText(suggestion);
    }
  };

  const acceptGhostText = useCallback(() => {
    if (editor && ghostText && !isAccepting) {
      // Start the "absorption" animation
      setIsAccepting(true);

      // Insert content immediately for responsiveness
      editor.chain().focus().insertContent(' ' + ghostText).run();

      // Clear the ghost text state after the animation completes
      // The CSS animation is set to 400ms (0.4s) in index.html
      setTimeout(() => {
        setGhostText(null);
        setIsAccepting(false);
      }, 400);
    }
  }, [editor, ghostText, isAccepting]);

  // Handle Tab key to accept ghost text
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && ghostText) {
        e.preventDefault();
        acceptGhostText();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ghostText, acceptGhostText]);

  if (!editor) {
    return null;
  }

  const wordCount = editor.getText().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="w-full flex flex-col items-center pb-20 animate-fade-in relative">
      <a href="#editor-content" className="skip-link focus:absolute focus:top-4 focus:left-4 sr-only focus:not-sr-only">
        Skip to Editor Content
      </a>

      {/* Paper Container */}
      <div
        className={`
          relative w-full max-w-[850px] min-h-[85vh] 
          bg-paper dark:bg-[#1a1a22] 
          shadow-[0_2px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_40px_rgba(0,0,0,0.3)]
          border border-wash-stone/10 dark:border-white/5
          md:rounded-sm md:my-6
          transition-all duration-300
          group/paper
          ${isFocusMode ? 'scale-105 my-10' : ''}
        `}
      >
        {/* Paper Texture Overlay (Subtle) */}
        <div className="absolute inset-0 bg-paper-texture opacity-30 dark:opacity-10 pointer-events-none rounded-sm" />

        {/* Editor Controls Toolbar (Floating on the paper top-right) */}
        <div className="absolute top-6 right-8 z-10 opacity-0 group-hover/paper:opacity-100 transition-all duration-300 flex items-center gap-2">

          {/* Typewriter Mode Toggle */}
          <button
            onClick={() => onUpdateSettings({ typewriterMode: !settings.typewriterMode })}
            className={`p-1.5 rounded-lg transition-all ${settings.typewriterMode
              ? 'text-navy dark:text-blue-400 bg-navy/10 dark:bg-blue-400/10'
              : 'text-ink-faint dark:text-white/40 hover:text-ink dark:hover:text-white hover:bg-wash-stone/20 dark:hover:bg-white/10'
              }`}
            title={settings.typewriterMode ? 'Typewriter Mode On' : 'Typewriter Mode Off'}
            aria-label="Toggle Typewriter Mode"
          >
            <AlignCenter size={16} />
          </button>

          {/* Focus Mode Toggle */}
          <button
            onClick={toggleFocusMode}
            className="p-1.5 rounded-lg text-ink-faint dark:text-white/40 hover:text-ink dark:hover:text-white hover:bg-wash-stone/20 dark:hover:bg-white/10 transition-all"
            title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
            aria-label={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
          >
            {isFocusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Undo/Redo Group */}
          <div className="flex items-center gap-1 bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-wash-stone/20 dark:border-white/10 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className={`p-1.5 rounded-md transition-colors ${editor.can().undo() ? 'text-ink dark:text-white hover:bg-wash-stone/20 dark:hover:bg-white/10' : 'text-ink-faint/40 dark:text-white/20 cursor-not-allowed'}`}
              title="Undo (Ctrl+Z)"
              aria-label="Undo last action"
            >
              <Undo size={14} />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className={`p-1.5 rounded-md transition-colors ${editor.can().redo() ? 'text-ink dark:text-white hover:bg-wash-stone/20 dark:hover:bg-white/10' : 'text-ink-faint/40 dark:text-white/20 cursor-not-allowed'}`}
              title="Redo (Ctrl+Y)"
              aria-label="Redo reversed action"
            >
              <Redo size={14} />
            </button>
          </div>

          {/* Markdown Toggle */}
          <button
            onClick={() => onUpdateSettings({ markdownMode: !markdownMode })}
            className={`
              flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border transition-all shadow-sm
              ${markdownMode
                ? 'bg-navy text-white border-navy'
                : 'bg-white/80 dark:bg-white/5 backdrop-blur-sm text-ink-faint dark:text-white/40 border-wash-stone/20 dark:border-white/10 hover:border-navy/30 hover:text-ink dark:hover:text-white'}
            `}
            title={markdownMode ? "Markdown Shortcuts Active" : "Markdown Shortcuts Disabled"}
            aria-label={markdownMode ? "Disable Markdown Shortcuts" : "Enable Markdown Shortcuts"}
            aria-pressed={markdownMode}
          >
            {markdownMode ? <FileCode size={14} /> : <Type size={14} />}
            <span className="font-medium tracking-wide">{markdownMode ? 'MD' : 'Visual'}</span>
          </button>
        </div>

        <BubbleMenu editor={editor} showAiRefinement={settings.enableAiRefinement ?? true} />

        {/* Main Typing Area */}
        <div className="px-8 py-12 md:px-16 md:py-20 relative z-0" id="editor-content">
          <div
            style={{
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
              fontFamily: settings.fontFamily === 'serif' ? 'Merriweather, serif' : settings.fontFamily === 'mono' ? 'JetBrains Mono, monospace' : 'Inter, sans-serif'
            }}
            className={`transition-all duration-300 ease-in-out ${settings.fontFamily === 'serif' ? 'font-serif' : settings.fontFamily === 'mono' ? 'font-mono' : 'font-sans'}`}
          >
            <EditorContent editor={editor} />
          </div>

          {/* Ghost Writer Overlay */}
          {(ghostText || isThinking || isAccepting) && (
            <div className={`relative mt-4 z-20 transition-all duration-300 ${isAccepting ? 'animate-absorb pointer-events-none' : 'animate-fade-in'}`}>
              {isThinking && !ghostText && (
                <div className="flex items-center gap-2 text-sage dark:text-blue-400 text-sm animate-pulse font-medium ml-1 mb-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Ink & Flow is thinking...</span>
                </div>
              )}

              {!isThinking && ghostText && (
                <div className="relative pl-6">
                  {/* Decorative connection line */}
                  <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-full transition-colors duration-300 ${isAccepting ? 'bg-sage/0' : 'bg-sage/40 dark:bg-blue-400/40'}`} />

                  <div className="group relative bg-white/60 dark:bg-white/5 backdrop-blur-md border border-sage/30 dark:border-white/10 shadow-[0_8px_24px_rgba(152,168,162,0.12)] dark:shadow-none rounded-xl overflow-hidden animate-ink-spread origin-top-left transition-all hover:bg-white dark:hover:bg-white/10 hover:border-sage/50 dark:hover:border-white/20">
                    <div className="flex items-start gap-4 p-5">
                      <div className="mt-1 text-sage dark:text-blue-400 flex-shrink-0">
                        <Sparkles size={18} />
                      </div>
                      <div className="flex-1">
                        <p
                          className="text-ink dark:text-white font-serif italic leading-relaxed opacity-90"
                          style={{
                            fontSize: `${settings.fontSize}px`
                          }}
                        >
                          {ghostText}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 px-5 pb-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300">
                      <button
                        onClick={acceptGhostText}
                        className="flex items-center gap-2 bg-sage dark:bg-blue-500 text-white text-xs px-3.5 py-2 rounded-lg shadow-sm hover:shadow-md hover:bg-sage/90 dark:hover:bg-blue-400 transition-all active:scale-[0.98] border border-transparent"
                      >
                        <Check size={13} strokeWidth={3} />
                        <span className="font-semibold tracking-wide">Accept</span>
                        <kbd className="hidden sm:inline-block bg-white/20 text-white px-1.5 py-0.5 rounded text-[9px] font-mono min-w-[24px] text-center ml-1">TAB</kbd>
                      </button>
                      <button
                        onClick={() => setGhostText(null)}
                        className="flex items-center gap-2 text-ink-faint dark:text-white/40 hover:text-navy dark:hover:text-white text-xs px-3.5 py-2 rounded-lg hover:bg-wash-stone/10 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-wash-stone/20 dark:hover:border-white/20"
                      >
                        <X size={13} />
                        <span>Dismiss</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Word Count + Reading Time */}
        <div className="absolute bottom-4 right-8 text-[10px] text-ink-faint dark:text-white/25 uppercase tracking-wider opacity-60 pointer-events-none flex items-center gap-3">
          <span>{wordCount} Words</span>
          <span>·</span>
          <span>{Math.max(1, Math.round(wordCount / 200))} min read</span>
        </div>
      </div>
    </div>
  );
};