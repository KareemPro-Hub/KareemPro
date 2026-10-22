import { readQuote, sessionMatches, safeCheckoutUrl } from '@/lib/xpay.mjs';
import { checkoutPriceMatches } from '@/lib/checkout';
import { paymentsReady, selectedPayment, xpay, confirmSession } from '@/lib/xpay-server';
import { createAdminClient } from '@/lib/supabase/server';
export const runtime='nodejs';
export async function POST(request){
 const origin='https://kareempro.com';
 if(![origin,'https://www.kareempro.com'].includes(request.headers.get('origin')))return new Response('Forbidden',{status:403});
 if(!paymentsReady())return Response.json({error:'الدفع غير متاح حاليًا.'},{status:503});
 try{
  const form=await request.formData();const q=readQuote(form.get('quote'),process.env.XPAY_QUOTE_SECRET);
  const selected=await selectedPayment(q.stage_id?{stage:q.stage_id}:{service:q.service_id,tier:q.tier_key??String(q.tier)});
  if(!selected||!checkoutPriceMatches(selected.pkg,q)||(!q.stage_id&&q.title!==selected.service.name+' — '+selected.pkg.name.split('|')[0])||Boolean(selected.stageId)!==Boolean(q.stage_id)||q.client_id!==(selected.clientId??null))return Response.json({error:'تغيّرت بيانات الطلب. أعد فتح صفحة الدفع.'},{status:409});
  const db=createAdminClient();
  // Release an expired stage attempt only after Xpay confirms its actual state.
  if(q.stage_id){
   const {data:prior,error:priorError}=await db.from('xpay_orders').select('id,session_id').eq('stage_id',q.stage_id).eq('status','pending').neq('id',q.id).maybeSingle();
   if(priorError)throw Error('Pending payment lookup failed');
   if(prior?.session_id){
    const fresh=await xpay('/checkout/sessions/'+prior.session_id);
    await confirmSession(fresh,'reconcile:'+prior.session_id);
   }
  }
  const {error:insertError}=await db.from('xpay_orders').upsert({id:q.id,service_id:q.service_id,tier:q.tier,stage_id:q.stage_id,client_id:q.client_id,title:q.title,amount_sar:q.amount_sar,amount_egp_minor:q.amount_egp_minor,exchange_rate:q.exchange_rate,rate_updated_at:q.rate_updated_at,livemode:q.livemode},{onConflict:'id',ignoreDuplicates:true});
  if(insertError)throw Error('Order unavailable');
  const {data:order,error}=await db.from('xpay_orders').select('*').eq('id',q.id).single();if(error)throw Error('Order lookup failed');
  if(order.status==='paid')return Response.redirect(origin+'/checkout/result?session_id='+encodeURIComponent(order.session_id),303);
  if(order.status!=='pending')throw Error('Order expired');
  if(order.checkout_url&&safeCheckoutUrl(order.checkout_url))return Response.redirect(order.checkout_url,303);
  const session=await xpay('/checkout/sessions',{idempotencyKey:'kareempro-'+order.id,body:{mode:'payment',uiMode:'hosted',locale:'ar',currency:'EGP',expiresAfterMinutes:30,afterCompletion:{type:'redirect',redirect:{url:origin+'/checkout/result?session_id={CHECKOUT_SESSION_ID}'}},cancelUrl:origin+'/checkout/result?session_id={CHECKOUT_SESSION_ID}',lineItems:[{priceData:{currency:'EGP',unitAmount:Number(order.amount_egp_minor),productData:{name:order.title}},quantity:1}],metadata:{order_id:order.id},nameCollection:true,phoneNumberCollection:true,feeConfig:{feesPassThrough:false,vatCollectionEnabled:false}}});
  if(!safeCheckoutUrl(session.url)||!sessionMatches(session,{...order,session_id:session.id}))throw Error('Unexpected session');
  const {error:saveError}=await db.from('xpay_orders').update({session_id:session.id,checkout_url:session.url}).eq('id',order.id);if(saveError)throw Error('Session storage failed');
  return Response.redirect(session.url,303);
 }catch{
  return new Response('<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>تعذر بدء الدفع</title><body><h1>تعذر بدء الدفع</h1><p>قد يكون العرض انتهى أو توجد عملية سداد سابقة قيد المعالجة. ارجع لصفحة الدفع وأعد المحاولة، أو تواصل معنا قبل إنشاء طلب آخر.</p><a href="/">العودة للموقع</a></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
 }
}
