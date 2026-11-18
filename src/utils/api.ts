import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import type { CertificateApplication, GramSabhaMeeting, Grievance, PropertyTaxRecord } from '../types';

const TOKEN_KEY = 'gp_ramnagar_staff_token';
const USER_KEY = 'gp_ramnagar_staff_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredSession(token: string, user: unknown): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser<T>(): T | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]): void {
  const escape = (val: string | number | null | undefined) => {
    const s = val === null || val === undefined ? '' : String(val);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportTablePDF(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
  filename: string
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFillColor(11, 44, 89);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 56, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('GOVERNMENT OF BIHAR · RAMNAGAR GRAM PARISHAD (WEST CHAMPARAN)', 32, 24);
  doc.setFontSize(10);
  doc.text(`${title}  |  ${subtitle}`, 32, 42);

  autoTable(doc, {
    startY: 72,
    head: [headers],
    body: rows.map((r) => r.map((cell) => (cell === null || cell === undefined ? '-' : String(cell)))),
    styles: { fontSize: 8.5, cellPadding: 5 },
    headStyles: { fillColor: [11, 44, 89], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text(`Generated via Ramnagar Gram Parishad Portal on ${new Date().toLocaleDateString('en-IN')}`, 32, doc.internal.pageSize.getHeight() - 20);
  doc.save(filename);
}

export async function generateCertificatePDF(cert: CertificateApplication): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  doc.setDrawColor(11, 44, 89);
  doc.setLineWidth(2.5);
  doc.rect(24, 24, w - 48, h - 48);
  doc.setDrawColor(255, 103, 31);
  doc.setLineWidth(1);
  doc.rect(30, 30, w - 60, h - 60);

  doc.setFillColor(11, 44, 89);
  doc.rect(30, 30, w - 60, 82, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text('GOVERNMENT OF BIHAR', w / 2, 56, { align: 'center' });
  doc.setFontSize(12);
  doc.text('PANCHAYATI RAJ DEPARTMENT · OFFICE OF RAMNAGAR GRAM PARISHAD', w / 2, 76, { align: 'center' });
  doc.setFontSize(9.5);
  doc.text('Block: Ramnagar · District: West Champaran · Bihar - 845106 | RTPS Citizen Services', w / 2, 95, { align: 'center' });

  doc.setTextColor(11, 44, 89);
  doc.setFontSize(16);
  doc.text(cert.cert_type.toUpperCase(), w / 2, 148, { align: 'center' });
  doc.setDrawColor(255, 103, 31);
  doc.setLineWidth(1.5);
  doc.line(w / 2 - 120, 156, w / 2 + 120, 156);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.text(`Certificate Reference No: ${cert.ref_id}`, 54, 186);
  doc.text(`Issue Date: ${cert.issued_date || new Date().toISOString().slice(0, 10)}`, w - 54, 186, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11.5);
  const bodyLines = doc.splitTextToSize(
    `This is to certify that ${cert.applicant_name}, Son/Daughter/Spouse of ${cert.guardian_name}, is a bonafide resident of Ward No. ${String(cert.ward_no).padStart(2, '0')}, Ramnagar Gram Parishad, Block Ramnagar, District West Champaran, State Bihar (PIN 845106). Based on verification of Parishad records and Parivar Register, this ${cert.cert_type} is hereby issued for: "${cert.purpose}".`,
    w - 108
  );
  doc.text(bodyLines, 54, 224, { lineHeightFactor: 1.6 });

  autoTable(doc, {
    startY: 315,
    margin: { left: 54, right: 54 },
    head: [['Particulars', 'Verified Record Detail']],
    body: [
      ['Applicant Full Name', cert.applicant_name],
      ['Father / Husband / Guardian', cert.guardian_name],
      ['Gram Parishad & Ward', `Ramnagar, Ward No. ${String(cert.ward_no).padStart(2, '0')} (West Champaran)`],
      ['Registered Mobile / Aadhaar (Last 4)', `${cert.mobile} / XXXX-XXXX-${cert.aadhaar_last4}`],
      ['Verification Status', cert.status],
      ['Official Remarks', cert.remarks || 'Verified against Gram Parishad records.'],
      ['QR Verification Hash', cert.qr_hash],
    ],
    styles: { fontSize: 9.5, cellPadding: 7 },
    headStyles: { fillColor: [11, 44, 89], textColor: 255 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 190 } },
  });

  const qrPayload = JSON.stringify({
    ref: cert.ref_id,
    hash: cert.qr_hash,
    name: cert.applicant_name,
    type: cert.cert_type,
    ward: cert.ward_no,
    parishad: 'Ramnagar Gram Parishad, West Champaran, Bihar',
  });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 120, margin: 1 });

  const footerY = 610;
  doc.addImage(qrDataUrl, 'PNG', 54, footerY, 100, 100);
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Scan QR or verify on Portal using:', 54, footerY + 114);
  doc.text(cert.qr_hash, 54, footerY + 126);

  doc.setDrawColor(4, 106, 56);
  doc.setFillColor(240, 253, 244);
  doc.rect(w - 265, footerY + 10, 210, 86, 'FD');
  doc.setTextColor(4, 106, 56);
  doc.setFontSize(9.5);
  doc.text('DIGITALLY VERIFIED & SIGNED', w - 160, footerY + 30, { align: 'center' });
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  const signer = cert.issued_by || 'Parishad Secretary / Mukhiya, Ramnagar';
  const signerLines = doc.splitTextToSize(signer, 190);
  doc.text(signerLines, w - 160, footerY + 50, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${cert.issued_date || new Date().toISOString().slice(0, 10)}`, w - 160, footerY + 84, { align: 'center' });

  doc.save(`${cert.ref_id}_Ramnagar_RTPS_Certificate.pdf`);
}

export function generateGramSabhaMomPDF(sabha: GramSabhaMeeting): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(11, 44, 89);
  doc.rect(0, 0, w, 72, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('RAMNAGAR GRAM PARISHAD · GRAM SABHA PROCEEDINGS (MoM)', w / 2, 32, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Block: Ramnagar · District: West Champaran · Bihar | Meeting No: ${sabha.meeting_no}`, w / 2, 52, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.text(sabha.title, 40, 108);
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Date & Time: ${sabha.meeting_date} at ${sabha.meeting_time}  |  Venue: ${sabha.venue}`, 40, 130);
  doc.text(`Presiding Officer: ${sabha.presiding_officer}  |  Attendance: ${sabha.attendance_count} / Quorum Required: ${sabha.quorum_required}`, 40, 148);

  doc.setTextColor(11, 44, 89);
  doc.setFontSize(11);
  doc.text('Meeting Agenda:', 40, 182);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  const agendaLines = doc.splitTextToSize(sabha.agenda, w - 80);
  doc.text(agendaLines, 40, 200, { lineHeightFactor: 1.5 });

  const afterAgendaY = 210 + agendaLines.length * 16;
  doc.setTextColor(11, 44, 89);
  doc.setFontSize(11);
  doc.text('Recorded Minutes & Resolutions (कार्यवाही विवरण):', 40, afterAgendaY);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  const momLines = doc.splitTextToSize(sabha.minutes_summary, w - 80);
  doc.text(momLines, 40, afterAgendaY + 18, { lineHeightFactor: 1.5 });

  const sigY = afterAgendaY + 90 + momLines.length * 14;
  doc.setDrawColor(148, 163, 184);
  doc.line(40, sigY, 220, sigY);
  doc.line(w - 220, sigY, w - 40, sigY);
  doc.setFontSize(9);
  doc.text('Parishad Secretary (Sachiv)', 40, sigY + 15);
  doc.text('Mukhiya, Ramnagar Gram Parishad', w - 220, sigY + 15);

  doc.save(`${sabha.meeting_no}_Ramnagar_Minutes_of_Meeting.pdf`);
}

export function generateTaxReceiptPDF(record: PropertyTaxRecord): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(11, 44, 89);
  doc.rect(30, 30, w - 60, 74, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('RAMNAGAR GRAM PARISHAD · PROPERTY TAX RECEIPT', w / 2, 58, { align: 'center' });
  doc.setFontSize(9.5);
  doc.text('Block: Ramnagar · District: West Champaran · Bihar - 845106 (OSR Collection)', w / 2, 80, { align: 'center' });

  autoTable(doc, {
    startY: 130,
    margin: { left: 44, right: 44 },
    head: [['Tax Receipt Field', 'Details']],
    body: [
      ['Receipt Number', record.last_receipt_no || 'PENDING'],
      ['Holding Number', record.holding_no],
      ['Property Owner', record.owner_name],
      ['Ward Number', `Ward No. ${String(record.ward_no).padStart(2, '0')}`],
      ['Property Type & Area', `${record.property_type} (${record.area_sqft} sq.ft)`],
      ['Annual Tax Paid', formatINR(record.annual_tax)],
      ['Payment Date', record.last_paid_date || new Date().toISOString().slice(0, 10)],
      ['Payment Status', 'PAID (Credited to Ramnagar Gram Parishad OSR Account)'],
    ],
    styles: { fontSize: 10, cellPadding: 8 },
    headStyles: { fillColor: [4, 106, 56], textColor: 255 },
  });

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('This is an electronically generated receipt issued by Ramnagar Gram Parishad E-Governance Portal.', 44, 430);
  doc.save(`${record.last_receipt_no || record.holding_no}_Tax_Receipt.pdf`);
}

export function generateGrievanceReceiptPDF(grievance: Grievance): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(11, 44, 89);
  doc.rect(30, 30, w - 60, 72, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('RAMNAGAR GRAM PARISHAD · JANTA DARBAR ACKNOWLEDGMENT', w / 2, 58, { align: 'center' });
  doc.setFontSize(9.5);
  doc.text('Block: Ramnagar · District: West Champaran · Bihar - 845106', w / 2, 80, { align: 'center' });

  autoTable(doc, {
    startY: 126,
    margin: { left: 44, right: 44 },
    head: [['Grievance Ticket Field', 'Recorded Particulars']],
    body: [
      ['Ticket ID', grievance.ticket_id],
      ['Citizen Name & Mobile', `${grievance.citizen_name} (${grievance.mobile})`],
      ['Ward Number', `Ward No. ${String(grievance.ward_no).padStart(2, '0')}`],
      ['Category', grievance.category],
      ['Subject', grievance.subject],
      ['Description', grievance.description],
      ['Routed To Officer', grievance.assigned_to],
      ['Current Status', grievance.status],
      ['Filed Date', grievance.created_at],
    ],
    styles: { fontSize: 9.5, cellPadding: 7 },
    headStyles: { fillColor: [11, 44, 89], textColor: 255 },
  });

  doc.save(`${grievance.ticket_id}_Janta_Darbar_Receipt.pdf`);
}

export function generateBlankFormPDF(formTitle: string, formCode: string, instructions: string, fields: string[]): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(11, 44, 89);
  doc.rect(30, 30, w - 60, 68, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text('RAMNAGAR GRAM PARISHAD · OFFICE OF PANCHAYAT RAJ, BIHAR', w / 2, 54, { align: 'center' });
  doc.setFontSize(9.5);
  doc.text(`Form Code: ${formCode} · Block Ramnagar, District West Champaran (PIN 845106)`, w / 2, 74, { align: 'center' });

  doc.setTextColor(11, 44, 89);
  doc.setFontSize(14);
  doc.text(formTitle, w / 2, 128, { align: 'center' });

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9.5);
  const instLines = doc.splitTextToSize(instructions, w - 88);
  doc.text(instLines, 44, 152, { lineHeightFactor: 1.4 });

  autoTable(doc, {
    startY: 168 + instLines.length * 14,
    margin: { left: 44, right: 44 },
    head: [['S.No.', 'Applicant Particular / Field', 'To Be Filled By Applicant']],
    body: fields.map((f, idx) => [String(idx + 1), f, '']),
    styles: { fontSize: 10, cellPadding: 11, minCellHeight: 28 },
    headStyles: { fillColor: [11, 44, 89], textColor: 255 },
    columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 210, fontStyle: 'bold' } },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 620;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.text('Date: ____________________', 44, Math.min(760, finalY + 54));
  doc.text('Signature / Thumb Impression of Applicant', w - 235, Math.min(760, finalY + 54));

  doc.save(`${formCode}_Ramnagar_Application_Form.pdf`);
}
