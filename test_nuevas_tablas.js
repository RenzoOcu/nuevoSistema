// ===========================================
// TEST DE LAS NUEVAS TABLAS EN SUPABASE
// Ejecutar con: node test_nuevas_tablas.js
// ===========================================

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (misma que tu proyecto)
const SUPABASE_URL = 'https://skxsmyhjwqdljnrijeqz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNreHNteWhqd3FkbGpucmlqZXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjY4NDUsImV4cCI6MjA4OTYwMjg0NX0.eaUUybPFMta6YHF1m9R05UMoB0tjocuBoy890GELSHU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testProductosSalida() {
  console.log('\n📦 PRODUCTOS SALIDA');
  console.log('==================\n');
  
  // Leer registros
  const { data: salidas, error: readError } = await supabase
    .from('productos_salida')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (readError) {
    console.log('❌ Error leyendo tabla:', readError.message);
    return;
  }
  
  console.log(`✅ Registros encontrados: ${salidas.length}`);
  salidas.forEach(s => {
    console.log(`   - ${s.producto} | ${s.cantidad} ${s.unidad} | ${s.responsable}`);
  });
  
  // Insertar registro de prueba
  const nuevoRegistro = {
    producto: 'Empaque de Empanadas (Test)',
    cantidad: 10,
    unidad: 'unidad',
    fecha_salida: new Date().toISOString().split('T')[0],
    hora_salida: new Date().toTimeString().slice(0, 5),
    responsable: 'Sistema Test',
    firma_asistente: 'Automático',
    etiqueta: 'TEST-001',
    motivo: 'Prueba de sistema',
    notas: 'Registro creado por script de prueba'
  };
  
  console.log('\n📝 Insertando registro de prueba...');
  const { data: inserted, error: insertError } = await supabase
    .from('productos_salida')
    .insert([nuevoRegistro])
    .select();
  
  if (insertError) {
    console.log('❌ Error insertando:', insertError.message);
  } else {
    console.log('✅ Registro insertado con ID:', inserted[0].id);
  }
}

async function testNotasTurnos() {
  console.log('\n📝 NOTAS POR TURNOS');
  console.log('===================\n');
  
  // Leer registros
  const { data: notas, error: readError } = await supabase
    .from('notas_turnos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (readError) {
    console.log('❌ Error leyendo tabla:', readError.message);
    return;
  }
  
  console.log(`✅ Registros encontrados: ${notas.length}`);
  notas.forEach(n => {
    const estado = n.leida ? '✓ Leída' : '○ No leída';
    console.log(`   - [T${n.turno_origen} → T${n.turno_destino}] ${n.titulo} | ${estado}`);
  });
  
  // Insertar nota de prueba
  const nuevaNota = {
    turno_origen: 1,
    turno_destino: 2,
    titulo: 'Nota de prueba del sistema',
    contenido: 'Esta es una nota creada por el script de prueba para verificar que todo funciona correctamente.',
    prioridad: 'normal',
    autor: 'Sistema Test'
  };
  
  console.log('\n📝 Insertando nota de prueba...');
  const { data: inserted, error: insertError } = await supabase
    .from('notas_turnos')
    .insert([nuevaNota])
    .select();
  
  if (insertError) {
    console.log('❌ Error insertando:', insertError.message);
  } else {
    console.log('✅ Nota insertada con ID:', inserted[0].id);
  }
}

async function main() {
  console.log('🚀 INICIANDO PRUEBAS DE LAS NUEVAS TABLAS');
  console.log('=========================================');
  
  await testProductosSalida();
  await testNotasTurnos();
  
  console.log('\n=========================================');
  console.log('✅ PRUEBAS COMPLETADAS');
  console.log('=========================================\n');
}

main().catch(console.error);