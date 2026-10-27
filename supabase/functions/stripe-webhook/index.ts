import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import {stripe} from '../_shared/stripe.ts';
Deno.serve(async req=>{
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 const secret=Deno.env.get('STRIPE_WEBHOOK_SECRET');if(!secret)return new Response('Not configured',{status:503});
 const raw=await req.text();if(raw.length>1000000)return new Response('Too large',{status:413});
 const parts=(req.headers.get('stripe-signature')||'').split(',').map(p=>p.split('='));
 const t=parts.find(p=>p[0]==='t')?.[1];
 if(!t||!/^\d+$/.test(t)||Math.abs(Date.now()/1000-Number(t))>300)return new Response('Invalid signature',{status:400});
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 let valid=false;
 for(const [,hex] of parts.filter(p=>p[0]==='v1')){if(!/^[a-f0-9]{64}$/.test(hex))continue;const signature=Uint8Array.from(hex.match(/../g)!,x=>parseInt(x,16));if(await crypto.subtle.verify('HMAC',key,signature,new TextEncoder().encode(`${t}.${raw}`)))valid=true;}
 if(!valid)return new Response('Invalid signature',{status:400});
 try{
  const event=JSON.parse(raw);let id:string|undefined;
  if(event.type==='checkout.session.completed')id=event.data.object.subscription;
  else if(['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(event.type))id=event.data.object.id;
  else return new Response('Ignored');
  if(!id||!/^sub_[a-zA-Z0-9]+$/.test(id))return new Response('Invalid event',{status:400});
  // Read the canonical current subscription instead of trusting event delivery order.
  const sub=await stripe('subscriptions/'+id);
  const userId=sub.metadata?.user_id;
  if(!userId||!/^[-a-f0-9]{36}$/.test(userId))return new Response('Unrelated subscription');
  const price=Deno.env.get('STRIPE_PRICE_ID');
  const item=sub.items?.data?.find((i:any)=>i.price?.id===price);
  if(!item)return new Response('Unrelated price');
  const end=item.current_period_end||sub.current_period_end;
  if(!end)throw Error('Missing period end');
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const {error}=await admin.from('billing_subscriptions').upsert({user_id:userId,customer_id:sub.customer,subscription_id:sub.id,status:sub.status,period_end:new Date(end*1000).toISOString()});
  if(error)throw error;
  return new Response('OK');
 }catch{return new Response('Retry later',{status:500});}
});
