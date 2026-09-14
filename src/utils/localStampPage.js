// File bytes and rendered output stay in browser memory. No upload or persistent cache.
export async function localStampPage(file) {
    if (file.size > 20 * 1024 * 1024) throw new Error('Choose a file under 20 MB.');
    if (['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return { blob: file, pages: 1 };
    if (file.type !== 'application/pdf') throw new Error('Choose PNG, JPG, WebP or PDF.');
    const pdfjs = await import('pdfjs-dist');
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false });
    try {
        const pdf = await task.promise;
        const page = await pdf.getPage(1);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(2, 2400 / Math.max(base.width,base.height)) });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/png'));
        if (!blob) throw new Error('Could not prepare the stamp page.');
        return { blob, pages: pdf.numPages };
    } finally { await task.destroy(); }
}
