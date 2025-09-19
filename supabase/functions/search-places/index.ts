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

    // Try Text Search API first (more basic, more likely to work)
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json'
    const params = new URLSearchParams({
      query: query,
      key: apiKey,
      fields: 'place_id,name,formatted_address,geometry'
    })
    
    const url = `${baseUrl}?${params.toString()}`
    console.log('🌐 Making request to:', url.replace(apiKey, 'API_KEY_HIDDEN'))
    
    const response = await fetch(url)
    console.log('📡 Response status:', response.status)
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('❌ Error body:', errorText)
      
      return new Response(
        JSON.stringify({ 
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: errorText 
        }),
        {
          status: 200, // Return 200 so the frontend gets the error message
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const data = await response.json()
    console.log('📄 API Response status:', data.status)
    console.log('📄 API Response data:', JSON.stringify(data, null, 2))

    if (data.status === 'REQUEST_DENIED') {
      console.error('❌ REQUEST_DENIED - API Key issue')
      console.error('Error message:', data.error_message)
      
      let fixMessage = 'Check that Places API is enabled in Google Cloud Console'
      if (data.error_message?.includes('billing')) {
        fixMessage = 'Enable billing in Google Cloud Console'
      }
      
      return new Response(
        JSON.stringify({ 
          error: `API Access Denied: ${data.error_message || fixMessage}`,
          places: [] 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('❌ OVER_QUERY_LIMIT')
      return new Response(
        JSON.stringify({ 
          error: 'API quota exceeded. Try again later.',
          places: [] 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('❌ Google Places API error:', data.status, data.error_message)
      return new Response(
        JSON.stringify({ 
          error: `API Error: ${data.status} - ${data.error_message || 'Unknown error'}`,
          places: []
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Transform the text search results
    const places = data.results?.map((place: any) => ({
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      geometry: place.geometry,
      types: place.types,
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
      JSON.stringify({ 
        error: `Function error: ${error.message}`,
        places: []
      }),
      {
        status: 200, // Return 200 so frontend gets the error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})