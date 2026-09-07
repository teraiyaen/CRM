import React from 'react';
import { Sun } from 'lucide-react';

export default function BrandMark({
    label = null,
    variant = 'blue',
    size = 'sm',
    className = '',
}) {
    const onDark = variant === 'white';

    const textSizes = {
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-2xl',
    };

    return (
        <div className={`flex items-center gap-2.5 min-w-0 select-none ${className}`}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white shadow-sm shrink-0">
                <Sun className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex items-baseline gap-1.5">
                <span className={`font-black tracking-tight ${textSizes[size] || 'text-lg'} ${onDark ? 'text-white' : 'text-stone-900'}`}>
                    Solar<span className="text-amber-500">Flow</span>
                </span>
            </div>
            {label && (
                <>
                    <span className={`w-px h-4 shrink-0 ${onDark ? 'bg-white/20' : 'bg-stone-200'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${onDark ? 'text-amber-300' : 'text-amber-600'}`}>
                        {label}
                    </span>
                </>
            )}
        </div>
    );
}
