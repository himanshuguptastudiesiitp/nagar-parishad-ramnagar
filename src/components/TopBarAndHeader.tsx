import { useState } from 'react';
import {
  ChevronDown,
  Contrast,
  Globe,
  LogIn,
  LogOut,
  Menu,
  Pause,
  Phone,
  Play,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { ActiveView, AuthUser, Language, Notice } from '../types';
import { t } from '../utils/i18n';

interface TopBarAndHeaderProps {
  lang: Language;
  setLang: (l: Language) => void;
  fontSizeScale: number;
  setFontSizeScale: (s: number) => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  activeView: ActiveView;
  onNavigate: (view: ActiveView, subTab?: string) => void;
  staffUser: AuthUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  tickerNotices: Notice[];
  onSelectNotice: (n: Notice) => void;
}

export function TopBarAndHeader({
  lang,
  setLang,
  fontSizeScale,
  setFontSizeScale,
  highContrast,
  setHighContrast,
  activeView,
  onNavigate,
  staffUser,
  onOpenLogin,
  onLogout,
  tickerNotices,
  onSelectNotice,
}: TopBarAndHeaderProps) {
  const tr = t(lang);
  const [tickerPaused, setTickerPaused] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: {
    id: string;
    label: string;
    view: ActiveView;
    children?: { label: string; view: ActiveView; subTab?: string }[];
  }[] = [
    { id: 'home', label: tr.nav.home, view: 'home' },
    {
      id: 'about',
      label: tr.nav.about,
      view: 'about',
      children: [
        { label: lang === 'hi' ? 'परिषद प्रोफ़ाइल एवं पदाधिकारी' : 'Parishad Profile & Functionaries', view: 'about' },
        { label: lang === 'hi' ? 'वार्ड निर्देशिका (1 से 15)' : 'Ward Directory (Wards 1–15)', view: 'home', subTab: 'wards' },
        { label: lang === 'hi' ? 'नागरिक चार्टर एवं फोटो दीर्घा' : 'Citizen Charter & Gallery', view: 'about' },
        { label: lang === 'hi' ? 'परिवार एवं परिसंपत्ति पंजी' : 'Parivar & Asset Registers', view: 'registers', subTab: 'parivar' },
      ],
    },
    {
      id: 'services',
      label: tr.nav.services,
      view: 'services',
      children: [
        { label: lang === 'hi' ? 'प्रमाण पत्र आवेदन (RTPS)' : 'Apply for Certificates (RTPS)', view: 'services', subTab: 'apply' },
        { label: lang === 'hi' ? 'आवेदन स्थिति एवं QR सत्यापन' : 'Track Application & QR Verify', view: 'services', subTab: 'track' },
        { label: lang === 'hi' ? 'ऑनलाइन संपत्ति कर भुगतान' : 'Property / House Tax Payment', view: 'services', subTab: 'tax' },
        { label: lang === 'hi' ? 'मुद्रण योग्य आवेदन प्रपत्र (PDF)' : 'Downloadable Blank Forms (PDF)', view: 'downloads' },
      ],
    },
    {
      id: 'schemes',
      label: tr.nav.schemes,
      view: 'schemes',
      children: [
        { label: lang === 'hi' ? 'सात निश्चय (नल-जल / सोलर लाइट)' : 'Saat Nischay (Nal-Jal & Solar)', view: 'schemes', subTab: 'Saat Nischay' },
        { label: lang === 'hi' ? 'पीएम आवास योजना (PMAY-G)' : 'PMAY-G Housing Beneficiaries', view: 'schemes', subTab: 'PMAY-G' },
        { label: lang === 'hi' ? 'मनरेगा एवं पेंशन / राशन' : 'MGNREGA, Pensions & PDS Ration', view: 'schemes', subTab: 'All' },
      ],
    },
    {
      id: 'works',
      label: tr.nav.works,
      view: 'funds',
      children: [
        { label: lang === 'hi' ? 'सार्वजनिक विकास कार्य रजिस्टर' : 'Public Works & Asset Register', view: 'funds', subTab: 'works' },
        { label: lang === 'hi' ? 'निविदा एवं कोटेशन सूचना' : 'Tenders & Quotations Board', view: 'home', subTab: 'tenders' },
      ],
    },
    {
      id: 'funds',
      label: tr.nav.funds,
      view: 'funds',
      children: [
        { label: lang === 'hi' ? '15वां वित्त एवं राज्य वित्त अनुदान' : '15th FC, SFC & Grant Tracker', view: 'funds', subTab: 'overview' },
        { label: lang === 'hi' ? 'डिजिटल कैशबुक (आय-व्यय)' : 'Digital Cashbook Ledger', view: 'funds', subTab: 'cashbook' },
        { label: lang === 'hi' ? 'वार्ड-वार RTI व्यय चार्ट' : 'Public RTI Ward Expenditure Chart', view: 'funds', subTab: 'rti' },
        { label: lang === 'hi' ? 'RTI अधिकारी एवं डाउनलोड प्रकोष्ठ' : 'RTI Officers & Statutory Forms', view: 'downloads' },
      ],
    },
    {
      id: 'sabha',
      label: tr.nav.sabha,
      view: 'sabha',
      children: [
        { label: lang === 'hi' ? 'ग्राम सभा अनुसूची एवं कार्यवाही' : 'Gram Sabha & Minutes (MoM)', view: 'sabha', subTab: 'sabha' },
        { label: lang === 'hi' ? 'ग्राम कचहरी (न्याय पीठ)' : 'Gram Katchahry (Village Court)', view: 'sabha', subTab: 'katchahry' },
        { label: lang === 'hi' ? 'अनिवार्य डिजिटल पंजियाँ' : 'Mandatory Digital Registers', view: 'registers', subTab: 'parivar' },
      ],
    },
    { id: 'grievance', label: tr.nav.grievance, view: 'grievance' },
  ];

  const handleNavAction = (view: ActiveView, subTab?: string) => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    onNavigate(view, subTab);
  };

  return (
    <div className="w-full">
      {/* Top Tricolor Thin Institutional Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF671F] via-[#FFFFFF] to-[#046A38]" />

      {/* 1. Top Utility Bar */}
      <div className="bg-[#071E3D] text-slate-100 text-xs border-b border-slate-800">
        <div className="max-w-[1380px] mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="font-medium tracking-wide text-slate-100 whitespace-nowrap">
              {tr.govBanner}
            </span>
            <span className="hidden sm:inline text-slate-500" aria-hidden="true">|</span>
            <a
              href="#main-content"
              className="hidden sm:inline text-slate-300 hover:text-white underline underline-offset-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#FF671F]"
            >
              {tr.skipContent}
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Font Resizer A- A A+ */}
            <div className="flex items-center border border-slate-700 rounded overflow-hidden" role="group" aria-label="Font size controls">
              <button
                type="button"
                onClick={() => setFontSizeScale(Math.max(0.9, Number((fontSizeScale - 0.05).toFixed(2))))}
                className="px-2 py-1 hover:bg-slate-800 text-slate-200 transition-colors whitespace-nowrap shrink-0"
                title="Decrease Font Size"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSizeScale(1)}
                className="px-2 py-1 border-x border-slate-700 hover:bg-slate-800 text-white font-semibold transition-colors whitespace-nowrap shrink-0"
                title="Reset Font Size"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSizeScale(Math.min(1.15, Number((fontSizeScale + 0.05).toFixed(2))))}
                className="px-2 py-1 hover:bg-slate-800 text-slate-200 transition-colors whitespace-nowrap shrink-0"
                title="Increase Font Size"
              >
                A+
              </button>
            </div>

            {/* High Contrast Toggle */}
            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              className="flex items-center gap-1.5 px-2.5 py-1 border border-slate-700 rounded hover:bg-slate-800 text-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              <Contrast className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{highContrast ? tr.normalContrast : tr.highContrast}</span>
            </button>

            {/* English / हिंदी Switcher */}
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-white font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-[#FF671F]" />
              <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            {/* Staff / Official Login or Signed-in Control */}
            {staffUser ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNavAction('staff')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#046A38] hover:bg-emerald-800 text-white font-semibold rounded transition-colors whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{staffUser.role.toUpperCase()} · {tr.staffWorkspace}</span>
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-red-900/70 border border-slate-700 text-slate-200 rounded transition-colors whitespace-nowrap shrink-0"
                  title={tr.logout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tr.logout}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#FF671F] hover:bg-[#e55814] text-white font-semibold rounded transition-colors whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{tr.staffLogin}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Header Banner */}
      <header className="bg-white border-b border-slate-200 hc-surface">
        <div className="max-w-[1380px] mx-auto px-4 py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Official Bihar Emblem + Panchayat Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 shrink-0 rounded-full border border-slate-200 bg-[#F8FAFC] flex items-center justify-center p-1.5">
              {/* Clean Institutional State Emblem SVG */}
              <svg viewBox="0 0 64 64" className="w-full h-full text-[#0B2C59]" fill="none" aria-label="Bihar Panchayati Raj Emblem">
                <circle cx="32" cy="32" r="29" stroke="currentColor" strokeWidth="2.2" />
                <circle cx="32" cy="32" r="24" stroke="#FF671F" strokeWidth="1.2" strokeDasharray="3 2" />
                <circle cx="32" cy="32" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M32 14v9M32 41v9M14 32h9M41 32h9M19.3 19.3l6.4 6.4M38.3 38.3l6.4 6.4M44.7 19.3l-6.4 6.4M25.7 38.3l-6.4 6.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M22 48h20" stroke="#046A38" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FF671F]">
                {lang === 'hi' ? 'पंचायती राज विभाग · बिहार सरकार' : 'Panchayati Raj Department · Govt. of Bihar'}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0B2C59] leading-tight hc-text">
                {tr.panchayatTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 hc-muted">
                {tr.panchayatSubtitle}
              </p>
            </div>
          </div>

          {/* Right: Partner Mission Marks & Helpline */}
          <div className="flex flex-wrap items-center gap-4 lg:gap-6">
            <div className="hidden sm:flex items-center gap-4 border-r border-slate-200 pr-5">
              <div className="text-center">
                <div className="text-[11px] font-bold text-[#046A38] tracking-tight">SWACHH BHARAT</div>
                <div className="text-[10px] text-slate-500">स्वच्छ ग्राम · रामनगर</div>
              </div>
              <div className="h-7 w-px bg-slate-200" />
              <div className="text-center">
                <div className="text-[11px] font-bold text-[#0B2C59] tracking-tight">DIGITAL INDIA</div>
                <div className="text-[10px] text-slate-500">RTPS Bihar Online</div>
              </div>
              <div className="h-7 w-px bg-slate-200" />
              <div className="text-center">
                <div className="text-[11px] font-bold text-[#FF671F] tracking-tight">e-GRAMSWARAJ</div>
                <div className="text-[10px] text-slate-500">GPDP 2026–27</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded bg-[#0B2C59]/10 text-[#0B2C59] flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">{tr.helplineLabel}</div>
                <div className="text-sm font-bold text-[#0B2C59] font-mono-tabular">1800-345-6115 / 06256-242110</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Sticky Primary Navigation Bar (Deep Navy with Saffron Accent) */}
      <nav className="sticky top-0 z-40 bg-[#0B2C59] text-white shadow-sm border-b-2 border-[#FF671F]" aria-label="Primary Navigation">
        <div className="max-w-[1380px] mx-auto px-4 flex items-center justify-between">
          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center justify-between w-full py-2.5">
            <span className="text-sm font-semibold tracking-wide">
              {lang === 'hi' ? 'मेनू' : 'Portal Navigation'}
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded hover:bg-[#071E3D] text-white"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Desktop Horizontal Navigation */}
          <ul className="hidden lg:flex items-center gap-1 w-full">
            {navItems.map((item) => {
              const isActive =
                (item.id === 'home' && activeView === 'home') ||
                (item.id === 'about' && activeView === 'about') ||
                (item.id === 'services' && activeView === 'services') ||
                (item.id === 'schemes' && activeView === 'schemes') ||
                ((item.id === 'funds' || item.id === 'works') && (activeView === 'funds' || activeView === 'downloads')) ||
                (item.id === 'sabha' && (activeView === 'sabha' || activeView === 'registers')) ||
                (item.id === 'grievance' && activeView === 'grievance');

              return (
                <li
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => item.children && setOpenDropdown(item.id)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (item.children) {
                        setOpenDropdown(openDropdown === item.id ? null : item.id);
                      } else {
                        handleNavAction(item.view);
                      }
                    }}
                    className={`flex items-center gap-1 px-3 py-3 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                      isActive
                        ? 'bg-[#071E3D] text-white border-[#FF671F]'
                        : 'text-slate-100 hover:bg-[#133b73] border-transparent'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.children && <ChevronDown className="w-3.5 h-3.5 opacity-80" />}
                  </button>

                  {item.children && openDropdown === item.id && (
                    <div className="absolute left-0 top-full w-64 bg-white text-slate-900 border border-slate-200 shadow-lg z-50 py-1">
                      {item.children.map((sub) => (
                        <button
                          key={sub.label}
                          type="button"
                          onClick={() => handleNavAction(sub.view, sub.subTab)}
                          className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0B2C59] border-b border-slate-100 last:border-b-0 transition-colors"
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}

            {staffUser && (
              <li className="ml-auto">
                <button
                  type="button"
                  onClick={() => handleNavAction('staff')}
                  className={`px-3.5 py-3 text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    activeView === 'staff' ? 'bg-[#046A38] text-white' : 'bg-[#046A38]/90 hover:bg-[#046A38] text-white'
                  }`}
                >
                  {tr.staffWorkspace}
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#071E3D] border-t border-slate-700 px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <div key={item.id} className="border-b border-slate-800 pb-1">
                <button
                  type="button"
                  onClick={() => handleNavAction(item.view)}
                  className="w-full text-left py-2 text-sm font-medium text-white"
                >
                  {item.label}
                </button>
                {item.children && (
                  <div className="pl-3 space-y-1 pb-1">
                    {item.children.map((sub) => (
                      <button
                        key={sub.label}
                        type="button"
                        onClick={() => handleNavAction(sub.view, sub.subTab)}
                        className="block w-full text-left py-1 text-xs text-slate-300 hover:text-white"
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {staffUser && (
              <button
                type="button"
                onClick={() => handleNavAction('staff')}
                className="w-full text-left py-2 text-sm font-semibold text-emerald-300"
              >
                {tr.staffWorkspace}
              </button>
            )}
          </div>
        )}
      </nav>

      {/* 4. Running News Ticker ("Latest Updates / नवीनतम सूचनाएं") */}
      <div className="bg-white border-b border-slate-200 hc-surface">
        <div className="max-w-[1380px] mx-auto px-4 flex items-center gap-3 py-2">
          <div className="bg-[#FF671F] text-white text-xs font-bold px-3 py-1.5 rounded-sm whitespace-nowrap shrink-0">
            {tr.latestUpdates}
          </div>

          <div className="flex-1 overflow-hidden relative">
            <div className={`animate-gov-marquee ${tickerPaused ? 'paused' : ''}`}>
              {[...tickerNotices, ...tickerNotices].map((notice, idx) => (
                <button
                  key={`${notice.id}-${idx}`}
                  type="button"
                  onClick={() => onSelectNotice(notice)}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-800 hover:text-[#0B2C59] hover:underline font-medium mr-10 whitespace-nowrap hc-text"
                >
                  <span className="text-[#FF671F] font-mono-tabular font-semibold">[{notice.published_date}]</span>
                  <span>{lang === 'hi' ? notice.title_hi : notice.title}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTickerPaused(!tickerPaused)}
            className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0"
            aria-label={tickerPaused ? tr.play : tr.pause}
          >
            {tickerPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{tickerPaused ? tr.play : tr.pause}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
