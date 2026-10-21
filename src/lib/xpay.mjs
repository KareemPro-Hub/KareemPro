import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
export function egpMinor(sar, rate) {
 const amount=Math.round(sar*rate*100);
 if(!Number.isFinite(sar)||sar<=0||!Number.isFinite(rate)||rate<=0||!Number.isSafeInteger(amount)||amount<=0) throw Error('Invalid amount');
 return amount;
}
export function signQuote(data,secret,now=Date.now()) {
 if(!secret) throw Error('Payments not configured');
 const body=Buffer.from(JSON.stringify({...data,id:data.id??randomUUID(),exp:Math.floor(now/1000)+900})).toString('base64url');
 return body+'.'+createHmac('sha256',secret).update(body).digest('base64url');
}
export function readQuote(token,secret,now=Date.now()) {
 if(!secret||typeof token!=='string'||token.length>5000) throw Error('Invalid quote');
 const [body,sig,...rest]=token.split('.');
 if(rest.length||!body||!sig) throw Error('Invalid quote');
 const expected=createHmac('sha256',secret).update(body).digest();const got=Buffer.from(sig,'base64url');
 if(got.length!==expected.length||!timingSafeEqual(got,expected)) throw Error('Invalid quote');
 const q=JSON.parse(Buffer.from(body,'base64url').toString());
 if(!Number.isInteger(q.exp)||q.exp<=now/1000||q.exp>now/1000+901) throw Error('Quote expired');
 return q;
}
export function verifySignature(raw,header,secret,now=Date.now()) {
 if(!secret||!header) return false;
 const parts=header.split(',').map(s=>s.trim().split('='));const stamps=parts.filter(p=>p[0]==='t');
 if(stamps.length!==1||!/^\d+$/.test(stamps[0][1])) return false;
 const t=stamps[0][1];if(Math.abs(now/1000-Number(t))>300) return false;
 const expected=createHmac('sha256',secret).update(t+'.'+raw).digest();
 return parts.filter(p=>p[0]==='v1'&&/^[a-f0-9]{64}$/i.test(p[1])).some(p=>timingSafeEqual(expected,Buffer.from(p[1],'hex')));
}
export function sessionMatches(session,order) {
 return session?.id===order.session_id&&session.metadata?.order_id===order.id&&session.currency==='EGP'&&session.amountTotal===Number(order.amount_egp_minor)&&session.livemode===order.livemode;
}
export function safeCheckoutUrl(value) {
 try {const u=new URL(value);return u.protocol==='https:'&&u.hostname==='checkout.xpay.app'&&u.pathname.startsWith('/c/');}catch{return false;}
}
