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
    console.log('=== Search Places Function Called ===')
    const body = await req.json()
    console.log('Request body:', JSON.stringify(body))
    
    const { query } = body
    
    if (!query || query.trim().length < 2) {
      console.log('Query too short or empty:', query)
      return new Response(
        JSON.stringify({ places: [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      console.error('❌ Google Places API key not found in environment')
      return new Response(
        JSON.stringify({ error: 'Google Places API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ API Key found, length:', apiKey.length)

    // Use Google Places Autocomplete API with better parameters
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
    const params = new URLSearchParams({
      input: query,
      key: apiKey,
      types: '(cities)', // Focus on cities and places
      fields: 'place_id,name,formatted_address,geometry'
    })
    
    const url = `${baseUrl}?${params.toString()}`
    console.log('🌐 Making request to:', url.replace(apiKey, 'API_KEY_HIDDEN'))
    
    const response = await fetch(url)
    console.log('📡 Response status:', response.status)
    
    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText)
      return new Response(
        JSON.stringify({ error: `HTTP ${response.status}: ${response.statusText}` }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const data = await response.json()
    console.log('📄 API Response status:', data.status)
    console.log('📄 API Response:', JSON.stringify(data, null, 2))

    if (data.status === 'REQUEST_DENIED') {
      console.error('❌ REQUEST_DENIED - Check API key permissions')
      console.error('Error message:', data.error_message)
      return new Response(
        JSON.stringify({ 
          error: `API Request Denied: ${data.error_message || 'Check API key permissions'}` 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('❌ Google Places API error:', data.status, data.error_message)
      return new Response(
        JSON.stringify({ 
          error: `Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}` 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Transform the autocomplete results
    const places = data.predictions?.map((prediction: any) => ({
      place_id: prediction.place_id,
      name: prediction.structured_formatting?.main_text || prediction.description.split(',')[0],
      formatted_address: prediction.description,
      geometry: null,
      types: prediction.types,
    })) || []

    console.log(`✅ Returning ${places.length} places`)
    
    return new Response(
      JSON.stringify({ places }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('💥 Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})