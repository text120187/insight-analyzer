import { jsPDF } from 'jspdf';

type LineStyle = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bullet' | 'hr' | 'blank';

interface DocLine {
  text: string;
  style: LineStyle;
  indent: number;
}

function parseMarkdown(md: string): DocLine[] {
  const lines: DocLine[] = [];

  for (const raw of md.split('\n')) {
    const line = raw.trimEnd();

    if (/^#{4}\s/.test(line)) {
      lines.push({ text: line.replace(/^#{4}\s/, ''), style: 'h4', indent: 0 });
    } else if (/^#{3}\s/.test(line)) {
      lines.push({ text: line.replace(/^#{3}\s/, ''), style: 'h3', indent: 0 });
    } else if (/^#{2}\s/.test(line)) {
      lines.push({ text: line.replace(/^#{2}\s/, ''), style: 'h2', indent: 0 });
    } else if (/^#{1}\s/.test(line)) {
      lines.push({ text: line.replace(/^#{1}\s/, ''), style: 'h1', indent: 0 });
    } else if (/^[-*+]\s/.test(line)) {
      lines.push({ text: line.replace(/^[-*+]\s/, ''), style: 'bullet', indent: 4 });
    } else if (/^\d+\.\s/.test(line)) {
      lines.push({ text: line.replace(/^\d+\.\s/, ''), style: 'bullet', indent: 4 });
    } else if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      lines.push({ text: '', style: 'hr', indent: 0 });
    } else if (line.trim() === '') {
      lines.push({ text: '', style: 'blank', indent: 0 });
    } else {
      lines.push({ text: line, style: 'body', indent: 0 });
    }
  }

  return lines;
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1');
}

export async function exportPdf(
  _element: HTMLElement,
  filename: string,
  markdownContent?: string,
) {
  const { jsPDF } = await import('jspdf');

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const marginX = 18;
  const marginY = 20;
  const contentW = pageW - marginX * 2;

  let curY = marginY;

  function needNewPage(height: number) {
    if (curY + height > pageH - marginY) {
      pdf.addPage();
      curY = marginY;
    }
  }

  function addText(
    text: string,
    fontSize: number,
    fontStyle: 'normal' | 'bold',
    color: [number, number, number],
    indentMm: number,
    lineHeightMm: number,
    maxWidth: number,
  ) {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    pdf.setTextColor(...color);

    const wrapped = pdf.splitTextToSize(text, maxWidth - indentMm);
    for (const wl of wrapped) {
      needNewPage(lineHeightMm);
      pdf.text(wl, marginX + indentMm, curY);
      curY += lineHeightMm;
    }
  }

  const content = markdownContent ?? '';
  const docLines = parseMarkdown(content);

  for (const dl of docLines) {
    const clean = stripInlineMarkdown(dl.text);

    switch (dl.style) {
      case 'h1':
        needNewPage(10);
        curY += 3;
        addText(clean, 18, 'bold', [30, 30, 30], 0, 9, contentW);
        curY += 2;
        break;
      case 'h2':
        needNewPage(9);
        curY += 4;
        addText(clean, 14, 'bold', [55, 65, 200], 0, 8, contentW);
        // underline
        pdf.setDrawColor(200, 210, 255);
        pdf.setLineWidth(0.3);
        pdf.line(marginX, curY, pageW - marginX, curY);
        curY += 2;
        break;
      case 'h3':
        needNewPage(8);
        curY += 3;
        addText(clean, 12, 'bold', [50, 50, 80], 0, 7, contentW);
        break;
      case 'h4':
        needNewPage(7);
        curY += 2;
        addText(clean, 11, 'bold', [80, 80, 100], 0, 6.5, contentW);
        break;
      case 'bullet': {
        needNewPage(6);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 120);
        pdf.circle(marginX + 1.5, curY - 1.2, 0.8, 'F');
        pdf.setTextColor(60, 60, 60);
        const wrapped = pdf.splitTextToSize(clean, contentW - 6);
        for (let i = 0; i < wrapped.length; i++) {
          needNewPage(5.5);
          pdf.text(wrapped[i], marginX + 5, curY);
          curY += 5.5;
        }
        break;
      }
      case 'hr':
        needNewPage(8);
        curY += 3;
        pdf.setDrawColor(200, 200, 210);
        pdf.setLineWidth(0.3);
        pdf.line(marginX, curY, pageW - marginX, curY);
        curY += 5;
        break;
      case 'blank':
        curY += 3;
        break;
      default:
        if (clean) addText(clean, 10, 'normal', [60, 60, 60], 0, 6, contentW);
        else curY += 2;
    }
  }

  pdf.save(filename);
}
