export async function stripe(path: string, fields?: Record<string,string>) {
 const key=Deno.env.get('STRIPE_SECRET_KEY');if(!key)throw Error('Billing not configured');
 const r=await fetch('https://api.stripe.com/v1/'+path,{method:fields?'POST':'GET',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/x-www-form-urlencoded'},body:fields?new URLSearchParams(fields):undefined});
 const data=await r.json();if(!r.ok)throw Error('Stripe request failed');return data;
}
