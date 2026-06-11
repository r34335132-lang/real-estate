import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return json({ error: 'Metodo no permitido.' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authorization = request.headers.get('Authorization');

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) {
      return json({ error: 'Configuracion de servidor incompleta.' }, 500);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: authData, error: authError } = await callerClient.auth.getUser();

    if (authError || !authData.user) {
      return json({ error: 'Sesion invalida.' }, 401);
    }

    const body = await request.json().catch(() => ({}));
    if (body?.confirm !== true) {
      return json({ error: 'La eliminacion no fue confirmada.' }, 400);
    }

    const userId = authData.user.id;
    const storagePaths = new Set<string>();

    const { data: userRow } = await adminClient
      .from('users')
      .select('avatar_url')
      .eq('id', userId)
      .maybeSingle();
    addStoragePath(storagePaths, userRow?.avatar_url);

    const { data: brokerRows, error: brokerError } = await adminClient
      .from('broker_profiles')
      .select('id, avatar_url, id_document_url')
      .eq('user_id', userId);
    if (brokerError) throw brokerError;

    const brokerIds = (brokerRows ?? []).map((row) => row.id as string);
    for (const broker of brokerRows ?? []) {
      addStoragePath(storagePaths, broker.avatar_url);
      addStoragePath(storagePaths, broker.id_document_url);
    }

    let propertyIds: string[] = [];
    if (brokerIds.length > 0) {
      const { data: propertyRows, error: propertyError } = await adminClient
        .from('properties')
        .select('id, images')
        .in('broker_id', brokerIds);
      if (propertyError) throw propertyError;

      propertyIds = (propertyRows ?? []).map((row) => row.id as string);
      for (const property of propertyRows ?? []) {
        for (const image of (property.images as string[] | null) ?? []) {
          addStoragePath(storagePaths, image);
        }
      }
    }

    if (propertyIds.length > 0) {
      const { data: documentRows, error: documentError } = await adminClient
        .from('property_documents')
        .select('file_url')
        .in('property_id', propertyIds);
      if (documentError) throw documentError;
      for (const document of documentRows ?? []) addStoragePath(storagePaths, document.file_url);

      const { error: legalPropertyError } = await adminClient
        .from('legal_requests')
        .delete()
        .in('property_id', propertyIds);
      if (legalPropertyError) throw legalPropertyError;
    }

    const { error: legalUserError } = await adminClient
      .from('legal_requests')
      .delete()
      .or(`user_id.eq.${userId},lawyer_id.eq.${userId}`);
    if (legalUserError) throw legalUserError;

    if (brokerIds.length > 0) {
      const { error: appointmentError } = await adminClient
        .from('appointments')
        .delete()
        .in('broker_id', brokerIds);
      if (appointmentError) throw appointmentError;
    }

    if (propertyIds.length > 0) {
      const { error: propertiesError } = await adminClient
        .from('properties')
        .delete()
        .in('id', propertyIds);
      if (propertiesError) throw propertiesError;
    }

    if (brokerIds.length > 0) {
      const { error: deleteBrokerError } = await adminClient
        .from('broker_profiles')
        .delete()
        .in('id', brokerIds);
      if (deleteBrokerError) throw deleteBrokerError;
    }

    if (storagePaths.size > 0) {
      const { error: storageError } = await adminClient.storage
        .from('img')
        .remove([...storagePaths]);
      if (storageError) console.error('delete-account storage cleanup', storageError);
    }

    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteAuthError) throw deleteAuthError;

    return json({ deleted: true }, 200);
  } catch (error) {
    console.error('delete-account', error);
    return json(
      { error: error instanceof Error ? error.message : 'No se pudo eliminar la cuenta.' },
      500,
    );
  }
});

function addStoragePath(paths: Set<string>, value: unknown) {
  if (typeof value !== 'string' || !value) return;
  const marker = '/storage/v1/object/public/img/';
  const index = value.indexOf(marker);
  if (index >= 0) {
    paths.add(decodeURIComponent(value.slice(index + marker.length).split('?')[0]));
  }
}

function json(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
