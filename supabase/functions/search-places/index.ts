import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    
    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ places: [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      console.error('Google Places API key not configured')
      return new Response(
        JSON.stringify({ error: 'Google Places API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Use Google Places Autocomplete API for better search suggestions
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${apiKey}&types=geocode`
    
    console.log(`Making request to Google Places API: ${url}`)
    
    const response = await fetch(url)
    const data = await response.json()

    console.log(`Google Places API response status: ${data.status}`)
    console.log(`Google Places API response:`, JSON.stringify(data, null, 2))

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`)
      return new Response(
        JSON.stringify({ error: `Google Places API error: ${data.status}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Transform the autocomplete results to match our expected format
    const places = data.predictions?.map((prediction: any) => ({
      place_id: prediction.place_id,
      name: prediction.structured_formatting?.main_text || prediction.description,
      formatted_address: prediction.description,
      geometry: null, // Autocomplete doesn't return geometry, we'll get it if needed
      types: prediction.types,
    })) || []

    console.log(`Returning ${places.length} places`)

    return new Response(
      JSON.stringify({ places }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in search-places function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})