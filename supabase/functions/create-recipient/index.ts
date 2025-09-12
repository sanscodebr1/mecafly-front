// Cria recebedor na Pagarme usando a chave secreta no backend (Deno)

// Declarações mínimas para Deno env
declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

async function handler(req: Request): Promise<Response> {
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    // Requer usuário autenticado (JWT do Supabase)
    const auth = req.headers.get('authorization') || '';
    if (!auth.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const apiKey = Deno.env.get('PAGARME_API_KEY');
    if (!apiKey) {
      console.error('PAGARME_API_KEY não configurada');
      return new Response('Server misconfigured', { status: 500, headers: corsHeaders });
    }

    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
    }

    const register_information = body?.register_information;
    if (!register_information) {
      return new Response('register_information is required', { status: 400, headers: corsHeaders });
    }

    const basic = btoa(`${apiKey}:`);
    const pagarmeRes = await fetch('https://api.pagar.me/core/v5/recipients', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ register_information }),
    });

    const text = await pagarmeRes.text();
    if (!pagarmeRes.ok) {
      console.error('Erro Pagarme create recipient:', pagarmeRes.status, text);
      return new Response(text, { status: pagarmeRes.status, headers: corsHeaders });
    }

    return new Response(text, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('Erro na create-recipient function:', e);
    return new Response('Internal error', { status: 500, headers: corsHeaders });
  }
}

export default handler;



