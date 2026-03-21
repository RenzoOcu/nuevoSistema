const SUPABASE_URL = 'https://skxsmyhjwqdljnrijeqz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNreHNteWhqd3FkbGpucmlqZXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjY4NDUsImV4cCI6MjA4OTYwMjg0NX0.eaUUybPFMta6YHF1m9R05UMoB0tjocuBoy890GELSHU';

let supabase = null;
try {
  if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.error('window.supabase is UNDEFINED. CDN failed to load the UMD build properly.');
  }
} catch (e) {
  console.error('Error creating Supabase client:', e);
}

const SupabaseAPI = {
  async getProducts() {
    try {
      if (!supabase) throw new Error("Supabase is null. CDN failed to load.");
      const { data, error } = await supabase
        .from('productos')
        .select(`*, recetas(id, nombre)`);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching products:', err);
      return [];
    }
  },

  async getRecipe(recetaId) {
    try {
      if (!supabase) throw new Error("Supabase is null. CDN failed to load.");
      const { data: receta, error: err1 } = await supabase
        .from('recetas')
        .select('*')
        .eq('id', recetaId)
        .single();
      if (err1) throw err1;

      const { data: detalles, error: err2 } = await supabase
        .from('receta_detalle')
        .select(`
          cantidad,
          ingredientes (
            nombre,
            unidad
          )
        `)
        .eq('receta_id', recetaId);
      if (err2) throw err2;

      return { ...receta, detalles: detalles || [] };
    } catch (err) {
      console.error('Error fetching recipe:', err);
      return null;
    }
  },

  async saveProduct(product) {
    try {
      if (!supabase) throw new Error("Supabase is null. CDN failed to load.");
      if (product.id) {
        // Update
        const { error } = await supabase.from('productos').update(product).eq('id', product.id);
        if (error) throw error;
      } else {
        // Insert
        // Omit generated columns like id if empty
        const { id, ...newProduct } = product; 
        const { error } = await supabase.from('productos').insert([newProduct]);
        if (error) throw error;
      }
      return true;
    } catch (err) {
      console.error('Error saving product:', err);
      return false;
    }
  },

  async deleteProduct(id) {
    try {
      if (!supabase) throw new Error("Supabase is null. CDN failed to load.");
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting product:', err);
      return false;
    }
  }
};

window.SupabaseAPI = SupabaseAPI;
