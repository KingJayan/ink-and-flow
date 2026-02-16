import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import {
  Sparkles, Bold, Italic, Strikethrough, Code,
  Heading1, Heading2, List, ListOrdered, Quote
} from 'lucide-react';
import { refineText } from '../../services/geminiService';

interface BubbleMenuProps {
  editor: Editor;
  showAiRefinement: boolean;
}

const MenuButton = ({
  isActive,
  onClick,
  icon: Icon
}: { isActive: boolean; onClick: () => void; icon: React.ElementType }) => (
  <button
    onClick={onClick}
    className={`p-1.5 rounded transition-colors ${isActive ? 'text-navy dark:text-blue-400 bg-wash-beige dark:bg-white/10' : 'text-ink dark:text-white/70 hover:bg-wash-stone/20 dark:hover:bg-white/10'}`}
  >
    <Icon size={16} />
  </button>
);

export const BubbleMenu: React.FC<BubbleMenuProps> = ({ editor, showAiRefinement }) => {
  const [isAiInputVisible, setIsAiInputVisible] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const updateMenu = useCallback(() => {
    if (editor.isDestroyed) return;

    const { selection } = editor.state;
    if (!selection || selection.empty) {
      setMenuPosition(null);
      setIsAiInputVisible(false);
      return;
    }

    // If text is selected, calculate position
    if (editor.view) {
      const { from, to } = selection;
      try {
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);

        // Calculate center of selection
        const left = (start.left + end.left) / 2;
        // Position above (approx 50px)
        const top = start.top - 50;

        setMenuPosition({ top, left });
      } catch (e) {
        // Ignore positioning errors
      }
    }
  }, [editor]);

  useEffect(() => {
    editor.on('selectionUpdate', updateMenu);
    editor.on('blur', updateMenu);

    // Add global scroll listener to update position when container scrolls
    window.addEventListener('scroll', updateMenu, true);
    window.addEventListener('resize', updateMenu);

    // Initial check
    updateMenu();

    return () => {
      editor.off('selectionUpdate', updateMenu);
      editor.off('blur', updateMenu);
      window.removeEventListener('scroll', updateMenu, true);
      window.removeEventListener('resize', updateMenu);
    };
  }, [editor, updateMenu]);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInstruction.trim()) return;

    setIsLoading(true);
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    const fullContext = editor.getText();

    const refined = await refineText(selectedText, aiInstruction, fullContext);

    if (refined) {
      editor.chain()
        .focus()
        .insertContentAt({ from, to }, refined)
        // Select the new text to give visual feedback (subtle "animation" via state change)
        .setTextSelection({ from, to: from + refined.length })
        .run();
    }

    setIsLoading(false);
    setIsAiInputVisible(false);
    setAiInstruction('');
    setMenuPosition(null);
  };

  if (!menuPosition) return null;

  return (
    <div
      className="fixed z-50 bg-white dark:bg-[#252530] border border-wash-stone/30 dark:border-white/10 shadow-lg rounded-lg overflow-hidden flex flex-col min-w-[300px] animate-fade-in"
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
        transform: 'translateX(-50%)'
      }}
      onMouseDown={(e) => {
        // Prevent editor blur when clicking buttons, unless it's an input
        if ((e.target as HTMLElement).tagName !== 'INPUT') {
          e.preventDefault();
        }
      }}
    >
      {!isAiInputVisible ? (
        <div className="flex items-center p-1.5 gap-1">
          {/* Group 1: Text Styles */}
          <div className="flex items-center gap-0.5">
            <MenuButton
              icon={Bold}
              isActive={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
            />
            <MenuButton
              icon={Italic}
              isActive={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            />
            <MenuButton
              icon={Strikethrough}
              isActive={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            />
            <MenuButton
              icon={Code}
              isActive={editor.isActive('code')}
              onClick={() => editor.chain().focus().toggleCode().run()}
            />
          </div>

          <div className="w-px h-5 bg-wash-stone/30 dark:bg-white/10 mx-1" />

          {/* Group 2: Headings */}
          <div className="flex items-center gap-0.5">
            <MenuButton
              icon={Heading1}
              isActive={editor.isActive('heading', { level: 1 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            />
            <MenuButton
              icon={Heading2}
              isActive={editor.isActive('heading', { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            />
          </div>

          <div className="w-px h-5 bg-wash-stone/30 dark:bg-white/10 mx-1" />

          {/* Group 3: Lists & Quote */}
          <div className="flex items-center gap-0.5">
            <MenuButton
              icon={List}
              isActive={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            />
            <MenuButton
              icon={ListOrdered}
              isActive={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            />
            <MenuButton
              icon={Quote}
              isActive={editor.isActive('blockquote')}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            />
          </div>

          {/* Group 4: AI (Conditional) */}
          {showAiRefinement && (
            <>
              <div className="w-px h-5 bg-wash-stone/30 dark:bg-white/10 mx-1" />
              <button
                onClick={() => setIsAiInputVisible(true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-wash-stone/20 dark:hover:bg-white/10 text-ink dark:text-white/70 text-xs font-medium transition-colors ml-1"
              >
                <Sparkles size={14} className="text-navy dark:text-blue-400" />
                <span>Refine</span>
              </button>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handleAiSubmit} className="p-2 bg-paper dark:bg-[#252530] flex gap-2 items-center min-w-[320px]">
          <input
            type="text"
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
            placeholder="e.g. Make it punchier..."
            className="flex-1 bg-white dark:bg-white/5 border border-wash-stone/50 dark:border-white/10 rounded px-2 py-1 text-sm text-ink dark:text-white focus:outline-none focus:border-sage placeholder:text-ink-faint dark:placeholder:text-white/25 shadow-inner"
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading}
            className="text-xs bg-navy text-white px-3 py-1.5 rounded hover:bg-navy/90 transition-colors disabled:opacity-50 font-medium"
          >
            {isLoading ? '...' : 'Go'}
          </button>
          <button
            type="button"
            onClick={() => setIsAiInputVisible(false)}
            className="text-ink-faint dark:text-white/30 hover:text-ink dark:hover:text-white px-1 rounded hover:bg-wash-stone/20 dark:hover:bg-white/10"
          >
            ✕
          </button>
        </form>
      )}
    </div>
  );
};