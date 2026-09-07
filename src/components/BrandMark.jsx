import React from 'react';
import logoImg from '../assets/logo.png';

const DIMENSIONS = {
    sm: 'h-10 w-[140px]',     // compact portal headers (~60% wider)
    md: 'h-[52px] w-[180px]', // sidebar (~60% wider)
    lg: 'h-20 w-[280px]',     // login screen (~60% wider)
};

export default function BrandMark({
    label = null,
    variant = 'blue',
    size = 'sm',
    className = '',
}) {
    const onDark = variant === 'white';

    return (
        <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
            <img
                src={logoImg}
                alt="Teraiya Solar"
                className={`${DIMENSIONS[size] || DIMENSIONS.sm} shrink-0 select-none object-contain object-left`}
                draggable="false"
            />
            {label && (
                <>
                    <span className={`w-px self-stretch my-0.5 shrink-0 ${onDark ? 'bg-white/25' : 'bg-stone-200'}`} />
                    <span
                        className={`text-[9px] font-bold uppercase tracking-widest leading-tight truncate ${
                            onDark ? 'text-amber-300' : 'text-amber-600'
                        }`}
                    >
                        {label}
                    </span>
                </>
            )}
        </div>
    );
}
