import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Coffee, Pen, ChevronUp, ChevronDown } from 'lucide-react';

interface PomodoroTimerProps {
    isDark?: boolean;
}

type TimerPhase = 'focus' | 'break';

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ isDark }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [phase, setPhase] = useState<TimerPhase>('focus');
    const [focusMinutes, setFocusMinutes] = useState(25);
    const [breakMinutes, setBreakMinutes] = useState(5);
    const [secondsLeft, setSecondsLeft] = useState(25 * 60);
    const [sessions, setSessions] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const intervalRef = useRef<number | null>(null);

    const totalSeconds = phase === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
    const progress = 1 - secondsLeft / totalSeconds;

    const playNotification = useCallback(() => {
        try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 660;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 1);
        } catch (e) {
            // Audio not supported
        }
    }, []);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = window.setInterval(() => {
                setSecondsLeft(prev => {
                    if (prev <= 1) {
                        playNotification();
                        if (phase === 'focus') {
                            setPhase('break');
                            setSessions(s => s + 1);
                            return breakMinutes * 60;
                        } else {
                            setPhase('focus');
                            return focusMinutes * 60;
                        }
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, phase, focusMinutes, breakMinutes, playNotification]);

    const reset = () => {
        setIsRunning(false);
        setPhase('focus');
        setSecondsLeft(focusMinutes * 60);
    };

    const adjustTime = (type: 'focus' | 'break', delta: number) => {
        if (isRunning) return;
        if (type === 'focus') {
            const newVal = Math.max(1, Math.min(120, focusMinutes + delta));
            setFocusMinutes(newVal);
            if (phase === 'focus') setSecondsLeft(newVal * 60);
        } else {
            const newVal = Math.max(1, Math.min(30, breakMinutes + delta));
            setBreakMinutes(newVal);
            if (phase === 'break') setSecondsLeft(newVal * 60);
        }
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const circumference = 2 * Math.PI * 18;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <div className="relative">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-lg transition-all relative ${isDark
                        ? 'hover:bg-white/10 text-white/60 hover:text-white'
                        : 'hover:bg-wash-stone/20 text-ink-faint hover:text-ink'
                    } ${isRunning ? (phase === 'focus' ? 'text-navy dark:text-blue-400' : 'text-sage dark:text-green-400') : ''}`}
                title="Pomodoro Timer"
            >
                <Timer size={18} />
                {isRunning && (
                    <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse ${phase === 'focus' ? 'bg-navy dark:bg-blue-400' : 'bg-sage dark:bg-green-400'
                        }`} />
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className={`absolute right-0 top-full mt-2 z-50 w-72 rounded-xl shadow-2xl border animate-fade-in ${isDark
                            ? 'bg-[#1e1e24] border-white/10'
                            : 'bg-white border-wash-stone/20'
                        }`}>
                        <div className="p-5 flex flex-col items-center text-center">
                            {/* Phase indicator */}
                            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4 ${phase === 'focus'
                                    ? (isDark ? 'text-blue-400' : 'text-navy')
                                    : (isDark ? 'text-green-400' : 'text-sage')
                                }`}>
                                {phase === 'focus' ? <Pen size={12} /> : <Coffee size={12} />}
                                <span>{phase === 'focus' ? 'Focus Time' : 'Break Time'}</span>
                            </div>

                            {/* Circular Progress */}
                            <div className="relative w-28 h-28 mb-4">
                                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 40 40">
                                    <circle
                                        cx="20" cy="20" r="18"
                                        fill="none"
                                        className={isDark ? 'stroke-white/5' : 'stroke-wash-stone/15'}
                                        strokeWidth="2"
                                    />
                                    <circle
                                        cx="20" cy="20" r="18"
                                        fill="none"
                                        className={phase === 'focus'
                                            ? (isDark ? 'stroke-blue-400' : 'stroke-navy')
                                            : (isDark ? 'stroke-green-400' : 'stroke-sage')
                                        }
                                        strokeWidth="2.5"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-2xl font-mono font-bold tracking-tight ${isDark ? 'text-white' : 'text-ink'}`}>
                                        {formatTime(secondsLeft)}
                                    </span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-3 mb-3">
                                <button
                                    onClick={reset}
                                    className={`p-2.5 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-white/40' : 'hover:bg-wash-stone/15 text-ink-faint'
                                        }`}
                                    title="Reset"
                                >
                                    <RotateCcw size={16} />
                                </button>
                                <button
                                    onClick={() => setIsRunning(!isRunning)}
                                    className={`p-3 rounded-full transition-all shadow-lg ${phase === 'focus'
                                            ? (isDark ? 'bg-blue-500 hover:bg-blue-400 text-white' : 'bg-navy hover:bg-navy/90 text-white')
                                            : (isDark ? 'bg-green-500 hover:bg-green-400 text-white' : 'bg-sage hover:bg-sage/90 text-white')
                                        }`}
                                    title={isRunning ? 'Pause' : 'Start'}
                                >
                                    {isRunning ? <Pause size={18} /> : <Play size={18} />}
                                </button>
                            </div>

                            {/* Sessions counter */}
                            {sessions > 0 && (
                                <div className={`text-[10px] uppercase tracking-widest mb-3 ${isDark ? 'text-white/30' : 'text-ink-faint'}`}>
                                    {sessions} session{sessions !== 1 ? 's' : ''} completed
                                </div>
                            )}

                            {/* Settings toggle */}
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className={`text-[11px] transition-colors ${isDark ? 'text-white/30 hover:text-white/60' : 'text-ink-faint hover:text-ink'
                                    }`}
                            >
                                {showSettings ? 'Hide settings' : 'Customize times'}
                            </button>

                            {/* Time Settings */}
                            {showSettings && (
                                <div className={`mt-3 pt-3 w-full border-t animate-fade-in space-y-3 ${isDark ? 'border-white/5' : 'border-wash-stone/10'
                                    }`}>
                                    {/* Focus Duration */}
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-medium ${isDark ? 'text-white/50' : 'text-ink/70'}`}>Focus</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => adjustTime('focus', -5)}
                                                disabled={isRunning || focusMinutes <= 1}
                                                className={`p-1 rounded transition-colors disabled:opacity-20 ${isDark ? 'hover:bg-white/10 text-white/50' : 'hover:bg-wash-stone/15 text-ink-faint'
                                                    }`}
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                            <span className={`text-sm font-mono w-12 text-center font-bold ${isDark ? 'text-white' : 'text-ink'}`}>
                                                {focusMinutes}m
                                            </span>
                                            <button
                                                onClick={() => adjustTime('focus', 5)}
                                                disabled={isRunning || focusMinutes >= 120}
                                                className={`p-1 rounded transition-colors disabled:opacity-20 ${isDark ? 'hover:bg-white/10 text-white/50' : 'hover:bg-wash-stone/15 text-ink-faint'
                                                    }`}
                                            >
                                                <ChevronUp size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Break Duration */}
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-medium ${isDark ? 'text-white/50' : 'text-ink/70'}`}>Break</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => adjustTime('break', -1)}
                                                disabled={isRunning || breakMinutes <= 1}
                                                className={`p-1 rounded transition-colors disabled:opacity-20 ${isDark ? 'hover:bg-white/10 text-white/50' : 'hover:bg-wash-stone/15 text-ink-faint'
                                                    }`}
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                            <span className={`text-sm font-mono w-12 text-center font-bold ${isDark ? 'text-white' : 'text-ink'}`}>
                                                {breakMinutes}m
                                            </span>
                                            <button
                                                onClick={() => adjustTime('break', 1)}
                                                disabled={isRunning || breakMinutes >= 30}
                                                className={`p-1 rounded transition-colors disabled:opacity-20 ${isDark ? 'hover:bg-white/10 text-white/50' : 'hover:bg-wash-stone/15 text-ink-faint'
                                                    }`}
                                            >
                                                <ChevronUp size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className={`text-[10px] text-center ${isDark ? 'text-white/20' : 'text-ink-faint/60'}`}>
                                        Changes apply when timer is paused
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
