import React, { useState } from 'react';
import { Sparkles, X, Loader2, BarChart3 } from 'lucide-react';
import { analyzeTone, ToneAnalysis } from '../services/geminiService';

interface ToneAnalyzerProps {
    content: string;
    title: string;
    isDark?: boolean;
}

export const ToneAnalyzer: React.FC<ToneAnalyzerProps> = ({ content, title, isDark }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [analysis, setAnalysis] = useState<ToneAnalysis | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        const result = await analyzeTone(content, title);
        setAnalysis(result);
        setLoading(false);
    };

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen && !analysis) {
            // Auto-analyze on first open
            setTimeout(handleAnalyze, 100);
        }
    };

    const traitColor = (value: number) => {
        if (value >= 75) return isDark ? 'bg-blue-400' : 'bg-navy';
        if (value >= 50) return isDark ? 'bg-green-400' : 'bg-sage';
        if (value >= 25) return isDark ? 'bg-amber-400' : 'bg-amber-500';
        return isDark ? 'bg-red-400' : 'bg-red-400';
    };

    return (
        <div className="relative">
            {/* Trigger */}
            <button
                onClick={handleToggle}
                className={`p-2 rounded-lg transition-all ${isDark
                        ? 'hover:bg-white/10 text-white/60 hover:text-white'
                        : 'hover:bg-wash-stone/20 text-ink-faint hover:text-ink'
                    } ${isOpen ? (isDark ? 'bg-white/10 text-white' : 'bg-wash-stone/20 text-ink') : ''}`}
                title="Tone Analyzer"
            >
                <BarChart3 size={18} />
            </button>

            {/* Panel */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className={`absolute right-0 top-full mt-2 z-50 w-80 rounded-xl shadow-2xl border animate-fade-in ${isDark
                            ? 'bg-[#1e1e24] border-white/10'
                            : 'bg-white border-wash-stone/20'
                        }`}>
                        {/* Header */}
                        <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-white/5' : 'border-wash-stone/10'
                            }`}>
                            <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-white/60' : 'text-navy'
                                }`}>
                                <Sparkles size={14} />
                                <span>Tone Analysis</span>
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className={`p-1 rounded transition-colors ${isDark ? 'text-white/30 hover:text-white' : 'text-ink-faint hover:text-ink'}`}
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="p-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                    <Loader2 size={24} className={`animate-spin ${isDark ? 'text-blue-400' : 'text-navy'}`} />
                                    <span className={`text-xs ${isDark ? 'text-white/40' : 'text-ink-faint'}`}>Analyzing your writing...</span>
                                </div>
                            ) : analysis ? (
                                <div className="space-y-5">
                                    {/* Overall Tone */}
                                    <div className="text-center">
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-navy/10 text-navy'
                                            }`}>
                                            {analysis.overall}
                                        </div>
                                        <div className={`text-[10px] mt-2 ${isDark ? 'text-white/30' : 'text-ink-faint'}`}>
                                            {Math.round(analysis.confidence * 100)}% confidence
                                        </div>
                                    </div>

                                    {/* Trait Bars */}
                                    <div className="space-y-3">
                                        {analysis.traits.map(trait => (
                                            <div key={trait.label}>
                                                <div className="flex justify-between mb-1">
                                                    <span className={`text-xs font-medium ${isDark ? 'text-white/70' : 'text-ink/80'}`}>{trait.label}</span>
                                                    <span className={`text-[10px] font-mono ${isDark ? 'text-white/30' : 'text-ink-faint'}`}>{trait.value}%</span>
                                                </div>
                                                <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-wash-stone/15'}`}>
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ease-out ${traitColor(trait.value)}`}
                                                        style={{ width: `${trait.value}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Suggestion */}
                                    <div className={`p-3 rounded-lg text-xs italic ${isDark ? 'bg-white/5 text-white/50' : 'bg-desk text-ink-faint'
                                        }`}>
                                        💡 {analysis.suggestion}
                                    </div>

                                    {/* Re-analyze */}
                                    <button
                                        onClick={handleAnalyze}
                                        className={`w-full text-center text-xs py-2 rounded-lg transition-colors ${isDark
                                                ? 'text-white/40 hover:text-white hover:bg-white/5'
                                                : 'text-ink-faint hover:text-ink hover:bg-wash-stone/10'
                                            }`}
                                    >
                                        ↻ Re-analyze
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className={`text-sm mb-3 ${isDark ? 'text-white/40' : 'text-ink-faint'}`}>
                                        Analyze the tone and style of your writing
                                    </p>
                                    <button
                                        onClick={handleAnalyze}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-blue-500 text-white hover:bg-blue-400' : 'bg-navy text-white hover:bg-navy/90'
                                            }`}
                                    >
                                        Analyze Tone
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
