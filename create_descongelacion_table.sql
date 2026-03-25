-- ===========================================
-- TABLA: Descongelación y Refrigeración de Alimentos
-- Sistema POS Listo Minimarket
-- ===========================================

-- Crear la tabla descongelacion_refrigeracion
CREATE TABLE IF NOT EXISTS public.descongelacion_refrigeracion
(
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    id_posicion integer,
    tipo character varying(20) NOT NULL CHECK (tipo IN ('descongelacion', 'refrigeracion')),
    producto character varying(255) NOT NULL,
    vencimiento_empaque date,
    fecha_inicio_proceso date NOT NULL,
    hora_inicio_proceso character varying(5) NOT NULL, -- Formato HH:MM (24h)
    fecha_fin_proceso date,
    hora_fin_proceso character varying(5), -- Formato HH:MM (24h)
    estado character varying(20) DEFAULT 'en_proceso' CHECK (estado IN ('en_proceso', 'completado', 'anulado')),
    notas text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Crear índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_descongelacion_tipo ON public.descongelacion_refrigeracion(tipo);
CREATE INDEX IF NOT EXISTS idx_descongelacion_estado ON public.descongelacion_refrigeracion(estado);
CREATE INDEX IF NOT EXISTS idx_descongelacion_producto ON public.descongelacion_refrigeracion(producto);
CREATE INDEX IF NOT EXISTS idx_descongelacion_fecha_inicio ON public.descongelacion_refrigeracion(fecha_inicio_proceso);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.descongelacion_refrigeracion ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (permite todo para usuarios anónimos - ajustar según necesidades)
CREATE POLICY "Enable read access for all users" ON public.descongelacion_refrigeracion
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.descongelacion_refrigeracion
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.descongelacion_refrigeracion
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.descongelacion_refrigeracion
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
CREATE TRIGGER update_descongelacion_refrigeracion_updated_at
    BEFORE UPDATE ON public.descongelacion_refrigeracion
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- DATOS DE EJEMPLO (opcional - para pruebas)
-- ===========================================

INSERT INTO public.descongelacion_refrigeracion 
    (id_posicion, tipo, producto, vencimiento_empaque, fecha_inicio_proceso, hora_inicio_proceso, fecha_fin_proceso, hora_fin_proceso, estado, notas)
VALUES
    (1, 'descongelacion', 'Emp. Pollo', '2026-03-30', '2026-03-24', '08:00', '2026-03-25', '08:00', 'en_proceso', 'Descongelación lenta en refrigerador'),
    (2, 'descongelacion', 'Emp. Lomo', '2026-03-28', '2026-03-24', '09:00', '2026-03-25', '09:00', 'en_proceso', 'Descongelación a temperatura ambiente'),
    (3, 'refrigeracion', 'Pan Croissant', '2026-03-27', '2026-03-24', '10:00', NULL, NULL, 'en_proceso', 'Mantener entre 2-4°C'),
    (4, 'descongelacion', 'Emp. Carne Molida', '2026-03-29', '2026-03-23', '07:00', '2026-03-24', '07:00', 'completado', 'Proceso completado satisfactoriamente'),
    (5, 'refrigeracion', 'Sándwich Preparado', '2026-03-25', '2026-03-24', '11:00', NULL, NULL, 'en_proceso', 'Producto listo para venta');

-- ===========================================
-- CONSULTAS ÚTILES
-- ===========================================

-- Ver todos los registros activos (en proceso)
-- SELECT * FROM public.descongelacion_refrigeracion WHERE estado = 'en_proceso';

-- Ver registros que vencen pronto (próximas 24 horas)
-- SELECT * FROM public.descongelacion_refrigeracion 
-- WHERE estado = 'en_proceso' 
-- AND fecha_fin_proceso <= CURRENT_DATE + INTERVAL '1 day';

-- Contar por tipo y estado
-- SELECT tipo, estado, COUNT(*) FROM public.descongelacion_refrigeracion GROUP BY tipo, estado;
