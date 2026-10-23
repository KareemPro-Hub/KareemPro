import PlatformIcon from './PlatformIcon';

// Historical metadata/messages keep their original values; only their UI rendering changes.
const legacy = {
  '✅':'check','✓':'check','✔':'check','✕':'minus','✖':'minus','❌':'minus','×':'minus',
  '⚠':'info','⚠️':'info','⏳':'clock','⏸':'pause','⏸️':'pause','🚀':'rocket','👋':'user',
  '📁':'folder','📂':'folder','📄':'document','📝':'document-signed','🧾':'file-invoice',
  '🔗':'arrow-up-right-from-square','📋':'list-check','📅':'calendar','💰':'wallet','📊':'chart-histogram',
  '🎯':'list-check','⚙':'settings','⚙️':'settings','🔔':'bell','📦':'folder','💬':'comment','📞':'phone-call',
  '🔒':'lock','🔑':'lock','⭐':'star','💎':'star','❤':'heart','❤️':'heart','🎨':'browser',
  '＋':'user-pen','↓':'download','…':'clock','✔️':'check','↗':'arrow-up-right-from-square','🔍':'search','🏷️':'document','🛠️':'settings','💳':'wallet','💡':'bolt','🔵':'info','🟠':'clock','▶':'play','✉️':'comment','↪':'sign-out-alt','🟢':'check','🟡':'clock','⚡':'bolt','🤝':'handshake','🎉':'star','🎓':'graduation-cap',
};
const available = new Set(["angle-small-down", "angle-small-left", "angle-small-right", "angle-small-up", "arrow-down-left", "arrow-left", "arrow-right", "arrow-up-right-from-square", "bell", "bolt", "briefcase", "browser", "calendar", "cash-register", "chart-histogram", "check", "clock", "cloud-upload-alt", "code-simple", "comment", "computer", "copy", "crown", "document", "document-signed", "download", "edit", "eye", "file-invoice", "fingerprint", "folder", "globe", "graduation-cap", "handshake", "headset", "heart", "info", "interrogation", "layers", "list-check", "lock", "menu-burger", "menu-dots-vertical", "microphone", "minus", "paper-plane", "pause", "phone-call", "play", "quote-right", "refresh", "rocket", "search", "settings", "shield-check", "shopping-cart", "sign-out-alt", "smartphone", "star", "trash", "user", "user-pen", "users-alt", "wallet"]);
export default function InterfaceSymbol({ value, ...props }) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return value;
  const name = legacy[value] || value;
  return <PlatformIcon name={available.has(name) ? name : 'document'} {...props} />;
}
