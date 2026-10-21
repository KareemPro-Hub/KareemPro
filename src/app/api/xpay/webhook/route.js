import { verifySignature } from '@/lib/xpay.mjs';
import { confirmSession, xpay } from '@/lib/xpay-server';
export const runtime='nodejs';
export async function POST(request){
 if(!process.env.XPAY_WEBHOOK_SECRET)return new Response('Unavailable',{status:503});
 if(Number(request.headers.get('content-length')||0)>262144)return new Response('Too large',{status:413});
 const raw=await request.text();if(raw.length>262144)return new Response('Too large',{status:413});
 if(!verifySignature(raw,request.headers.get('XPay-Signature'),process.env.XPAY_WEBHOOK_SECRET)&&!verifySignature(raw,request.headers.get('XPay-Signature'),process.env.XPAY_TEST_WEBHOOK_SECRET))return new Response('Invalid signature',{status:400});
 try{
  const event=JSON.parse(raw);
  if(['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'].includes(event.type)){
   const session=event.data?.object;
   if(typeof event.id!=='string'||!/^cs_(test|live)_[A-Za-z0-9]+$/.test(session?.id||''))return new Response('Invalid event',{status:400});
   // Retrieve authoritative data as well; never fulfil from a browser return or unpaid Fawry event.
   const fresh=await xpay('/checkout/sessions/'+session.id);
   await confirmSession(fresh,event.id,event.type);
  }
  return Response.json({received:true});
 }catch{return new Response('Processing failed',{status:500});}
}
