import { createAdminClient } from '@/lib/supabase/server';
import { xpay, confirmSession } from '@/lib/xpay-server';
import '../checkout.css';
export const dynamic='force-dynamic';
export const metadata={title:'نتيجة السداد — Kareem Pro',robots:{index:false,follow:false}};
export default async function PaymentResult({searchParams}){
 const {session_id:id}=await searchParams;let order=null;
 if(typeof id==='string'&&/^cs_(live|test)_[A-Za-z0-9]+$/.test(id)){
  const db=createAdminClient();
  const {data}=await db.from('xpay_orders').select('id,status,title,amount_egp_minor,stage_id').eq('session_id',id).maybeSingle();
  if(data){
   try{const session=await xpay('/checkout/sessions/'+id);await confirmSession(session,'reconcile:'+id);}catch{/* No success claim when verification is unavailable. */}
   const {data:fresh}=await db.from('xpay_orders').select('status,title,amount_egp_minor,stage_id').eq('id',data.id).single();order=fresh;
  }
 }
 const paid=order?.status==='paid';
 return <main className="checkout-page"><section className="checkout-container checkout-panel checkout-empty"><h1>{paid?'تم تأكيد السداد':order?.status==='expired'?'انتهت جلسة الدفع':'لم يتم تأكيد السداد بعد'}</h1><p>{paid?'شكرًا لك، تم تسجيل سدادك بنجاح.': 'نجاح العودة لهذه الصفحة لا يعني نجاح الدفع. إذا استخدمت فوري، انتظر تأكيد سداد المرجع، ثم حدّث الصفحة.'}</p>{order&&<><h2>{order.title}</h2><p dir="ltr">{(order.amount_egp_minor/100).toLocaleString('en-US',{minimumFractionDigits:2})} EGP</p></>}<p><a href={order?.stage_id?'/portal':'/#pricing'}>{order?.stage_id?'العودة لبوابة العميل':'العودة للموقع'}</a></p>{!paid&&<a href={typeof id==='string'?'/checkout/result?session_id='+encodeURIComponent(id):'/checkout'}>تحديث حالة السداد</a>}</section></main>;
}
