// ===========================================
// SERVIDOR LOCAL - Sistema POS Listo Ovalo La Marina
// Ejecutar con: npm start
// ===========================================

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos desde la raíz del proyecto
app.use(express.static(path.join(__dirname)));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n🚀 ====================================');
  console.log('   SISTEMA POS LISTO OVALO LA MARINA');
  console.log('====================================');
  console.log(`\n✅ Servidor iniciado correctamente`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`\n📋 Módulos disponibles:`);
  console.log('   - Dashboard');
  console.log('   - Inventario');
  console.log('   - Alertas');
  console.log('   - Guías Interactivas');
  console.log('   - Recepción y Descongelación');
  console.log('   - Productos Salida');
  console.log('   - Notas Turnos');
  console.log('\n⏹️  Para detener: Ctrl + C');
  console.log('====================================\n');
});