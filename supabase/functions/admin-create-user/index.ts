import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CreateUserBody = {
  full_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: 'admin' | 'broker' | 'buyer';
  company_name?: string;
  whatsapp?: string;
  avatar_url?: string;
  specialties?: string[];
  certifications?: string[];
  ampi_number?: string;
  sedetus_number?: string;
  verification_status?: 'pending' | 'approved' | 'rejected';
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authorization = request.headers.get('Authorization');

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) {
      throw new Error('Configuracion de servidor incompleta.');
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData, error: authError } = await callerClient.auth.getUser();
    if (authError || !authData.user) {
      return json({ error: 'Sesion invalida.' }, 401);
    }

    const { data: callerProfile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle();
    if (callerProfile?.role !== 'admin') {
      return json({ error: 'Solo un administrador puede crear cuentas.' }, 403);
    }

    const body = (await request.json()) as CreateUserBody;
    const fullName = body.full_name?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim() ?? '';
    const password = body.password ?? '';
    const role = body.role;

    if (!fullName || !email || password.length < 6 || !role) {
      return json(
        { error: 'Nombre, correo, rol y contrasena temporal de al menos 6 caracteres son obligatorios.' },
        400,
      );
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });
    if (createError || !created.user) {
      return json({ error: createError?.message ?? 'No se pudo crear la cuenta.' }, 400);
    }

    const userId = created.user.id;
    const { error: profileError } = await adminClient.from('users').upsert({
      id: userId,
      full_name: fullName,
      email,
      phone,
      avatar_url: body.avatar_url || null,
      role,
      updated_at: new Date().toISOString(),
    });
    if (profileError) throw profileError;

    if (role === 'broker') {
      const { error: brokerError } = await adminClient.from('broker_profiles').upsert(
        {
          user_id: userId,
          full_name: fullName,
          email,
          phone,
          company_name: body.company_name?.trim() ?? '',
          whatsapp: body.whatsapp?.trim() ?? phone,
          avatar_url: body.avatar_url || null,
          specialties: body.specialties ?? [],
          certifications: body.certifications ?? [],
          ampi_number: body.ampi_number?.trim() ?? '',
          sedetus_number: body.sedetus_number?.trim() ?? '',
          verification_status: body.verification_status ?? 'pending',
          verified: body.verification_status === 'approved',
          rejection_reason: null,
        },
        { onConflict: 'user_id' },
      );
      if (brokerError) throw brokerError;
    }

    return json({ user_id: userId }, 200);
  } catch (error) {
    console.error('admin-create-user', error);
    return json({ error: error instanceof Error ? error.message : 'Error inesperado.' }, 500);
  }
});

function json(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
