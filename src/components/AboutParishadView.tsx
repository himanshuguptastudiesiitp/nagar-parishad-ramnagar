import { Building2, Clock, FileCheck2, MapPin, Phone, ShieldCheck, Users } from 'lucide-react';
import type { ActiveView, Language, Ward } from '../types';

interface AboutParishadViewProps {
  lang: Language;
  wards: Ward[];
  onNavigate: (view: ActiveView, subTab?: string) => void;
}

const PARISHAD_FUNCTIONARIES = [
  {
    nameEn: 'Shri Suresh Prasad Singh',
    nameHi: 'श्री सुरेश प्रसाद सिंह',
    designationEn: 'Mukhiya (Head of Gram Parishad)',
    designationHi: 'मुखिया (ग्राम परिषद प्रमुख)',
    office: 'Parishad Bhawan Chamber 01',
    phone: '+91 94310-88201',
  },
  {
    nameEn: 'Smt. Fulmati Devi',
    nameHi: 'श्रीमती फूलमती देवी',
    designationEn: 'Up-Mukhiya (Deputy Head)',
    designationHi: 'उप-मुखिया',
    office: 'Parishad Bhawan Chamber 02',
    phone: '+91 94310-88205',
  },
  {
    nameEn: 'Shri Ramashray Mahto',
    nameHi: 'श्री रामाश्रय महतो',
    designationEn: 'Sarpanch (Gram Katchahry Chief)',
    designationHi: 'सरपंच (ग्राम कचहरी प्रमुख)',
    office: 'Gram Katchahry Hall',
    phone: '+91 94310-88202',
  },
  {
    nameEn: 'Smt. Sangeeta Kumari',
    nameHi: 'श्रीमती संगीता कुमारी',
    designationEn: 'Parishad Secretary (Sachiv) & PIO',
    designationHi: 'परिषद सचिव एवं लोक सूचना पदाधिकारी',
    office: 'RTPS & Secretariat Desk',
    phone: '+91 94310-88203',
  },
  {
    nameEn: 'Shri Manoj Kumar Tiwari',
    nameHi: 'श्री मनोज कुमार तिवारी',
    designationEn: 'Panchayat Rozgar Sevak (MGNREGA)',
    designationHi: 'पंचायत रोजगार सेवक (मनरेगा)',
    office: 'MGNREGA & Works Cell',
    phone: '+91 94310-88207',
  },
  {
    nameEn: 'Ku. Priya Ranjan',
    nameHi: 'कुमारी प्रिया रंजन',
    designationEn: 'Lekhapal-cum-IT Assistant',
    designationHi: 'लेखपाल सह आईटी सहायक',
    office: 'e-GramSwaraj & Cashbook Desk',
    phone: '+91 94310-88209',
  },
  {
    nameEn: 'Shri Rameshwar Ram',
    nameHi: 'श्री रामेश्वर राम',
    designationEn: 'Vikas Mitra (Welfare Outreach)',
    designationHi: 'विकास मित्र',
    office: 'SC/ST Welfare & Pension Desk',
    phone: '+91 94310-88211',
  },
  {
    nameEn: 'Shri Harishchandra Kushwaha',
    nameHi: 'श्री हरिश्चंद्र कुशवाहा',
    designationEn: 'Kisan Salahkar (Agriculture)',
    designationHi: 'किसान सलाहकार',
    office: 'PM-KISAN & Fasal Sahayata',
    phone: '+91 94310-88214',
  },
];

const CITIZEN_CHARTER = [
  { service: 'Birth & Death Registration (Within 21 Days)', sla: '7 Working Days', fee: 'Free', officer: 'Parishad Secretary (Registrar)' },
  { service: 'Residence / Caste / Income Certificate (RTPS)', sla: '10 Working Days', fee: 'Free', officer: 'RTPS Counter / Sachiv / Mukhiya' },
  { service: 'Parivar Register Copy & Correction', sla: '5 Working Days', fee: 'Free', officer: 'Parishad Secretary (Sachiv)' },
  { service: 'Janta Darbar Ward Grievance Resolution', sla: '15 Days', fee: 'Free', officer: 'Concerned Ward Member / Sachiv' },
  { service: 'MGNREGA Job Card Issuance & Work Demand', sla: '15 Days', fee: 'Free', officer: 'Parishad Rozgar Sevak' },
  { service: 'RTI Application Disposal (Section 7)', sla: '30 Days', fee: '₹10 (BPL Free)', officer: 'PIO (Parishad Sachiv)' },
];

export function AboutParishadView({ lang, wards, onNavigate }: AboutParishadViewProps) {
  const totalHouseholds = wards.reduce((s, w) => s + w.households, 0);
  const totalPopulation = wards.reduce((s, w) => s + w.population, 0);

  return (
    <div className="space-y-6">
      {/* Page Title Banner */}
      <div className="bg-white border border-slate-200 rounded p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hc-surface">
        <div>
          <p className="text-xs font-semibold text-[#FF671F] uppercase tracking-wide">
            {lang === 'hi' ? 'ग्राम परिषद प्रोफ़ाइल, संरचना एवं नागरिक चार्टर' : 'Institutional Profile, Elected Body & Citizen Charter'}
          </p>
          <h2 className="text-xl font-bold text-[#0B2C59] mt-0.5 hc-text">
            {lang === 'hi'
              ? 'रामनगर ग्राम परिषद — प्रशासनिक परिचय एवं जनप्रतिनिधि निर्देशिका'
              : 'About Ramnagar Gram Parishad — Administration & Directory'}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('downloads')}
          className="px-4 py-2 bg-[#0B2C59] hover:bg-[#071E3D] text-white text-xs font-semibold rounded whitespace-nowrap shrink-0"
        >
          {lang === 'hi' ? 'डाउनलोड एवं आरटीआई प्रकोष्ठ →' : 'Forms, Downloads & RTI Cell →'}
        </button>
      </div>

      {/* Overview + Geographic Fact Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
          <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2 hc-text">
            {lang === 'hi' ? 'रामनगर ग्राम परिषद का परिचय' : 'Parishad Overview & Mandate'}
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed hc-muted">
            {lang === 'hi'
              ? 'रामनगर ग्राम परिषद, प्रखंड रामनगर, जिला पश्चिम चंपारण (बिहार) के अंतर्गत एक आदर्श ई-गवर्नेंस ग्राम परिषद है। बिहार पंचायती राज अधिनियम, 2006 के प्रावधानों के अनुरूप यह परिषद 15 वार्डों के नागरिकों को पारदर्शी आरटीपीएस सेवाएं, सात निश्चय अवसंरचना, मनरेगा रोजगार, सामाजिक सुरक्षा पेंशन तथा ग्राम कचहरी के माध्यम से त्वरित न्याय उपलब्ध कराती है।'
              : 'Ramnagar Gram Parishad, located in Block Ramnagar, District West Champaran, Bihar, operates as an integrated digital local self-government body under the Bihar Panchayati Raj Act, 2006. Serving 15 territorial wards, the Parishad delivers RTPS citizen certificates, Saat Nischay drinking water and solar infrastructure, MGNREGA livelihood security, transparent Gram Parishad Development Plans (GPDP), and community dispute resolution through its Gram Katchahry.'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-[#F8FAFC] border border-slate-200 rounded p-3">
              <div className="text-xs text-slate-500">Total Wards</div>
              <div className="text-lg font-bold text-[#0B2C59] font-mono-tabular mt-0.5">{wards.length}</div>
            </div>
            <div className="bg-[#F8FAFC] border border-slate-200 rounded p-3">
              <div className="text-xs text-slate-500">Households</div>
              <div className="text-lg font-bold text-[#0B2C59] font-mono-tabular mt-0.5">
                {totalHouseholds.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-[#F8FAFC] border border-slate-200 rounded p-3">
              <div className="text-xs text-slate-500">Population</div>
              <div className="text-lg font-bold text-[#046A38] font-mono-tabular mt-0.5">
                {totalPopulation.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-[#F8FAFC] border border-slate-200 rounded p-3">
              <div className="text-xs text-slate-500">Literacy Rate</div>
              <div className="text-lg font-bold text-slate-900 font-mono-tabular mt-0.5">74.2%</div>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-5 bg-white border border-slate-200 rounded p-5 space-y-3 hc-surface">
          <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2 hc-text">
            {lang === 'hi' ? 'प्रशासनिक एवं भौगोलिक तथ्य' : 'Administrative Fact Sheet'}
          </h3>
          <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
            <div className="py-2 flex justify-between gap-2">
              <dt className="text-slate-500">LGD Panchayat Code</dt>
              <dd className="font-mono-tabular font-semibold text-slate-900">102198 (Bihar)</dd>
            </div>
            <div className="py-2 flex justify-between gap-2">
              <dt className="text-slate-500">Block / Sub-Division</dt>
              <dd className="font-semibold text-slate-900">Ramnagar / Bagaha</dd>
            </div>
            <div className="py-2 flex justify-between gap-2">
              <dt className="text-slate-500">District & PIN Code</dt>
              <dd className="font-semibold text-slate-900">West Champaran · 845106</dd>
            </div>
            <div className="py-2 flex justify-between gap-2">
              <dt className="text-slate-500">Nearest Police Station</dt>
              <dd className="font-semibold text-slate-900">Ramnagar Thana (1.4 km)</dd>
            </div>
            <div className="py-2 flex justify-between gap-2">
              <dt className="text-slate-500">Office Working Hours</dt>
              <dd className="font-mono-tabular font-semibold text-[#046A38]">Mon–Sat · 10:00 AM – 5:00 PM</dd>
            </div>
            <div className="py-2 flex justify-between gap-2">
              <dt className="text-slate-500">Official E-Mail</dt>
              <dd className="font-mono-tabular text-[#0B2C59]">sachiv.ramnagar.wch@bihar.gov.in</dd>
            </div>
          </dl>
        </aside>
      </div>

      {/* Elected Representatives & Administrative Functionaries */}
      <div className="bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-base font-bold text-[#0B2C59] flex items-center gap-2 hc-text">
            <Users className="w-4 h-4 text-[#FF671F]" />
            <span>
              {lang === 'hi'
                ? 'ग्राम परिषद पदाधिकारी एवं सरकारी कर्मी निर्देशिका'
                : 'Elected Executive & Administrative Functionaries'}
            </span>
          </h3>
          <span className="text-xs text-slate-500">Term: 2021–2026</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {PARISHAD_FUNCTIONARIES.map((person) => (
            <div key={person.nameEn} className="border border-slate-200 rounded p-3.5 bg-[#F8FAFC] space-y-1.5">
              <div className="text-sm font-bold text-slate-900">
                {lang === 'hi' ? person.nameHi : person.nameEn}
              </div>
              <div className="text-xs font-semibold text-[#0B2C59]">
                {lang === 'hi' ? person.designationHi : person.designationEn}
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1 pt-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{person.office}</span>
              </div>
              <div className="text-xs font-mono-tabular text-[#046A38] flex items-center gap-1">
                <Phone className="w-3 h-3 shrink-0" />
                <span>{person.phone}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All 15 Ward Members Directory Table */}
      <div className="bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
        <h3 className="text-base font-bold text-[#0B2C59] border-b border-slate-200 pb-2.5 hc-text">
          {lang === 'hi' ? 'वार्ड संख्या 1 से 15 — संपूर्ण वार्ड सदस्य सूची' : 'Complete Ward Member Directory (Wards 01–15)'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs text-slate-600 uppercase">
                <th className="py-2.5 px-3">Ward No</th>
                <th className="py-2.5 px-3">Tola / Locality Name</th>
                <th className="py-2.5 px-3">Elected Ward Member</th>
                <th className="py-2.5 px-3">Contact Number</th>
                <th className="py-2.5 px-3 text-right">Households</th>
                <th className="py-2.5 px-3">Key Ongoing Work</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {wards.map((w) => (
                <tr key={w.ward_no} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono-tabular font-bold text-[#0B2C59]">
                    W-{String(w.ward_no).padStart(2, '0')}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">
                    {lang === 'hi' ? w.ward_name_hi : w.ward_name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-800">{w.member_name}</td>
                  <td className="py-2.5 px-3 font-mono-tabular text-slate-700">{w.member_phone}</td>
                  <td className="py-2.5 px-3 text-right font-mono-tabular">{w.households}</td>
                  <td className="py-2.5 px-3 text-xs text-slate-600">
                    {lang === 'hi' ? w.ongoing_project_hi : w.ongoing_project}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Citizen Charter & RTPS Service Delivery Timelines */}
      <div className="bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <h3 className="text-base font-bold text-[#0B2C59] flex items-center gap-2 hc-text">
            <ShieldCheck className="w-4 h-4 text-[#046A38]" />
            <span>{lang === 'hi' ? 'नागरिक अधिकार पत्र (Citizen Charter)' : 'Citizen Charter & Service Delivery Guarantee'}</span>
          </h3>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Bihar RTPS Act</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs text-slate-600 uppercase">
                <th className="py-2.5 px-3">Public Service</th>
                <th className="py-2.5 px-3">Statutory Time Limit</th>
                <th className="py-2.5 px-3">Prescribed Fee</th>
                <th className="py-2.5 px-3">Designated Officer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {CITIZEN_CHARTER.map((row) => (
                <tr key={row.service} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-medium text-slate-900">{row.service}</td>
                  <td className="py-2.5 px-3 font-mono-tabular font-semibold text-[#0B2C59]">{row.sla}</td>
                  <td className="py-2.5 px-3 font-semibold text-[#046A38]">{row.fee}</td>
                  <td className="py-2.5 px-3 text-slate-700">{row.officer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Infrastructure Photo Gallery */}
      <div className="bg-white border border-slate-200 rounded p-5 space-y-4 hc-surface">
        <h3 className="text-base font-bold text-[#0B2C59] flex items-center gap-2 border-b border-slate-200 pb-2.5 hc-text">
          <Building2 className="w-4 h-4 text-[#FF671F]" />
          <span>{lang === 'hi' ? 'विकास कार्य एवं परिषद छायाचित्र दीर्घा' : 'Ramnagar Gram Parishad Development Gallery'}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              src: '/src/assets/images/hero_panchayat_bhawan_1794723027763.jpg',
              title: 'Ramnagar Gram Parishad Bhawan',
              caption: 'Solar-powered RTPS facilitation centre & secretariat hall (Ward 06)',
            },
            {
              src: '/src/assets/images/hero_nal_jal_solar_1794723028205.jpg',
              title: 'Har Ghar Nal Ka Jal & Solar Grid',
              caption: 'Paver block lanes, covered RCC drainage & LED solar poles',
            },
            {
              src: '/src/assets/images/hero_gram_sabha_1794723030640.jpg',
              title: 'Gram Sabha & Social Audit',
              caption: 'Community participation & Jeevika SHG GPDP consultation',
            },
          ].map((item) => (
            <figure key={item.title} className="border border-slate-200 rounded overflow-hidden bg-[#F8FAFC]">
              <img
                src={item.src}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-44 object-cover"
              />
              <figcaption className="p-3">
                <div className="text-sm font-bold text-slate-900">{item.title}</div>
                <div className="text-xs text-slate-600 mt-0.5">{item.caption}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
