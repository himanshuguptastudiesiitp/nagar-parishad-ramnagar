import { useEffect, useState } from 'react';
import { Calendar, Download, Gavel, Users } from 'lucide-react';
import type { GramKatchahryCase, GramSabhaMeeting, Language } from '../types';
import { apiFetch, generateGramSabhaMomPDF } from '../utils/api';

interface SabhaAndKatchahryViewProps {
  lang: Language;
  initialTab?: string;
}

export function SabhaAndKatchahryView({ lang, initialTab = 'sabha' }: SabhaAndKatchahryViewProps) {
  const [tab, setTab] = useState<'sabha' | 'katchahry'>(initialTab === 'katchahry' ? 'katchahry' : 'sabha');
  const [meetings, setMeetings] = useState<GramSabhaMeeting[]>([]);
  const [cases, setCases] = useState<GramKatchahryCase[]>([]);

  useEffect(() => {
    if (initialTab === 'katchahry' || initialTab === 'sabha') {
      setTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    Promise.all([
      apiFetch<GramSabhaMeeting[]>('/api/gram-sabha'),
      apiFetch<GramKatchahryCase[]>('/api/gram-katchahry'),
    ]).then(([m, k]) => {
      setMeetings(m);
      setCases(k);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hc-surface">
        <div>
          <p className="text-xs font-semibold text-[#FF671F] uppercase tracking-wide">
            {lang === 'hi' ? 'लोकतांत्रिक सहभागिता एवं ग्राम न्याय पीठ' : 'Participatory Governance & Village Court'}
          </p>
          <h2 className="text-xl font-bold text-[#0B2C59] mt-0.5 hc-text">
            {lang === 'hi' ? 'ग्राम सभा कार्यवाही एवं ग्राम कचहरी वाद सूची' : 'Gram Sabha Proceedings & Gram Katchahry Docket'}
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200">
          <button
            type="button"
            onClick={() => setTab('sabha')}
            className={`px-4 py-2 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
              tab === 'sabha' ? 'bg-[#0B2C59] text-white' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            {lang === 'hi' ? 'ग्राम सभा एवं कार्यवाही (MoM)' : 'Gram Sabha & Minutes (MoM)'}
          </button>
          <button
            type="button"
            onClick={() => setTab('katchahry')}
            className={`px-4 py-2 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
              tab === 'katchahry' ? 'bg-[#0B2C59] text-white' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            {lang === 'hi' ? 'ग्राम कचहरी (न्याय पीठ)' : 'Gram Katchahry (Village Court)'}
          </button>
        </div>
      </div>

      {tab === 'sabha' && (
        <div className="space-y-4">
          {meetings.map((m) => (
            <article key={m.id} className="bg-white border border-slate-200 rounded p-5 space-y-3 hc-surface">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono-tabular font-bold text-[#0B2C59]">{m.meeting_no}</span>
                    <span aria-hidden="true">·</span>
                    <span className={`font-semibold ${m.status === 'Completed' ? 'text-[#046A38]' : 'text-[#FF671F]'}`}>
                      {m.status}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-mono-tabular">
                      <Calendar className="w-3.5 h-3.5" />
                      {m.meeting_date} · {m.meeting_time}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1 hc-text">
                    {lang === 'hi' ? m.title_hi : m.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Venue: {m.venue} · Presiding: {m.presiding_officer}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-xs">
                    <div className="text-slate-500 flex items-center justify-end gap-1">
                      <Users className="w-3.5 h-3.5 text-[#0B2C59]" />
                      <span>Attendance / Quorum</span>
                    </div>
                    <div className="font-mono-tabular font-bold text-slate-900">
                      {m.attendance_count} / {m.quorum_required} Required
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => generateGramSabhaMomPDF(m)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0B2C59] hover:bg-[#071E3D] text-white text-xs font-semibold rounded whitespace-nowrap shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MoM PDF</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="bg-[#F8FAFC] border border-slate-200 rounded p-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[#0B2C59] mb-1.5">
                    Meeting Agenda (कार्यसूची)
                  </h4>
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed">{m.agenda}</p>
                </div>
                <div className="bg-[#F8FAFC] border border-slate-200 rounded p-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[#046A38] mb-1.5">
                    Minutes & Resolutions (कार्यवाही एवं निर्णय)
                  </h4>
                  <p className="text-slate-700 leading-relaxed">{m.minutes_summary}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === 'katchahry' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-[#0B2C59] flex items-center gap-2 hc-text">
                <Gavel className="w-4 h-4 text-[#FF671F]" />
                <span>{lang === 'hi' ? 'ग्राम कचहरी वाद एवं निर्णय पंजिका' : 'Gram Katchahry (Village Court) Case Docket'}</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Presided by Hon&apos;ble Sarpanch Shri Ramashray Mahto & Elected Panch Bench under Bihar Panchayati Raj Act, 2006
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Case No</th>
                  <th className="py-2.5 px-3">Parties (Petitioner vs Respondent)</th>
                  <th className="py-2.5 px-3">Ward</th>
                  <th className="py-2.5 px-3">Dispute Nature</th>
                  <th className="py-2.5 px-3">Filing / Hearing</th>
                  <th className="py-2.5 px-3">Status & Judgment Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 align-top">
                    <td className="py-3 px-3 font-mono-tabular font-bold text-[#0B2C59] whitespace-nowrap">{c.case_no}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{c.petitioner}</div>
                      <div className="text-xs text-slate-500">vs. {c.respondent}</div>
                    </td>
                    <td className="py-3 px-3 font-mono-tabular">W-{String(c.ward_no).padStart(2, '0')}</td>
                    <td className="py-3 px-3 text-slate-800">{c.dispute_type}</td>
                    <td className="py-3 px-3 font-mono-tabular text-xs text-slate-600">
                      <div>Filed: {c.filing_date}</div>
                      {c.next_hearing_date && <div className="text-[#FF671F] font-semibold">Next: {c.next_hearing_date}</div>}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-xs font-bold ${
                          c.status === 'Judgment Delivered' || c.status === 'Compromise Reached'
                            ? 'text-[#046A38]'
                            : 'text-[#D97706]'
                        }`}
                      >
                        {c.status}
                      </span>
                      <p className="text-xs text-slate-600 mt-1">{c.judgment_summary}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
