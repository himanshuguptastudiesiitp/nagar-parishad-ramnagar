import { useEffect, useState } from 'react';
import {
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ExternalLink,
  FileBadge2,
  FileText,
  Landmark,
  MapPin,
  MessageSquareWarning,
  Phone,
  Users,
} from 'lucide-react';
import type { ActiveView, Language, Notice, Ward } from '../types';
import { formatINR } from '../utils/api';
import { t } from '../utils/i18n';

interface HomeLandingViewProps {
  lang: Language;
  wards: Ward[];
  notices: Notice[];
  initialNoticeTab?: 'notice' | 'tender' | 'resolution';
  onNavigate: (view: ActiveView, subTab?: string) => void;
  onSelectNotice: (notice: Notice) => void;
}

const HERO_SLIDES = [
  {
    src: '/src/assets/images/hero_panchayat_bhawan_1794723027763.jpg',
    titleEn: 'Ramnagar Gram Parishad Bhawan — Solar-Powered RTPS & Citizen Facilitation Centre',
    titleHi: 'रामनगर ग्राम परिषद भवन — सौर ऊर्जा युक्त आरटीपीएस एवं नागरिक सुविधा केंद्र',
    metaEn: 'Block Ramnagar · District West Champaran · Open Mon–Sat 10:00 AM – 5:00 PM',
    metaHi: 'प्रखंड रामनगर · जिला पश्चिम चंपारण · कार्य समय सोम–शनि प्रातः 10:00 – सायं 5:00 बजे',
  },
  {
    src: '/src/assets/images/hero_nal_jal_solar_1794723028205.jpg',
    titleEn: 'Saat Nischay Yojana — Har Ghar Nal Ka Jal, Pakki Gali-Nali & Solar Street Lights',
    titleHi: 'सात निश्चय योजना — हर घर नल का जल, पक्की गली-नाली एवं सोलर स्ट्रीट लाइट',
    metaEn: '100% Ward Coverage · 2,228 Households Connected Across Wards 1–15',
    metaHi: 'शत-प्रतिशत वार्ड आच्छादन · वार्ड 1–15 में 2,228 परिवार लाभान्वित',
  },
  {
    src: '/src/assets/images/hero_gram_sabha_1794723030640.jpg',
    titleEn: 'Participatory Democracy — Quarterly Gram Sabha & Jeevika SHG Social Audit',
    titleHi: 'सहभागी लोकतंत्र — त्रैमासिक ग्राम सभा एवं जीविका दीदियों की भागीदारी',
    metaEn: 'Transparent GPDP 2026–27 Planning · Open Digital Minutes & Fund Disclosure',
    metaHi: 'पारदर्शी GPDP 2026–27 कार्ययोजना · ऑनलाइन कार्यवाही एवं निधि विवरण',
  },
];

const LEADERSHIP = [
  {
    nameEn: 'Shri Suresh Prasad Singh',
    nameHi: 'श्री सुरेश प्रसाद सिंह',
    roleEn: 'Mukhiya (Ramnagar Gram Parishad)',
    roleHi: 'मुखिया (रामनगर ग्राम परिषद प्रमुख)',
    contact: '+91 94310-88201',
    photo: '/src/assets/images/portrait_mukhiya_1794723029437.jpg',
  },
  {
    nameEn: 'Shri Ramashray Mahto',
    nameHi: 'श्री रामाश्रय महतो',
    roleEn: 'Sarpanch (Gram Katchahry)',
    roleHi: 'सरपंच (ग्राम कचहरी प्रमुख)',
    contact: '+91 94310-88202',
    photo: '/src/assets/images/portrait_sarpanch_1794723028776.jpg',
  },
  {
    nameEn: 'Smt. Sangeeta Kumari',
    nameHi: 'श्रीमती संगीता कुमारी',
    roleEn: 'Parishad Secretary (Sachiv)',
    roleHi: 'परिषद सचिव (सरकारी पदाधिकारी)',
    contact: '+91 94310-88203',
    photo: '/src/assets/images/portrait_sachiv_1794723029609.jpg',
  },
];

const GOV_PORTALS = [
  { name: 'e-GramSwaraj Portal', subtitle: 'GPDP & Accounting', view: 'funds' as ActiveView, subTab: 'overview' },
  { name: 'ServicePlus (RTPS Bihar)', subtitle: 'Online Certificates', view: 'services' as ActiveView, subTab: 'apply' },
  { name: 'PMAY-G AwaasSoft', subtitle: 'Rural Housing Tracker', view: 'schemes' as ActiveView, subTab: 'PMAY-G' },
  { name: 'MGNREGA Bihar', subtitle: 'Job Cards & Muster Roll', view: 'schemes' as ActiveView, subTab: 'MGNREGA' },
  { name: 'PFMS Public Expenditure', subtitle: 'Ward RTI Disclosure', view: 'funds' as ActiveView, subTab: 'rti' },
  { name: 'Statutory Forms & RTI', subtitle: 'Printable PDF Forms', view: 'downloads' as ActiveView },
];

export function HomeLandingView({
  lang,
  wards,
  notices,
  initialNoticeTab = 'notice',
  onNavigate,
  onSelectNotice,
}: HomeLandingViewProps) {
  const tr = t(lang);
  const [slideIdx, setSlideIdx] = useState(0);
  const [noticeTab, setNoticeTab] = useState<'notice' | 'tender' | 'resolution'>(initialNoticeTab);
  const [selectedWardNo, setSelectedWardNo] = useState<number>(4);

  useEffect(() => {
    setNoticeTab(initialNoticeTab);
  }, [initialNoticeTab]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const filteredNotices = notices.filter((n) => n.type === noticeTab);
  const activeWard = wards.find((w) => w.ward_no === selectedWardNo) || wards[0];

  const totalHouseholds = wards.reduce((s, w) => s + w.households, 0);
  const totalPopulation = wards.reduce((s, w) => s + w.population, 0);
  const totalAllocated = wards.reduce((s, w) => s + w.allocated_fund, 0);
  const totalSpent = wards.reduce((s, w) => s + w.spent_fund, 0);

  const quickServices = [
    {
      titleEn: 'Apply for Certificates',
      titleHi: 'प्रमाण पत्र आवेदन (RTPS)',
      descEn: 'Birth, Death, Caste, Income, Domicile & Parivar NOC with QR PDF',
      descHi: 'जन्म, मृत्यु, जाति, आय, निवास व पारिवारिक प्रमाण पत्र',
      icon: FileBadge2,
      view: 'services' as ActiveView,
      subTab: 'apply',
    },
    {
      titleEn: 'Check Beneficiary List',
      titleHi: 'लाभार्थी सूची जांचें',
      descEn: 'Saat Nischay, PMAY-G Awas, MGNREGA Job Card, Pensions & Ration',
      descHi: 'सात निश्चय, पीएम आवास, मनरेगा, पेंशन एवं राशन कार्ड सूची',
      icon: Users,
      view: 'schemes' as ActiveView,
      subTab: 'All',
    },
    {
      titleEn: 'Lodge Grievance (Janta Darbar)',
      titleHi: 'शिकायत दर्ज करें (जनता दरबार)',
      descEn: 'Submit ward complaints with photo & track Ticket ID resolution',
      descHi: 'फोटो सहित वार्ड शिकायत दर्ज करें और टिकट आईडी से ट्रैक करें',
      icon: MessageSquareWarning,
      view: 'grievance' as ActiveView,
    },
    {
      titleEn: 'View Ward Funds (RTI)',
      titleHi: 'वार्ड निधि एवं RTI विवरण',
      descEn: '15th FC, SFC grants, Digital Cashbook & Ward expenditure charts',
      descHi: '15वां वित्त, राज्य वित्त आयोग, कैशबुक एवं वार्ड व्यय ग्राफ',
      icon: Landmark,
      view: 'funds' as ActiveView,
      subTab: 'rti',
    },
    {
      titleEn: 'Parivar Register Search',
      titleHi: 'परिवार पंजी खोजें',
      descEn: 'Household census, BPL/APL status, Vital Birth/Death & Asset stock',
      descHi: 'परिवार जनगणना, जन्म-मृत्यु एवं पंचायत संपत्ति पंजी',
      icon: BookOpen,
      view: 'registers' as ActiveView,
      subTab: 'parivar',
    },
    {
      titleEn: 'Property Tax Payment',
      titleHi: 'संपत्ति / गृह कर भुगतान',
      descEn: 'Search Holding No, view annual assessment & pay tax online',
      descHi: 'होल्डिंग नंबर खोजें, वार्षिक कर देखें व ऑनलाइन भुगतान करें',
      icon: CreditCard,
      view: 'services' as ActiveView,
      subTab: 'tax',
    },
  ];

  const currentSlide = HERO_SLIDES[slideIdx];
  const utilizationPct = activeWard
    ? Math.min(100, Math.round((activeWard.spent_fund / Math.max(1, activeWard.allocated_fund)) * 100))
    : 0;

  return (
    <div className="space-y-8">
      {/* 5. HERO SECTION (Split 70% Carousel / 30% Official Leadership Cards like ldalucknow.in) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8 relative bg-slate-900 rounded border border-slate-200 overflow-hidden min-h-[320px] lg:min-h-[420px] flex flex-col justify-end">
          <img
            src={currentSlide.src}
            alt={lang === 'hi' ? currentSlide.titleHi : currentSlide.titleEn}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />

          <button
            type="button"
            onClick={() => setSlideIdx((slideIdx - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-[#0B2C59] text-white flex items-center justify-center transition-colors z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setSlideIdx((slideIdx + 1) % HERO_SLIDES.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-[#0B2C59] text-white flex items-center justify-center transition-colors z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="relative z-10 p-5 sm:p-6 text-white">
            <p className="text-xs text-amber-300 font-medium mb-1">
              {lang === 'hi' ? currentSlide.metaHi : currentSlide.metaEn}
            </p>
            <h2 className="text-lg sm:text-2xl font-bold leading-snug max-w-2xl text-balance">
              {lang === 'hi' ? currentSlide.titleHi : currentSlide.titleEn}
            </h2>
            <div className="flex items-center gap-2 mt-4">
              {HERO_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSlideIdx(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    idx === slideIdx ? 'w-7 bg-[#FF671F]' : 'w-2 bg-white/50 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <aside id="leadership" className="lg:col-span-4 bg-white border border-slate-200 rounded p-4 flex flex-col justify-between hc-surface">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
              <h2 className="text-sm font-bold text-[#0B2C59] uppercase tracking-wide hc-text">
                {tr.leadershipTitle}
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="text-xs font-semibold text-[#FF671F] hover:underline"
              >
                {lang === 'hi' ? 'पूर्ण परिचय →' : 'Full Profile →'}
              </button>
            </div>

            <div className="space-y-3">
              {LEADERSHIP.map((leader) => (
                <div
                  key={leader.nameEn}
                  className="flex items-center gap-3.5 p-2.5 rounded border border-slate-200 bg-[#F8FAFC] hc-surface"
                >
                  <div className="w-16 h-16 rounded overflow-hidden border border-slate-300 bg-slate-200 shrink-0 flex items-center justify-center">
                    <img
                      src={leader.photo}
                      alt={lang === 'hi' ? leader.nameHi : leader.nameEn}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate hc-text">
                      {lang === 'hi' ? leader.nameHi : leader.nameEn}
                    </h3>
                    <p className="text-xs font-semibold text-[#0B2C59] mt-0.5 hc-muted">
                      {lang === 'hi' ? leader.roleHi : leader.roleEn}
                    </p>
                    <p className="text-xs text-slate-600 mt-1 flex items-center gap-1 font-mono-tabular">
                      <Phone className="w-3 h-3 text-[#046A38]" />
                      <span>{leader.contact}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-600 hc-muted">
              {lang === 'hi' ? 'आगामी ग्राम सभा: 22 नवम्बर 2026' : 'Next Gram Sabha: 22 Nov 2026'}
            </span>
            <button
              type="button"
              onClick={() => onNavigate('sabha')}
              className="text-[#0B2C59] font-semibold hover:underline whitespace-nowrap shrink-0"
            >
              {lang === 'hi' ? 'कार्यसूची देखें →' : 'View Schedule →'}
            </button>
          </div>
        </aside>
      </section>

      {/* 4-Column Parishad Key Metrics Strip (Full-Width Row Below Hero Split) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Ramnagar Gram Parishad Key Statistics">
        <div className="bg-white border border-slate-200 rounded p-4 hc-surface">
          <div className="text-xs text-slate-500 font-medium">
            {lang === 'hi' ? 'कुल जनसंख्या एवं परिवार' : 'Parishad Population & Households'}
          </div>
          <div className="text-xl font-bold text-[#0B2C59] font-mono-tabular mt-1">
            {totalPopulation.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-600 mt-0.5 font-mono-tabular">
            {totalHouseholds.toLocaleString('en-IN')} Households · 15 Wards
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4 hc-surface">
          <div className="text-xs text-slate-500 font-medium">
            {lang === 'hi' ? 'वार्ड-वार आवंटित निधि (FY 26-27)' : 'Ward Fund Allocation (FY 26–27)'}
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono-tabular mt-1">
            {formatINR(totalAllocated)}
          </div>
          <div className="text-xs text-[#046A38] mt-0.5 font-mono-tabular font-semibold">
            {formatINR(totalSpent)} Utilized ({totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0}%)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4 hc-surface">
          <div className="text-xs text-slate-500 font-medium">
            {lang === 'hi' ? 'नल-जल एवं सोलर स्ट्रीट लाइट' : 'Saat Nischay Coverage'}
          </div>
          <div className="text-xl font-bold text-[#046A38] font-mono-tabular mt-1">100% Wards</div>
          <div className="text-xs text-slate-600 mt-0.5">Har Ghar Nal Ka Jal · 15/15 Wards</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4 hc-surface">
          <div className="text-xs text-slate-500 font-medium">
            {lang === 'hi' ? 'आरटीपीएस एवं जनता दरबार' : 'RTPS & Janta Darbar SLA'}
          </div>
          <div className="text-xl font-bold text-[#FF671F] font-mono-tabular mt-1">7–10 Days</div>
          <div className="text-xs text-slate-600 mt-0.5">QR-Verified Certificates · Free Service</div>
        </div>
      </section>

      {/* 6. Quick Citizen Services Grid */}
      <section aria-labelledby="quick-services-heading">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
          <div>
            <h2 id="quick-services-heading" className="text-lg sm:text-xl font-bold text-[#0B2C59] hc-text">
              {tr.quickServicesTitle}
            </h2>
            <p className="text-sm text-slate-600 mt-0.5 hc-muted">{tr.quickServicesSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('services', 'track')}
            className="text-xs font-semibold text-[#FF671F] hover:underline whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            {lang === 'hi' ? 'RTPS आवेदन ट्रैक / QR सत्यापन करें →' : 'Track RTPS Application / Verify QR →'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickServices.map((svc) => {
            const Icon = svc.icon;
            return (
              <button
                key={svc.titleEn}
                type="button"
                onClick={() => onNavigate(svc.view, svc.subTab)}
                className="group text-left bg-white border border-slate-200 hover:border-[#0B2C59] hover:shadow-md rounded p-4 transition-all duration-150 flex items-start gap-3.5 hc-surface"
              >
                <div className="w-11 h-11 rounded bg-[#0B2C59]/8 group-hover:bg-[#0B2C59] text-[#0B2C59] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0B2C59] hc-text">
                    {lang === 'hi' ? svc.titleHi : svc.titleEn}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed hc-muted">
                    {lang === 'hi' ? svc.descHi : svc.descEn}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 7. Tabbed Information & Notice Board + Interactive Ward 1-15 Map / Directory */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded p-5 hc-surface">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-4">
            <h2 className="text-base sm:text-lg font-bold text-[#0B2C59] hc-text">
              {tr.noticeBoardTitle}
            </h2>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200" role="tablist">
              {(
                [
                  { id: 'notice', label: tr.tabs.notices },
                  { id: 'tender', label: tr.tabs.tenders },
                  { id: 'resolution', label: tr.tabs.resolutions },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={noticeTab === tab.id}
                  onClick={() => setNoticeTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                    noticeTab === tab.id
                      ? 'bg-[#0B2C59] text-white'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {filteredNotices.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                {lang === 'hi' ? 'इस श्रेणी में कोई सूचना उपलब्ध नहीं है।' : 'No entries found in this category.'}
              </p>
            ) : (
              filteredNotices.map((item) => (
                <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-mono-tabular font-semibold text-[#0B2C59]">{item.ref_no}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.department}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{item.published_date}</span>
                      {item.closing_date && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#FF671F] font-medium">
                            {lang === 'hi' ? `अंतिम तिथि: ${item.closing_date}` : `Closing: ${item.closing_date}`}
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 leading-snug hc-text">
                      {lang === 'hi' ? item.title_hi : item.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 hc-muted">
                      {lang === 'hi' ? item.summary_hi : item.summary}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectNotice(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:border-[#0B2C59] hover:bg-slate-50 rounded text-xs font-semibold text-[#0B2C59] whitespace-nowrap shrink-0 self-start"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'विवरण पढ़ें' : 'Read Notice'}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div id="ward-directory" className="lg:col-span-5 bg-white border border-slate-200 rounded p-5 hc-surface">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <h2 className="text-base sm:text-lg font-bold text-[#0B2C59] hc-text">
              {tr.wardMapTitle}
            </h2>
            <span className="text-xs text-slate-500 font-mono-tabular">15 Wards · {totalHouseholds.toLocaleString('en-IN')} Houses</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 mb-4" role="group" aria-label="Select Ward 1 to 15">
            {wards.map((w) => {
              const selected = w.ward_no === selectedWardNo;
              return (
                <button
                  key={w.ward_no}
                  type="button"
                  onClick={() => setSelectedWardNo(w.ward_no)}
                  className={`py-2 px-1 rounded text-center border text-xs font-semibold transition-colors font-mono-tabular ${
                    selected
                      ? 'bg-[#0B2C59] text-white border-[#0B2C59]'
                      : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:border-[#0B2C59]'
                  }`}
                >
                  W-{String(w.ward_no).padStart(2, '0')}
                </button>
              );
            })}
          </div>

          {activeWard && (
            <div className="bg-[#F8FAFC] border border-slate-200 rounded p-4 space-y-3 hc-surface">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-[#FF671F] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'hi' ? `वार्ड संख्या ${activeWard.ward_no}` : `Ward No. ${String(activeWard.ward_no).padStart(2, '0')}`}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5 hc-text">
                    {lang === 'hi' ? activeWard.ward_name_hi : activeWard.ward_name}
                  </h3>
                </div>
                <div className="text-right text-xs text-slate-600 font-mono-tabular">
                  <div>{activeWard.households} {lang === 'hi' ? 'परिवार' : 'Households'}</div>
                  <div>{activeWard.population} {lang === 'hi' ? 'जनसंख्या' : 'Pop.'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">{lang === 'hi' ? 'वार्ड सदस्य' : 'Ward Sadasya'}</span>
                  <span className="font-semibold text-slate-900 hc-text">{activeWard.member_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{lang === 'hi' ? 'संपर्क सूत्र' : 'Contact'}</span>
                  <span className="font-mono-tabular font-semibold text-[#0B2C59]">{activeWard.member_phone}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">
                    {lang === 'hi' ? 'वार्ड निधि उपयोग (FY 2026-27)' : 'Ward Fund Utilization (FY 2026–27)'}
                  </span>
                  <span className="font-mono-tabular font-bold text-[#046A38]">
                    {formatINR(activeWard.spent_fund)} / {formatINR(activeWard.allocated_fund)} ({utilizationPct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#046A38]" style={{ width: `${utilizationPct}%` }} />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs">
                <span className="text-slate-500 flex items-center gap-1 mb-0.5">
                  <Building2 className="w-3.5 h-3.5 text-[#0B2C59]" />
                  <span>{lang === 'hi' ? 'प्रमुख चालू योजना' : 'Ongoing Ward Project'}</span>
                </span>
                <p className="font-semibold text-slate-800 hc-text">
                  {lang === 'hi' ? activeWard.ongoing_project_hi : activeWard.ongoing_project}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Important Integrated E-Governance Modules Strip */}
      <section className="bg-white border border-slate-200 rounded p-5 hc-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-4">
          <h2 className="text-sm font-bold text-[#0B2C59] uppercase tracking-wide hc-text">
            {lang === 'hi' ? 'प्रमुख ई-गवर्नेंस पोर्टल एवं सेवा लिंक' : 'Integrated E-Governance Modules & Portals'}
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('downloads')}
            className="text-xs font-semibold text-[#0B2C59] hover:underline whitespace-nowrap shrink-0"
          >
            {lang === 'hi' ? 'सभी आवेदन प्रपत्र डाउनलोड करें →' : 'Download Statutory Forms →'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {GOV_PORTALS.map((gp) => (
            <button
              key={gp.name}
              type="button"
              onClick={() => onNavigate(gp.view, gp.subTab)}
              className="text-left p-3 rounded border border-slate-200 bg-[#F8FAFC] hover:border-[#0B2C59] hover:bg-white transition-colors"
            >
              <div className="flex items-center justify-between gap-1 text-xs font-bold text-[#0B2C59]">
                <span className="truncate">{gp.name}</span>
                <ExternalLink className="w-3 h-3 shrink-0 text-[#FF671F]" />
              </div>
              <div className="text-[11px] text-slate-500 mt-1 truncate">{gp.subtitle}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
