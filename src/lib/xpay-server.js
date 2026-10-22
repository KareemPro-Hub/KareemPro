import 'server-only';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import catalog from '../../public/pricing-catalog.json';
import { checkoutPackage } from './checkout';
import { egpMinor, sessionMatches } from './xpay.mjs';
export function paymentsReady(){return process.env.XPAY_ENABLED==='true' && !!(process.env.XPAY_SECRET_KEY&&process.env.XPAY_QUOTE_SECRET&&process.env.XPAY_WEBHOOK_SECRET);}
export async function xpay(path,{body,idempotencyKey}={}){
 const response=await fetch('https://api.xpay.app'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+(path.includes('cs_test_')?process.env.XPAY_TEST_SECRET_KEY:process.env.XPAY_SECRET_KEY),'Content-Type':'application/json',...(idempotencyKey?{'Idempotency-Key':idempotencyKey}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!response.ok) throw Error('Xpay request failed: '+response.status);
 return response.json();
}
export async function selectedPayment(params){
 if(params?.stage){
  if(typeof params.stage!=='string'||!/^[a-f0-9-]{36}$/i.test(params.stage))return null;
  const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return null;
  const {data:stage}=await db.from('stages').select('id,title,amount,status,project_id').eq('id',params.stage).maybeSingle();
  if(!stage||stage.status!=='awaiting_payment')return null;
  const {data:project}=await db.from('projects').select('id,title,client_id,currency').eq('id',stage.project_id).eq('client_id',user.id).maybeSingle();
  if(!project||!['SAR','ريال','ريال سعودي',null].includes(project.currency))return null;
  return {service:{id:'stage',name:project.title},pkg:{name:stage.title+'|دفعة المشروع',price:Number(stage.amount),features:'سداد المرحلة المحددة من مشروعك'},stageId:stage.id,clientId:user.id};
 }
 return checkoutPackage(catalog,params);
}
export function makeSnapshot(selected,rate){
 const egyptian=selected.pkg.currency==='EGP';
 const amountSar=egyptian?Math.round(selected.pkg.price/rate.rate*100)/100:selected.pkg.price;
 if(!Number.isFinite(amountSar)||amountSar<=0)throw Error('Invalid reference amount');
 return {service_id:selected.service.id,tier:selected.tier??null,...(selected.pkg.id?{tier_key:selected.pkg.id}:{}),stage_id:selected.stageId??null,client_id:selected.clientId??null,title:selected.service.name+' — '+selected.pkg.name.split('|')[0],amount_sar:amountSar,amount_egp_minor:egpMinor(selected.pkg.price,egyptian?1:rate.rate),exchange_rate:rate.rate,rate_updated_at:new Date(rate.updatedAt).toISOString(),livemode:!process.env.XPAY_SECRET_KEY?.includes('_test_')};
}
export async function confirmSession(session,eventId,eventType){
 const db=createAdminClient();const id=session.metadata?.order_id;
 if(typeof id!=='string'||!/^[a-f0-9-]{36}$/i.test(id))return;
 const {data:order,error}=await db.from('xpay_orders').select('*').eq('id',id).maybeSingle();if(error)throw Error('Order lookup failed');
 if(!order||!sessionMatches(session,order))throw Error('Payment snapshot mismatch');
 if(session.paymentStatus==='paid'){
  const {error}=await db.rpc('confirm_xpay_payment',{p_order_id:order.id,p_session_id:session.id,p_amount:session.amountTotal,p_live:session.livemode,p_event_id:eventId});if(error)throw Error('Payment confirmation failed');
 }else if(session.status==='expired'||eventType==='checkout.session.async_payment_failed'){
  const {error}=await db.from('xpay_orders').update({status:session.status==='expired'?'expired':'failed'}).eq('id',id).eq('status','pending');if(error)throw Error('Order expiration failed');
 }
}

// Reopening a project instalment resumes the same locked order and idempotency key.
export async function paymentSnapshot(selected,rate){
 const snapshot=makeSnapshot(selected,rate);
 if(!selected.stageId)return snapshot;
 const db=createAdminClient();
 const {data:prior,error}=await db.from('xpay_orders').select('*').eq('stage_id',selected.stageId).eq('status','pending').maybeSingle();
 if(error)throw Error('Payment lookup failed');
 if(!prior)return snapshot;
 if(Number(prior.amount_sar)!==snapshot.amount_sar||prior.client_id!==snapshot.client_id||prior.livemode!==snapshot.livemode)throw Error('Pending stage amount changed; contact support');
 if(prior.session_id){
  const session=await xpay('/checkout/sessions/'+prior.session_id);
  await confirmSession(session,'reconcile:'+prior.session_id);
  if(session.paymentStatus==='paid')return {paidSession:prior.session_id};
  if(session.status==='expired')return snapshot;
 }
 return {...snapshot,id:prior.id,amount_egp_minor:Number(prior.amount_egp_minor),exchange_rate:Number(prior.exchange_rate),rate_updated_at:prior.rate_updated_at};
}
