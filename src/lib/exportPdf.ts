export async function exportPdf(element: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;
  const imgHeight = (canvas.height * contentW) / canvas.width;
  const usableH = pageH - margin * 2;
  const totalPages = Math.ceil(imgHeight / usableH);

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage();
    const yOffset = margin - page * usableH;
    pdf.addImage(imgData, 'JPEG', margin, yOffset, contentW, imgHeight);
  }

  pdf.save(filename);
}
