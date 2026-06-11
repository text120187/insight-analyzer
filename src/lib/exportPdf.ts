export async function exportPdf(element: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;
  const usableHeight = pageHeight - margin * 2;
  const totalPages = Math.ceil(imgHeight / usableHeight);

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage();
    const yOffset = margin - page * usableHeight;
    pdf.addImage(imgData, 'JPEG', margin, yOffset, contentWidth, imgHeight);
  }

  pdf.save(filename);
}
