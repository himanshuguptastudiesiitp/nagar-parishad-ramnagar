export type Language = 'en' | 'hi';

export type StaffRole = 'mukhiya' | 'sarpanch' | 'sachiv' | 'ward_member';

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  fullNameHi: string;
  role: StaffRole;
  designation: string;
  designationHi: string;
  wardNo: number | null;
}

export interface Ward {
  id: number;
  ward_no: number;
  ward_name: string;
  ward_name_hi: string;
  member_name: string;
  member_phone: string;
  households: number;
  population: number;
  allocated_fund: number;
  spent_fund: number;
  ongoing_project: string;
  ongoing_project_hi: string;
}

export interface Notice {
  id: number;
  ref_no: string;
  type: 'notice' | 'tender' | 'resolution';
  title: string;
  title_hi: string;
  department: string;
  published_date: string;
  closing_date: string | null;
  summary: string;
  summary_hi: string;
  is_ticker: number;
  created_by: string;
}

export type CertificateType =
  | 'Birth Certificate'
  | 'Death Certificate'
  | 'Caste Certificate'
  | 'Income Certificate'
  | 'Residence (Domicile) Certificate'
  | 'Character Certificate'
  | 'Family Membership (Parivar)'
  | 'No Objection Certificate (NOC)';

export type CertificateStatus = 'Submitted' | 'Verified by Sachiv' | 'Approved & Signed' | 'Rejected';

export interface CertificateApplication {
  id: number;
  ref_id: string;
  cert_type: CertificateType;
  applicant_name: string;
  guardian_name: string;
  ward_no: number;
  mobile: string;
  aadhaar_last4: string;
  purpose: string;
  doc_name: string;
  doc_preview: string;
  status: CertificateStatus;
  remarks: string;
  applied_date: string;
  issued_date: string | null;
  issued_by: string | null;
  qr_hash: string;
}

export interface Beneficiary {
  id: number;
  family_id: string;
  beneficiary_name: string;
  guardian_name: string;
  ward_no: number;
  scheme_category: 'Saat Nischay' | 'PMAY-G' | 'MGNREGA' | 'Pensions' | 'PDS Ration';
  scheme_name: string;
  id_card_no: string;
  masked_aadhaar: string;
  sanctioned_amount: number;
  benefit_status: 'Active' | 'Installment Paid' | 'Pending Verification' | 'Completed';
  last_disbursed_date: string;
}

export interface GrantSummary {
  id: number;
  scheme_name: string;
  scheme_name_hi: string;
  financial_year: string;
  sanctioned_amount: number;
  released_amount: number;
  utilized_amount: number;
  nodal_agency: string;
}

export interface CashbookEntry {
  id: number;
  voucher_no: string;
  entry_date: string;
  entry_type: 'Income' | 'Expenditure';
  grant_source: string;
  ward_no: number | null;
  party_name: string;
  description: string;
  amount: number;
  bill_ref: string;
  recorded_by: string;
}

export interface PublicWork {
  id: number;
  work_code: string;
  title: string;
  title_hi: string;
  ward_no: number;
  scheme_source: string;
  contractor_name: string;
  sanctioned_budget: number;
  expenditure: number;
  progress_pct: number;
  status: 'Sanctioned' | 'In Progress' | 'Completed';
  geo_lat: number;
  geo_lng: number;
  start_date: string;
  completion_date: string | null;
}

export interface GramSabhaMeeting {
  id: number;
  meeting_no: string;
  title: string;
  title_hi: string;
  meeting_date: string;
  meeting_time: string;
  venue: string;
  presiding_officer: string;
  quorum_required: number;
  attendance_count: number;
  status: 'Scheduled' | 'Completed';
  agenda: string;
  minutes_summary: string;
}

export interface GramKatchahryCase {
  id: number;
  case_no: string;
  petitioner: string;
  respondent: string;
  ward_no: number;
  dispute_type: string;
  filing_date: string;
  next_hearing_date: string | null;
  bench_head: string;
  status: 'Filed' | 'Hearing Scheduled' | 'Compromise Reached' | 'Judgment Delivered';
  judgment_summary: string;
}

export interface ParivarRecord {
  id: number;
  family_id: string;
  house_no: string;
  ward_no: number;
  head_name: string;
  members_count: number;
  category: string;
  economic_status: 'BPL' | 'APL' | 'AAY';
  occupation: string;
  ration_card_no: string;
}

export interface PropertyTaxRecord {
  id: number;
  holding_no: string;
  ward_no: number;
  owner_name: string;
  property_type: 'Residential' | 'Commercial' | 'Agricultural Plot';
  area_sqft: number;
  annual_tax: number;
  paid_status: 'Paid' | 'Due';
  last_receipt_no: string | null;
  last_paid_date: string | null;
}

export interface AssetItem {
  id: number;
  asset_code: string;
  item_name: string;
  category: string;
  ward_no: number;
  quantity: number;
  condition: 'Good' | 'Needs Repair' | 'Under Maintenance';
  purchase_value: number;
  folio_no: string;
}

export interface VitalRecord {
  id: number;
  reg_no: string;
  record_type: 'Birth' | 'Death' | 'Marriage';
  person_name: string;
  related_name: string;
  event_date: string;
  ward_no: number;
  cert_ref: string;
}

export interface Grievance {
  id: number;
  ticket_id: string;
  citizen_name: string;
  mobile: string;
  ward_no: number;
  category: string;
  subject: string;
  description: string;
  photo_name: string;
  photo_preview: string;
  assigned_to: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  resolution_remarks: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity: string;
  details: string;
}

export interface PortalMeta {
  visitor_count: number;
  last_updated: string;
}

export type ActiveView =
  | 'home'
  | 'about'
  | 'services'
  | 'schemes'
  | 'funds'
  | 'sabha'
  | 'registers'
  | 'grievance'
  | 'downloads'
  | 'staff';
