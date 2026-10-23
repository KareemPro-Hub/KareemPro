'use client';
import { usePathname } from 'next/navigation';
export default function FloatingWhatsApp() {
  const path = usePathname();
  if (['/admin', '/portal', '/team', '/auth'].some(prefix => path.startsWith(prefix))) return null;
  return <a className="whatsapp-launcher" href="https://wa.me/966507069605" target="_blank" rel="noopener noreferrer" aria-label="تواصل فوري عبر واتساب" title="تواصل فوري عبر واتساب"><svg aria-hidden="true" className="ui-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><use href="/icons/ui.svg#comment"></use></svg></a>;
}
