import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting cleanup of expired files...')

    // Find all expired files
    const now = new Date().toISOString()
    const { data: expiredFiles, error: fetchError } = await supabase
      .from('shared_files')
      .select('*')
      .lt('expire_at', now)

    if (fetchError) {
      console.error('Error fetching expired files:', fetchError)
      throw fetchError
    }

    console.log(`Found ${expiredFiles?.length || 0} expired files`)

    if (!expiredFiles || expiredFiles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No expired files to clean up', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete files from storage
    const filePaths = expiredFiles.map(file => file.file_path)
    const { error: storageError } = await supabase.storage
      .from('shared-files')
      .remove(filePaths)

    if (storageError) {
      console.error('Error deleting files from storage:', storageError)
    }

    // Delete database records (this will cascade delete permissions)
    const fileIds = expiredFiles.map(file => file.id)
    const { error: dbError } = await supabase
      .from('shared_files')
      .delete()
      .in('id', fileIds)

    if (dbError) {
      console.error('Error deleting database records:', dbError)
      throw dbError
    }

    console.log(`Successfully cleaned up ${expiredFiles.length} expired files`)

    return new Response(
      JSON.stringify({ 
        message: 'Cleanup completed successfully', 
        count: expiredFiles.length,
        files: expiredFiles.map(f => ({ code: f.code, name: f.file_name }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in cleanup function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})