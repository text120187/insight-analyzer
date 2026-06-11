function mdToHtml(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inList = false;

  for (const raw of lines) {
    const line = raw.trimEnd();

    const closeList = () => {
      if (inList) { out.push('</ul>'); inList = false; }
    };

    if (/^#### /.test(line)) {
      closeList();
      out.push(`<h4 style="font-size:13px;font-weight:700;color:#475569;margin:10px 0 3px 0">${inline(line.slice(5))}</h4>`);
    } else if (/^### /.test(line)) {
      closeList();
      out.push(`<h3 style="font-size:14px;font-weight:700;color:#1e293b;margin:14px 0 4px 0">${inline(line.slice(4))}</h3>`);
    } else if (/^## /.test(line)) {
      closeList();
      out.push(`<h2 style="font-size:16px;font-weight:700;color:#3730a3;margin:18px 0 6px 0;padding-bottom:4px;border-bottom:1px solid #cbd5e1">${inline(line.slice(3))}</h2>`);
    } else if (/^# /.test(line)) {
      closeList();
      out.push(`<h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 12px 0">${inline(line.slice(2))}</h1>`);
    } else if (/^[-*+] /.test(line)) {
      if (!inList) { out.push('<ul style="margin:4px 0;padding:0;list-style:none">'); inList = true; }
      out.push(`<li style="margin:3px 0;padding-left:16px;color:#374151;font-size:13px">• ${inline(line.slice(2))}</li>`);
    } else if (/^\d+\. /.test(line)) {
      if (!inList) { out.push('<ul style="margin:4px 0;padding:0;list-style:none">'); inList = true; }
      out.push(`<li style="margin:3px 0;padding-left:16px;color:#374151;font-size:13px">${inline(line)}</li>`);
    } else if (/^---+$|^\*\*\*+$/.test(line.trim())) {
      closeList();
      out.push('<hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0">');
    } else if (line.trim() === '') {
      closeList();
      out.push('<div style="height:6px"></div>');
    } else {
      closeList();
      out.push(`<p style="margin:3px 0;color:#374151;font-size:13px;line-height:1.65">${inline(line)}</p>`);
    }
  }

  if (inList) out.push('</ul>');
  return out.join('\n');
}

function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;font-family:monospace;color:#6d28d9;font-size:12px">$1</code>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>');
}

export async function exportPdf(
  _element: HTMLElement,
  filename: string,
  markdownContent: string,
) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  // Tailwind 없이 hex 색상만 쓰는 독립 컨테이너 생성
  const container = document.createElement('div');
  container.style.cssText = [
    'position:fixed',
    'top:0',
    'left:-9999px',
    'width:740px',
    'background:#ffffff',
    'padding:40px 48px',
    'font-family:Arial,"Noto Sans KR",sans-serif',
    'color:#1a1a1a',
    'font-size:14px',
    'line-height:1.6',
    'z-index:-9999',
    'box-sizing:border-box',
  ].join(';');
  container.innerHTML = mdToHtml(markdownContent);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 740,
      windowWidth: 740,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const contentW = pageW - margin * 2;
    const imgHeight = (canvas.height * contentW) / canvas.width;
    const usableH = pageH - margin * 2;
    const totalPages = Math.ceil(imgHeight / usableH);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, margin - page * usableH, contentW, imgHeight);
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
