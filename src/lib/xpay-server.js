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
 return {service_id:selected.service.id,tier:selected.tier??null,stage_id:selected.stageId??null,client_id:selected.clientId??null,title:selected.service.name+' — '+selected.pkg.name.split('|')[0],amount_sar:selected.pkg.price,amount_egp_minor:egpMinor(selected.pkg.price,rate.rate),exchange_rate:rate.rate,rate_updated_at:new Date(rate.updatedAt).toISOString(),livemode:!process.env.XPAY_SECRET_KEY?.includes('_test_')};
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
