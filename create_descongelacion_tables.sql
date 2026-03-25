-- ===========================================
-- SISTEMA DE RECEPCIÓN Y DESCONGELACIÓN DE ALIMENTOS
-- Sistema POS Listo Minimarket
-- ===========================================
-- Flujo: Proveedor → Recepción/Refrigeración → Descongelación → Uso

-- ===========================================
-- TABLA 1: RECEPCIÓN / REFRIGERACIÓN
-- Cuando se reciben productos del proveedor
-- ===========================================

CREATE TABLE IF NOT EXISTS public.recepcion_refrigeracion
(
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    id_posicion integer,
    proveedor character varying(255),
    producto character varying(255) NOT NULL,
    vencimiento_empaque date,
    cantidad integer,
    unidad character varying(20) DEFAULT 'kg',
    fecha_recepcion date NOT NULL,
    hora_recepcion character varying(5) NOT NULL, -- Formato HH:MM (24h)
    temperatura_recepcion numeric(4,1), -- Temperatura al recibir (°C)
    estado character varying(20) DEFAULT 'en_refrigeracion' 
        CHECK (estado IN ('en_refrigeracion', 'listo', 'anulado')),
    notas text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_recepcion_estado ON public.recepcion_refrigeracion(estado);
CREATE INDEX IF NOT EXISTS idx_recepcion_producto ON public.recepcion_refrigeracion(producto);
CREATE INDEX IF NOT EXISTS idx_recepcion_fecha ON public.recepcion_refrigeracion(fecha_recepcion);

-- ===========================================
-- TABLA 2: DESCONGELACIÓN
-- Productos que pasan de refrigeración a descongelación
-- ===========================================

CREATE TABLE IF NOT EXISTS public.descongelacion
(
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    id_posicion integer,
    recepcion_id uuid REFERENCES public.recepcion_refrigeracion(id) ON DELETE SET NULL,
    producto character varying(255) NOT NULL,
    vencimiento_empaque date,
    fecha_inicio_proceso date NOT NULL,
    hora_inicio_proceso character varying(5) NOT NULL, -- Formato HH:MM (24h)
    fecha_fin_proceso date,
    hora_fin_proceso character varying(5), -- Formato HH:MM (24h)
    metodo character varying(30) DEFAULT 'refrigerador'
        CHECK (metodo IN ('refrigerador', 'agua_fria', 'microondas', 'ambiente')),
    estado character varying(20) DEFAULT 'en_proceso' 
        CHECK (estado IN ('en_proceso', 'completado', 'anulado')),
    notas text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_descongelacion_estado ON public.descongelacion(estado);
CREATE INDEX IF NOT EXISTS idx_descongelacion_producto ON public.descongelacion(producto);
CREATE INDEX IF NOT EXISTS idx_descongelacion_recepcion ON public.descongelacion(recepcion_id);
CREATE INDEX IF NOT EXISTS idx_descongelacion_fecha_inicio ON public.descongelacion(fecha_inicio_proceso);

-- ===========================================
-- HABILITAR RLS (Row Level Security)
-- ===========================================

ALTER TABLE public.recepcion_refrigeracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.descongelacion ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para recepcion_refrigeracion
CREATE POLICY "Enable read access for all users" ON public.recepcion_refrigeracion
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.recepcion_refrigeracion
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.recepcion_refrigeracion
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.recepcion_refrigeracion
    FOR DELETE USING (true);

-- Políticas de acceso para descongelacion
CREATE POLICY "Enable read access for all users" ON public.descongelacion
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.descongelacion
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.descongelacion
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.descongelacion
    FOR DELETE USING (true);

-- ===========================================
-- FUNCIÓN PARA ACTUALIZAR updated_at
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_recepcion_refrigeracion_updated_at
    BEFORE UPDATE ON public.recepcion_refrigeracion
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_descongelacion_updated_at
    BEFORE UPDATE ON public.descongelacion
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- VISTA: Unir recepción con descongelación
-- ===========================================

CREATE OR REPLACE VIEW public.vista_flujo_alimentos AS
SELECT 
    r.id as recepcion_id,
    r.id_posicion as recepcion_posicion,
    r.producto,
    r.proveedor,
    r.fecha_recepcion,
    r.hora_recepcion,
    r.estado as estado_recepcion,
    d.id as descongelacion_id,
    d.fecha_inicio_proceso,
    d.hora_inicio_proceso,
    d.fecha_fin_proceso,
    d.hora_fin_proceso,
    d.metodo,
    d.estado as estado_descongelacion,
    CASE 
        WHEN d.id IS NULL AND r.estado = 'listo' THEN 'Esperando descongelación'
        WHEN d.estado = 'en_proceso' THEN 'En descongelación'
        WHEN d.estado = 'completado' THEN 'Listo para usar'
        ELSE r.estado
    END as estado_actual
FROM public.recepcion_refrigeracion r
LEFT JOIN public.descongelacion d ON d.recepcion_id = r.id;

-- ===========================================
-- DATOS DE EJEMPLO (para pruebas)
-- ===========================================

-- Ejemplos de recepción
INSERT INTO public.recepcion_refrigeracion 
    (id_posicion, proveedor, producto, vencimiento_empaque, cantidad, unidad, fecha_recepcion, hora_recepcion, temperatura_recepcion, estado, notas)
VALUES
    (1, 'Distribuidora ABC', 'Emp. Pollo', '2026-03-30', 10, 'kg', '2026-03-23', '08:30', 4.2, 'listo', '24 horas en refrigeración - Listo para descongelar'),
    (2, 'Carnes del Sur', 'Emp. Lomo', '2026-03-28', 5, 'kg', '2026-03-23', '09:15', 3.8, 'listo', ' producto en buen estado'),
    (3, 'Panadería Central', 'Pan Croissant', '2026-03-25', 50, 'unidad', '2026-03-24', '07:00', 5.1, 'en_refrigeracion', 'Esperando 24h de refrigeración'),
    (4, 'Distribuidora ABC', 'Carne Molida', '2026-03-29', 8, 'kg', '2026-03-22', '10:00', 4.0, 'listo', 'Completado refrigeración'),
    (5, 'Avícola Norte', 'Pechuga de Pollo', '2026-03-31', 15, 'kg', '2026-03-24', '06:45', 3.5, 'en_refrigeracion', 'Recién recibido');

-- Ejemplos de descongelación
INSERT INTO public.descongelacion 
    (id_posicion, recepcion_id, producto, vencimiento_empaque, fecha_inicio_proceso, hora_inicio_proceso, fecha_fin_proceso, hora_fin_proceso, metodo, estado, notas)
VALUES
    (1, (SELECT id FROM public.recepcion_refrigeracion WHERE producto = 'Emp. Pollo' LIMIT 1), 
     'Emp. Pollo', '2026-03-30', '2026-03-24', '08:00', '2026-03-25', '08:00', 'refrigerador', 'en_proceso', 'Descongelación lenta en refrigerador'),
    (2, (SELECT id FROM public.recepcion_refrigeracion WHERE producto = 'Carne Molida' LIMIT 1), 
     'Carne Molida', '2026-03-29', '2026-03-23', '14:00', '2026-03-24', '14:00', 'refrigerador', 'completado', 'Descongelación completada - Producto en freezer');

-- ===========================================
-- CONSULTAS ÚTILES
-- ===========================================

-- Ver todo el flujo de alimentos
-- SELECT * FROM public.vista_flujo_alimentos ORDER BY fecha_recepcion DESC;

-- Ver productos listos para descongelar
-- SELECT * FROM public.recepcion_refrigeracion WHERE estado = 'listo';

-- Ver descongelaciones en proceso
-- SELECT d.*, r.proveedor FROM public.descongelacion d
-- LEFT JOIN public.recepcion_refrigeracion r ON r.id = d.recepcion_id
-- WHERE d.estado = 'en_proceso';

-- Estadísticas del día
-- SELECT 
--     (SELECT COUNT(*) FROM public.recepcion_refrigeracion WHERE fecha_recepcion = CURRENT_DATE) as recepciones_hoy,
--     (SELECT COUNT(*) FROM public.descongelacion WHERE fecha_inicio_proceso = CURRENT_DATE) as descongelaciones_hoy,
--     (SELECT COUNT(*) FROM public.descongelacion WHERE estado = 'en_proceso') as en_proceso,
--     (SELECT COUNT(*) FROM public.recepcion_refrigeracion WHERE estado = 'en_refrigeracion') as en_refrigeracion;
