import { Document } from '../types';

export const exportDocument = (doc: Document, format: 'txt' | 'md' | 'html') => {
  let content = '';
  let mimeType = 'text/plain';
  let extension = 'txt';

  switch (format) {
    case 'txt':
      // Strip HTML tags for plain text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = doc.content;
      content = tempDiv.textContent || tempDiv.innerText || '';
      mimeType = 'text/plain';
      extension = 'txt';
      break;
    case 'md':
      // Basic HTML to Markdown conversion (Simple fallback)
      content = convertToMarkdown(doc.content);
      mimeType = 'text/markdown';
      extension = 'md';
      break;
    case 'html':
      // Basic HTML wrapper for Word compatibility
      content = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${doc.title}</title>
          <style>
            body { font-family: 'Merriweather', serif; line-height: 1.6; color: #2D2D2D; }
            h1, h2, h3 { font-family: 'Inter', sans-serif; }
          </style>
        </head>
        <body>
          <h1>${doc.title}</h1>
          ${doc.content}
        </body>
        </html>
      `;
      mimeType = 'application/vnd.ms-word'; // Trick to open in Word
      extension = 'doc'; // Use .doc for better compatibility with simple HTML
      break;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.title || 'Untitled'}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Very basic HTML to Markdown converter
const convertToMarkdown = (html: string): string => {
  let md = html;
  md = md.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<[^>]+>/g, ''); // Strip remaining tags
  // Decode entities
  const txt = document.createElement('textarea');
  txt.innerHTML = md;
  return txt.value;
};

export const readImportFile = (file: File): Promise<{ content: string, title: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const title = file.name.replace(/\.[^/.]+$/, "");
      
      // If it's HTML/Word export, we might want to keep HTML
      // For TXT/MD, wrap in paragraphs
      let content = result;
      if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        content = result.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('');
      }
      
      resolve({ content, title });
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
