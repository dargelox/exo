import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import {stripe} from '../_shared/stripe.ts';
Deno.serve(async req=>{
 const origin=Deno.env.get('APP_ORIGIN')||'';
 const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Content-Type':'application/json','Vary':'Origin'};
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST'||!origin||req.headers.get('origin')!==origin)return new Response('Forbidden',{status:403});
 try {
  const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!);
  const token=(req.headers.get('authorization')||'').replace(/^Bearer /,'');
  const {data:{user},error}=await client.auth.getUser(token);if(error||!user)return new Response('{"error":"Authentication required"}',{status:401,headers});
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const {data:sub,error:dbError}=await admin.from('billing_subscriptions').select('*').eq('user_id',user.id).maybeSingle();if(dbError)throw dbError;
  const {action}=await req.json();
  if(action==='portal'){
   if(!sub)throw Error('No subscription');
   const portal=await stripe('billing_portal/sessions',{customer:sub.customer_id,return_url:origin});
   return Response.json({url:portal.url},{headers});
  }
  if(action!=='checkout'||Deno.env.get('BILLING_ENABLED')!=='true')return Response.json({error:'Subscriptions are not open'},{status:409,headers});
  if(sub&&['active','trialing','past_due','unpaid','incomplete','paused'].includes(sub.status))return Response.json({error:'Manage your existing subscription first'},{status:409,headers});
  const price=Deno.env.get('STRIPE_PRICE_ID');if(!price)throw Error('Price missing');
  const fields:Record<string,string>={mode:'subscription','line_items[0][price]':price,'line_items[0][quantity]':'1',client_reference_id:user.id,'subscription_data[metadata][user_id]':user.id,success_url:origin+'/?checkout=success',cancel_url:origin+'/?checkout=cancelled'};
  if(sub)fields.customer=sub.customer_id;else fields.customer_email=user.email||'';
  const checkout=await stripe('checkout/sessions',fields);
  return Response.json({url:checkout.url},{headers});
 }catch{return Response.json({error:'Billing unavailable'},{status:503,headers});}
});
