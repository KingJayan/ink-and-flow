import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export const ErrorPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center h-screen w-full bg-desk dark:bg-[#121218] text-ink dark:text-white font-sans">
            <div className="bg-white/50 dark:bg-white/5 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-wash-stone/20 dark:border-white/10 flex flex-col items-center max-w-md text-center">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6 text-red-500">
                    <AlertCircle size={32} />
                </div>
                <h1 className="font-serif text-2xl font-bold mb-2">Page Not Found</h1>
                <p className="text-ink-faint dark:text-white/40 mb-8">
                    The page you are looking for doesn't exist or has been moved.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 bg-navy dark:bg-blue-600 text-white rounded-xl shadow-md hover:bg-navy/90 dark:hover:bg-blue-500 transition-all font-medium"
                >
                    Return Home
                </button>
            </div>
        </div>
    );
};
