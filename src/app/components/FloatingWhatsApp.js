'use client';
import { usePathname } from 'next/navigation';
export default function FloatingWhatsApp() {
  const path = usePathname();
  if (['/admin', '/portal', '/team', '/auth'].some(prefix => path.startsWith(prefix))) return null;
  return <a className="whatsapp-launcher" href="https://wa.me/966507069605" target="_blank" rel="noopener noreferrer" aria-label="تواصل فوري عبر واتساب" title="تواصل فوري عبر واتساب"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.5 14.1c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3.3-.9-2.8-1.2-4.5-4-4.6-4.2-.1-.2-1.1-1.4-1.1-2.7s.7-1.9.9-2.2c.2-.2.5-.3.6-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.3.3c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6 0l.9-1c.2-.2.3-.2.5-.1l2 .9c.2.1.4.2.4.3 0 .2 0 .8-.2 1.3Z"/></svg></a>;
}
