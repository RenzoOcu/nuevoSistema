// ===========================================
// SCRIPT DE VERIFICACIÓN DE SUPABASE
// Ejecutar con: node test_conexion.js
// ===========================================

import { createClient } from '@supabase/supabase-js';

// ⚠️ CAMBIAR POR TUS CREDENCIALES REALES
const SUPABASE_URL = 'https://tqjxuafyapjywxmtqxpl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcnh1YWZ5YXBqeXd4bXRxeHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MDkyNjIsImV4cCI6MjA1ODM4NTI2Mn0.j5BQlKjKZvP6kDv4l3hJjvQk8Xz6R9y2Y1nM8vLp0W4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verificarTablas() {
  console.log('🔍 Verificando conexión a Supabase...\n');

  // Lista de tablas a verificar
  const tablas = [
    'productos',
    'recetas',
    'ingredientes',
    'recepcion_refrigeracion',
    'descongelacion',
    'productos_salida',
    'notas_turnos'
  ];

  for (const tabla of tablas) {
    try {
      const { data, error, count } = await supabase
        .from(tabla)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${tabla}: ${error.message}`);
      } else {
        console.log(`✅ ${tabla}: OK (registros: ${count || 0})`);
      }
    } catch (err) {
      console.log(`❌ ${tabla}: ${err.message}`);
    }
  }

  console.log('\n📊 Verificación de datos de ejemplo...\n');

  // Verificar productos_salida
  try {
    const { data: salidas, error } = await supabase
      .from('productos_salida')
      .select('*')
      .limit(5);

    if (!error && salidas) {
      console.log(`📦 Productos Salida: ${salidas.length} registros encontrados`);
      salidas.forEach(s => console.log(`   - ${s.producto} (${s.cantidad} ${s.unidad})`));
    }
  } catch (err) {
    console.log(`📦 Productos Salida: ${err.message}`);
  }

  // Verificar notas_turnos
  try {
    const { data: notas, error } = await supabase
      .from('notas_turnos')
      .select('*')
      .limit(5);

    if (!error && notas) {
      console.log(`\n📝 Notas Turnos: ${notas.length} registros encontrados`);
      notas.forEach(n => console.log(`   - [Turno ${n.turno_origen} → ${n.turno_destino}] ${n.titulo}`));
    }
  } catch (err) {
    console.log(`\n📝 Notas Turnos: ${err.message}`);
  }

  console.log('\n✅ Verificación completada!');
}

verificarTablas();