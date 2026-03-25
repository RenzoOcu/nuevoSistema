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
let ALL_RECEPCION = [];
let ALL_DESCONGELACION = [];

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
    const [prodRes, recRes, ingRes, recepRes, descRes] = await Promise.all([
      supabase.from('productos').select(`*, recetas(id, nombre)`),
      supabase.from('recetas').select('*'),
      supabase.from('ingredientes').select('*'),
      supabase.from('recepcion_refrigeracion').select('*').order('created_at', { ascending: false }),
      supabase.from('descongelacion').select('*, recepcion_refrigeracion(id, producto)').order('created_at', { ascending: false })
    ]);
      
    if (prodRes.error) throw prodRes.error;
    if (recRes.error) throw recRes.error;
    if (ingRes.error) throw ingRes.error;
    if (recepRes.error) throw recepRes.error;
    if (descRes.error) throw descRes.error;
    
    ALL_PRODUCTS = prodRes.data || [];
    ALL_RECIPES = recRes.data || [];
    ALL_INGREDIENTS = ingRes.data || [];
    ALL_RECEPCION = recepRes.data || [];
    ALL_DESCONGELACION = descRes.data || [];
  } catch (err) {
    console.error('Error fetching data:', err);
    showToast('Error cargando datos de Supabase', 'error');
    ALL_PRODUCTS = [];
    ALL_RECIPES = [];
    ALL_INGREDIENTS = [];
    ALL_RECEPCION = [];
    ALL_DESCONGELACION = [];
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
  renderRecepcion();
  renderDescongelacion();
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
  const listoParaDescongelar = ALL_RECEPCION.filter(r => r.estado === 'listo').length;
  const alertCount = expired + expiring + listoParaDescongelar;
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
  
  const listos = ALL_RECEPCION.filter(r => r.estado === 'listo');
  
  const summary = document.getElementById('alert-summary-bar');
  if (summary) {
    summary.innerHTML = `
      <span class="summary-pill pill-red">${expired.length} vencido(s)</span>
      <span class="summary-pill pill-yellow">${expiring.length} por vencer</span>
      <span class="summary-pill pill-blue" style="background: rgba(10,132,255,0.15); color: var(--blue); padding: 4px 10px; border-radius: 12px; font-size: 11px;">❄️ ${listos.length} listos para descongelar</span>`;
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

// ==========================================
// DESCONGELACIÓN Y REFRIGERACIÓN - TABS
// ==========================================

window.switchDesconTab = function(tab) {
  // Update tab buttons
  document.querySelectorAll('.descon-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  
  // Update content visibility
  document.getElementById('content-recepcion').classList.toggle('hidden', tab !== 'recepcion');
  document.getElementById('content-descongelacion').classList.toggle('hidden', tab !== 'descongelacion');
  
  // Refresh data
  if (tab === 'recepcion') {
    renderRecepcion();
  } else {
    renderDescongelacion();
  }
};

// ==========================================
// RECEPCIÓN / REFRIGERACIÓN
// ==========================================

let currentRecepcionFilter = 'all';
let editingRecepcionId = null;

window.setRecepcionFilter = function(filterValue, btnElement) {
  currentRecepcionFilter = filterValue;
  document.querySelectorAll('#content-recepcion .filter-btn').forEach(b => b.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  renderRecepcion();
};

window.filterRecepcion = function() {
  renderRecepcion();
};

function renderRecepcion() {
  const searchEl = document.getElementById('recepcion-search');
  const query = searchEl ? searchEl.value.toLowerCase() : '';
  
  const filtered = ALL_RECEPCION.filter(r => {
    const matchesSearch = (r.producto || '').toLowerCase().includes(query) ||
                          (r.proveedor || '').toLowerCase().includes(query) ||
                          (r.id_posicion || '').toString().includes(query);
    
    let matchesFilter = true;
    if (currentRecepcionFilter === 'en_refrigeracion') matchesFilter = r.estado === 'en_refrigeracion';
    if (currentRecepcionFilter === 'listo') matchesFilter = r.estado === 'listo';
    
    return matchesSearch && matchesFilter;
  });
  
  // Update stats
  const total = ALL_RECEPCION.length;
  const enRefrigeracion = ALL_RECEPCION.filter(r => r.estado === 'en_refrigeracion').length;
  const listo = ALL_RECEPCION.filter(r => r.estado === 'listo').length;
  
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setEl('stat-total-recep-val', total);
  setEl('stat-en-refrigeracion-val', enRefrigeracion);
  setEl('stat-listo-descon-val', listo);
  
  // Update nav badge
  const badge = document.getElementById('descon-badge');
  if (badge) {
    badge.textContent = listo;
    badge.style.display = listo > 0 ? 'flex' : 'none';
  }
  
  const tbody = document.getElementById('recepcion-table-body');
  const empty = document.getElementById('recepcion-empty');
  
  if (!tbody || !empty) return;
  
  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    tbody.innerHTML = filtered.map(r => generateRecepcionRow(r)).join('');
  }
}

function generateRecepcionRow(r) {
  const estadoClass = r.estado || 'en_refrigeracion';
  const estadoLabel = r.estado === 'listo' ? 'Listo' : 
                      r.estado === 'anulado' ? 'Anulado' : 'En Refrigeración';
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES');
  };
  
  // Calculate days in refrigeration
  const diasEnRefrigeracion = r.fecha_recepcion ? 
    Math.floor((new Date() - new Date(r.fecha_recepcion)) / (1000 * 60 * 60 * 24)) : 0;
  
  const canMove = r.estado === 'listo';
  const canEdit = r.estado !== 'anulado';
  
  return `
    <tr>
      <td><strong>${r.id_posicion || '-'}</strong></td>
      <td>${r.producto || '-'}${r.proveedor ? `<br><small style="color: var(--grey)">de ${r.proveedor}</small>` : ''}</td>
      <td>${formatDate(r.vencimiento_empaque)}</td>
      <td>${formatDate(r.fecha_recepcion)}</td>
      <td>${r.hora_recepcion || '-'}</td>
      <td><span class="estado-badge ${diasEnRefrigeracion >= 1 ? 'en_proceso' : 'completado'}">${diasEnRefrigeracion} día(s)</span></td>
      <td><span class="estado-badge ${estadoClass}">${estadoLabel}</span></td>
      <td>
        <div class="action-btns">
          ${canMove ? `<button class="action-btn complete" onclick="moveToDescongelacion('${r.id}')" title="Mover a Descongelación">❄️</button>` : ''}
          ${canEdit ? `<button class="action-btn edit" onclick="openEditRecepcion('${r.id}')" title="Editar">✏️</button>` : ''}
          <button class="action-btn delete" onclick="deleteRecepcion('${r.id}', '${(r.producto || '').replace(/'/g, "\\'")}')" title="Eliminar">🗑️</button>
        </div>
      </td>
    </tr>
  `;
}

window.openRecepcionModal = function() {
  editingRecepcionId = null;
  document.getElementById('recepcion-form').reset();
  document.getElementById('recepcion-modal-title').textContent = 'Registrar Recepción de Producto';
  
  // Set default dates to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('r-fecha-recepcion').value = today;
  document.getElementById('r-hora-recepcion').value = new Date().toTimeString().slice(0, 5);
  
  document.getElementById('recepcion-modal-overlay').classList.remove('hidden');
};

window.openEditRecepcion = function(id) {
  const r = ALL_RECEPCION.find(x => x.id === id);
  if (!r) return;
  
  editingRecepcionId = id;
  
  document.getElementById('r-id-posicion').value = r.id_posicion || '';
  document.getElementById('r-proveedor').value = r.proveedor || '';
  document.getElementById('r-producto').value = r.producto || '';
  document.getElementById('r-vencimiento-empaque').value = r.vencimiento_empaque ? r.vencimiento_empaque.split('T')[0] : '';
  document.getElementById('r-cantidad').value = r.cantidad || '';
  document.getElementById('r-unidad').value = r.unidad || 'kg';
  document.getElementById('r-fecha-recepcion').value = r.fecha_recepcion ? r.fecha_recepcion.split('T')[0] : '';
  document.getElementById('r-hora-recepcion').value = r.hora_recepcion || '';
  document.getElementById('r-temperatura').value = r.temperatura_recepcion || '';
  document.getElementById('r-estado').value = r.estado || 'en_refrigeracion';
  document.getElementById('r-notas').value = r.notas || '';
  
  document.getElementById('recepcion-modal-title').textContent = 'Editar Recepción';
  document.getElementById('recepcion-modal-overlay').classList.remove('hidden');
};

window.closeRecepcionModal = function(e) {
  if (e && e.target.id !== 'recepcion-modal-overlay' && !e.target.classList.contains('modal-close') && !e.target.classList.contains('btn-ghost')) return;
  document.getElementById('recepcion-modal-overlay').classList.add('hidden');
  editingRecepcionId = null;
};

window.saveRecepcion = async function(e) {
  e.preventDefault();
  
  const record = {
    id_posicion: document.getElementById('r-id-posicion').value ? parseInt(document.getElementById('r-id-posicion').value) : null,
    proveedor: document.getElementById('r-proveedor').value || null,
    producto: document.getElementById('r-producto').value,
    vencimiento_empaque: document.getElementById('r-vencimiento-empaque').value || null,
    cantidad: document.getElementById('r-cantidad').value ? parseInt(document.getElementById('r-cantidad').value) : null,
    unidad: document.getElementById('r-unidad').value,
    fecha_recepcion: document.getElementById('r-fecha-recepcion').value || null,
    hora_recepcion: document.getElementById('r-hora-recepcion').value || null,
    temperatura_recepcion: document.getElementById('r-temperatura').value ? parseFloat(document.getElementById('r-temperatura').value) : null,
    estado: document.getElementById('r-estado').value,
    notas: document.getElementById('r-notas').value || null
  };

  try {
    let error;
    if (editingRecepcionId) {
      const res = await supabase.from('recepcion_refrigeracion').update(record).eq('id', editingRecepcionId);
      error = res.error;
    } else {
      const res = await supabase.from('recepcion_refrigeracion').insert([record]);
      error = res.error;
    }
    if (error) throw error;
    
    showToast(editingRecepcionId ? 'Recepción actualizada' : 'Recepción registrada con éxito');
    window.closeRecepcionModal(null);
    await loadData();
  } catch (err) {
    console.error('Error saving recepcion:', err);
    showToast('Error guardando recepción', 'error');
  }
};

window.deleteRecepcion = async function(id, name) {
  if (!confirm(`¿Estás seguro de eliminar la recepción de "${name}"?`)) return;
  
  try {
    const { error } = await supabase.from('recepcion_refrigeracion').delete().eq('id', id);
    if (error) throw error;
    
    showToast('Recepción eliminada con éxito');
    await loadData();
  } catch (err) {
    console.error('Error deleting recepcion:', err);
    showToast('Error eliminando recepción', 'error');
  }
};

// ==========================================
// MOVER A DESCONGELACIÓN
// ==========================================

window.moveToDescongelacion = async function(recepcionId) {
  const recepcion = ALL_RECEPCION.find(r => r.id === recepcionId);
  if (!recepcion) {
    showToast('No se encontró el registro de recepción', 'error');
    return;
  }
  
  // Switch to descongelacion tab and open modal with pre-filled data
  switchDesconTab('descongelacion');
  
  setTimeout(() => {
    editingDesconId = null;
    document.getElementById('descongelacion-form').reset();
    document.getElementById('descongelacion-modal-title').textContent = 'Iniciar Descongelación';
    
    // Pre-fill data from recepcion
    document.getElementById('d-recepcion-id').value = recepcionId;
    document.getElementById('d-id-posicion').value = recepcion.id_posicion || '';
    document.getElementById('d-producto').value = recepcion.producto || '';
    document.getElementById('d-vencimiento-empaque').value = recepcion.vencimiento_empaque ? recepcion.vencimiento_empaque.split('T')[0] : '';
    
    // Set default dates to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('d-fecha-inicio').value = today;
    document.getElementById('d-hora-inicio').value = new Date().toTimeString().slice(0, 5);
    
    document.getElementById('descongelacion-modal-overlay').classList.remove('hidden');
  }, 100);
};

// ==========================================
// DESCONGELACIÓN
// ==========================================

let currentDesconFilter = 'all';
let editingDesconId = null;

window.setDescongelacionFilter = function(filterValue, btnElement) {
  currentDesconFilter = filterValue;
  document.querySelectorAll('#content-descongelacion .filter-btn').forEach(b => b.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  renderDescongelacion();
};

window.filterDescongelacion = function() {
  renderDescongelacion();
};

function renderDescongelacion() {
  const searchEl = document.getElementById('descon-search-input');
  const query = searchEl ? searchEl.value.toLowerCase() : '';
  
  const filtered = ALL_DESCONGELACION.filter(d => {
    const matchesSearch = (d.producto || '').toLowerCase().includes(query) ||
                          (d.id_posicion || '').toString().includes(query);
    
    let matchesFilter = true;
    if (currentDesconFilter === 'en_proceso') matchesFilter = d.estado === 'en_proceso';
    if (currentDesconFilter === 'completado') matchesFilter = d.estado === 'completado';
    if (currentDesconFilter === 'anulado') matchesFilter = d.estado === 'anulado';
    
    return matchesSearch && matchesFilter;
  });
  
  // Update stats
  const total = ALL_DESCONGELACION.length;
  const enProceso = ALL_DESCONGELACION.filter(d => d.estado === 'en_proceso').length;
  const completados = ALL_DESCONGELACION.filter(d => d.estado === 'completado').length;
  const anulados = ALL_DESCONGELACION.filter(d => d.estado === 'anulado').length;
  
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setEl('stat-total-descon-val', total);
  setEl('stat-activos-descon-val', enProceso);
  setEl('stat-completados-descon-val', completados);
  setEl('stat-anulados-descon-val', anulados);
  
  const tbody = document.getElementById('descongelacion-table-body');
  const empty = document.getElementById('descongelacion-empty');
  
  if (!tbody || !empty) return;
  
  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    tbody.innerHTML = filtered.map(d => generateDescongelacionRow(d)).join('');
  }
}

function generateDescongelacionRow(d) {
  const estadoClass = d.estado || 'en_proceso';
  const estadoLabel = d.estado === 'completado' ? 'Completado' : 
                      d.estado === 'anulado' ? 'Anulado' : 'En Proceso';
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES');
  };
  
  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return timeStr;
  };
  
  const canComplete = d.estado === 'en_proceso';
  
  // Get origin product name
  const originName = d.recepcion_refrigeracion ? d.recepcion_refrigeracion.producto : '-';
  
  return `
    <tr>
      <td><strong>${d.id_posicion || '-'}</strong></td>
      <td>${d.producto || '-'}</td>
      <td>${formatDate(d.vencimiento_empaque)}</td>
      <td>${originName !== '-' ? `<span style="color: var(--blue); font-size: 12px;">📦 ${originName}</span>` : '-'}</td>
      <td>${formatDate(d.fecha_inicio_proceso)}</td>
      <td>${formatTime(d.hora_inicio_proceso)}</td>
      <td>${formatDate(d.fecha_fin_proceso)}</td>
      <td>${formatTime(d.hora_fin_proceso)}</td>
      <td><span class="estado-badge ${estadoClass}">${estadoLabel}</span></td>
      <td>
        <div class="action-btns">
          ${canComplete ? `<button class="action-btn complete" onclick="completeDescongelacion('${d.id}')" title="Completar">✓</button>` : ''}
          <button class="action-btn edit" onclick="openEditDescongelacion('${d.id}')" title="Editar">✏️</button>
          <button class="action-btn delete" onclick="deleteDescongelacion('${d.id}', '${(d.producto || '').replace(/'/g, "\\'")}')" title="Eliminar">🗑️</button>
        </div>
      </td>
    </tr>
  `;
}

window.openDescongelacionModal = function() {
  editingDesconId = null;
  document.getElementById('descongelacion-form').reset();
  document.getElementById('descongelacion-modal-title').textContent = 'Iniciar Descongelación';
  
  // Populate recepcion dropdown
  populateRecepcionDropdown();
  
  // Set default dates to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('d-fecha-inicio').value = today;
  document.getElementById('d-hora-inicio').value = new Date().toTimeString().slice(0, 5);
  
  document.getElementById('descongelacion-modal-overlay').classList.remove('hidden');
};

function populateRecepcionDropdown() {
  const select = document.getElementById('d-recepcion-id');
  const listos = ALL_RECEPCION.filter(r => r.estado === 'listo');
  
  select.innerHTML = '<option value="">Seleccionar producto recibido (opcional)...</option>' +
    listos.map(r => `<option value="${r.id}">${r.producto} - ${r.fecha_recepcion ? new Date(r.fecha_recepcion).toLocaleDateString('es-ES') : ''}</option>`).join('');
}

window.openEditDescongelacion = function(id) {
  const d = ALL_DESCONGELACION.find(x => x.id === id);
  if (!d) return;
  
  editingDesconId = id;
  
  populateRecepcionDropdown();
  
  document.getElementById('d-id-posicion').value = d.id_posicion || '';
  document.getElementById('d-recepcion-id').value = d.recepcion_id || '';
  document.getElementById('d-producto').value = d.producto || '';
  document.getElementById('d-vencimiento-empaque').value = d.vencimiento_empaque ? d.vencimiento_empaque.split('T')[0] : '';
  document.getElementById('d-fecha-inicio').value = d.fecha_inicio_proceso ? d.fecha_inicio_proceso.split('T')[0] : '';
  document.getElementById('d-hora-inicio').value = d.hora_inicio_proceso || '';
  document.getElementById('d-fecha-fin').value = d.fecha_fin_proceso ? d.fecha_fin_proceso.split('T')[0] : '';
  document.getElementById('d-hora-fin').value = d.hora_fin_proceso || '';
  document.getElementById('d-metodo').value = d.metodo || 'refrigerador';
  document.getElementById('d-estado').value = d.estado || 'en_proceso';
  document.getElementById('d-notas').value = d.notas || '';
  
  document.getElementById('descongelacion-modal-title').textContent = 'Editar Descongelación';
  document.getElementById('descongelacion-modal-overlay').classList.remove('hidden');
};

window.closeDescongelacionModal = function(e) {
  if (e && e.target.id !== 'descongelacion-modal-overlay' && !e.target.classList.contains('modal-close') && !e.target.classList.contains('btn-ghost')) return;
  document.getElementById('descongelacion-modal-overlay').classList.add('hidden');
  editingDesconId = null;
};

window.saveDescongelacion = async function(e) {
  e.preventDefault();
  
  const recepcionId = document.getElementById('d-recepcion-id').value || null;
  
  const record = {
    id_posicion: document.getElementById('d-id-posicion').value ? parseInt(document.getElementById('d-id-posicion').value) : null,
    recepcion_id: recepcionId,
    producto: document.getElementById('d-producto').value,
    vencimiento_empaque: document.getElementById('d-vencimiento-empaque').value || null,
    fecha_inicio_proceso: document.getElementById('d-fecha-inicio').value || null,
    hora_inicio_proceso: document.getElementById('d-hora-inicio').value || null,
    fecha_fin_proceso: document.getElementById('d-fecha-fin').value || null,
    hora_fin_proceso: document.getElementById('d-hora-fin').value || null,
    metodo: document.getElementById('d-metodo').value,
    estado: document.getElementById('d-estado').value,
    notas: document.getElementById('d-notas').value || null
  };

  try {
    let error;
    if (editingDesconId) {
      const res = await supabase.from('descongelacion').update(record).eq('id', editingDesconId);
      error = res.error;
    } else {
      const res = await supabase.from('descongelacion').insert([record]);
      error = res.error;
    }
    if (error) throw error;
    
    showToast(editingDesconId ? 'Descongelación actualizada' : 'Descongelación iniciada con éxito');
    window.closeDescongelacionModal(null);
    await loadData();
  } catch (err) {
    console.error('Error saving descongelacion:', err);
    showToast('Error guardando descongelación', 'error');
  }
};

window.deleteDescongelacion = async function(id, name) {
  if (!confirm(`¿Estás seguro de eliminar el proceso de "${name}"?`)) return;
  
  try {
    const { error } = await supabase.from('descongelacion').delete().eq('id', id);
    if (error) throw error;
    
    showToast('Proceso eliminado con éxito');
    await loadData();
  } catch (err) {
    console.error('Error deleting descongelacion:', err);
    showToast('Error eliminando proceso', 'error');
  }
};

window.completeDescongelacion = async function(id) {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);
  
  try {
    const { error } = await supabase.from('descongelacion')
      .update({ 
        estado: 'completado',
        fecha_fin_proceso: today,
        hora_fin_proceso: now
      })
      .eq('id', id);
    if (error) throw error;
    
    showToast('Descongelación completada - Producto listo para usar');
    await loadData();
  } catch (err) {
    console.error('Error completing descongelacion:', err);
    showToast('Error al completar proceso', 'error');
  }
};
