import type { ResumeData } from '../types';

export async function exportResumePDF(
  previewElementId: string,
  resume: ResumeData
): Promise<void> {
  const { default: html2canvas } = await import('html2canvas');
  const { default: jsPDF } = await import('jspdf');

  const element = document.getElementById(previewElementId);
  if (!element) throw new Error('Preview element not found');

  // Capture at 2× scale for high-DPI quality
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgData = canvas.toDataURL('image/png');

  // A4 dimensions in mm
  const pageW = 210;
  const pageH = 297;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const imgWidth = pageW;
  const imgHeight = (canvas.height * pageW) / canvas.width;

  // If content fits in one page
  if (imgHeight <= pageH) {
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  } else {
    // Multi-page support
    let yOffset = 0;
    while (yOffset < imgHeight) {
      if (yOffset > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -yOffset, imgWidth, imgHeight);
      yOffset += pageH;
    }
  }

  const filename = resume.header.name
    ? `${resume.header.name.replace(/\s+/g, '_')}_Resume.pdf`
    : 'Resume.pdf';

  pdf.save(filename);
}
