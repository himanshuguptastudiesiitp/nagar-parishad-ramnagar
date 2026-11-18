import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { AboutParishadView } from './components/AboutParishadView';
import { CitizenServicesView } from './components/CitizenServicesView';
import { DownloadsAndRtiView } from './components/DownloadsAndRtiView';
import { FundsAndWorksView } from './components/FundsAndWorksView';
import { HomeLandingView } from './components/HomeLandingView';
import { JantaDarbarView, MandatoryRegistersView } from './components/RegistersAndGrievanceView';
import { SabhaAndKatchahryView } from './components/SabhaAndKatchahryView';
import { StaffDashboardView } from './components/StaffDashboardView';
import { StaffLoginModal } from './components/StaffLoginModal';
import { TopBarAndHeader } from './components/TopBarAndHeader';
import { WelfareSchemesView } from './components/WelfareSchemesView';
import type { ActiveView, AuthUser, Language, Notice, PortalMeta, Ward } from './types';
import { apiFetch, clearStoredSession, getStoredToken, getStoredUser } from './utils/api';
import { t } from './utils/i18n';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [fontSizeScale, setFontSizeScale] = useState<number>(1);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [subTab, setSubTab] = useState<string | undefined>(undefined);

  const [wards, setWards] = useState<Ward[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [meta, setMeta] = useState<PortalMeta>({ visitor_count: 14928, last_updated: '2026-11-16' });

  const [staffUser, setStaffUser] = useState<AuthUser | null>(() => getStoredUser<AuthUser>());
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  useEffect(() => {
    document.documentElement.style.fontSize = `${Math.round(fontSizeScale * 16)}px`;
  }, [fontSizeScale]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    loadInitialData();
    if (getStoredToken()) {
      apiFetch<{ user: AuthUser }>('/api/auth/me')
        .then((res) => setStaffUser(res.user))
        .catch(() => {
          clearStoredSession();
          setStaffUser(null);
        });
    }
  }, []);

  async function loadInitialData() {
    try {
      const [w, n, m] = await Promise.all([
        apiFetch<Ward[]>('/api/wards'),
        apiFetch<Notice[]>('/api/notices'),
        apiFetch<PortalMeta>('/api/portal-meta?visit=1'),
      ]);
      setWards(w);
      setNotices(n);
      setMeta(m);
    } catch {
      // handled cleanly
    }
  }

  function handleNavigate(view: ActiveView, nextSubTab?: string) {
    setActiveView(view);
    setSubTab(nextSubTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'home' && nextSubTab === 'leadership') {
      setTimeout(() => document.getElementById('leadership')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else if (view === 'home' && nextSubTab === 'wards') {
      setTimeout(() => document.getElementById('ward-directory')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }

  function handleLogout() {
    clearStoredSession();
    setStaffUser(null);
    if (activeView === 'staff') {
      setActiveView('home');
    }
  }

  const tr = t(lang);
  const tickerNotices = notices.filter((n) => n.is_ticker === 1);
  const homeNoticeTab: 'notice' | 'tender' | 'resolution' =
    subTab === 'tenders' ? 'tender' : subTab === 'resolutions' ? 'resolution' : 'notice';

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] text-slate-900">
      <TopBarAndHeader
        lang={lang}
        setLang={setLang}
        fontSizeScale={fontSizeScale}
        setFontSizeScale={setFontSizeScale}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        activeView={activeView}
        onNavigate={handleNavigate}
        staffUser={staffUser}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        tickerNotices={tickerNotices.length > 0 ? tickerNotices : notices.slice(0, 3)}
        onSelectNotice={(n) => setSelectedNotice(n)}
      />

      <main id="main-content" className="flex-1 max-w-[1380px] w-full mx-auto px-4 py-6">
        {activeView === 'home' && (
          <HomeLandingView
            lang={lang}
            wards={wards}
            notices={notices}
            initialNoticeTab={homeNoticeTab}
            onNavigate={handleNavigate}
            onSelectNotice={(n) => setSelectedNotice(n)}
          />
        )}

        {activeView === 'about' && (
          <AboutParishadView lang={lang} wards={wards} onNavigate={handleNavigate} />
        )}

        {activeView === 'services' && (
          <CitizenServicesView lang={lang} initialTab={subTab} onRefreshData={loadInitialData} />
        )}

        {activeView === 'schemes' && <WelfareSchemesView lang={lang} initialCategory={subTab} />}

        {activeView === 'funds' && <FundsAndWorksView lang={lang} wards={wards} initialTab={subTab} />}

        {activeView === 'sabha' && <SabhaAndKatchahryView lang={lang} initialTab={subTab} />}

        {activeView === 'registers' && <MandatoryRegistersView lang={lang} initialTab={subTab} />}

        {activeView === 'grievance' && <JantaDarbarView lang={lang} />}

        {activeView === 'downloads' && <DownloadsAndRtiView lang={lang} onNavigate={handleNavigate} />}

        {activeView === 'staff' && staffUser && (
          <StaffDashboardView lang={lang} staffUser={staffUser} onRefreshGlobal={loadInitialData} />
        )}
      </main>

      {/* 9. Government Footer */}
      <footer className="bg-[#071E3D] text-slate-200 border-t-4 border-[#FF671F] mt-10">
        <div className="max-w-[1380px] mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
          <div className="md:col-span-5 space-y-2">
            <h3 className="text-sm font-bold text-white">{tr.panchayatTitle}</h3>
            <p className="text-slate-300 leading-relaxed">{tr.footerDisclaimer}</p>
            <p className="text-slate-400">
              Office Address: Ramnagar Gram Parishad Bhawan, Block Ramnagar, District West Champaran, Bihar - 845106
            </p>
          </div>

          <div className="md:col-span-4 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="font-bold text-white uppercase tracking-wide mb-2">Citizen Links</div>
              <button type="button" onClick={() => handleNavigate('about')} className="block hover:text-white text-slate-300">
                About Gram Parishad
              </button>
              <button type="button" onClick={() => handleNavigate('services', 'apply')} className="block hover:text-white text-slate-300">
                RTPS Certificate Desk
              </button>
              <button type="button" onClick={() => handleNavigate('schemes', 'All')} className="block hover:text-white text-slate-300">
                Beneficiary Search
              </button>
              <button type="button" onClick={() => handleNavigate('grievance')} className="block hover:text-white text-slate-300">
                Janta Darbar Portal
              </button>
              <button type="button" onClick={() => handleNavigate('registers', 'parivar')} className="block hover:text-white text-slate-300">
                Parivar Register
              </button>
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-white uppercase tracking-wide mb-2">RTI & Governance</div>
              <button type="button" onClick={() => handleNavigate('funds', 'rti')} className="block hover:text-white text-slate-300">
                Section 4(1)(b) RTI Funds
              </button>
              <button type="button" onClick={() => handleNavigate('funds', 'cashbook')} className="block hover:text-white text-slate-300">
                Digital Cashbook
              </button>
              <button type="button" onClick={() => handleNavigate('sabha', 'sabha')} className="block hover:text-white text-slate-300">
                Gram Sabha Minutes
              </button>
              <button type="button" onClick={() => handleNavigate('sabha', 'katchahry')} className="block hover:text-white text-slate-300">
                Gram Katchahry Docket
              </button>
              <button type="button" onClick={() => handleNavigate('downloads')} className="block hover:text-white text-slate-300">
                Forms & RTI Officers
              </button>
            </div>
          </div>

          <div className="md:col-span-3 space-y-2 md:text-right">
            <div className="font-bold text-white uppercase tracking-wide">Portal Statistics</div>
            <div className="font-mono-tabular text-slate-300">
              Total Visitors: <strong className="text-white">{meta.visitor_count.toLocaleString('en-IN')}</strong>
            </div>
            <div className="font-mono-tabular text-slate-300">
              Last Updated: <strong className="text-white">{meta.last_updated}</strong>
            </div>
            <div className="text-[11px] text-slate-400 pt-1">
              Standardized under Bihar Panchayati Raj E-Governance Framework
            </div>
          </div>
        </div>
        <div className="bg-[#041429] py-2.5 px-4 text-center text-[11px] text-slate-400 border-t border-slate-800">
          © 2026 Ramnagar Gram Parishad, Block Ramnagar, District West Champaran, Government of Bihar. All Rights Reserved.
        </div>
      </footer>

      {/* Staff Login Modal */}
      <StaffLoginModal
        lang={lang}
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={(user) => {
          setStaffUser(user);
          setActiveView('staff');
        }}
      />

      {/* Notice / Tender / Resolution Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white border border-slate-200 rounded w-full max-w-lg shadow-xl overflow-hidden">
            <div className="bg-[#0B2C59] text-white px-5 py-3 flex items-center justify-between">
              <span className="font-mono-tabular text-xs font-bold">{selectedNotice.ref_no}</span>
              <button type="button" onClick={() => setSelectedNotice(null)} className="p-1 hover:bg-slate-800 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="uppercase font-bold text-[#FF671F]">{selectedNotice.type}</span>
                <span>·</span>
                <span>{selectedNotice.department}</span>
                <span>·</span>
                <span className="font-mono-tabular">Published: {selectedNotice.published_date}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'hi' ? selectedNotice.title_hi : selectedNotice.title}
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {lang === 'hi' ? selectedNotice.summary_hi : selectedNotice.summary}
              </p>
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Issued by: {selectedNotice.created_by}</span>
                <button
                  type="button"
                  onClick={() => setSelectedNotice(null)}
                  className="px-3.5 py-1.5 bg-[#0B2C59] text-white font-semibold rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
