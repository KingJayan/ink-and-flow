import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, FileText, X } from 'lucide-react';
import { Document } from '../types';

interface SearchPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    documents: Document[];
    onSelectDoc: (id: string) => void;
}

interface SearchResult {
    doc: Document;
    titleMatch: boolean;
    snippet: string;
    matchIndex: number;
}

export const SearchPalette: React.FC<SearchPaletteProps> = ({ isOpen, onClose, documents, onSelectDoc }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults([]);
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const search = useCallback((q: string) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }

        const lower = q.toLowerCase();
        const matched: SearchResult[] = [];

        for (const doc of documents) {
            const titleMatch = doc.title.toLowerCase().includes(lower);

            // Strip HTML tags for content search
            const plainText = doc.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
            const contentIndex = plainText.toLowerCase().indexOf(lower);

            if (titleMatch || contentIndex >= 0) {
                let snippet = '';
                if (contentIndex >= 0) {
                    const start = Math.max(0, contentIndex - 40);
                    const end = Math.min(plainText.length, contentIndex + q.length + 60);
                    snippet = (start > 0 ? '...' : '') + plainText.slice(start, end) + (end < plainText.length ? '...' : '');
                } else {
                    snippet = plainText.slice(0, 100) + (plainText.length > 100 ? '...' : '');
                }

                matched.push({
                    doc,
                    titleMatch,
                    snippet,
                    matchIndex: titleMatch ? 0 : contentIndex
                });
            }
        }

        // Sort: title matches first, then by position
        matched.sort((a, b) => {
            if (a.titleMatch && !b.titleMatch) return -1;
            if (!a.titleMatch && b.titleMatch) return 1;
            return 0;
        });

        setResults(matched.slice(0, 10));
        setActiveIndex(0);
    }, [documents]);

    useEffect(() => {
        search(query);
    }, [query, search]);

    const handleSelect = (docId: string) => {
        onSelectDoc(docId);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && results.length > 0) {
            e.preventDefault();
            handleSelect(results[activeIndex].doc.id);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const highlightMatch = (text: string, q: string) => {
        if (!q.trim()) return text;
        const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part)
                ? <mark key={i} className="bg-sage/40 dark:bg-blue-500/30 text-ink dark:text-white rounded-sm px-0.5">{part}</mark>
                : part
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] p-4" onClick={onClose}>
            <div className="fixed inset-0 bg-ink/30 dark:bg-black/50 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-xl bg-white dark:bg-[#1e1e24] rounded-2xl shadow-2xl border border-wash-stone/20 dark:border-white/10 overflow-hidden animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-wash-stone/15 dark:border-white/10">
                    <Search size={20} className="text-ink-faint dark:text-white/40 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search documents..."
                        className="flex-1 bg-transparent text-ink dark:text-white text-base focus:outline-none placeholder:text-ink-faint/50 dark:placeholder:text-white/30"
                    />
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-ink-faint dark:text-white/30 bg-desk dark:bg-white/5 rounded border border-wash-stone/20 dark:border-white/10">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto">
                    {query && results.length === 0 && (
                        <div className="p-8 text-center text-ink-faint dark:text-white/40 text-sm">
                            No documents match "<span className="font-medium text-ink dark:text-white/60">{query}</span>"
                        </div>
                    )}

                    {!query && (
                        <div className="p-8 text-center text-ink-faint dark:text-white/40 text-sm">
                            Start typing to search across all your documents
                        </div>
                    )}

                    {results.map((result, index) => (
                        <button
                            key={result.doc.id}
                            onClick={() => handleSelect(result.doc.id)}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={`w-full text-left px-5 py-3 flex items-start gap-3 transition-colors ${index === activeIndex
                                ? 'bg-navy/5 dark:bg-white/10'
                                : 'hover:bg-desk/50 dark:hover:bg-white/5'
                                }`}
                        >
                            <FileText size={16} className="mt-1 text-ink-faint dark:text-white/30 flex-shrink-0" />
                            <div className="overflow-hidden min-w-0">
                                <div className="font-medium text-sm text-ink dark:text-white truncate">
                                    {highlightMatch(result.doc.title || 'Untitled Draft', query)}
                                </div>
                                <div className="text-xs text-ink-faint dark:text-white/40 truncate mt-0.5">
                                    {highlightMatch(result.snippet, query)}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-2.5 border-t border-wash-stone/10 dark:border-white/5 flex items-center gap-4 text-[10px] text-ink-faint dark:text-white/30 font-mono">
                    <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 border border-wash-stone/20 dark:border-white/10 rounded">↑↓</kbd> navigate</span>
                    <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 border border-wash-stone/20 dark:border-white/10 rounded">↵</kbd> open</span>
                    <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 border border-wash-stone/20 dark:border-white/10 rounded">esc</kbd> close</span>
                </div>
            </div>
        </div>
    );
};
