// ==========================================
// LISTO POS — Minimalist App Logic (Supabase Integrado ES Module)
// ==========================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://skxsmyhjwqdljnrijeqz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNreHNteWhqd3FkbGpucmlqZXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjY4NDUsImV4cCI6MjA4OTYwMjg0NX0.eaUUybPFMta6YHF1m9R05UMoB0tjocuBoy890GELSHU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let ALL_PRODUCTS = [];
let ALL_RECIPES = [];
let ALL_INGREDIENTS = [];

// Start app exactly when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

async function initApp() {
  // Clock setup
  setInterval(updateClock, 1000);
  updateClock();

  // Load data via Supabase
  await loadData();

  // Navigation setup
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      showModule(btn.id.replace('nav-', ''));
      if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
      }
    });
  });
}

function updateClock() {
  const now = new Date();
  const timeEl = document.getElementById('sidebar-time');
  const dateEl = document.getElementById('sidebar-date');
  if (timeEl) timeEl.textContent = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (dateEl) dateEl.textContent = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
}

window.showModule = function(modId) {
  document.querySelectorAll('.module').forEach(m => m.classList.add('hidden'));
  const target = document.getElementById('module-' + modId);
  if (target) target.classList.remove('hidden');
  
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.getElementById('nav-' + modId);
  if (nav) nav.classList.add('active');
};

window.toggleSidebar = function() {
  const side = document.getElementById('sidebar');
  if (side) side.classList.toggle('open');
};

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast toast-${type}`;
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

// ==========================================
// DATA FETCHING & STATE
// ==========================================

async function loadData() {
  try {
    const [prodRes, recRes, ingRes] = await Promise.all([
      supabase.from('productos').select(`*, recetas(id, nombre)`),
      supabase.from('recetas').select('*'),
      supabase.from('ingredientes').select('*')
    ]);
      
    if (prodRes.error) throw prodRes.error;
    if (recRes.error) throw recRes.error;
    if (ingRes.error) throw ingRes.error;
    
    ALL_PRODUCTS = prodRes.data || [];
    ALL_RECIPES = recRes.data || [];
    ALL_INGREDIENTS = ingRes.data || [];
  } catch (err) {
    console.error('Error fetching data:', err);
    showToast('Error cargando datos de Supabase', 'error');
    ALL_PRODUCTS = [];
    ALL_RECIPES = [];
    ALL_INGREDIENTS = [];
  }
  
  renderAllModules();
}

function calcStatus(expiryDateStr) {
  if (!expiryDateStr) return { status: 'normal', days: 999 };
  const today = new Date();
  today.setHours(0,0,0,0);
  const exp = new Date(expiryDateStr);
  exp.setHours(0,0,0,0);
  
  const diffTime = exp - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { status: 'vencido', days: diffDays };
  if (diffDays <= 3) return { status: 'por_vencer', days: diffDays };
  return { status: 'normal', days: diffDays };
}

function getBadgeHTML(statusKey) {
  const map = {
    normal: { cls: 'badge-normal', label: 'Normal' },
    por_vencer: { cls: 'badge-expiring', label: 'Por Vencer' },
    vencido: { cls: 'badge-expired', label: 'Vencido' }
  };
  const bg = map[statusKey] || map.normal;
  return `<span class="status-badge ${bg.cls}">${bg.label}</span>`;
}

// ==========================================
// RENDERING
// ==========================================

function renderAllModules() {
  renderDashboard();
  renderInventory();
  renderAlerts();
  renderRecipes();
}

function renderDashboard() {
  const total = ALL_PRODUCTS.length;
  let expiring = 0;
  let expired = 0;
  let lowstock = 0;
  
  ALL_PRODUCTS.forEach(p => {
    const { status } = calcStatus(p.fecha_vencimiento);
    if (status === 'vencido') expired++;
    if (status === 'por_vencer') expiring++;
    if (p.stock <= 5) lowstock++;
  });
  
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setEl('stat-total-val', total);
  setEl('stat-expiring-val', expiring);
  setEl('stat-expired-val', expired);
  setEl('stat-lowstock-val', lowstock);
  
  // Update nav badge
  const badge = document.getElementById('alert-badge');
  const alertCount = expired + expiring;
  if (badge) {
    badge.textContent = alertCount;
    badge.setAttribute('data-count', alertCount);
  }

  // Topbar badge for mobile
  const topbarBadge = document.getElementById('topbar-badge');
  if (topbarBadge) {
    topbarBadge.textContent = alertCount;
    topbarBadge.style.display = alertCount > 0 ? 'flex' : 'none';
  }

  renderDashboardCards();
}

function renderDashboardCards() {
  const filterEl = document.getElementById('dashboard-filter');
  const filter = filterEl ? filterEl.value : 'all';
  
  const cards = ALL_PRODUCTS.filter(p => {
    const { status } = calcStatus(p.fecha_vencimiento);
    if (filter === 'all') return true;
    if (filter === 'expiring') return status === 'por_vencer';
    if (filter === 'expired') return status === 'vencido';
    if (filter === 'lowstock') return p.stock <= 5;
    return true;
  });
  
  const dashCards = document.getElementById('dashboard-cards');
  if (dashCards) {
    dashCards.innerHTML = cards.map(generateCardHTML).join('');
  }
}

let currentInventoryFilter = 'all';

window.setInventoryFilter = function(filterValue, btnElement) {
  currentInventoryFilter = filterValue;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  renderInventory();
};

window.filterInventory = function() {
  renderInventory();
};

function renderInventory() {
  const searchEl = document.getElementById('search-input');
  const query = searchEl ? searchEl.value.toLowerCase() : '';
  
  const filtered = ALL_PRODUCTS.filter(p => {
    const { status } = calcStatus(p.fecha_vencimiento);
    const mSearch = p.nombre.toLowerCase().includes(query) || (p.categoria || '').toLowerCase().includes(query);
    const mFilter = (currentInventoryFilter === 'all') || 
                    (currentInventoryFilter === 'normal' && status === 'normal') ||
                    (currentInventoryFilter === 'expiring' && status === 'por_vencer') ||
                    (currentInventoryFilter === 'expired' && status === 'vencido');
    return mSearch && mFilter;
  });
  
  const grid = document.getElementById('inventory-grid');
  const empty = document.getElementById('inventory-empty');
  
  if (!grid || !empty) return;
  
  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    grid.innerHTML = filtered.map(generateCardHTML).join('');
  }
}

function renderAlerts() {
  const expired = [];
  const expiring = [];
  
  ALL_PRODUCTS.forEach(p => {
    const { status } = calcStatus(p.fecha_vencimiento);
    if (status === 'vencido') expired.push(p);
    if (status === 'por_vencer') expiring.push(p);
  });
  
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('count-expired', expired.length);
  setEl('count-expiring', expiring.length);
  
  const summary = document.getElementById('alert-summary-bar');
  if (summary) {
    summary.innerHTML = `
      <span class="summary-pill pill-red">${expired.length} vencido(s)</span>
      <span class="summary-pill pill-yellow">${expiring.length} por vencer</span>`;
  }
    
  // Render cards
  const expCardsGrid = document.getElementById('alert-expired-cards');
  const emptyExp = document.getElementById('empty-expired');
  if (expCardsGrid && emptyExp) {
    if (expired.length === 0) {
      expCardsGrid.innerHTML = '';
      emptyExp.classList.remove('hidden');
    } else {
      emptyExp.classList.add('hidden');
      expCardsGrid.innerHTML = expired.map(generateCardHTML).join('');
    }
  }
  
  const porvCardsGrid = document.getElementById('alert-expiring-cards');
  const emptyPor = document.getElementById('empty-expiring');
  if (porvCardsGrid && emptyPor) {
    if (expiring.length === 0) {
      porvCardsGrid.innerHTML = '';
      emptyPor.classList.remove('hidden');
    } else {
      emptyPor.classList.add('hidden');
      porvCardsGrid.innerHTML = expiring.map(generateCardHTML).join('');
    }
  }
}

function generateCardHTML(p) {
  const { status, days } = calcStatus(p.fecha_vencimiento);
  let statusClass = '';
  if (status === 'vencido') statusClass = 'status-expired';
  if (status === 'por_vencer') statusClass = 'status-expiring';
  
  const hasRecipe = p.receta_id != null;
  const clickAction = hasRecipe ? `onclick="openSupabaseRecipe('${p.receta_id}')"` : '';
  const cursorStyle = hasRecipe ? 'cursor: pointer;' : '';

  const venceText = p.fecha_vencimiento 
    ? (status === 'vencido' ? `Venció hace ${Math.abs(days)}d` : (days === 0 ? 'Vence hoy' : `Vence en ${days}d`)) 
    : 'No perecible';

  return `
    <div class="product-card ${statusClass}" ${clickAction} style="${cursorStyle} position:relative;">
      <button onclick="openDeleteModal(event, 'producto', '${p.id}', '${p.nombre.replace(/'/g, "\\'")}')" style="position: absolute; top: 12px; right: 12px; background: transparent; border: none; font-size: 1.1rem; cursor: pointer; color: var(--red); z-index: 10;" title="Eliminar">🗑️</button>
      <button onclick="openEditProduct(event, '${p.id}')" style="position: absolute; top: 12px; right: 40px; background: transparent; border: none; font-size: 1.1rem; cursor: pointer; color: var(--yellow); z-index: 10;" title="Editar">✏️</button>
      <div class="product-card-row">
        <span class="product-card-name" style="padding-right: 55px;">${p.nombre}</span>
      </div>
      <span class="product-card-cat">${p.categoria || 'Sin categoría'}</span>
      
      <div class="product-card-row" style="margin-top: 8px;">
        <span class="product-card-label">Stock:</span>
        <span class="product-card-val" style="color:${p.stock <= 5 ? 'var(--red)' : ''}">${p.stock} uds.</span>
      </div>
      <div class="product-card-row">
        <span class="product-card-label">Vence:</span>
        <span class="product-card-val">${venceText}</span>
      </div>
      
      <div class="product-card-row" style="margin-top: 8px;">
        ${getBadgeHTML(status)}
        ${hasRecipe ? '<span style="font-size:10px; color:var(--yellow); font-weight:600;">Ver Receta →</span>' : ''}
      </div>
    </div>
  `;
}

// ==========================================
// RECIPES
// ==========================================

window.openSupabaseRecipe = async function(recetaId) {
  try {
    const { data: receta, error: err1 } = await supabase
      .from('recetas')
      .select('*')
      .eq('id', recetaId)
      .single();
    if (err1) throw err1;

    const { data: detalles, error: err2 } = await supabase
      .from('receta_detalle')
      .select(`cantidad, ingredientes(nombre, unidad)`)
      .eq('receta_id', recetaId);
    if (err2) throw err2;

    const recipe = { ...receta, detalles: detalles || [] };
    
    document.getElementById('detail-title').textContent = recipe.nombre;
    document.getElementById('detail-meta').textContent = "Receta interactiva";
    document.getElementById('detail-emoji').textContent = "👨‍🍳";

    let tableIng = "";
    if (recipe.detalles && recipe.detalles.length > 0) {
      tableIng = recipe.detalles.map(d => `
        <li>
          <span class="ing-name">${d.ingredientes.nombre}</span>
          <span class="ing-qty">${d.cantidad} ${d.ingredientes.unidad}</span>
        </li>
      `).join('');
    } else {
      tableIng = `<li><span class="ing-name" style="opacity:0.5">Sin ingredientes registrados</span></li>`;
    }
    document.getElementById('detail-ingredients').innerHTML = tableIng;
    
    let stepsHtml = "";
    if (recipe.descripcion) {
      stepsHtml = recipe.descripcion.split('\\n')
        .filter(s => s.trim().length > 0)
        .map(s => {
          const cleanStr = s.replace(/^\\d+\\.\\s*/, '').trim();
          return `<li>${cleanStr}</li>`;
        })
        .join('');
    } else {
      stepsHtml = "<li>No hay pasos definidos.</li>";
    }
    document.getElementById('detail-steps').innerHTML = stepsHtml;
    
    document.getElementById('recipe-detail').classList.remove('hidden');
  } catch (err) {
    console.error('Error fetching recipe:', err);
    showToast("No se pudo cargar la receta", "error");
  }
};

window.closeRecipeDetail = function() {
  document.getElementById('recipe-detail').classList.add('hidden');
};

function renderRecipes() {
  const grid = document.getElementById('recipes-grid');
  if (!grid) return;
  
  if (ALL_RECIPES.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; opacity: 0.5;">No hay recetas disponibles</div>';
    return;
  }
  
  grid.innerHTML = ALL_RECIPES.map(r => `
    <div class="product-card" style="cursor: pointer; border-bottom: 3px solid var(--yellow); position: relative;" onclick="openSupabaseRecipe('${r.id}')">
      <button onclick="openDeleteModal(event, 'receta', '${r.id}', '${r.nombre.replace(/'/g, "\\'")}')" style="position: absolute; top: 12px; right: 12px; background: transparent; border: none; font-size: 1.1rem; cursor: pointer; color: var(--red); z-index: 10;" title="Eliminar Guía">🗑️</button>
      <button onclick="openEditRecipe(event, '${r.id}')" style="position: absolute; top: 12px; right: 40px; background: transparent; border: none; font-size: 1.1rem; cursor: pointer; color: var(--yellow); z-index: 10;" title="Editar Guía">✏️</button>
      <div class="product-card-row">
        <span class="product-card-name" style="font-size: 1.1rem; margin-bottom: 8px; padding-right: 55px;">${r.nombre}</span>
      </div>
      <span class="product-card-cat">Receta Interactiva</span>
      <div style="margin-top: 15px; opacity: 0.8; font-size: 0.85rem;">
        Clic para ver ingredientes y pasos detallados
      </div>
      <div class="product-card-row" style="margin-top: 15px;">
        <span style="font-size:12px; color:var(--yellow); font-weight:600;">Abrir Guía 👨‍🍳</span>
      </div>
    </div>
  `).join('');
}

// ==========================================
// FORMS & MODALS (Add Product fallback)
// ==========================================

let editingProductId = null;

window.openProductModal = function() {
  editingProductId = null;
  document.getElementById('product-form').reset();
  const title = document.getElementById('modal-title');
  if (title) title.textContent = 'Nuevo Producto';
  const overlay = document.getElementById('product-modal-overlay');
  if (overlay) overlay.classList.remove('hidden');
};

window.openEditProduct = function(e, id) {
  if (e) e.stopPropagation();
  editingProductId = id;
  const p = ALL_PRODUCTS.find(x => x.id === id);
  if (!p) return;
  
  document.getElementById('product-form').reset();
  document.getElementById('f-name').value = p.nombre || '';
  document.getElementById('f-category').value = p.categoria || '';
  document.getElementById('f-stock').value = p.stock || 0;
  
  // Handling date values (YYYY-MM-DD expected, or raw string from DB)
  // Ensure we format it properly if needed, but if it comes as YYYY-MM-DD string from supabase, assigning it directly works for input type="date"
  document.getElementById('f-entry').value = p.fecha_ingreso ? p.fecha_ingreso.split('T')[0] : '';
  document.getElementById('f-expiry').value = p.fecha_vencimiento ? p.fecha_vencimiento.split('T')[0] : '';
  
  const title = document.getElementById('modal-title');
  if (title) title.textContent = 'Editar Producto';
  const overlay = document.getElementById('product-modal-overlay');
  if (overlay) overlay.classList.remove('hidden');
};

window.closeProductModal = function(e) {
  if (e && e.target.id !== 'product-modal-overlay' && !e.target.classList.contains('modal-close')) return;
  const overlay = document.getElementById('product-modal-overlay');
  if (overlay) overlay.classList.add('hidden');
};

window.saveProduct = async function(e) {
  e.preventDefault();
  const product = {
    nombre: document.getElementById('f-name').value,
    categoria: document.getElementById('f-category').value,
    stock: parseInt(document.getElementById('f-stock').value, 10),
    fecha_ingreso: document.getElementById('f-entry').value,
    fecha_vencimiento: document.getElementById('f-expiry').value,
    estado: 'normal'
  };

  try {
    let error;
    if (editingProductId) {
      const res = await supabase.from('productos').update(product).eq('id', editingProductId);
      error = res.error;
    } else {
      const res = await supabase.from('productos').insert([product]);
      error = res.error;
    }
    if (error) throw error;
    showToast(editingProductId ? 'Producto actualizado' : 'Producto agregado con éxito');
    window.closeProductModal(null);
    await loadData();
  } catch (err) {
    console.error('Error saving product:', err);
    showToast("Error guardando producto", "error");
  }
};

let editingRecipeId = null;

window.openRecipeFormModal = function() {
  editingRecipeId = null;
  document.getElementById('gui-form').reset();
  document.getElementById('ingredients-container').innerHTML = '';
  const title = document.querySelector('#recipe-form-modal .modal-title');
  if (title) title.textContent = 'Nueva Guía Interactiva';
  const overlay = document.getElementById('recipe-form-overlay');
  if (overlay) overlay.classList.remove('hidden');
};

window.openEditRecipe = async function(e, id) {
  if (e) e.stopPropagation();
  editingRecipeId = id;
  const r = ALL_RECIPES.find(x => x.id === id);
  if (!r) return;
  
  document.getElementById('gui-form').reset();
  document.getElementById('r-name').value = r.nombre || '';
  document.getElementById('r-desc').value = r.descripcion || '';
  
  document.getElementById('ingredients-container').innerHTML = '';
  try {
    const { data: detalles } = await supabase.from('receta_detalle').select('*').eq('receta_id', id);
    if (detalles && detalles.length > 0) {
      detalles.forEach(d => window.addIngredientRow(d));
    }
  } catch(err) {
    console.error("Error cargando detalles", err);
  }

  const title = document.querySelector('#recipe-form-modal .modal-title');
  if (title) title.textContent = 'Editar Guía Interactiva';
  const overlay = document.getElementById('recipe-form-overlay');
  if (overlay) overlay.classList.remove('hidden');
};

window.closeRecipeFormModal = function(e) {
  if (e && e.target.id !== 'recipe-form-overlay' && !e.target.classList.contains('modal-close')) return;
  const overlay = document.getElementById('recipe-form-overlay');
  if (overlay) overlay.classList.add('hidden');
};

window.addIngredientRow = function(data = null) {
  const container = document.getElementById('ingredients-container');
  const row = document.createElement('div');
  row.className = 'ingredient-row form-group';
  row.style.display = 'flex';
  row.style.gap = '10px';
  row.style.alignItems = 'center';
  row.style.marginBottom = '0';

  const select = document.createElement('select');
  select.className = 'form-input ing-select';
  select.style.flex = '2';
  select.required = true;
  select.innerHTML = '<option value="">Seleccionar ingrediente...</option>' + 
    ALL_INGREDIENTS.map(i => `<option value="${i.id}">${i.nombre} (${i.unidad})</option>`).join('');

  const input = document.createElement('input');
  input.className = 'form-input ing-qty';
  input.type = 'number';
  input.step = '0.01';
  input.min = '0.01';
  input.placeholder = 'Cantidad';
  input.style.flex = '1';
  input.required = true;

  if (data) {
    select.value = data.ingrediente_id;
    input.value = data.cantidad;
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-ghost';
  btn.style.color = 'var(--red)';
  btn.style.padding = '10px 15px';
  btn.textContent = '✕';
  btn.onclick = () => container.removeChild(row);

  row.appendChild(select);
  row.appendChild(input);
  row.appendChild(btn);

  container.appendChild(row);
};

window.saveRecipe = async function(e) {
  e.preventDefault();
  const receta = {
    nombre: document.getElementById('r-name').value,
    descripcion: document.getElementById('r-desc').value
  };

  const ingRows = Array.from(document.querySelectorAll('.ingredient-row'));
  const ingredientesData = ingRows.map(row => {
    return {
      ingrediente_id: row.querySelector('.ing-select').value,
      cantidad: parseFloat(row.querySelector('.ing-qty').value)
    };
  });

  try {
    let error, savedRecipeId;
    if (editingRecipeId) {
      const res = await supabase.from('recetas').update(receta).eq('id', editingRecipeId).select();
      error = res.error;
      if (!error && res.data) savedRecipeId = res.data[0].id;
    } else {
      const res = await supabase.from('recetas').insert([receta]).select();
      error = res.error;
      if (!error && res.data) savedRecipeId = res.data[0].id;
    }
    if (error) throw error;

    if (savedRecipeId) {
      if (editingRecipeId) {
        const { error: errDel } = await supabase.from('receta_detalle').delete().eq('receta_id', savedRecipeId);
        if (errDel) console.error("Error deleting old details", errDel);
      }
      if (ingredientesData.length > 0) {
        const detailsToInsert = ingredientesData.map(d => ({ ...d, receta_id: savedRecipeId }));
        const { error: errIns } = await supabase.from('receta_detalle').insert(detailsToInsert);
        if (errIns) console.error("Error inserting details", errIns);
      }
    }

    showToast(editingRecipeId ? 'Guía actualizada' : 'Guía creada con éxito');
    window.closeRecipeFormModal(null);
    await loadData();
  } catch (err) {
    console.error('Error saving recipe:', err);
    showToast("Error guardando la guía", "error");
  }
};

let currentDeleteTarget = null;
window.openDeleteModal = function(e, type, id, name) {
  if (e) e.stopPropagation();
  currentDeleteTarget = { type, id, name };
  document.getElementById('delete-modal-title').textContent = type === 'receta' ? 'Eliminar Guía' : 'Eliminar Producto';
  document.getElementById('delete-name').textContent = name;
  const overlay = document.getElementById('delete-modal-overlay');
  if (overlay) overlay.classList.remove('hidden');
};

window.closeDeleteModal = function(e) {
  if (e && e.target.id !== 'delete-modal-overlay' && !e.target.classList.contains('modal-close') && !e.target.classList.contains('btn-ghost')) return;
  const overlay = document.getElementById('delete-modal-overlay');
  if (overlay) overlay.classList.add('hidden');
  currentDeleteTarget = null;
};

window.confirmDelete = async function() {
  if (!currentDeleteTarget) return;
  const { type, id } = currentDeleteTarget;
  const table = type === 'receta' ? 'recetas' : 'productos';
  
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
    showToast(`${type === 'receta' ? 'Guía' : 'Producto'} eliminado con éxito`);
    window.closeDeleteModal(null);
    await loadData();
  } catch(err) {
    console.error('Error deleting:', err);
    const msg = err.message || 'Error al eliminar';
    showToast(msg, 'error');
  }
};
