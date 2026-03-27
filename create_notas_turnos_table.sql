-- ===========================================
-- TABLA: Notas por Turnos (Comunicación interna)
-- Sistema POS Listo Ovalo La Marina
-- ===========================================
-- Permite que cada turno deje recordatorios para los demás turnos

CREATE TABLE IF NOT EXISTS public.notas_turnos
(
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Información del turno
    turno_origen integer NOT NULL CHECK (turno_origen IN (1, 2, 3)), -- Turno que escribe la nota
    turno_destino integer NOT NULL CHECK (turno_destino IN (1, 2, 3)), -- Turno al que va dirigida (0 = todos)
    
    -- Contenido de la nota
    titulo character varying(255) NOT NULL,
    contenido text NOT NULL,
    prioridad character varying(20) DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
    
    -- Estado de la nota
    leida boolean DEFAULT false,
    fecha_lectura timestamp with time zone,
    leida_por character varying(255),
    
    -- Información del autor
    autor character varying(255) NOT NULL,
    
    -- Auditoría
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_notas_turnos_turno_origen ON public.notas_turnos(turno_origen);
CREATE INDEX IF NOT EXISTS idx_notas_turnos_turno_destino ON public.notas_turnos(turno_destino);
CREATE INDEX IF NOT EXISTS idx_notas_turnos_leida ON public.notas_turnos(leida);
CREATE INDEX IF NOT EXISTS idx_notas_turnos_prioridad ON public.notas_turnos(prioridad);
CREATE INDEX IF NOT EXISTS idx_notas_turnos_created_at ON public.notas_turnos(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.notas_turnos ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (permite todo para usuarios anónimos - ajustar según necesidades)
CREATE POLICY "Enable read access for all users" ON public.notas_turnos
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.notas_turnos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.notas_turnos
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.notas_turnos
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
CREATE TRIGGER update_notas_turnos_updated_at
    BEFORE UPDATE ON public.notas_turnos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- DATOS DE EJEMPLO (para pruebas)
-- ===========================================

INSERT INTO public.notas_turnos 
    (turno_origen, turno_destino, titulo, contenido, prioridad, autor)
VALUES
    (1, 2, 'Revisar stock de empanadas', 'Favor revisar si quedan empanadas de pollo en el freezer, se agotaron ayer y necesitamos reponer para el almuerzo.', 'alta', 'Juan Pérez'),
    (1, 3, 'Cliente especial', 'Viene el Sr. Rodríguez a las 6 PM para recoger pedido de 50 empanadas. Tener listo y verificar calidad.', 'urgente', 'Juan Pérez'),
    (2, 3, 'Reparación freidora', 'La freidora #2 hace ruido extraño. Llamar al técnico antes del siguiente turno.', 'normal', 'Carlos García'),
    (2, 1, 'Producto vencido', 'Encontré un paquete de pan que vence mañana. Mover a descarte antes del siguiente turno.', 'alta', 'Carlos García'),
    (3, 1, 'Limpieza profunda', 'Hoy toca limpieza profunda de las neveras. Usar desinfectante especial.', 'normal', 'Roberto Díaz');

-- ===========================================
-- CONSULTAS ÚTILES
-- ===========================================

-- Ver notas no leídas para un turno específico (ej: turno 2)
-- SELECT * FROM public.notas_turnos 
-- WHERE turno_destino IN (2, 0) 
-- AND leida = false 
-- ORDER BY prioridad DESC, created_at DESC;

-- Ver todas las notas de hoy
-- SELECT * FROM public.notas_turnos 
-- WHERE DATE(created_at) = CURRENT_DATE 
-- ORDER BY turno_origen, prioridad DESC;

-- Contar notas pendientes por turno
-- SELECT turno_destino, COUNT(*) as pendientes 
-- FROM public.notas_turnos 
-- WHERE leida = false 
-- GROUP BY turno_destino;

-- Marcar nota como leída
-- UPDATE public.notas_turnos 
-- SET leida = true, 
--     fecha_lectura = now(), 
--     leida_por = 'Nombre del usuario'
-- WHERE id = 'uuid-de-la-nota';