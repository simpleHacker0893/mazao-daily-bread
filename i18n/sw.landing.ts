// Kiswahili landing half. Typed against the English keys, so a missing translation fails typecheck.
// Provisional until the translation phase (D-050); not shown yet.
import type { landing as en } from "./en.landing";

export const landing: Record<keyof typeof en, string> = {
  "landing.meta.title": "Mazao: jua faida yako halisi",
  "landing.meta.description":
    "Uhasibu wa bure kwa wafanyabiashara wa Kenya. Andika mauzo, deni na gharama kwenye simu yako, hata bila mtandao, na uone kile ulichobaki nacho.",

  "landing.brand": "Mazao",
  "landing.header.navLabel": "Anza",
  "landing.cta.start": "Anza bure",
  "landing.cta.demo": "Jaribu onyesho",
  "landing.cta.signIn": "Ingia",

  "landing.demo.intro.title": "See Mazao with a real day's numbers",
  "landing.demo.intro.description":
    "Explore a fictional Gikomba shop's sample day. Nothing you do here is saved.",
  "landing.demo.intro.photoAlt":
    "Fundi wa simu akifanya kazi kwenye kibanda kidogo",
  "landing.demo.intro.open": "Open the demo",
  "landing.demo.banner.label": "Demo mode",
  "landing.demo.banner.message": "Demo with sample data. Nothing is saved.",
  "landing.demo.banner.start": "Start free",
  "landing.demo.banner.exit": "Exit demo",
  "landing.demo.overview.title": "Overview",
  "landing.demo.overview.newSale": "New sale",
  "landing.demo.overview.profit": "Net profit today",
  "landing.demo.overview.sales": "Sales",
  "landing.demo.overview.cost": "Cost of goods",
  "landing.demo.overview.expenses": "Expenses",
  "landing.demo.overview.moneyIn": "Money in",
  "landing.demo.overview.cash": "Cash",
  "landing.demo.overview.mpesa": "M-Pesa",
  "landing.demo.overview.givenOnDeni": "Given on deni today",
  "landing.demo.overview.recentSales": "Today's sales",
  "landing.demo.save.title": "Demo only",
  "landing.demo.save.body":
    "This is a demo. Start free to record your own sales.",
  "landing.demo.save.close": "Close",

  "landing.hero.title": "Jua faida yako halisi.",
  "landing.hero.body":
    "Andika mauzo na deni, na uone ulichobaki nacho leo baada ya gharama. Inafanya kazi hata bila mtandao.",
  "landing.hero.photoAlt":
    "Mama mboga ameketi kwenye kibanda chake cha mboga akiangalia simu, mbele yake kuna sukuma, nyanya na vitunguu",

  "landing.notebook.photoAlt":
    "Mkono wa mfanyabiashara ukiandika majina ya wateja na kiasi kwenye daftari la karatasi lililochakaa",
  "landing.notebook.title": "Daftari linalokufanyia hesabu",
  "landing.notebook.debts.title": "Nani anadaiwa, na tangu lini",
  "landing.notebook.debts.body":
    "Kila deni lina jina, kiasi na tarehe. Yaliyopitwa na wakati yanakuja kwanza.",
  "landing.notebook.profit.title": "Faida baada ya gharama",
  "landing.notebook.profit.body":
    "Mazao inatoa gharama ya bidhaa na matumizi yako, ili uone ulichobaki nacho kweli.",
  "landing.notebook.offline.title": "Inafanya kazi bila mtandao",
  "landing.notebook.offline.body":
    "Kila kitu kinahifadhiwa kwenye simu yako kwanza, kwa hivyo mtandao dhaifu haupotezi mauzo.",
  "landing.notebook.backup.title": "Nakala ukipoteza simu",
  "landing.notebook.backup.body":
    "Ingia kwenye simu mpya na kumbukumbu zako zilizohifadhiwa zinarudi.",

  "landing.offline.photoAlt":
    "Njia yenye watu wengi katika soko la Gikomba, yenye magunia ya viazi na makreti ya mboga pande zote",
  "landing.offline.title": "Hakuna mtandao? Sawa.",
  "landing.offline.body":
    "Kila mauzo yanahifadhiwa kwenye simu yako kwanza, kisha yanahifadhiwa nje ukiunganishwa.",

  "landing.debts.title": "Jua nani anakudai",
  "landing.debts.overdue": "Wateja waliopitwa na tarehe wanaonyeshwa kwanza.",
  "landing.debts.dueDate": "Kila deni lina tarehe ya kulipa.",
  "landing.debts.payments": "Malipo yanabadilisha salio papo hapo.",

  "landing.bento.title": "Kwa bidhaa na kwa huduma",
  "landing.bento.units.caption": "Uza kwa kilo, fundo au trei",
  "landing.bento.units.alt":
    "Mafungu ya sukuma na spinachi yananing'inia juu ya makreti ya nyanya na vitunguu",
  "landing.bento.stock.caption": "Fuatilia bidhaa zinazopungua",
  "landing.bento.stock.alt":
    "Rafu ya duka iliyojaa pakiti za unga, mafuta ya kupikia na sabuni",
  "landing.bento.trips.caption": "Andika safari na mafuta",
  "landing.bento.trips.alt":
    "Mwendesha boda anayetabasamu akiwa na koti la usalama amesimama karibu na pikipiki yake iliyobeba mzigo",
  "landing.bento.repairs.caption": "Kazi za kutengeneza na malipo ya awali",
  "landing.bento.repairs.alt":
    "Fundi wa simu anatengeneza bodi ya simu kwenye kibanda chake cha barabarani",

  "landing.start.title": "Anza kwa hatua tatu",
  "landing.start.signIn.verb": "Ingia",
  "landing.start.signIn.body":
    "Tumia barua pepe yako kwenye simu yako, ili kumbukumbu zibaki zako.",
  "landing.start.pin.verb": "Weka PIN",
  "landing.start.pin.body":
    "PIN fupi inafunga programu, na haitoki kwenye simu yako.",
  "landing.start.sale.verb": "Andika mauzo",
  "landing.start.sale.body":
    "Chagua bidhaa, kiasi na pesa taslimu au M-Pesa. Basi.",

  "landing.data.title": "Data yako ni yako",
  "landing.data.pin.title": "PIN yako inabaki kwenye simu",
  "landing.data.pin.body": "Hatuioni, na haitumwi popote.",
  "landing.data.eu.title": "Nakala zinahifadhiwa salama Ulaya",
  "landing.data.eu.body":
    "Ukiunganishwa, kumbukumbu zako zinahifadhiwa kwenye seva salama huko Frankfurt.",
  "landing.data.delete.title": "Tuombe tufute data yako wakati wowote",
  "landing.data.delete.body":
    "Tuma ujumbe kwa msaada wetu na tutaondoa akaunti yako na kumbukumbu zake.",
  "landing.data.ads.title": "Hakuna matangazo",
  "landing.data.ads.body":
    "Mazao haionyeshi matangazo na haiuzi kumbukumbu zako.",

  "landing.faq.title": "Maswali",
  "landing.faq.free.question": "Ni bure?",
  "landing.faq.free.answer": "Bure wakati wa majaribio.",
  "landing.faq.offline.question": "Inafanya kazi bila intaneti?",
  "landing.faq.offline.answer":
    "Ndiyo. Mazao inahifadhi kila kitu kwenye simu yako na kuhifadhi nakala ukiunganishwa tena.",
  "landing.faq.lost.question": "Nikipoteza simu je?",
  "landing.faq.lost.answer":
    "Ingia kwenye simu mpya kwa barua pepe ile ile na kumbukumbu zako zinarudi. Kisha weka PIN mpya.",
  "landing.faq.trade.question": "Inafaa biashara yangu?",
  "landing.faq.trade.answer":
    "Ndiyo, ukiuza bidhaa au huduma. Maduka, mama mboga, waendesha boda na mafundi wote wanaweza kuandika mauzo, gharama na deni.",
  "landing.faq.language.question": "Iko kwa Kiswahili?",
  "landing.faq.language.answer":
    "Kiingereza kwa sasa; Kiswahili kinakuja baadaye.",

  "landing.close.title": "Anza leo",

  "landing.footer.navLabel": "Chini",
  "landing.footer.privacy": "Taarifa ya faragha",
  "landing.footer.support": "Msaada wa WhatsApp",
  "landing.footer.copyright": "© 2026 Mazao",
};
