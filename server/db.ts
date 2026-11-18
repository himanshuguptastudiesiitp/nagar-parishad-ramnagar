import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = process.env.VERCEL
  ? path.join('/tmp', 'ramnagar-parishad')
  : path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'panchayat.db');
if (process.env.VERCEL && !fs.existsSync(dbPath)) {
  const bundledDbPath = path.resolve(process.cwd(), 'data', 'panchayat.db');
  if (fs.existsSync(bundledDbPath)) {
    fs.copyFileSync(bundledDbPath, dbPath);
  }
}
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      full_name_hi TEXT NOT NULL,
      role TEXT NOT NULL,
      designation TEXT NOT NULL,
      designation_hi TEXT NOT NULL,
      ward_no INTEGER
    );

    CREATE TABLE IF NOT EXISTS wards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ward_no INTEGER UNIQUE NOT NULL,
      ward_name TEXT NOT NULL,
      ward_name_hi TEXT NOT NULL,
      member_name TEXT NOT NULL,
      member_phone TEXT NOT NULL,
      households INTEGER NOT NULL,
      population INTEGER NOT NULL,
      allocated_fund INTEGER NOT NULL,
      spent_fund INTEGER NOT NULL,
      ongoing_project TEXT NOT NULL,
      ongoing_project_hi TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ref_no TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      title_hi TEXT NOT NULL,
      department TEXT NOT NULL,
      published_date TEXT NOT NULL,
      closing_date TEXT,
      summary TEXT NOT NULL,
      summary_hi TEXT NOT NULL,
      is_ticker INTEGER DEFAULT 0,
      created_by TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ref_id TEXT UNIQUE NOT NULL,
      cert_type TEXT NOT NULL,
      applicant_name TEXT NOT NULL,
      guardian_name TEXT NOT NULL,
      ward_no INTEGER NOT NULL,
      mobile TEXT NOT NULL,
      aadhaar_last4 TEXT NOT NULL,
      purpose TEXT NOT NULL,
      doc_name TEXT DEFAULT '',
      doc_preview TEXT DEFAULT '',
      status TEXT NOT NULL,
      remarks TEXT DEFAULT '',
      applied_date TEXT NOT NULL,
      issued_date TEXT,
      issued_by TEXT,
      qr_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS beneficiaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id TEXT NOT NULL,
      beneficiary_name TEXT NOT NULL,
      guardian_name TEXT NOT NULL,
      ward_no INTEGER NOT NULL,
      scheme_category TEXT NOT NULL,
      scheme_name TEXT NOT NULL,
      id_card_no TEXT NOT NULL,
      masked_aadhaar TEXT NOT NULL,
      sanctioned_amount INTEGER NOT NULL,
      benefit_status TEXT NOT NULL,
      last_disbursed_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS funds_grants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheme_name TEXT NOT NULL,
      scheme_name_hi TEXT NOT NULL,
      financial_year TEXT NOT NULL,
      sanctioned_amount INTEGER NOT NULL,
      released_amount INTEGER NOT NULL,
      utilized_amount INTEGER NOT NULL,
      nodal_agency TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cashbook (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_no TEXT UNIQUE NOT NULL,
      entry_date TEXT NOT NULL,
      entry_type TEXT NOT NULL,
      grant_source TEXT NOT NULL,
      ward_no INTEGER,
      party_name TEXT NOT NULL,
      description TEXT NOT NULL,
      amount INTEGER NOT NULL,
      bill_ref TEXT NOT NULL,
      recorded_by TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS works (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      title_hi TEXT NOT NULL,
      ward_no INTEGER NOT NULL,
      scheme_source TEXT NOT NULL,
      contractor_name TEXT NOT NULL,
      sanctioned_budget INTEGER NOT NULL,
      expenditure INTEGER NOT NULL,
      progress_pct INTEGER NOT NULL,
      status TEXT NOT NULL,
      geo_lat REAL NOT NULL,
      geo_lng REAL NOT NULL,
      start_date TEXT NOT NULL,
      completion_date TEXT
    );

    CREATE TABLE IF NOT EXISTS gram_sabha (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_no TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      title_hi TEXT NOT NULL,
      meeting_date TEXT NOT NULL,
      meeting_time TEXT NOT NULL,
      venue TEXT NOT NULL,
      presiding_officer TEXT NOT NULL,
      quorum_required INTEGER NOT NULL,
      attendance_count INTEGER NOT NULL,
      status TEXT NOT NULL,
      agenda TEXT NOT NULL,
      minutes_summary TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gram_katchahry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_no TEXT UNIQUE NOT NULL,
      petitioner TEXT NOT NULL,
      respondent TEXT NOT NULL,
      ward_no INTEGER NOT NULL,
      dispute_type TEXT NOT NULL,
      filing_date TEXT NOT NULL,
      next_hearing_date TEXT,
      bench_head TEXT NOT NULL,
      status TEXT NOT NULL,
      judgment_summary TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS parivar_register (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id TEXT UNIQUE NOT NULL,
      house_no TEXT NOT NULL,
      ward_no INTEGER NOT NULL,
      head_name TEXT NOT NULL,
      members_count INTEGER NOT NULL,
      category TEXT NOT NULL,
      economic_status TEXT NOT NULL,
      occupation TEXT NOT NULL,
      ration_card_no TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS property_tax (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      holding_no TEXT UNIQUE NOT NULL,
      ward_no INTEGER NOT NULL,
      owner_name TEXT NOT NULL,
      property_type TEXT NOT NULL,
      area_sqft INTEGER NOT NULL,
      annual_tax INTEGER NOT NULL,
      paid_status TEXT NOT NULL,
      last_receipt_no TEXT,
      last_paid_date TEXT
    );

    CREATE TABLE IF NOT EXISTS asset_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_code TEXT UNIQUE NOT NULL,
      item_name TEXT NOT NULL,
      category TEXT NOT NULL,
      ward_no INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      condition TEXT NOT NULL,
      purchase_value INTEGER NOT NULL,
      folio_no TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vital_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reg_no TEXT UNIQUE NOT NULL,
      record_type TEXT NOT NULL,
      person_name TEXT NOT NULL,
      related_name TEXT NOT NULL,
      event_date TEXT NOT NULL,
      ward_no INTEGER NOT NULL,
      cert_ref TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS grievances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT UNIQUE NOT NULL,
      citizen_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      ward_no INTEGER NOT NULL,
      category TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      photo_name TEXT DEFAULT '',
      photo_preview TEXT DEFAULT '',
      assigned_to TEXT NOT NULL,
      status TEXT NOT NULL,
      resolution_remarks TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      details TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS portal_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      visitor_count INTEGER NOT NULL,
      last_updated TEXT NOT NULL
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  const legacyRampur = db.prepare("SELECT COUNT(*) as count FROM wards WHERE ward_name LIKE '%Rampur%'").get() as { count: number };

  if (userCount.count === 0 || legacyRampur.count > 0) {
    resetAndSeedDatabase();
  }
}

function resetAndSeedDatabase(): void {
  const tables = [
    'users',
    'wards',
    'notices',
    'certificates',
    'beneficiaries',
    'funds_grants',
    'cashbook',
    'works',
    'gram_sabha',
    'gram_katchahry',
    'parivar_register',
    'property_tax',
    'asset_inventory',
    'vital_records',
    'grievances',
    'audit_logs',
    'portal_meta',
  ];
  for (const tbl of tables) {
    db.prepare(`DELETE FROM ${tbl}`).run();
  }

  // 1. Seed Staff Users (RBAC)
  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, full_name_hi, role, designation, designation_hi, ward_no)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run('mukhiya', hashPassword('Bihar@2026'), 'Shri Suresh Prasad Singh', 'श्री सुरेश प्रसाद सिंह', 'mukhiya', 'Mukhiya (Ramnagar Gram Parishad)', 'मुखिया (रामनगर ग्राम परिषद प्रमुख)', null);
  insertUser.run('sarpanch', hashPassword('Bihar@2026'), 'Shri Ramashray Mahto', 'श्री रामाश्रय महतो', 'sarpanch', 'Sarpanch (Gram Katchahry Head)', 'सरपंच (ग्राम कचहरी प्रमुख)', null);
  insertUser.run('sachiv', hashPassword('Bihar@2026'), 'Smt. Sangeeta Kumari', 'श्रीमती संगीता कुमारी', 'sachiv', 'Parishad Secretary (Sachiv)', 'परिषद सचिव', null);
  insertUser.run('ward4', hashPassword('Bihar@2026'), 'Smt. Meena Devi', 'श्रीमती मीना देवी', 'ward_member', 'Ward Member - Ward 04', 'वार्ड सदस्य - वार्ड 04', 4);

  // 2. Seed Wards 1 to 15 (Ramnagar Gram Parishad, Block Ramnagar, District West Champaran, Bihar)
  const wardsData = [
    [1, 'Ramnagar Purab Tola', 'रामनगर पूरब टोला', 'Shri Arvind Kumar', '94310-21201', 148, 768, 980000, 845000, 'PCC Road Construction from Shiv Mandir to Triveni Canal', 'शिव मंदिर से त्रिवेणी नहर तक पीसीसी सड़क निर्माण'],
    [2, 'Ramnagar Paschim Tola', 'रामनगर पश्चिम टोला', 'Smt. Sunita Devi', '94310-21202', 139, 722, 910000, 770000, 'Nal-Jal Pipeline Extension & Submersible Overhaul', 'नल-जल पाइपलाइन विस्तार एवं मोटर मरम्मत'],
    [3, 'Bishunpur Chowk', 'विशुनपुर चौक', 'Shri Rajeshwar Paswan', '94310-21203', 162, 844, 1150000, 960000, 'Covered RCC Drainage & Interlocking Paver Tiles', 'ढक्कनयुक्त आरसीसी नाली एवं पेवर ब्लॉक'],
    [4, 'Sabha Nagar Harijan Tola', 'सभा नगर हरिजन टोला', 'Smt. Meena Devi', '94310-21204', 168, 875, 1280000, 1110000, '24 Solar LED Street Lights & Anganwadi Kendra Repair', '24 सोलर स्ट्रीट लाइट एवं आंगनवाड़ी मरम्मत'],
    [5, 'Ramnagar Gudri Bazar', 'रामनगर गुदरी बाजार', 'Shri Mukesh Sahni', '94310-21205', 152, 795, 1020000, 840000, 'Haat Bazaar Tin Shed & Community Sanitary Complex', 'हाट बाजार शेड एवं सामुदायिक शौचालय निर्माण'],
    [6, 'Mahavir Mandir Ward', 'महावीर मंदिर वार्ड', 'Smt. Kavita Kumari', '94310-21206', 134, 696, 860000, 710000, 'Ramnagar Parishad Bhawan Boundary & 5kW Solar Grid', 'रामनगर परिषद भवन चारदीवारी एवं सोलर ग्रिड'],
    [7, 'Dhanauti Tola', 'धनौटी टोला', 'Shri Manoj Kumar Verma', '94310-21207', 146, 760, 940000, 785000, 'MGNREGA Box Culvert & Agricultural Field Bunding', 'मनरेगा पुलिया एवं खेत मेड़बंदी कार्य'],
    [8, 'Koiri Patti', 'कोइरी पट्टी', 'Smt. Rekha Sinha', '94310-21208', 155, 812, 990000, 865000, 'Soak Pit & Solid-Liquid Waste Processing Unit (WPU)', 'सोख्ता गड्ढा एवं कचरा प्रसंस्करण इकाई'],
    [9, 'Brahmasthan Tola', 'ब्रह्मस्थान टोला', 'Shri Dinesh Yadav', '94310-21209', 165, 855, 1100000, 915000, 'Gali-Nali Renovation Lane 2 & Lane 3', 'गली-नाली जीर्णोद्धार लेन 2 व 3'],
    [10, 'Pahari Tola', 'पहाड़ी टोला', 'Smt. Asha Devi', '94310-21210', 130, 678, 810000, 645000, 'Deep Bore Handpump & Community Chabutara Construction', 'चापाकल बोरिंग एवं चबूतरा निर्माण'],
    [11, 'Kashi Nagar', 'काशी नगर', 'Shri Santosh Thakur', '94310-21211', 141, 734, 880000, 735000, 'Government Primary School Boundary & RO Water Point', 'प्राथमिक विद्यालय चारदीवारी एवं पेयजल'],
    [12, 'Gobardhana Badh', 'गोबरधना बाढ़', 'Smt. Babita Devi', '94310-21212', 149, 780, 960000, 805000, 'Monsoon Flood Embankment & Drainage Desilting', 'बाढ़ सुरक्षा तटबंध एवं नाला सफाई'],
    [13, 'Imamganj Patti', 'इमामगंज पट्टी', 'Shri Md. Salim Ansari', '94310-21213', 157, 818, 1050000, 890000, 'Solar Street Light Phase-II (18 Poles)', 'सोलर स्ट्रीट लाइट फेज-2 (18 पोल)'],
    [14, 'Surya Mandir Ghat Road', 'सूर्य मंदिर घाट रोड', 'Smt. Usha Sharma', '94310-21214', 135, 704, 870000, 725000, 'Chhath Ghat Concrete Stairs & High-Mast Illumination', 'छठ घाट सीढ़ी निर्माण एवं प्रकाश व्यवस्था'],
    [15, 'Ramnagar Dakshin Colony', 'रामनगर दक्षिण कॉलोनी', 'Shri Vikash Kumar', '94310-21215', 143, 745, 930000, 770000, 'PCC Approach Road to Health & Wellness Sub-Centre', 'स्वास्थ्य उपकेंद्र तक पीसीसी पहुंच पथ']
  ];
  const insertWard = db.prepare(`
    INSERT INTO wards (ward_no, ward_name, ward_name_hi, member_name, member_phone, households, population, allocated_fund, spent_fund, ongoing_project, ongoing_project_hi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const w of wardsData) {
    insertWard.run(...w);
  }

  // 3. Seed Notices, Tenders & Gram Sabha Resolutions
  const insertNotice = db.prepare(`
    INSERT INTO notices (ref_no, type, title, title_hi, department, published_date, closing_date, summary, summary_hi, is_ticker, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertNotice.run(
    'RGP/2026/114', 'notice',
    'Special Gram Sabha & PMAY-G Beneficiary Verification Camp on 22 Nov 2026 at Ramnagar Parishad Bhawan',
    'दिनांक 22 नवंबर 2026 को रामनगर ग्राम परिषद भवन में विशेष ग्राम सभा एवं पीएम आवास सत्यापन शिविर',
    'Ramnagar Parishad Secretariat', '2026-11-10', '2026-11-22',
    'All residents of Wards 1–15 under Ramnagar Gram Parishad are informed that a Special Gram Sabha will convene at Parishad Bhawan at 11:00 AM for PMAY-G AwaasPlus verification and Social Security Pension KYC.',
    'रामनगर ग्राम परिषद के वार्ड 1 से 15 के सभी नागरिकों को सूचित किया जाता है कि परिषद भवन में सुबह 11:00 बजे पीएम आवास सत्यापन एवं पेंशन केवाईसी हेतु विशेष ग्राम सभा आयोजित की जाएगी।',
    1, 'Smt. Sangeeta Kumari'
  );
  insertNotice.run(
    'RGP/2026/112', 'notice',
    'Har Ghar Nal Ka Jal — Water Quality Testing & Leakage Repair Camp (Wards 1–8)',
    'हर घर नल का जल — पेयजल गुणवत्ता जांच एवं लीकेज मरम्मत शिविर (वार्ड 1–8)',
    'PHED / Saat Nischay Cell', '2026-11-08', '2026-11-25',
    'Ward Implementation and Management Committees (WIMC) of Ramnagar Gram Parishad will conduct TDS and residual chlorine testing across Wards 1 to 8 along with immediate pipe repairs.',
    'रामनगर ग्राम परिषद की वार्ड क्रियान्वयन समितियों द्वारा वार्ड 1 से 8 में पेयजल गुणवत्ता जांच तथा पाइपलाइन लीकेज मरम्मत कार्य किया जाएगा।',
    1, 'Smt. Sangeeta Kumari'
  );
  insertNotice.run(
    'RGP/NIT/2026-09', 'tender',
    'Short Term Quotation: Supply & Installation of 60 Solar LED Street Lights (Phase III) across Ramnagar',
    'अल्पकालीन निविदा सूचना: रामनगर ग्राम परिषद में 60 सोलर एलईडी स्ट्रीट लाइट आपूर्ति एवं अधिष्ठापन (फेज-3)',
    '15th Finance Commission', '2026-11-05', '2026-11-28',
    'Sealed quotations are invited from BREDA-empaneled agencies for supply and 5-year maintenance of 60 12W Solar LED street lights across Wards 5, 9, 12, and 15. Estimated cost ₹18,40,000.',
    'ब्रेडा सूचीबद्ध एजेंसियों से वार्ड 5, 9, 12 व 15 में 60 सोलर स्ट्रीट लाइट लगाने हेतु मुहरबंद निविदा आमंत्रित है। प्राक्कलित राशि ₹18,40,000।',
    1, 'Shri Suresh Prasad Singh'
  );
  insertNotice.run(
    'RGP/NIT/2026-08', 'tender',
    'Notice Inviting Tender: PCC Road & Covered Drain Construction in Ward 3 & Ward 11',
    'निविदा आमंत्रण सूचना: वार्ड 3 एवं वार्ड 11 में पीसीसी सड़क व ढक्कनयुक्त नाली निर्माण',
    'State Finance Commission (SFC)', '2026-10-29', '2026-11-24',
    'Registered contractors under Bihar Rural Works / Panchayati Raj may submit technical and financial bids for 480m PCC road and RCC drain construction in Ramnagar Gram Parishad. EMD ₹28,500.',
    'बिहार ग्रामीण कार्य / पंचायती राज अंतर्गत पंजीकृत संवेदकों से रामनगर ग्राम परिषद के वार्ड 3 व 11 में 480 मीटर पीसीसी सड़क व नाली निर्माण हेतु निविदा आमंत्रित।',
    0, 'Shri Suresh Prasad Singh'
  );
  insertNotice.run(
    'RGP/GS-RES/2026-04', 'resolution',
    'Resolution No. 04/2026: Approval of Annual Gram Parishad Development Plan (GPDP 2026–27)',
    'प्रस्ताव संख्या 04/2026: वार्षिक ग्राम परिषद विकास योजना (GPDP 2026-27) की स्वीकृति',
    'Gram Sabha Secretariat', '2026-10-15', null,
    'Unanimously approved 28 infrastructure, sanitation, and livelihood works worth ₹1.42 Crore across Ramnagar Gram Parishad under 15th FC, SFC, and MGNREGA convergence.',
    '15वें वित्त आयोग, राज्य वित्त आयोग एवं मनरेगा अभिसरण अंतर्गत ₹1.42 करोड़ की 28 विकास योजनाओं को सर्वसम्मति से पारित किया गया।',
    0, 'Smt. Sangeeta Kumari'
  );
  insertNotice.run(
    'RGP/GS-RES/2026-03', 'resolution',
    'Resolution No. 03/2026: Mandatory User Charge Waiver for BPL & Antyodaya Households',
    'प्रस्ताव संख्या 03/2026: बीपीएल एवं अंत्योदय परिवारों को स्वच्छता व जल शुल्क में छूट',
    'Gram Sabha Secretariat', '2026-09-20', null,
    'Passed resolution exempting AAY and BPL cardholders in Ramnagar Gram Parishad from quarterly solid waste collection fees while ensuring daily Swachhagrahi collection.',
    'ग्राम सभा द्वारा अंत्योदय व बीपीएल परिवारों को कचरा संग्रहण शुल्क से मुक्त रखने का प्रस्ताव पारित किया गया।',
    0, 'Smt. Sangeeta Kumari'
  );

  // 4. Seed RTPS Certificate Applications
  const insertCert = db.prepare(`
    INSERT INTO certificates (ref_id, cert_type, applicant_name, guardian_name, ward_no, mobile, aadhaar_last4, purpose, doc_name, doc_preview, status, remarks, applied_date, issued_date, issued_by, qr_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertCert.run('BR-WCH-RMN-2026-0041', 'Residence (Domicile) Certificate', 'Ravi Shankar Kumar', 'Ramdev Mahto', 4, '9835012411', '4821', 'State Government Scholarship Verification', 'Aadhaar_Ward4_VoterSlip.pdf', '', 'Approved & Signed', 'Verified against Parivar Register Family ID RMN-F0412.', '2026-11-02', '2026-11-06', 'Smt. Sangeeta Kumari (Sachiv) & Shri Suresh Prasad Singh (Mukhiya)', 'QR-VER-RMN-0041-8A92F');
  insertCert.run('BR-WCH-RMN-2026-0042', 'Income Certificate', 'Pooja Kumari', 'Umesh Prasad', 7, '9122489102', '7734', 'Bihar Post-Matric Scholarship Portal', 'Ration_Card_Copy.jpg', '', 'Verified by Sachiv', 'Ward Member verification complete; awaiting Mukhiya digital sign-off.', '2026-11-09', null, null, 'QR-VER-RMN-0042-3B19C');
  insertCert.run('BR-WCH-RMN-2026-0043', 'Birth Certificate', 'Aarav Kumar (Minor)', 'Sunil Paswan', 3, '9934187620', '1904', 'Primary School Admission - Ward 03', 'Hospital_Discharge_Slip.pdf', '', 'Approved & Signed', 'Entered in Vital Birth Register Reg. No. B-2026-118.', '2026-10-28', '2026-11-01', 'Smt. Sangeeta Kumari (Registrar Birth & Death)', 'QR-VER-RMN-0043-7D44E');
  insertCert.run('BR-WCH-RMN-2026-0044', 'Caste Certificate', 'Neha Kumari', 'Satish Sharma', 14, '9709211844', '6129', 'BPSC Examination Application', 'Khatiyan_Land_Record.pdf', '', 'Submitted', 'Application received via Citizen RTPS Desk.', '2026-11-12', null, null, 'QR-VER-RMN-0044-9E21A');
  insertCert.run('BR-WCH-RMN-2026-0045', 'Family Membership (Parivar)', 'Mohammad Arif', 'Late Md. Idris', 13, '9431884210', '5502', 'Succession & Bank Account Update', 'Parivar_Affidavit.pdf', '', 'Verified by Sachiv', 'Cross-checked with Household Census Folio #13-088.', '2026-11-11', null, null, 'QR-VER-RMN-0045-1C77B');

  // 5. Seed Welfare Scheme Beneficiaries
  const insertBen = db.prepare(`
    INSERT INTO beneficiaries (family_id, beneficiary_name, guardian_name, ward_no, scheme_category, scheme_name, id_card_no, masked_aadhaar, sanctioned_amount, benefit_status, last_disbursed_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const benRows = [
    ['RMN-F0104', 'Kamla Devi', 'W/o Maheshwar Singh', 1, 'PMAY-G', 'Pradhan Mantri Awas Yojana - Gramin', 'BH-WCH-2026-88412', 'XXXX-XXXX-4190', 120000, 'Installment Paid', '2026-10-18'],
    ['RMN-F0412', 'Ramdev Mahto', 'S/o Late Bhikhari Mahto', 4, 'Saat Nischay', 'Har Ghar Nal Ka Jal & Pakki Gali-Nali', 'SN-RMN-04-112', 'XXXX-XXXX-4821', 0, 'Active', '2026-11-01'],
    ['RMN-F0309', 'Sita Devi', 'W/o Late Bhola Paswan', 3, 'Pensions', 'Laxmibai Social Security Widow Pension', 'PEN-BR-908411', 'XXXX-XXXX-3318', 400, 'Active', '2026-11-05'],
    ['RMN-F0315', 'Raju Paswan', 'S/o Dukhan Paswan', 3, 'MGNREGA', 'MGNREGA Job Card & 100-Day Wage Guarantee', 'BH-03-019-008-192', 'XXXX-XXXX-7201', 24500, 'Installment Paid', '2026-11-07'],
    ['RMN-F0502', 'Ramesh Sahni', 'S/o Jiyalal Sahni', 5, 'PDS Ration', 'Antyodaya Anna Yojana (AAY) Ration Card', '10190041928371', 'XXXX-XXXX-8943', 0, 'Active', '2026-11-02'],
    ['RMN-F0711', 'Urmila Devi', 'W/o Umesh Prasad', 7, 'Pensions', 'Mukhyamantri Vridhjan Pension Yojana', 'PEN-BR-771204', 'XXXX-XXXX-7734', 400, 'Active', '2026-11-05'],
    ['RMN-F0908', 'Lalan Yadav', 'S/o Ramjatan Yadav', 9, 'PMAY-G', 'Pradhan Mantri Awas Yojana - Gramin', 'BH-WCH-2026-88509', 'XXXX-XXXX-1147', 120000, 'Completed', '2026-09-22'],
    ['RMN-F1304', 'Nazma Khatoon', 'W/o Md. Salim', 13, 'Pensions', 'Bihar Disability Pension Scheme', 'PEN-BR-652190', 'XXXX-XXXX-5502', 400, 'Active', '2026-11-05'],
    ['RMN-F0218', 'Birju Kumar', 'S/o Shivnarayan Ram', 2, 'MGNREGA', 'MGNREGA Cattle Shed & Plantation Work', 'BH-03-019-008-341', 'XXXX-XXXX-6609', 18600, 'Installment Paid', '2026-10-30'],
    ['RMN-F0610', 'Anita Kumari', 'W/o Sudhir Thakur', 6, 'Saat Nischay', 'Mukhyamantri Gramin Solar Street Light Ward Grid', 'SN-RMN-06-084', 'XXXX-XXXX-2984', 0, 'Active', '2026-10-25'],
    ['RMN-F1105', 'Kameshwar Pandit', 'S/o Ramkhelawan Pandit', 11, 'PDS Ration', 'Priority Household (PHH) Ration Card', '10190041929014', 'XXXX-XXXX-9031', 0, 'Active', '2026-11-01'],
    ['RMN-F1402', 'Geeta Sharma', 'W/o Satish Sharma', 14, 'PMAY-G', 'PMAY-G AwaasPlus New Survey 2026', 'BH-WCH-2026-89104', 'XXXX-XXXX-6129', 120000, 'Pending Verification', '2026-11-10']
  ];
  for (const b of benRows) {
    insertBen.run(...b);
  }

  // 6. Seed Grants Summary
  const insertGrant = db.prepare(`
    INSERT INTO funds_grants (scheme_name, scheme_name_hi, financial_year, sanctioned_amount, released_amount, utilized_amount, nodal_agency)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertGrant.run('15th Central Finance Commission (Tied & Untied)', '15वां केंद्रीय वित्त आयोग (बँधी एवं अबँधी)', '2026-27', 6850000, 5400000, 4620000, 'Ministry of Panchayati Raj, GoI');
  insertGrant.run('State Finance Commission (6th SFC Bihar)', 'षष्ठम राज्य वित्त आयोग (बिहार)', '2026-27', 4200000, 3500000, 2980000, 'Panchayati Raj Dept, Govt. of Bihar');
  insertGrant.run('MGNREGA Labour & Material Convergence', 'मनरेगा (श्रमिक एवं सामग्री अभिसरण)', '2026-27', 5100000, 4150000, 3790000, 'Rural Development Dept, Bihar');
  insertGrant.run('Saat Nischay Part-2 (Solar Light & Swachh Gaon)', 'सात निश्चय भाग-2 (सोलर लाइट एवं स्वच्छ गाँव)', '2026-27', 3100000, 2600000, 2140000, 'BREDA / Bihar Panchayati Raj');

  // 7. Seed Digital Cashbook
  const insertCash = db.prepare(`
    INSERT INTO cashbook (voucher_no, entry_date, entry_type, grant_source, ward_no, party_name, description, amount, bill_ref, recorded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const cashRows = [
    ['CB-2026-091', '2026-10-04', 'Income', '15th Central Finance Commission', null, 'PFMS Treasury West Champaran', '1st Installment FY 2026-27 Untied & Tied Grant Receipt', 2700000, 'PFMS-TR-99812', 'Smt. Sangeeta Kumari'],
    ['CB-2026-092', '2026-10-12', 'Expenditure', '15th Central Finance Commission', 3, 'M/s Champaran Infra Builders', 'Running Bill #1 for Ward 03 Covered RCC Drainage', 485000, 'BILL-MB-304', 'Smt. Sangeeta Kumari'],
    ['CB-2026-093', '2026-10-19', 'Expenditure', 'Saat Nischay Part-2', 4, 'Bihar Solar Power Enterprises', 'Installation of 24 Solar LED Street Lights in Ward 04', 528000, 'BREDA-INV-412', 'Smt. Sangeeta Kumari'],
    ['CB-2026-094', '2026-10-25', 'Income', 'State Finance Commission', null, 'District Panchayat Office Bettiah', '6th SFC Tranche Release for Gali-Nali & Bhawan Maint.', 1750000, 'SFC-WCH-2219', 'Smt. Sangeeta Kumari'],
    ['CB-2026-095', '2026-11-02', 'Expenditure', 'State Finance Commission', 1, 'Sri Balaji Construction', 'Final Payment PCC Road Shiv Mandir to Triveni Canal Ward 01', 610000, 'BILL-MB-318', 'Shri Suresh Prasad Singh'],
    ['CB-2026-096', '2026-11-08', 'Expenditure', 'MGNREGA', 7, 'MGNREGA Wage & Material Account', 'Culvert & Irrigation Canal Desilting Muster Roll #44', 342000, 'MR-RMN-2026-44', 'Smt. Sangeeta Kumari'],
    ['CB-2026-097', '2026-11-11', 'Income', 'Own Source Revenue (OSR)', null, 'Ramnagar Haat & Property Tax', 'Monthly Gudri Bazaar Fee & House Tax Collection Deposit', 64500, 'OSR-REC-110', 'Smt. Sangeeta Kumari']
  ];
  for (const c of cashRows) {
    insertCash.run(...c);
  }

  // 8. Seed Infrastructure & Public Works
  const insertWork = db.prepare(`
    INSERT INTO works (work_code, title, title_hi, ward_no, scheme_source, contractor_name, sanctioned_budget, expenditure, progress_pct, status, geo_lat, geo_lng, start_date, completion_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const worksRows = [
    ['WRK-RMN-01', 'PCC Road Shiv Mandir to Triveni Canal (380m)', 'शिव मंदिर से त्रिवेणी नहर तक पीसीसी सड़क निर्माण', 1, 'State Finance Commission', 'Sri Balaji Construction', 620000, 610000, 100, 'Completed', 27.1652, 84.3218, '2026-07-10', '2026-11-02'],
    ['WRK-RMN-02', 'Covered RCC Drainage & Paver Block Lane 1-4', 'ढक्कनयुक्त आरसीसी नाली एवं पेवर ब्लॉक कार्य', 3, '15th Central Finance Commission', 'M/s Champaran Infra Builders', 850000, 625000, 75, 'In Progress', 27.1675, 84.3251, '2026-08-18', null],
    ['WRK-RMN-03', '24 Solar LED Street Lights Installation', '24 सोलर एलईडी स्ट्रीट लाइट अधिष्ठापन', 4, 'Saat Nischay Part-2', 'Bihar Solar Power Enterprises', 540000, 528000, 100, 'Completed', 27.1628, 84.3194, '2026-08-01', '2026-10-19'],
    ['WRK-RMN-04', 'Gudri Haat Bazaar Tin Shed & Toilet Complex', 'गुदरी हाट बाजार शेड एवं सामुदायिक शौचालय', 5, '15th Central Finance Commission', 'Valmiki Civil Works', 780000, 410000, 55, 'In Progress', 27.1691, 84.3282, '2026-09-12', null],
    ['WRK-RMN-05', 'MGNREGA Box Culvert & Field Bunding', 'मनरेगा बॉक्स पुलिया एवं खेत मेड़बंदी', 7, 'MGNREGA', 'Departmental (Parishad Rozgar Sevak)', 490000, 342000, 70, 'In Progress', 27.1604, 84.3310, '2026-09-20', null],
    ['WRK-RMN-06', 'Surya Mandir Chhath Ghat Steps & High-Mast Light', 'सूर्य मंदिर छठ घाट सीढ़ी एवं सोलर हाई-मास्ट लाइट', 14, 'State Finance Commission', 'Gandak Engineering Co-op', 680000, 190000, 25, 'Sanctioned', 27.1719, 84.3167, '2026-11-01', null]
  ];
  for (const wk of worksRows) {
    insertWork.run(...wk);
  }

  // 9. Seed Gram Sabha Meetings
  const insertSabha = db.prepare(`
    INSERT INTO gram_sabha (meeting_no, title, title_hi, meeting_date, meeting_time, venue, presiding_officer, quorum_required, attendance_count, status, agenda, minutes_summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSabha.run(
    'GS-2026-05',
    'Special Gram Sabha: PMAY-G AwaasPlus & Pension Verification',
    'विशेष ग्राम सभा: पीएम आवास प्लस एवं पेंशन सत्यापन',
    '2026-11-22', '11:00 AM', 'Ramnagar Gram Parishad Bhawan Courtyard',
    'Shri Suresh Prasad Singh (Mukhiya)', 180, 0, 'Scheduled',
    '1. Verification of 48 PMAY-G AwaasPlus households.\n2. Aadhaar seeding & e-KYC for Vridhjan & Widow Pensions.\n3. Ward-wise Solar Street Light Phase III site selection.',
    'Meeting scheduled. Public announcement made via ward committees and notice board.'
  );
  insertSabha.run(
    'GS-2026-04',
    'Gandhi Jayanti Quarterly Gram Sabha & GPDP 2026-27 Approval',
    'गांधी जयंती त्रैमासिक ग्राम सभा एवं GPDP 2026-27 स्वीकृति',
    '2026-10-02', '10:30 AM', 'Ramnagar Gram Parishad Bhawan Hall',
    'Shri Suresh Prasad Singh (Mukhiya)', 180, 246, 'Completed',
    '1. Review of 15th FC & SFC utilization.\n2. Approval of GPDP 2026-27 priority shelf of projects.\n3. Social Audit of MGNREGA Muster Rolls.',
    'Quorum met with 246 citizens including 118 women SHG (Jeevika) members. 28 priority works worth ₹1.42 Cr approved unanimously under Resolution 04/2026.'
  );
  insertSabha.run(
    'GS-2026-03',
    'Monsoon Sanitation, Jal-Jeevan-Hariyali & Flood Preparedness Sabha',
    'मानसून स्वच्छता, जल-जीवन-हरियाली एवं बाढ़ पूर्व तैयारी सभा',
    '2026-07-18', '11:00 AM', 'Middle School Ground, Ward 06, Ramnagar',
    'Shri Suresh Prasad Singh (Mukhiya)', 180, 212, 'Completed',
    '1. Cleaning of ward drains and soak pits.\n2. Plantation drive of 1,200 saplings under MGNREGA.\n3. Handpump repair roster across Wards 1–15.',
    'Approved emergency drainage desilting budget of ₹1.80 Lakh and formed 15 Ward Vigilance Teams.'
  );

  // 10. Seed Gram Katchahry Cases
  const insertKatchahry = db.prepare(`
    INSERT INTO gram_katchahry (case_no, petitioner, respondent, ward_no, dispute_type, filing_date, next_hearing_date, bench_head, status, judgment_summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertKatchahry.run('GK-RMN-2026-19', 'Birendra Singh', 'Maheshwar Yadav', 9, 'Agricultural Field Boundary (Medh Dispute)', '2026-10-14', '2026-11-20', 'Shri Ramashray Mahto (Sarpanch)', 'Hearing Scheduled', 'Amin measurement report submitted; parties called for amicable boundary demarcation.');
  insertKatchahry.run('GK-RMN-2026-18', 'Smt. Shanti Devi', 'Raghunath Sah', 5, 'Drainage Water Discharge Dispute', '2026-09-28', null, 'Shri Ramashray Mahto (Sarpanch)', 'Compromise Reached', 'Amicable settlement signed before 5 Panchs; covered pipe outlet agreed and constructed.');
  insertKatchahry.run('GK-RMN-2026-17', 'Harinarayan Paswan', 'Dipak Kumar', 3, 'Petty Wage & Tenancy Claim (₹4,500)', '2026-09-05', null, 'Shri Ramashray Mahto (Sarpanch)', 'Judgment Delivered', 'Bench ordered settlement of ₹4,500 in two installments; full payment receipt filed in Katchahry register.');

  // 11. Seed Mandatory Registers
  const insertParivar = db.prepare(`
    INSERT INTO parivar_register (family_id, house_no, ward_no, head_name, members_count, category, economic_status, occupation, ration_card_no)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const parivarRows = [
    ['RMN-F0104', 'H-01/018', 1, 'Maheshwar Singh', 5, 'General', 'BPL', 'Marginal Farmer', '10190041920041'],
    ['RMN-F0309', 'H-03/042', 3, 'Sita Devi', 3, 'SC', 'AAY', 'Agricultural Labour', '10190041920118'],
    ['RMN-F0412', 'H-04/019', 4, 'Ramdev Mahto', 6, 'OBC', 'APL', 'Vegetable Cultivation', '10190041920412'],
    ['RMN-F0502', 'H-05/007', 5, 'Ramesh Sahni', 4, 'EBC', 'AAY', 'Fishery & Trade', '10190041928371'],
    ['RMN-F0711', 'H-07/055', 7, 'Umesh Prasad', 5, 'OBC', 'BPL', 'Dairy & Farming', '10190041920711'],
    ['RMN-F1304', 'H-13/023', 13, 'Md. Salim Ansari', 6, 'EBC', 'BPL', 'Tailoring & Trade', '10190041921304'],
    ['RMN-F1402', 'H-14/011', 14, 'Satish Sharma', 4, 'EBC', 'BPL', 'Carpentry', '10190041921402']
  ];
  for (const p of parivarRows) {
    insertParivar.run(...p);
  }

  const insertTax = db.prepare(`
    INSERT INTO property_tax (holding_no, ward_no, owner_name, property_type, area_sqft, annual_tax, paid_status, last_receipt_no, last_paid_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const taxRows = [
    ['HOLD-RMN-01-018', 1, 'Maheshwar Singh', 'Residential', 1150, 350, 'Paid', 'TAX-2026-0118', '2026-08-14'],
    ['HOLD-RMN-04-019', 4, 'Ramdev Mahto', 'Residential', 1400, 420, 'Due', null, null],
    ['HOLD-RMN-05-032', 5, 'Gupta Kirana & Hardware', 'Commercial', 1800, 1250, 'Due', null, null],
    ['HOLD-RMN-06-012', 6, 'Sudhir Thakur', 'Residential', 1250, 380, 'Paid', 'TAX-2026-0204', '2026-09-21'],
    ['HOLD-RMN-09-044', 9, 'Birendra Singh', 'Agricultural Plot', 4200, 600, 'Due', null, null],
    ['HOLD-RMN-13-023', 13, 'Md. Salim Ansari', 'Residential', 980, 300, 'Paid', 'TAX-2026-0291', '2026-10-05']
  ];
  for (const t of taxRows) {
    insertTax.run(...t);
  }

  const insertAsset = db.prepare(`
    INSERT INTO asset_inventory (asset_code, item_name, category, ward_no, quantity, condition, purchase_value, folio_no)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAsset.run('AST-RMN-001', '5kW Rooftop Solar Plant at Ramnagar Parishad Bhawan', 'Energy Infrastructure', 6, 1, 'Good', 385000, 'REG-AST-01');
  insertAsset.run('AST-RMN-002', '12W Solar LED Street Light Poles (Phase I & II)', 'Street Lighting', 4, 42, 'Good', 924000, 'REG-AST-08');
  insertAsset.run('AST-RMN-003', 'E-Rickshaw Waste Collection Cart (Swachhata)', 'Sanitation Equipment', 5, 4, 'Good', 520000, 'REG-AST-14');
  insertAsset.run('AST-RMN-004', 'India Mark-II Deep Bore Handpumps', 'Drinking Water', 10, 18, 'Needs Repair', 648000, 'REG-AST-22');
  insertAsset.run('AST-RMN-005', 'RTPS Citizen Counter Desktop & Biometric Scanner', 'IT & Office', 6, 3, 'Good', 165000, 'REG-AST-29');

  const insertVital = db.prepare(`
    INSERT INTO vital_records (reg_no, record_type, person_name, related_name, event_date, ward_no, cert_ref)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertVital.run('B-2026-118', 'Birth', 'Aarav Kumar', 'S/o Sunil Paswan & Rita Devi', '2026-09-14', 3, 'BR-WCH-RMN-2026-0043');
  insertVital.run('B-2026-119', 'Birth', 'Ananya Kumari', 'D/o Vikash Kumar & Puja Devi', '2026-10-03', 15, 'BR-WCH-RMN-2026-0039');
  insertVital.run('D-2026-041', 'Death', 'Late Bhikhari Mahto', 'F/o Ramdev Mahto', '2026-08-22', 4, 'BR-WCH-RMN-2026-0031');
  insertVital.run('M-2026-027', 'Marriage', 'Rohan Kumar & Khushboo Kumari', 'S/o Arvind Kumar (Ward 01)', '2026-06-19', 1, 'MRG-RMN-2026-027');

  // 12. Seed Janta Darbar Grievances
  const insertGrievance = db.prepare(`
    INSERT INTO grievances (ticket_id, citizen_name, mobile, ward_no, category, subject, description, photo_name, photo_preview, assigned_to, status, resolution_remarks, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertGrievance.run(
    'JD-2026-108', 'Dhananjay Mahto', '9431209844', 4, 'Drinking Water (Nal-Jal)',
    'Low water pressure & valve leakage near Harijan Tola',
    'Morning water supply pressure has dropped for last 3 days due to main gate valve leakage near Ward 4 pump house.',
    'ward4_valve_leak.jpg', '', 'Smt. Meena Devi (Ward Member 04)', 'In Progress',
    'Plumber & WIMC अनुरक्षक assigned; replacement brass valve procured from Ramnagar.',
    '2026-11-09', '2026-11-12'
  );
  insertGrievance.run(
    'JD-2026-109', 'Sunita Kumari', '9835771209', 9, 'Drainage & Sanitation',
    'Drain silt overflow near Brahmasthan Lane 2',
    'Covered drain slab cracked near house #09/14 causing water logging on the road.',
    '', '', 'Shri Dinesh Yadav (Ward Member 09)', 'Pending',
    'Logged at Janta Darbar desk; site inspection scheduled.',
    '2026-11-13', '2026-11-13'
  );
  insertGrievance.run(
    'JD-2026-105', 'Kameshwar Pandit', '9199442011', 11, 'Street Light',
    'Solar street light pole #11-06 battery replacement',
    'Pole near Primary School Ward 11 was dimming after 9 PM.',
    '', '', 'Shri Santosh Thakur (Ward Member 11)', 'Resolved',
    'Battery replaced under 5-year BREDA warranty by vendor technician on 08 Nov 2026.',
    '2026-11-02', '2026-11-08'
  );

  // 13. Seed Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (timestamp, actor_name, actor_role, action, entity, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run('2026-11-12 16:40:00', 'Smt. Sangeeta Kumari', 'sachiv', 'VERIFIED_CERTIFICATE', 'BR-WCH-RMN-2026-0042', 'Verified Income Certificate application for Pooja Kumari (Ward 7)');
  insertAudit.run('2026-11-11 14:15:00', 'Smt. Sangeeta Kumari', 'sachiv', 'RECORDED_CASHBOOK', 'CB-2026-097', 'Logged OSR income deposit of ₹64,500');
  insertAudit.run('2026-11-06 11:20:00', 'Shri Suresh Prasad Singh', 'mukhiya', 'APPROVED_CERTIFICATE', 'BR-WCH-RMN-2026-0041', 'Digitally signed Residence Certificate for Ravi Shankar Kumar (Ward 4)');

  // 14. Seed Portal Meta
  db.prepare('INSERT INTO portal_meta (id, visitor_count, last_updated) VALUES (1, 14928, ?)').run('2026-11-16');
}
