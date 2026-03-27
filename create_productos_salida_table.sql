-- ===========================================
-- TABLA: Productos Salida (Control de despacho)
-- Sistema POS Listo Ovalo La Marina
-- ===========================================
-- Flujo: Producto sale del almacén → Registro de salida con foto y firma

CREATE TABLE IF NOT EXISTS public.productos_salida
(
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Información del producto
    producto character varying(255) NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    unidad character varying(20) DEFAULT 'unidad',
    
    -- Fechas y horarios
    fecha_salida date NOT NULL,
    hora_salida character varying(5) NOT NULL, -- Formato HH:MM (24h)
    fecha_empaque date, -- Fecha de empaque del producto
    hora_empaque character varying(5), -- Hora de empaque
    
    -- Información de la persona
    responsable character varying(255) NOT NULL, -- Quién registra la salida
    firma_asistente character varying(255), -- Firma o nombre del asistente
    
    -- Información adicional
    etiqueta character varying(255), -- Código o etiqueta del producto
    foto_url text, -- URL de la foto (puede ser ruta local o URL)
    motivo character varying(255), -- Motivo de la salida
    notas text, -- Observaciones adicionales
    
    -- Auditoría
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_productos_salida_fecha ON public.productos_salida(fecha_salida);
CREATE INDEX IF NOT EXISTS idx_productos_salida_producto ON public.productos_salida(producto);
CREATE INDEX IF NOT EXISTS idx_productos_salida_responsable ON public.productos_salida(responsable);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.productos_salida ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (permite todo para usuarios anónimos - ajustar según necesidades)
CREATE POLICY "Enable read access for all users" ON public.productos_salida
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.productos_salida
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.productos_salida
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.productos_salida
    FOR DELETE USING (true);

-- Función para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_productos_salida_updated_at
    BEFORE UPDATE ON public.productos_salida
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- DATOS DE EJEMPLO (para pruebas)
-- ===========================================

INSERT INTO public.productos_salida 
    (producto, cantidad, unidad, fecha_salida, hora_salida, fecha_empaque, hora_empaque, responsable, firma_asistente, etiqueta, motivo, notas)
VALUES
    ('Empaque de Empanadas', 20, 'unidad', '2026-03-27', '10:30', '2026-03-26', '14:00', 'Juan Pérez', 'María López', 'EMP-001', 'Venta directa', 'Empaques frescos del día'),
    ('Empaque de Panqueques', 15, 'unidad', '2026-03-27', '11:45', '2026-03-26', '16:30', 'Carlos García', 'Ana Torres', 'PAN-002', 'Despacho a local', 'Revisar etiqueta de vencimiento'),
    ('Empaque de Tortas', 8, 'unidad', '2026-03-27', '14:20', '2026-03-27', '08:00', 'Roberto Díaz', 'Sofía Martínez', 'TOR-003', 'Evento especial', 'Tortas decoradas para cumpleaños');

-- ===========================================
-- CONSULTAS ÚTILES
-- ===========================================

-- Ver todas las salidas del día
-- SELECT * FROM public.productos_salida 
-- WHERE fecha_salida = CURRENT_DATE 
-- ORDER BY hora_salida DESC;

-- Ver salidas por responsable
-- SELECT responsable, COUNT(*) as total_salidas 
-- FROM public.productos_salida 
-- GROUP BY responsable 
-- ORDER BY total_salidas DESC;

-- Resumen de salidas por producto
-- SELECT producto, SUM(cantidad) as total_cantidad 
-- FROM public.productos_salida 
-- WHERE fecha_salida >= CURRENT_DATE - 7 
-- GROUP BY producto 
-- ORDER BY total_cantidad DESC;