import { useEffect, useRef, useState } from 'react';
import { Page1 } from './Page1';
import { Page2 } from './Page2';
import { Page3 } from './Page3';
import { Page4 } from './Page4';

export const AgreementPreview = ({ data, onClose }) => {
    const content = useRef(null);
    const printFrame = useRef(null);
    useEffect(() => () => { printFrame.current?.remove(); }, []);
    const [printing,setPrinting] = useState(false);
    const [error,setError] = useState('');
    const print = () => {
        if(printing||!content.current)return;
        setPrinting(true);setError('');
        const frame=document.createElement('iframe');
        frame.title='Print agreement';
        frame.style.cssText='position:fixed;width:0;height:0;border:0;bottom:0;left:0;';
        const styles=Array.from(document.querySelectorAll('style,link[rel="stylesheet"]')).map(node=>node.outerHTML).join('\n');
        const title=`Agreement_${String(data.consumerNo||'document').replace(/[^a-zA-Z0-9_-]/g,'_')}`;
        const cleanup=()=>{frame.remove();printFrame.current=null;setPrinting(false);};
        frame.onload=async()=>{
            try {
                const doc=frame.contentDocument;
                await doc.fonts.ready;
                await Promise.all(Array.from(doc.images).map(img=>img.decode()));
                frame.contentWindow.onafterprint=cleanup;
                frame.contentWindow.focus();frame.contentWindow.print();
            }catch(err){cleanup();setError(`Could not prepare printing: ${err.message}`);}
        };
        frame.srcdoc=`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>${styles}<style>
            @page {size:A4 portrait;margin:0;}
            html,body{margin:0!important;padding:0!important;background:white!important;}
            .doc-page{width:210mm!important;height:297mm!important;min-height:297mm!important;box-sizing:border-box!important;padding:12mm 15mm 16mm!important;margin:0!important;position:relative!important;box-shadow:none!important;border:none!important;break-after:page;page-break-after:always;font-size:16px!important;}
            .doc-page:last-child{break-after:auto;page-break-after:auto;}
            .doc-page.stamp-page{padding:0!important;display:flex;align-items:center;justify-content:center;}
            .stamp-page img{max-width:100%;max-height:297mm;object-fit:contain;}
            .doc-page .absolute.bottom-5{bottom:12mm!important;left:15mm!important;right:15mm!important;}
        </style></head><body>${content.current.innerHTML}</body></html>`;
        printFrame.current=frame;
        document.body.appendChild(frame);
    };
    return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3"><section role="dialog" aria-modal="true" aria-labelledby="agreement-preview-title" className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-stone-100">
        <header className="flex flex-wrap items-center justify-between gap-3 bg-stone-900 p-4 text-white"><h2 id="agreement-preview-title" className="font-bold">Agreement · {data.gpaStampUrl?'5 pages, stamp first':'4 pages, no stamp'}</h2><div className="flex gap-3"><button disabled={printing} onClick={print} className="rounded-lg bg-amber-500 px-4 py-2 text-sm text-black disabled:opacity-50">{printing?'Preparing print…':'Print / Save PDF'}</button><button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Back to details</button></div></header>
        {error&&<p role="alert" className="p-3 text-sm text-red-700">{error}</p>}
        <div className="flex-1 overflow-auto p-4"><div ref={content} className="mx-auto w-fit space-y-4">
            {data.gpaStampUrl&&<div className="doc-page stamp-page flex items-center justify-center" style={{padding:0}}><img src={data.gpaStampUrl} alt="Stamp first page" style={{maxWidth:'100%',maxHeight:'297mm',objectFit:'contain'}}/></div>}
            <Page1 data={data} fontSizeClass="text-[16px]"/><Page2 data={data} fontSizeClass="text-[16px]"/><Page3 data={data} fontSizeClass="text-[16px]"/><Page4 data={data} fontSizeClass="text-[16px]"/>
        </div></div>
    </section></div>;
};
