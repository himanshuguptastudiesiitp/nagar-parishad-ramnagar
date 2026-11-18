import type { Language } from '../types';

export const copy = {
  en: {
    govBanner: 'Government of Bihar | Panchayati Raj Department',
    skipContent: 'Skip to Main Content',
    highContrast: 'High Contrast',
    normalContrast: 'Standard View',
    staffLogin: 'Staff / Official Login',
    staffWorkspace: 'Staff Workspace',
    logout: 'Sign Out',
    panchayatTitle: 'Ramnagar Gram Parishad',
    panchayatSubtitle: 'Block: Ramnagar · District: West Champaran · Bihar (PIN: 845106)',
    helplineLabel: 'Citizen Helpline (RTPS & Janta Darbar)',
    latestUpdates: 'Latest Updates',
    pause: 'Pause',
    play: 'Play',
    nav: {
      home: 'Home',
      about: 'About Parishad',
      services: 'Citizen Services (RTPS)',
      schemes: 'Welfare Schemes',
      works: 'Works & Tenders',
      funds: 'Funds & RTI',
      sabha: 'Gram Sabha & Katchahry',
      grievance: 'Janta Darbar',
    },
    leadershipTitle: 'Parishad Leadership',
    quickServicesTitle: 'Quick Citizen Services',
    quickServicesSubtitle: 'Direct online access to Bihar RTPS certificates, welfare beneficiary lists, Janta Darbar, and mandatory registers.',
    noticeBoardTitle: 'Information & Public Notice Board',
    wardMapTitle: 'Interactive Ward Directory (Wards 1–15)',
    tabs: {
      notices: 'Public Notices',
      tenders: 'Tenders / Quotations',
      resolutions: 'Gram Sabha Resolutions',
    },
    footerDisclaimer:
      'Content owned, maintained, and updated by Office of Ramnagar Gram Parishad, Block Ramnagar, District West Champaran, Panchayati Raj Department, Government of Bihar.',
  },
  hi: {
    govBanner: 'बिहार सरकार | पंचायती राज विभाग',
    skipContent: 'मुख्य सामग्री पर जाएं',
    highContrast: 'उच्च कंट्रास्ट',
    normalContrast: 'सामान्य दृश्य',
    staffLogin: 'अधिकारी / कर्मी लॉगिन',
    staffWorkspace: 'अधिकारी कार्यक्षेत्र',
    logout: 'लॉगआउट',
    panchayatTitle: 'रामनगर ग्राम परिषद',
    panchayatSubtitle: 'प्रखंड: रामनगर · जिला: पश्चिम चंपारण · बिहार (पिन: 845106)',
    helplineLabel: 'नागरिक हेल्पलाइन (आरटीपीएस एवं जनता दरबार)',
    latestUpdates: 'नवीनतम सूचनाएं',
    pause: 'रोकें',
    play: 'चलाएं',
    nav: {
      home: 'मुख्य पृष्ठ',
      about: 'परिषद परिचय',
      services: 'नागरिक सेवाएं (RTPS)',
      schemes: 'कल्याणकारी योजनाएं',
      works: 'विकास कार्य एवं निविदा',
      funds: 'निधि एवं आरटीआई',
      sabha: 'ग्राम सभा एवं कचहरी',
      grievance: 'जनता दरबार',
    },
    leadershipTitle: 'ग्राम परिषद नेतृत्व एवं पदाधिकारी',
    quickServicesTitle: 'त्वरित नागरिक सेवाएं',
    quickServicesSubtitle: 'बिहार आरटीपीएस प्रमाण पत्र, लाभार्थी सूची, जनता दरबार शिकायत एवं डिजिटल पंजी तक सीधी ऑनलाइन पहुंच।',
    noticeBoardTitle: 'सूचना एवं लोक निविदा पट्ट',
    wardMapTitle: 'संवादात्मक वार्ड निर्देशिका (वार्ड 1–15)',
    tabs: {
      notices: 'आदेश / सूचना',
      tenders: 'निविदा / कोटेशन',
      resolutions: 'ग्राम सभा कार्यवाही',
    },
    footerDisclaimer:
      'इस पोर्टल की सामग्री रामनगर ग्राम परिषद कार्यालय, प्रखंड रामनगर, जिला पश्चिम चंपारण, पंचायती राज विभाग, बिहार सरकार द्वारा अद्यतन एवं संचालित है।',
  },
} as const;

export function t(lang: Language) {
  return copy[lang];
}
