import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { email, userId } = await req.json();
    console.log('Processing attendant assignment for:', email, userId);

    // Check if email matches the attendant pattern: attendant#<centre-name>@gmail.com
    const attendantPattern = /^attendant#(.+)@gmail\.com$/;
    const match = email?.match(attendantPattern);

    if (!match) {
      return new Response(
        JSON.stringify({ success: false, message: 'Email does not match attendant pattern' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const centreSlug = match[1]; // e.g., "phoenix-mall", "bandra-west", "andheri-metro"
    console.log('Centre slug:', centreSlug);

    // Map centre slugs to centre names
    const centreMapping: { [key: string]: string } = {
      'phoenix-mall': 'Phoenix Mall Parking',
      'bandra-west': 'Bandra West Complex',
      'andheri-metro': 'Andheri Metro Station',
    };

    const centreName = centreMapping[centreSlug];
    if (!centreName) {
      console.error('Unknown centre slug:', centreSlug);
      return new Response(
        JSON.stringify({ success: false, message: 'Unknown parking centre' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Find the parking centre by name
    const { data: centre, error: centreError } = await supabaseClient
      .from('parking_centres')
      .select('id, name')
      .eq('name', centreName)
      .single();

    if (centreError || !centre) {
      console.error('Centre not found:', centreError);
      return new Response(
        JSON.stringify({ success: false, message: 'Parking centre not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log('Found centre:', centre);

    // Assign attendant role (idempotent: ignore unique violation)
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({ user_id: userId, role: 'attendant' });

    if (roleError && roleError.code !== '23505') {
      console.error('Error assigning attendant role:', roleError);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to assign attendant role', error: roleError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Link attendant to parking centre (avoid duplicates)
    const { data: existingLink } = await supabaseClient
      .from('parking_centre_attendants')
      .select('id')
      .eq('user_id', userId)
      .eq('centre_id', centre.id)
      .maybeSingle();

    if (!existingLink) {
      const { error: linkError } = await supabaseClient
        .from('parking_centre_attendants')
        .insert({ user_id: userId, centre_id: centre.id });

      if (linkError && linkError.code !== '23505') {
        console.error('Error linking attendant to centre:', linkError);
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to link attendant to centre', error: linkError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      if (linkError && linkError.code === '23505') {
        console.warn('Attendant link already exists, proceeding as success');
      }
    }

    console.log('Successfully assigned attendant role and linked to centre');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully assigned as attendant of ${centre.name}`,
        centre: centre.name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in assign-attendant-role function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});