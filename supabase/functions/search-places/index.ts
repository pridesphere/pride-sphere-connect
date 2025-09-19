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
    console.log('=== Search Places Function Called (New Places API) ===')
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

    // Use the NEW Places API (Text Search) endpoint
    const url = 'https://places.googleapis.com/v1/places:searchText'
    
    const requestBody = {
      textQuery: query,
      languageCode: 'en',
      maxResultCount: 10
    }
    
    console.log('🌐 Making request to NEW Places API:', url)
    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2))
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types'
      },
      body: JSON.stringify(requestBody)
    })
    
    console.log('📡 Response status:', response.status)
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ HTTP Error:', response.status, response.statusText)
      console.error('❌ Error body:', errorText)
      
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      if (errorText.includes('API_KEY_INVALID')) {
        errorMessage = 'Invalid API key'
      } else if (errorText.includes('PERMISSION_DENIED')) {
        errorMessage = 'Permission denied - check API key restrictions'
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorText,
          places: []
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const data = await response.json()
    console.log('📄 NEW API Response:', JSON.stringify(data, null, 2))

    // Transform the NEW API results to match our expected format
    const places = data.places?.map((place: any) => ({
      place_id: place.id,
      name: place.displayName?.text || 'Unknown Location',
      formatted_address: place.formattedAddress || 'Address not available',
      geometry: place.location ? {
        location: {
          lat: place.location.latitude,
          lng: place.location.longitude
        }
      } : null,
      types: place.types || [],
    })) || []

    console.log(`✅ Returning ${places.length} places from NEW API`)
    
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
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})