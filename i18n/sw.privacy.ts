// Kiswahili privacy half. Typed against the English keys, so a missing translation fails typecheck.
import type { privacy as en } from "./en.privacy";

export const privacy: Record<keyof typeof en, string> = {
  "privacy.meta.title": "Taarifa ya faragha: Mazao",
  "privacy.meta.description":
    "Jinsi Mazao inavyohifadhi kumbukumbu zako kwenye simu, kuhifadhi nakala Ulaya na kuzifuta ukiomba.",
  "privacy.title": "Taarifa ya faragha",
  "privacy.intro":
    "Hii ni taarifa ya majaribio ya Mazao. Inaeleza tunachohifadhi, kinapokaa na jinsi ya kukiondoa.",
  "privacy.collect.title": "Tunachohifadhi",
  "privacy.collect.body":
    "Barua pepe yako, jina la biashara yako na kumbukumbu unazoandika: mauzo, gharama, deni na bidhaa.",
  "privacy.device.title": "Kwenye simu yako",
  "privacy.device.body":
    "Kumbukumbu zinahifadhiwa kwenye simu yako kwanza. PIN yako inakaguliwa kwenye simu na haitumwi kwetu.",
  "privacy.backup.title": "Nakala",
  "privacy.backup.body":
    "Ukiunganishwa, kumbukumbu zako zinahifadhiwa kwenye hifadhidata salama Ulaya, huko Frankfurt. Ni wewe tu unayeweza kuingia kuzirejesha.",
  "privacy.share.title": "Tusichofanya",
  "privacy.share.body":
    "Mazao haionyeshi matangazo. Hatuuzi wala kushiriki kumbukumbu zako.",
  "privacy.delete.title": "Kufuta data yako",
  "privacy.delete.body":
    "Tuombe kupitia msaada wa WhatsApp na tutafuta akaunti yako na kumbukumbu zake zote.",
  "privacy.contact.title": "Mawasiliano",
  "privacy.contact.body":
    "Tumia kiungo cha msaada wa WhatsApp chini ya ukurasa huu.",
};
