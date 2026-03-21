/**
 * js/data.js
 * Seed data: products and recipes for Listo Minimarket
 */

// ── SEED PRODUCTS ──────────────────────────────────────────────────────────────
// Dates are relative to today for demo purposes
(function seedProducts() {
  if (localStorage.getItem('listo_products')) return; // don't overwrite existing data

  const today = new Date();
  const d = (days) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + days);
    return dt.toISOString().split('T')[0];
  };
  const past = (days) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - days);
    return dt.toISOString().split('T')[0];
  };

  const products = [
    { id: 1, name: 'Sándwich de Pollo', category: 'Sándwiches', stock: 12, lowStock: 5, entryDate: past(2), expiryDate: d(1) },
    { id: 2, name: 'Hamburguesa Clásica', category: 'Hamburguesas', stock: 8, lowStock: 5, entryDate: past(1), expiryDate: d(2) },
    { id: 3, name: 'Leche Evaporada Gloria', category: 'Lácteos', stock: 24, lowStock: 10, entryDate: past(5), expiryDate: d(30) },
    { id: 4, name: 'Yogurt Griego', category: 'Lácteos', stock: 6, lowStock: 8, entryDate: past(3), expiryDate: d(0) },
    { id: 5, name: 'Jugo de Naranja', category: 'Bebidas', stock: 15, lowStock: 10, entryDate: past(1), expiryDate: d(5) },
    { id: 6, name: 'Hotdog Premium', category: 'Sándwiches', stock: 3, lowStock: 5, entryDate: past(2), expiryDate: past(1) },
    { id: 7, name: 'Papas Fritas Lays', category: 'Snacks', stock: 30, lowStock: 10, entryDate: past(10), expiryDate: d(90) },
    { id: 8, name: 'Pan de Molde', category: 'Panadería', stock: 4, lowStock: 5, entryDate: past(1), expiryDate: d(3) },
    { id: 9, name: 'Mayonesa Alacena', category: 'Ingredientes', stock: 10, lowStock: 5, entryDate: past(7), expiryDate: d(45) },
    { id: 10, name: 'Lechuga Hidropónica', category: 'Ingredientes', stock: 5, lowStock: 3, entryDate: past(1), expiryDate: d(2) },
    { id: 11, name: 'Coca-Cola 500ml', category: 'Bebidas', stock: 48, lowStock: 12, entryDate: past(3), expiryDate: d(180) },
    { id: 12, name: 'Sándwich Caprese', category: 'Sándwiches', stock: 0, lowStock: 3, entryDate: past(1), expiryDate: past(2) },
  ];

  localStorage.setItem('listo_products', JSON.stringify(products));
  localStorage.setItem('listo_next_id', '13');
})();

// ── RECIPES ────────────────────────────────────────────────────────────────────
const RECIPES = [
  {
    id: 'r1',
    name: 'Sándwich de Pollo',
    emoji: '🥪',
    category: 'Sándwiches',
    prepTime: '5 min',
    ingredients: [
      { name: 'Pan de molde', qty: '2 rebanadas' },
      { name: 'Pechuga de pollo cocida', qty: '40 g' },
      { name: 'Lechuga hidropónica', qty: '10 g' },
      { name: 'Tomate', qty: '2 rodajas' },
      { name: 'Mayonesa Alacena', qty: '5 g' },
      { name: 'Sal / pimienta', qty: 'Al gusto' },
    ],
    steps: [
      'Colocar el pan en la superficie de trabajo.',
      'Untar mayonesa en ambas rebanadas.',
      'Agregar la lechuga sobre la primera rebanada.',
      'Colocar las rodajas de tomate encima de la lechuga.',
      'Añadir la pechuga de pollo desmechada o en láminas.',
      'Sazonar con sal y pimienta al gusto.',
      'Cerrar el sándwich y cortar en diagonal. Servir.',
    ],
  },
  {
    id: 'r2',
    name: 'Hamburguesa Clásica',
    emoji: '🍔',
    category: 'Hamburguesas',
    prepTime: '8 min',
    ingredients: [
      { name: 'Pan de hamburguesa', qty: '1 unidad' },
      { name: 'Carne de res (medallón)', qty: '90 g' },
      { name: 'Queso americano', qty: '1 loncha' },
      { name: 'Lechuga', qty: '15 g' },
      { name: 'Tomate', qty: '2 rodajas' },
      { name: 'Cebolla', qty: '10 g' },
      { name: 'Ketchup', qty: '10 g' },
      { name: 'Mostaza', qty: '5 g' },
    ],
    steps: [
      'Calentar la plancha a fuego medio-alto (180 °C).',
      'Cocinar el medallón de carne 3 min por lado.',
      'Añadir el queso americano al voltear la carne.',
      'Tostar el pan de hamburguesa en la plancha 1 min.',
      'Untar ketchup y mostaza en ambas mitades del pan.',
      'Armar: base → lechuga → tomate → cebolla → carne con queso → tapa.',
      'Presentar envuelto en papel encerado.',
    ],
  },
  {
    id: 'r3',
    name: 'Hotdog Premium',
    emoji: '🌭',
    category: 'Sándwiches',
    prepTime: '4 min',
    ingredients: [
      { name: 'Pan de hotdog', qty: '1 unidad' },
      { name: 'Salchicha tipo frankfurt', qty: '1 unidad (80 g)' },
      { name: 'Mostaza americana', qty: '8 g' },
      { name: 'Ketchup', qty: '10 g' },
      { name: 'Cebolla finamente picada', qty: '15 g' },
      { name: 'Salsa de tomate casera', qty: '10 g' },
    ],
    steps: [
      'Hervir o a la plancha la salchicha durante 3 minutos.',
      'Calentar el pan en la plancha hasta que esté dorado.',
      'Colocar la salchicha dentro del pan.',
      'Agregar mostaza, ketchup y cebolla en orden.',
      'Finalizar con salsa de tomate. Servir inmediatamente.',
    ],
  },
  {
    id: 'r4',
    name: 'Sándwich Caprese',
    emoji: '🥗',
    category: 'Sándwiches',
    prepTime: '3 min',
    ingredients: [
      { name: 'Ciabatta o pan artesanal', qty: '1 porción (80 g)' },
      { name: 'Mozzarella fresca', qty: '30 g' },
      { name: 'Tomate cherry', qty: '4 unidades' },
      { name: 'Hojas de albahaca fresca', qty: '5 g' },
      { name: 'Aceite de oliva extra virgen', qty: '5 ml' },
      { name: 'Sal de mar y pimienta negra', qty: 'Al gusto' },
    ],
    steps: [
      'Partir el pan a la mitad y tostar ligeramente.',
      'Cortar la mozzarella y los tomates cherry en láminas.',
      'Intercalar mozzarella y tomate sobre la base del pan.',
      'Añadir las hojas de albahaca fresca.',
      'Rociar con aceite de oliva, sal y pimienta.',
      'Cerrar y servir a temperatura ambiente.',
    ],
  },
  {
    id: 'r5',
    name: 'Hamburguesa Veggie',
    emoji: '🥦',
    category: 'Hamburguesas',
    prepTime: '7 min',
    ingredients: [
      { name: 'Pan de hamburguesa integral', qty: '1 unidad' },
      { name: 'Hamburguesa de legumbres', qty: '1 unidad (85 g)' },
      { name: 'Aguacate / Palta', qty: '¼ unidad (30 g)' },
      { name: 'Rúcula', qty: '10 g' },
      { name: 'Tomate', qty: '2 rodajas' },
      { name: 'Mayonesa vegana', qty: '8 g' },
      { name: 'Sal / especias', qty: 'Al gusto' },
    ],
    steps: [
      'Calentar la plancha y cocinar la hamburguesa veggie 3 min por lado.',
      'Tostar el pan integral en la plancha.',
      'Aplastar levemente el aguacate con un tenedor y sazonar.',
      'Untar el aguacate en la base del pan.',
      'Colocar la rúcula, tomate y la hamburguesa.',
      'Añadir mayonesa vegana en la tapa y cerrar.',
      'Servir con papas al horno.',
    ],
  },
  {
    id: 'r6',
    name: 'Combo Desayuno',
    emoji: '🍳',
    category: 'Otros',
    prepTime: '10 min',
    ingredients: [
      { name: 'Pan de molde', qty: '2 rebanadas' },
      { name: 'Huevo', qty: '2 unidades' },
      { name: 'Jamón serrano', qty: '30 g' },
      { name: 'Queso crema', qty: '15 g' },
      { name: 'Mantequilla', qty: '5 g' },
    ],
    steps: [
      'Derretir la mantequilla en sartén a fuego medio.',
      'Cocinar los huevos revueltos con sal y pimienta.',
      'Tostar el pan de molde.',
      'Untar queso crema en una rebanada.',
      'Agregar el jamón serrano y los huevos revueltos.',
      'Cerrar y servir caliente. Acompañar con jugo natural.',
    ],
  },
];
