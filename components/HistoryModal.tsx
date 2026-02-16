import React, { useEffect, useState } from 'react';
import { X, Clock, RotateCcw, Loader2 } from 'lucide-react';
import { getDocumentVersions } from '../services/firestoreService';
import LZString from 'lz-string';

interface Version {
    id: string;
    content: string;
    title: string;
    createdAt: number;
}

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: string;
    onRestore: (content: string, title: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, documentId, onRestore }) => {
    const [versions, setVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeVersion, setActiveVersion] = useState<Version | null>(null);

    useEffect(() => {
        if (isOpen && documentId) {
            setLoading(true);
            getDocumentVersions(documentId).then((fetchedVersions: any[]) => {
                // Versions are already decompressed in getDocumentVersions
                setVersions(fetchedVersions);
                setLoading(false);
            }).catch(err => {
                console.error("Failed to load versions", err);
                setLoading(false);
            });
        }
    }, [isOpen, documentId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#1e1e24] w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex overflow-hidden border border-wash-stone/20 dark:border-white/10">

                {/* Sidebar List */}
                <div className="w-80 border-r border-wash-stone/20 dark:border-white/10 flex flex-col bg-desk dark:bg-[#16161c]">
                    <div className="p-4 border-b border-wash-stone/10 dark:border-white/10 bg-white dark:bg-[#1e1e24]">
                        <h2 className="font-serif font-bold text-lg flex items-center gap-2 text-ink dark:text-white">
                            <Clock size={20} className="text-navy dark:text-blue-400" />
                            <span>Version History</span>
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loading ? (
                            <div className="flex justify-center p-8 text-ink-faint dark:text-white/30">
                                <Loader2 size={24} className="animate-spin" />
                            </div>
                        ) : versions.length === 0 ? (
                            <div className="text-center p-8 text-ink-faint dark:text-white/30 text-sm italic">
                                No saved versions found.
                            </div>
                        ) : (
                            versions.map((ver) => (
                                <button
                                    key={ver.id}
                                    onClick={() => setActiveVersion(ver)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors border border-transparent ${activeVersion?.id === ver.id
                                            ? 'bg-white dark:bg-white/10 border-wash-stone/30 dark:border-white/10 shadow-sm'
                                            : 'hover:bg-white/50 dark:hover:bg-white/5 hover:border-wash-stone/10 dark:hover:border-white/5 text-ink dark:text-white/70'
                                        }`}
                                >
                                    <div className={`font-medium text-sm truncate ${activeVersion?.id === ver.id ? 'text-ink dark:text-white' : 'text-ink/80 dark:text-white/60'}`}>
                                        {new Date(ver.createdAt).toLocaleString()}
                                    </div>
                                    <div className="text-xs text-ink-faint dark:text-white/30 truncate mt-0.5">{ver.title || 'Untitled'}</div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 flex flex-col bg-paper dark:bg-[#1a1a22] relative">
                    <div className="p-4 border-b border-wash-stone/10 dark:border-white/10 flex items-center justify-between bg-white/50 dark:bg-black/10 backdrop-blur-sm">
                        <h3 className="font-medium text-sm text-ink-faint dark:text-white/40 uppercase tracking-wider">
                            {activeVersion ? 'Previewing Version' : 'Select a version to preview'}
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-wash-stone/20 dark:hover:bg-white/10 rounded-full transition-colors text-ink-faint dark:text-white/40 hover:text-ink dark:hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 prose prose-lg dark:prose-invert max-w-none">
                        {activeVersion ? (
                            <div dangerouslySetInnerHTML={{ __html: activeVersion.content }} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-ink-faint dark:text-white/20 opacity-50">
                                <Clock size={48} className="mb-4" />
                                <p>Select a version from the left to preview.</p>
                            </div>
                        )}
                    </div>

                    {activeVersion && (
                        <div className="p-4 border-t border-wash-stone/10 dark:border-white/10 bg-white/80 dark:bg-[#1e1e24]/80 backdrop-blur-sm flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-sm text-ink-faint dark:text-white/40 hover:text-ink dark:hover:text-white hover:bg-wash-stone/10 dark:hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('Restore this version? current content will be overwritten.')) {
                                        onRestore(activeVersion.content, activeVersion.title);
                                        onClose();
                                    }
                                }}
                                className="px-4 py-2 rounded-lg text-sm bg-navy dark:bg-blue-600 text-white hover:bg-navy/90 dark:hover:bg-blue-500 transition-colors shadow-md flex items-center gap-2"
                            >
                                <RotateCcw size={16} />
                                <span>Restore Version</span>
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
