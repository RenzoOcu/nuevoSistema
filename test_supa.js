const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://skxsmyhjwqdljnrijeqz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNreHNteWhqd3FkbGpucmlqZXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjY4NDUsImV4cCI6MjA4OTYwMjg0NX0.eaUUybPFMta6YHF1m9R05UMoB0tjocuBoy890GELSHU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const { data, error } = await supabase.from('productos').select(`*, recetas(id, nombre)`);
  console.log("Error:", error);
  console.log("Data length:", data ? data.length : null);
}
test();
