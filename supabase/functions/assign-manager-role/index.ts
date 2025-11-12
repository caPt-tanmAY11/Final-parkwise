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
          persistSession: false
        }
      }
    );

    const { email, userId } = await req.json();
    console.log('Processing manager assignment for:', email, userId);

    // Check if email matches the manager pattern: manager#<centre-name>@gmail.com
    const managerPattern = /^manager#(.+)@gmail\.com$/;
    const match = email.match(managerPattern);

    if (!match) {
      return new Response(
        JSON.stringify({ success: false, message: 'Email does not match manager pattern' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const centreSlug = match[1]; // e.g., "phoenix-mall", "bandra-west", "andheri-metro"
    console.log('Centre slug:', centreSlug);

    // Map centre slugs to centre names
    const centreMapping: { [key: string]: string } = {
      'phoenix-mall': 'Phoenix Mall Parking',
      'bandra-west': 'Bandra West Complex',
      'andheri-metro': 'Andheri Metro Station'
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

    // Assign manager role
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({ user_id: userId, role: 'manager' });

    if (roleError) {
      console.error('Error assigning role:', roleError);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to assign manager role', error: roleError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Link manager to parking centre
    const { error: linkError } = await supabaseClient
      .from('parking_centre_managers')
      .insert({ user_id: userId, centre_id: centre.id });

    if (linkError) {
      console.error('Error linking manager to centre:', linkError);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to link manager to centre', error: linkError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Successfully assigned manager role and linked to centre');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully assigned as manager of ${centre.name}`,
        centre: centre.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in assign-manager-role function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
