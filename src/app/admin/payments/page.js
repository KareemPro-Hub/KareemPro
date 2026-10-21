import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
export const dynamic='force-dynamic';
export default async function Payments(){
 await requireAdmin();const db=createAdminClient();
 const {data:orders,error}=await db.from('xpay_orders').select('id,title,amount_sar,amount_egp_minor,status,created_at,paid_at,stage_applied,stage_id,livemode').order('created_at',{ascending:false}).limit(100);
 return <div dir="rtl" style={{padding:24}}><h1>عمليات Xpay</h1><p>طلبات الباقات ودفعات المشاريع — آخر 100 عملية.</p>{error?<p>تعذر تحميل العمليات.</p>:<div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'right',borderCollapse:'collapse'}}><thead><tr>{['الطلب','القيمة بالريال','مبلغ الجنيه','الحالة','التاريخ'].map(h=><th key={h} style={{padding:12}}>{h}</th>)}</tr></thead><tbody>{orders?.map(o=><tr key={o.id}><td style={{padding:12}}>{o.title}{!o.livemode&&' (اختبار)'}</td><td>{o.amount_sar}</td><td>{(o.amount_egp_minor/100).toFixed(2)}</td><td>{({paid:'مدفوع',pending:'بانتظار السداد',expired:'منتهي',failed:'فشل'})[o.status]}{o.status==='paid'&&o.stage_id&&!o.stage_applied&&' — راجع المرحلة'}</td><td>{new Date(o.created_at).toLocaleString('ar-EG',{timeZone:'Africa/Cairo'})}</td></tr>)}</tbody></table>{!orders?.length&&<p>لا توجد عمليات حتى الآن.</p>}</div>}</div>;
}
