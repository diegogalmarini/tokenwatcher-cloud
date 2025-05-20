#!/usr/bin/env bash
#
# Crea particiones mensuales en la tabla 'events' (o el nombre correcto de tu tabla de eventos)
# Debe ejecutarse una vez al día (ej. 00:00 UTC).
# Requiere que $DATABASE_URL esté definido en el entorno del cron job.

set -euo pipefail # Salir en error, tratar variables no definidas como error, error si falla un pipe.

# Nombre de la tabla de eventos particionada (debe coincidir con models.Event.__tablename__)
EVENTS_TABLE_NAME="events" # CAMBIO: Nombre de tabla consistente

# Número de meses por adelantado para crear particiones (ej. mes actual + 2 meses futuros)
MONTHS_AHEAD=2

log_info() {
  echo "[INFO] $(date -u +"%Y-%m-%dT%H:%M:%SZ") - $1"
}

log_error() {
  echo "[ERROR] $(date -u +"%Y-%m-%dT%H:%M:%SZ") - $1" >&2
}

# Verificar que DATABASE_URL esté configurada
if [ -z "${DATABASE_URL}" ]; then
  log_error "La variable de entorno DATABASE_URL no está configurada."
  exit 1
fi

# Función para formatear YYYY-MM-01
format_date_start_of_month() {
  date -u -d "$1" "+%Y-%m-01" # -u para UTC
}

log_info "Iniciando creación/verificación de particiones para la tabla '${EVENTS_TABLE_NAME}'."

CURRENT_MONTH_START=$(format_date_start_of_month "today")

for i in $(seq 0 $MONTHS_AHEAD); do
  # Calcula el primer día del mes para la partición (mes actual + i meses)
  PARTITION_FOR_MONTH_START=$(format_date_start_of_month "$CURRENT_MONTH_START + $i month")
  # Calcula el primer día del mes siguiente (límite superior de la partición)
  PARTITION_UPPER_BOUND=$(format_date_start_of_month "$PARTITION_FOR_MONTH_START + 1 month")
  
  # Nombre de la partición (ej. events_y2025m05)
  PARTITION_TABLE_NAME="${EVENTS_TABLE_NAME}_y$(date -u -d "$PARTITION_FOR_MONTH_START" "+%Y")m$(date -u -d "$PARTITION_FOR_MONTH_START" "+%m")"

  log_info "Verificando/Creando partición: '${PARTITION_TABLE_NAME}' para el rango ['${PARTITION_FOR_MONTH_START}', '${PARTITION_UPPER_BOUND}')."

  # Comando SQL para crear la partición.
  # Asume que la tabla EVENTS_TABLE_NAME está particionada por RANGE en una columna de tipo DATE o TIMESTAMP
  # (ej. la columna 'created_at' de tu modelo Event).
  # Si la columna de partición es diferente, ajusta la cláusula FOR VALUES.
  SQL_COMMAND="
    SET client_min_messages TO WARNING; -- Suprimir mensajes NOTICE de psql si la tabla ya existe
    CREATE TABLE IF NOT EXISTS ${PARTITION_TABLE_NAME}
      PARTITION OF ${EVENTS_TABLE_NAME}
      FOR VALUES FROM ('${PARTITION_FOR_MONTH_START}') TO ('${PARTITION_UPPER_BOUND}');
    SELECT 'Partición ${PARTITION_TABLE_NAME} verificada/creada.' AS status;
  "
  
  # Ejecutar el comando SQL
  if output=$(psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 -c "${SQL_COMMAND}" 2>&1); then
    log_info "Salida de psql para ${PARTITION_TABLE_NAME}: ${output}"
  else
    log_error "Error al crear/verificar la partición ${PARTITION_TABLE_NAME}. Salida de psql:"
    log_error "${output}"
    # Decide si quieres que el script falle por completo si una partición falla
    # exit 1 
  fi
done

log_info "Proceso de particionamiento completado."

# VACUUM ANALYZE para mantener estadísticas al día en la tabla principal y sus particiones.
log_info "Ejecutando VACUUM ANALYZE en la tabla '${EVENTS_TABLE_NAME}'."
if output_vacuum=$(psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 -c "VACUUM ANALYZE ${EVENTS_TABLE_NAME};" 2>&1); then
  log_info "VACUUM ANALYZE completado. Salida: ${output_vacuum}"
else
  log_error "Error durante VACUUM ANALYZE en ${EVENTS_TABLE_NAME}. Salida de psql:"
  log_error "${output_vacuum}"
fi

log_info "Script de particionamiento finalizado."