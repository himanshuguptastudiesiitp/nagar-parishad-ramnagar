import express from 'express';
import crypto from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { db, initializeDatabase } from './server/db.ts';

initializeDatabase();

const app = express();
const PORT = 3000;
const AUTH_SECRET = process.env.SESSION_SECRET || 'bihar-ramnagar-gram-parishad-2026-hmac-secret';

app.use(express.json({ limit: '5mb' }));

interface TokenPayload {
  id: number;
  username: string;
  fullName: string;
  fullNameHi: string;
  role: 'mukhiya' | 'sarpanch' | 'sachiv' | 'ward_member';
  designation: string;
  designationHi: string;
  wardNo: number | null;
  exp: number;
}

function signToken(payload: TokenPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): TokenPayload | null {
  try {
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TokenPayload;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function getAuthUser(req: express.Request): TokenPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return verifyToken(authHeader.slice(7));
}

function requireRoles(...roles: TokenPayload['role'][]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required. Please log in with official staff credentials.' });
      return;
    }
    if (roles.length > 0 && !roles.includes(user.role)) {
      res.status(403).json({ error: `Access denied for role: ${user.role}` });
      return;
    }
    (req as express.Request & { staffUser: TokenPayload }).staffUser = user;
    next();
  };
}

function logAudit(actorName: string, actorRole: string, action: string, entity: string, details: string): void {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  db.prepare(
    'INSERT INTO audit_logs (timestamp, actor_name, actor_role, action, entity, details) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(timestamp, actorName, actorRole, action, entity, details);
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------- AUTHENTICATION ROUTES ----------
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password_hash = ?').get(username.trim().toLowerCase(), hash) as
    | {
        id: number;
        username: string;
        full_name: string;
        full_name_hi: string;
        role: TokenPayload['role'];
        designation: string;
        designation_hi: string;
        ward_no: number | null;
      }
    | undefined;

  if (!user) {
    res.status(401).json({ error: 'Invalid official username or password.' });
    return;
  }

  const payload: TokenPayload = {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    fullNameHi: user.full_name_hi,
    role: user.role,
    designation: user.designation,
    designationHi: user.designation_hi,
    wardNo: user.ward_no,
    exp: Date.now() + 1000 * 60 * 60 * 12,
  };
  const token = signToken(payload);
  logAudit(user.full_name, user.role, 'STAFF_LOGIN', user.username, 'Signed in to E-Governance Staff Workspace');

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      fullNameHi: user.full_name_hi,
      role: user.role,
      designation: user.designation,
      designationHi: user.designation_hi,
      wardNo: user.ward_no,
    },
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ user });
});

// ---------- PORTAL META & OVERVIEW ----------
app.get('/api/portal-meta', (req, res) => {
  const increment = req.query.visit === '1';
  if (increment) {
    db.prepare('UPDATE portal_meta SET visitor_count = visitor_count + 1 WHERE id = 1').run();
  }
  const meta = db.prepare('SELECT visitor_count, last_updated FROM portal_meta WHERE id = 1').get();
  res.json(meta);
});

app.get('/api/wards', (_req, res) => {
  const wards = db.prepare('SELECT * FROM wards ORDER BY ward_no ASC').all();
  res.json(wards);
});

// ---------- NOTICES, TENDERS & RESOLUTIONS ----------
app.get('/api/notices', (req, res) => {
  const type = req.query.type as string | undefined;
  if (type && ['notice', 'tender', 'resolution'].includes(type)) {
    const rows = db.prepare('SELECT * FROM notices WHERE type = ? ORDER BY published_date DESC, id DESC').all(type);
    res.json(rows);
    return;
  }
  const rows = db.prepare('SELECT * FROM notices ORDER BY published_date DESC, id DESC').all();
  res.json(rows);
});

app.post('/api/notices', requireRoles('mukhiya', 'sachiv'), (req, res) => {
  const staff = (req as express.Request & { staffUser: TokenPayload }).staffUser;
  const { type, title, title_hi, department, closing_date, summary, summary_hi, is_ticker } = req.body;
  if (!type || !title || !summary) {
    res.status(400).json({ error: 'Type, title, and summary are required.' });
    return;
  }
  const prefix = type === 'tender' ? 'RGP/NIT' : type === 'resolution' ? 'RGP/GS-RES' : 'RGP';
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM notices').get() as { cnt: number };
  const refNo = `${prefix}/2026/${115 + countRow.cnt}`;
  const pubDate = todayDate();
  const result = db
    .prepare(
      `INSERT INTO notices (ref_no, type, title, title_hi, department, published_date, closing_date, summary, summary_hi, is_ticker, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      refNo,
      type,
      title,
      title_hi || title,
      department || 'Ramnagar Gram Parishad',
      pubDate,
      closing_date || null,
      summary,
      summary_hi || summary,
      is_ticker ? 1 : 0,
      staff.fullName
    );

  logAudit(staff.fullName, staff.role, 'PUBLISHED_NOTICE', refNo, `${type.toUpperCase()}: ${title}`);
  const created = db.prepare('SELECT * FROM notices WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// ---------- RTPS CERTIFICATES ----------
app.get('/api/certificates', (req, res) => {
  const ref = req.query.ref as string | undefined;
  if (ref) {
    const row = db.prepare('SELECT * FROM certificates WHERE UPPER(ref_id) = UPPER(?) OR UPPER(qr_hash) = UPPER(?)').get(ref.trim(), ref.trim());
    if (!row) {
      res.status(404).json({ error: 'No certificate application found matching that Reference ID or QR Verification Code.' });
      return;
    }
    res.json(row);
    return;
  }
  const rows = db.prepare('SELECT * FROM certificates ORDER BY id DESC').all();
  res.json(rows);
});

app.post('/api/certificates', (req, res) => {
  const { cert_type, applicant_name, guardian_name, ward_no, mobile, aadhaar_last4, purpose, doc_name, doc_preview } = req.body;
  if (!cert_type || !applicant_name || !guardian_name || !ward_no || !mobile) {
    res.status(400).json({ error: 'All mandatory applicant fields are required.' });
    return;
  }
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM certificates').get() as { cnt: number };
  const seq = String(46 + countRow.cnt).padStart(4, '0');
  const refId = `BR-WCH-RMN-2026-${seq}`;
  const qrHash = `QR-VER-RMN-${seq}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const appliedDate = todayDate();

  const result = db
    .prepare(
      `INSERT INTO certificates (ref_id, cert_type, applicant_name, guardian_name, ward_no, mobile, aadhaar_last4, purpose, doc_name, doc_preview, status, remarks, applied_date, issued_date, issued_by, qr_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, ?, NULL, NULL, ?)`
    )
    .run(
      refId,
      cert_type,
      applicant_name.trim(),
      guardian_name.trim(),
      Number(ward_no),
      mobile.trim(),
      (aadhaar_last4 || '0000').slice(-4),
      purpose || 'Official Purpose',
      doc_name || 'Supporting_ID.pdf',
      doc_preview || '',
      'Application received at Citizen RTPS Portal; pending Panchayat Sachiv verification.',
      appliedDate,
      qrHash
    );

  logAudit(applicant_name, 'citizen', 'APPLIED_CERTIFICATE', refId, `${cert_type} applied for Ward ${ward_no}`);
  const created = db.prepare('SELECT * FROM certificates WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

app.patch('/api/certificates/:id/status', requireRoles('mukhiya', 'sachiv', 'ward_member'), (req, res) => {
  const staff = (req as express.Request & { staffUser: TokenPayload }).staffUser;
  const { id } = req.params;
  const { status, remarks } = req.body as { status?: string; remarks?: string };
  const existing = db.prepare('SELECT * FROM certificates WHERE id = ?').get(id) as { ref_id: string; cert_type: string; applicant_name: string } | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Certificate record not found.' });
    return;
  }

  if (status === 'Approved & Signed' && staff.role === 'ward_member') {
    res.status(403).json({ error: 'Final approval and digital signature requires Mukhiya or Panchayat Sachiv authority.' });
    return;
  }

  const issuedDate = status === 'Approved & Signed' ? todayDate() : null;
  const issuedBy = status === 'Approved & Signed' ? `${staff.fullName} (${staff.designation})` : null;

  db.prepare('UPDATE certificates SET status = ?, remarks = ?, issued_date = COALESCE(?, issued_date), issued_by = COALESCE(?, issued_by) WHERE id = ?').run(
    status,
    remarks || `Updated by ${staff.fullName}`,
    issuedDate,
    issuedBy,
    id
  );

  // If approved Birth or Death certificate, auto-sync to Vital Records if not present
  if (status === 'Approved & Signed' && (existing.cert_type === 'Birth Certificate' || existing.cert_type === 'Death Certificate')) {
    const rType = existing.cert_type === 'Birth Certificate' ? 'Birth' : 'Death';
    const existsVital = db.prepare('SELECT id FROM vital_records WHERE cert_ref = ?').get(existing.ref_id);
    if (!existsVital) {
      const fullCert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(id) as { guardian_name: string; ward_no: number };
      const regNo = `${rType[0]}-2026-${Math.floor(200 + Math.random() * 799)}`;
      db.prepare('INSERT INTO vital_records (reg_no, record_type, person_name, related_name, event_date, ward_no, cert_ref) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        regNo,
        rType,
        existing.applicant_name,
        fullCert.guardian_name,
        todayDate(),
        fullCert.ward_no,
        existing.ref_id
      );
    }
  }

  logAudit(staff.fullName, staff.role, 'UPDATED_CERTIFICATE', existing.ref_id, `Status changed to ${status}`);
  const updated = db.prepare('SELECT * FROM certificates WHERE id = ?').get(id);
  res.json(updated);
});

// ---------- WELFARE SCHEMES & BENEFICIARIES ----------
app.get('/api/beneficiaries', (req, res) => {
  const category = req.query.category as string | undefined;
  const ward = req.query.ward as string | undefined;
  const q = req.query.q as string | undefined;

  let sql = 'SELECT * FROM beneficiaries WHERE 1=1';
  const params: unknown[] = [];

  if (category && category !== 'All') {
    sql += ' AND scheme_category = ?';
    params.push(category);
  }
  if (ward && ward !== 'All') {
    sql += ' AND ward_no = ?';
    params.push(Number(ward));
  }
  if (q && q.trim()) {
    sql += ' AND (LOWER(beneficiary_name) LIKE ? OR LOWER(family_id) LIKE ? OR LOWER(id_card_no) LIKE ? OR LOWER(scheme_name) LIKE ?)';
    const term = `%${q.trim().toLowerCase()}%`;
    params.push(term, term, term, term);
  }
  sql += ' ORDER BY ward_no ASC, id DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

app.post('/api/beneficiaries', requireRoles('mukhiya', 'sachiv', 'ward_member'), (req, res) => {
  const staff = (req as express.Request & { staffUser: TokenPayload }).staffUser;
  const { family_id, beneficiary_name, guardian_name, ward_no, scheme_category, scheme_name, id_card_no, masked_aadhaar, sanctioned_amount, benefit_status } = req.body;
  if (!family_id || !beneficiary_name || !ward_no || !scheme_category) {
    res.status(400).json({ error: 'Family ID, beneficiary name, ward, and scheme category are required.' });
    return;
  }
  const result = db
    .prepare(
      `INSERT INTO beneficiaries (family_id, beneficiary_name, guardian_name, ward_no, scheme_category, scheme_name, id_card_no, masked_aadhaar, sanctioned_amount, benefit_status, last_disbursed_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      family_id,
      beneficiary_name,
      guardian_name || '-',
      Number(ward_no),
      scheme_category,
      scheme_name || scheme_category,
      id_card_no || `BR-${Date.now().toString().slice(-6)}`,
      masked_aadhaar || 'XXXX-XXXX-0000',
      Number(sanctioned_amount || 0),
      benefit_status || 'Pending Verification',
      todayDate()
    );

  logAudit(staff.fullName, staff.role, 'ADDED_BENEFICIARY', family_id, `Added ${beneficiary_name} under ${scheme_category}`);
  const created = db.prepare('SELECT * FROM beneficiaries WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

app.patch('/api/beneficiaries/:id/status', requireRoles('mukhiya', 'sachiv', 'ward_member'), (req, res) => {
  const staff = (req as express.Request & { staffUser: TokenPayload }).staffUser;
  const { id } = req.params;
  const { benefit_status } = req.body;
  db.prepare('UPDATE beneficiaries SET benefit_status = ?, last_disbursed_date = ? WHERE id = ?').run(benefit_status, todayDate(), id);
  logAudit(staff.fullName, staff.role, 'VERIFIED_BENEFICIARY', `BEN-${id}`, `Updated status to ${benefit_status}`);
  const updated = db.prepare('SELECT * FROM beneficiaries WHERE id = ?').get(id);
  res.json(updated);
});

// ---------- FUNDS, CASHBOOK & PUBLIC WORKS ----------
app.get('/api/funds/grants', (_req, res) => {
  const rows = db.prepare('SELECT * FROM funds_grants ORDER BY id ASC').all();
  res.json(rows);
});

app.get('/api/funds/cashbook', (_req, res) => {
  const rows = db.prepare('SELECT * FROM cashbook ORDER BY entry_date DESC, id DESC').all();
  res.json(rows);
});

app.post('/api/funds/cashbook', requireRoles('mukhiya', 'sachiv'), (req, res) => {
  const staff = (req as express.Request & { staffUser: TokenPayload }).staffUser;
  const { entry_date, entry_type, grant_source, ward_no, party_name, description, amount, bill_ref } = req.body;
  if (!entry_type || !grant_source || !party_name || !amount) {
    res.status(400).json({ error: 'Entry type, grant source, party, and amount are required.' });
    return;
  }
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM cashbook').get() as { cnt: number };
  const voucherNo = `CB-2026-${String(98 + countRow.cnt).padStart(3, '0')}`;
  const amt = Number(amount);

  const result = db
    .prepare(
      `INSERT INTO cashbook (voucher_no, entry_date, entry_type, grant_source, ward_no, party_name, description, amount, bill_ref, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(voucherNo, entry_date || todayDate(), entry_type, grant_source, ward_no ? Number(ward_no) : null, party_name, description || '-', amt, bill_ref || `VCH-${Date.now().toString().slice(-5)}`, staff.fullName);

  if (entry_type === 'Expenditure' && ward_no) {
    db.prepare('UPDATE wards SET spent_fund = spent_fund + ? WHERE ward_no = ?').run(amt, Number(ward_no));
  }

  logAudit(staff.fullName, staff.role, 'RECORDED_CASHBOOK', voucherNo, `${entry_type} ₹${amt} (${grant_source})`);
  const created = db.prepare('SELECT * FROM cashbook WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

app.get('/api/works', (_req, res) => {
  const rows = db.prepare('SELECT * FROM works ORDER BY id DESC').all();
  res.json(rows);
});

app.post('/api/works', requireRoles('mukhiya', 'sachiv'), (req, res) => {
  const staff = (req as express.Request & { staffUser: TokenPayload }).staffUser;
  const { title, title_hi, ward_no, scheme_source, contractor_name, sanctioned_budget } = req.body;
  if (!title || !ward_no || !sanctioned_budget) {
    res.status(400).json({ error: 'Work title, ward number, and sanctioned budget are required.' });
    return;
  }
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM works').get() as { cnt: number };
  const workCode = `WRK-RMN-${String(7 + countRow.cnt).padStart(2, '0')}`;
  const result = db
    .prepare(
      `INSERT INTO works (work_code, title, title_hi, ward_no, scheme_source, contractor_name, sanctioned_budget, expenditure, progress_pct, status, geo_lat, geo_lng, start_date, completion_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 10, 'Sanctioned', ?, ?, ?, NULL)`
    )
    .run(
      workCode,
      title,
      title_hi || title,
      Number(ward_no),
      scheme_source || '15th Central Finance Commission',
      contractor_name || 'Departmental Execution',
      Number(sanctioned_budget),
      27.16 + Number(ward_no) * 0.001,
      84.32 + Number(ward_no) * 0.001,
      todayDate()
    );

  logAudit(staff.fullName, staff.role, 'SANCTIONED_WORK', workCode, `Sanctioned ${title} in Ward ${ward_no}`);
  const created = db.prepare('SELECT * FROM works WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

app.patch('/api/works/:id', requireRoles('mukhiya', 'sachiv', 'ward_member'), (req, res) => {
  const staff = (req as express.Request & { staffUser: TokenPayload }).staffUser;
  const { id } = req.params;
  const { progress_pct, status, expenditure } = req.body;
  const completionDate = status === 'Completed' ? todayDate() : null;
  db.prepare('UPDATE works SET progress_pct = ?, status = ?, expenditure = COALESCE(?, expenditure), completion_date = COALESCE(?, completion_date) WHERE id = ?').run(
    Number(progress_pct),
    status,
    expenditure !== undefined ? Number(expenditure) : null,
    completionDate,
    id
  );
  logAudit(staff.fullName, staff.role, 'UPDATED_WORK', `WRK-${id}`, `Progress ${progress_pct}%, Status: ${status}`);
  const updated = db.prepare('SELECT * FROM works WHERE id = ?').get(id);
  res.json(updated);
});

// ---------- GRAM SABHA & GRAM KATCHAHRY ----------
app.get('/api/gram-sabha', (_req, res) => {
  const rows = db.prepare('SELECT * FROM gram_sabha ORDER BY meeting_date DESC').all();
  res.json(rows);
});

app.post('/api/gram-sabha', requireRoles('mukhiya', 'sachiv'), (req, res) => {
  const staff = (req as express.Request & { staffUser: TokenPayload }).staffUser;
  const { title, title_hi, meeting_date, meeting_time, venue, agenda } = req.body;
  if (!title || !meeting_date || !agenda) {
    res.status(400).json({ error: 'Title, date, and agenda are required.' });
    return;
  }
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM gram_sabha').get() as { cnt: number };
  const meetingNo = `GS-2026-${String(6 + countRow.cnt).padStart(2, '0')}`;
  const result = db
    .prepare(
      `INSERT INTO gram_sabha (meeting_no, title, title_hi, meeting_date, meeting_time, venue, presiding_officer, quorum_required, attendance_count, status, agenda, minutes_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, 180, 0, 'Scheduled', ?, 'Meeting notice circulated across Wards 1–15.')`
    )
    .run(meetingNo, title, title_hi || title, meeting_date, meeting_time || '11:00 AM', venue || 'Ramnagar Gram Parishad Bhawan', 'Shri Suresh Prasad Singh (Mukhiya)', agenda);

  logAudit(staff.fullName, staff.role, 'SCHEDULED_GRAM_SABHA', meetingNo, title);
  const created = db.prepare('SELECT * FROM gram_sabha WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

app.patch('/api/gram-sabha/:id', requireRoles('mukhiya', 'sachiv'), (req, res) => {
  const staff = (req as express.Request & { staffUser: TokenPayload }).staffUser;
  const { id } = req.params;
  const { attendance_count, status, minutes_summary } = req.body;
  db.prepare('UPDATE gram_sabha SET attendance_count = ?, status = ?, minutes_summary = ? WHERE id = ?').run(
    Number(attendance_count),
    status,
    minutes_summary,
    id
  );
  logAudit(staff.fullName, staff.role, 'UPDATED_GRAM_SABHA', `GS-${id}`, `Recorded ${attendance_count} attendees (${status})`);
  const updated = db.prepare('SELECT * FROM gram_sabha WHERE id = ?').get(id);
  res.json(updated);
});

app.get('/api/gram-katchahry', (_req, res) => {
  const rows = db.prepare('SELECT * FROM gram_katchahry ORDER BY filing_date DESC, id DESC').all();
  res.json(rows);
});

app.post('/api/gram-katchahry', requireRoles('sarpanch', 'sachiv'), (req, res) => {
  const staff = (req as express.Request & { staffUser: TokenPayload }).staffUser;
  const { petitioner, respondent, ward_no, dispute_type, next_hearing_date, judgment_summary } = req.body;
  if (!petitioner || !respondent || !ward_no || !dispute_type) {
    res.status(400).json({ error: 'Petitioner, respondent, ward, and dispute type are required.' });
    return;
  }
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM gram_katchahry').get() as { cnt: number };
  const caseNo = `GK-RMN-2026-${20 + countRow.cnt}`;
  const result = db
    .prepare(
      `INSERT INTO gram_katchahry (case_no, petitioner, respondent, ward_no, dispute_type, filing_date, next_hearing_date, bench_head, status, judgment_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Shri Ramashray Mahto (Sarpanch)', 'Hearing Scheduled', ?)`
    )
    .run(caseNo, petitioner, respondent, Number(ward_no), dispute_type, todayDate(), next_hearing_date || null, judgment_summary || 'Notice issued to both parties for Gram Katchahry bench appearance.');

  logAudit(staff.fullName, staff.role, 'FILED_KATCHAHRY_CASE', caseNo, `${petitioner} vs ${respondent}`);
  const created = db.prepare('SELECT * FROM gram_katchahry WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

app.patch('/api/gram-katchahry/:id', requireRoles('sarpanch', 'sachiv'), (req, res) => {
  const staff = (req as express.Request & { staffUser: TokenPayload }).staffUser;
  const { id } = req.params;
  const { status, next_hearing_date, judgment_summary } = req.body;
  db.prepare('UPDATE gram_katchahry SET status = ?, next_hearing_date = ?, judgment_summary = ? WHERE id = ?').run(
    status,
    next_hearing_date || null,
    judgment_summary,
    id
  );
  logAudit(staff.fullName, staff.role, 'UPDATED_KATCHAHRY_CASE', `GK-${id}`, `Updated status to ${status}`);
  const updated = db.prepare('SELECT * FROM gram_katchahry WHERE id = ?').get(id);
  res.json(updated);
});

// ---------- MANDATORY DIGITAL REGISTERS ----------
app.get('/api/registers/parivar', (_req, res) => {
  res.json(db.prepare('SELECT * FROM parivar_register ORDER BY ward_no ASC, family_id ASC').all());
});

app.post('/api/registers/parivar', requireRoles('mukhiya', 'sachiv'), (req, res) => {
  const staff = (req as express.Request & { staffUser: TokenPayload }).staffUser;
  const { house_no, ward_no, head_name, members_count, category, economic_status, occupation, ration_card_no } = req.body;
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM parivar_register').get() as { cnt: number };
  const familyId = `RMN-F${String(ward_no).padStart(2, '0')}${String(15 + countRow.cnt).padStart(2, '0')}`;
  const result = db
    .prepare(
      `INSERT INTO parivar_register (family_id, house_no, ward_no, head_name, members_count, category, economic_status, occupation, ration_card_no)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(familyId, house_no || `H-${ward_no}/099`, Number(ward_no), head_name, Number(members_count || 4), category || 'OBC', economic_status || 'APL', occupation || 'Agriculture', ration_card_no || 'Pending');

  logAudit(staff.fullName, staff.role, 'ADDED_PARIVAR_RECORD', familyId, `Household ${head_name} in Ward ${ward_no}`);
  res.status(201).json(db.prepare('SELECT * FROM parivar_register WHERE id = ?').get(result.lastInsertRowid));
});

app.get('/api/registers/property-tax', (_req, res) => {
  res.json(db.prepare('SELECT * FROM property_tax ORDER BY ward_no ASC, holding_no ASC').all());
});

app.post('/api/registers/property-tax/:id/pay', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM property_tax WHERE id = ?').get(id) as { holding_no: string; owner_name: string; annual_tax: number; ward_no: number } | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Holding record not found.' });
    return;
  }
  const receiptNo = `TAX-2026-${Math.floor(300 + Math.random() * 699)}`;
  const paidDate = todayDate();
  db.prepare("UPDATE property_tax SET paid_status = 'Paid', last_receipt_no = ?, last_paid_date = ? WHERE id = ?").run(receiptNo, paidDate, id);

  // Also record OSR income in Cashbook
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM cashbook').get() as { cnt: number };
  const voucherNo = `CB-2026-${String(98 + countRow.cnt).padStart(3, '0')}`;
  db.prepare(
    `INSERT INTO cashbook (voucher_no, entry_date, entry_type, grant_source, ward_no, party_name, description, amount, bill_ref, recorded_by)
     VALUES (?, ?, 'Income', 'Own Source Revenue (OSR)', ?, ?, ?, ?, ?, 'Online Citizen Payment Gateway')`
  ).run(voucherNo, paidDate, existing.ward_no, existing.owner_name, `Property Tax Payment (${existing.holding_no})`, existing.annual_tax, receiptNo);

  logAudit(existing.owner_name, 'citizen', 'PAID_PROPERTY_TAX', existing.holding_no, `Paid ₹${existing.annual_tax} (Receipt ${receiptNo})`);
  res.json(db.prepare('SELECT * FROM property_tax WHERE id = ?').get(id));
});

app.get('/api/registers/assets', (_req, res) => {
  res.json(db.prepare('SELECT * FROM asset_inventory ORDER BY asset_code ASC').all());
});

app.get('/api/registers/vitals', (_req, res) => {
  res.json(db.prepare('SELECT * FROM vital_records ORDER BY event_date DESC').all());
});

// ---------- JANTA DARBAR GRIEVANCES ----------
app.get('/api/grievances', (req, res) => {
  const ticket = req.query.ticket as string | undefined;
  if (ticket) {
    const row = db.prepare('SELECT * FROM grievances WHERE UPPER(ticket_id) = UPPER(?)').get(ticket.trim());
    if (!row) {
      res.status(404).json({ error: 'No Janta Darbar grievance found for that Ticket ID.' });
      return;
    }
    res.json(row);
    return;
  }
  res.json(db.prepare('SELECT * FROM grievances ORDER BY id DESC').all());
});

app.post('/api/grievances', (req, res) => {
  const { citizen_name, mobile, ward_no, category, subject, description, photo_name, photo_preview } = req.body;
  if (!citizen_name || !mobile || !ward_no || !subject || !description) {
    res.status(400).json({ error: 'Citizen name, mobile, ward, subject, and description are required.' });
    return;
  }
  const ward = db.prepare('SELECT member_name FROM wards WHERE ward_no = ?').get(Number(ward_no)) as { member_name: string } | undefined;
  const assignedTo = ward ? `${ward.member_name} (Ward Member ${String(ward_no).padStart(2, '0')})` : 'Panchayat Secretary (Sachiv)';
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM grievances').get() as { cnt: number };
  const ticketId = `JD-2026-${110 + countRow.cnt}`;
  const now = todayDate();

  const result = db
    .prepare(
      `INSERT INTO grievances (ticket_id, citizen_name, mobile, ward_no, category, subject, description, photo_name, photo_preview, assigned_to, status, resolution_remarks, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Auto-routed to Ward Member & Panchayat Sachiv desk.', ?, ?)`
    )
    .run(ticketId, citizen_name.trim(), mobile.trim(), Number(ward_no), category || 'General Civic Issue', subject.trim(), description.trim(), photo_name || '', photo_preview || '', assignedTo, now, now);

  logAudit(citizen_name, 'citizen', 'SUBMITTED_GRIEVANCE', ticketId, `Ward ${ward_no}: ${subject}`);
  res.status(201).json(db.prepare('SELECT * FROM grievances WHERE id = ?').get(result.lastInsertRowid));
});

app.patch('/api/grievances/:id', requireRoles('mukhiya', 'sarpanch', 'sachiv', 'ward_member'), (req, res) => {
  const staff = (req as express.Request & { staffUser: TokenPayload }).staffUser;
  const { id } = req.params;
  const { status, resolution_remarks } = req.body;
  const existing = db.prepare('SELECT ticket_id FROM grievances WHERE id = ?').get(id) as { ticket_id: string } | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Grievance not found.' });
    return;
  }
  db.prepare('UPDATE grievances SET status = ?, resolution_remarks = ?, updated_at = ? WHERE id = ?').run(status, resolution_remarks, todayDate(), id);
  logAudit(staff.fullName, staff.role, 'UPDATED_GRIEVANCE', existing.ticket_id, `Status: ${status}`);
  res.json(db.prepare('SELECT * FROM grievances WHERE id = ?').get(id));
});

// ---------- AUDIT LOGS ----------
app.get('/api/audit-logs', requireRoles('mukhiya', 'sarpanch', 'sachiv', 'ward_member'), (_req, res) => {
  res.json(db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 60').all());
});

// ---------- HEALTH CHECK ----------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ---------- SERVER BOOTSTRAP ----------
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const vitePromise = createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Ramnagar Gram Parishad E-Governance Portal running at http://localhost:${PORT}`);
  });
}

export { app };
export default app;

if (!process.env.VERCEL) {
  startServer();
}
