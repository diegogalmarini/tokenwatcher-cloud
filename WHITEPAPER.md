# Whitepaper: TokenWatcher-Cloud

**Autor:** Diego Raúl Galmarini
**Versión:** 1.0
**Fecha:** 7 de mayo de 2025
**Repositorio del Proyecto:** [https://github.com/diegogalmarini/tokenwatcher-cloud](https://github.com/diegogalmarini/tokenwatcher-cloud)

## 1. Resumen Ejecutivo

TokenWatcher-Cloud es una plataforma de software diseñada para la monitorización en tiempo real de transferencias significativas de tokens ERC-20 en redes compatibles con la Máquina Virtual de Ethereum (EVM), como Ethereum, Polygon y Arbitrum. El proyecto nace de la necesidad de contar con una herramienta accesible y eficiente que permita a desarrolladores, analistas y entusiastas de Web3 rastrear movimientos on-chain relevantes sin incurrir en la complejidad y los costes asociados al despliegue y mantenimiento de infraestructura propia.

La plataforma opera como un servicio que sondea la blockchain a intervalos regulares, detecta eventos de transferencia que superan umbrales definidos por el usuario y envía notificaciones instantáneas a través de canales como Slack, Discord o webhooks genéricos. Para garantizar la sostenibilidad y la eficiencia, especialmente en un contexto de uso gratuito o de bajo coste, TokenWatcher-Cloud implementa un sistema de archivado automático de eventos antiguos en AWS S3 y la purga periódica de la base de datos principal (PostgreSQL).

Desarrollado con Python, FastAPI para el backend, SQLAlchemy como ORM, y desplegado mediante Docker en la plataforma Render, este proyecto no solo ofrece una solución funcional para la monitorización de tokens, sino que también sirve como un ejemplo práctico de la aplicación de tecnologías modernas en el desarrollo de aplicaciones Web3, el manejo de datos on-chain y la arquitectura de servicios en la nube.

**Palabras Clave:** Monitorización Blockchain, Alertas ERC-20, Web3, FastAPI, Python, PostgreSQL, Docker, Render, AWS S3, Open Source, Portafolio Técnico.

## 2. Introducción: El Desafío de la Visibilidad On-Chain

El ecosistema de las criptomonedas y la tecnología blockchain ha experimentado una expansión sin precedentes. Diariamente, millones de transacciones se registran en diversas redes, generando un volumen ingente de datos on-chain. Si bien esta transparencia es una de las fortalezas fundamentales de la blockchain, también presenta un desafío significativo: la capacidad de observar, filtrar y reaccionar a eventos específicos en tiempo real.

Para traders, analistas, equipos de desarrollo de DApps, y Organizaciones Autónomas Descentralizadas (DAOs), identificar grandes movimientos de tokens, la actividad de ciertas billeteras ("whales"), o el lanzamiento de nuevos contratos puede ser crucial para la toma de decisiones, la seguridad o la identificación de oportunidades. Sin embargo, realizar este seguimiento de forma manual consultando exploradores de bloques es ineficiente y prácticamente inviable a escala.

**Problemáticas Existentes:**

* **Sobrecarga de Información:** El gran volumen de transacciones dificulta la identificación manual de eventos relevantes.
* **Necesidad de Inmediatez:** En el dinámico mercado cripto, la capacidad de recibir información al instante es vital.
* **Complejidad Técnica:** Desarrollar y mantener soluciones de monitorización robustas requiere conocimientos especializados y una infraestructura que puede ser costosa y compleja de gestionar (nodos, bases de datos, sistemas de colas, etc.).
* **Límites de APIs Públicas:** Depender exclusivamente de APIs públicas de exploradores de bloques (como Etherscan) puede llevar a limitaciones de tasa (`rate-limiting`) que afectan la continuidad y fiabilidad del servicio de monitorización.
* **Gestión de Datos a Largo Plazo:** El almacenamiento continuo de todos los eventos on-chain puede volverse costoso y degradar el rendimiento de las bases de datos si no se gestiona adecuadamente.

TokenWatcher-Cloud se ha concebido para abordar estos desafíos, ofreciendo una solución de monitorización eficiente, automatizada y accesible, diseñada con un enfoque pragmático en la gestión de recursos y la sostenibilidad operativa. Este proyecto demuestra cómo, utilizando herramientas modernas y una arquitectura bien pensada, es posible construir servicios Web3 valiosos que pueden operar con costes mínimos.

## 3. TokenWatcher-Cloud: La Solución Detallada

TokenWatcher-Cloud es una aplicación backend que proporciona un servicio continuo de monitorización de la blockchain. Su diseño se centra en la simplicidad de configuración para el usuario final y en la eficiencia operativa.

### 3.1. Funcionalidades Clave

* **Creación de "Watchers" Personalizados:** Los usuarios (o el administrador del sistema, en la versión actual) pueden definir "watchers" específicos. Cada watcher se configura con:
    * La dirección del contrato del token ERC-20 a monitorizar.
    * Un nombre descriptivo para el watcher.
    * Un umbral de volumen (ej. notificar si se mueven más de X cantidad de tokens).
    * (Futuro) Canales de notificación asociados.

* **Polling Inteligente On-Chain:** Un servicio en segundo plano (`watcher.py`) sondea periódicamente la blockchain (actualmente a través de la API de Etherscan) para buscar nuevas transacciones (`Transfer` events) de los contratos monitorizados.
    * Gestiona el `start_block` para cada watcher, asegurando que solo se procesen transacciones nuevas desde la última revisión.
    * Maneja la paginación y los rangos de bloques para optimizar las llamadas a la API de Etherscan.

* **Procesamiento y Filtrado de Eventos:**
    * Las transacciones recuperadas se procesan para extraer el volumen transferido.
    * Se compara el volumen con el umbral definido en el watcher correspondiente.

* **Generación y Almacenamiento de `TokenEvent`:** Si una transacción supera el umbral, se crea un registro `TokenEvent` en la base de datos PostgreSQL. Este evento contiene detalles como:
    * ID del watcher asociado.
    * Dirección del contrato.
    * Volumen de la transacción.
    * Hash de la transacción (TxHash).
    * Número de bloque.
    * Timestamp del evento.

* **Notificaciones en Tiempo Real:** Tras registrar un `TokenEvent` significativo, el sistema envía una notificación a los canales configurados. Actualmente, el sistema está preparado para:
    * **Slack:** Mediante webhooks entrantes, con mensajes formateados usando Block Kit.
    * **Discord:** Mediante webhooks, con mensajes enriquecidos usando Embeds.
    * **Webhooks Genéricos:** (Planificado) Para permitir la integración con cualquier otro sistema que pueda recibir un payload JSON.
    * La lógica de notificación incluye reintentos con backoff exponencial para manejar errores transitorios o `rate-limiting` de las plataformas de mensajería.

* **API de Gestión (FastAPI):** Se expone una API RESTful construida con FastAPI para:
    * Operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre los `Watchers`.
    * Consultar los `TokenEvents` registrados (con paginación y filtros).
    * (Futuro) Gestionar `Transports` (canales de notificación específicos por watcher).
    * Un endpoint `/health` para verificaciones de estado.

* **Archivado y Purga Automática de Datos:** Para mantener la base de datos PostgreSQL ágil y dentro de los límites de almacenamiento (especialmente en planes gratuitos de servicios como Render), se implementa un proceso de mantenimiento:
    * Un script (`cleanup_and_archive.py`) se ejecuta periódicamente (ej. diariamente mediante un Cron Job).
    * Los `TokenEvents` más antiguos que un umbral configurable (ej. 1 día) se seleccionan.
    * Estos eventos se serializan a formato JSON y se archivan en un bucket de AWS S3 para su conservación a largo plazo.
    * Una vez archivados, los eventos se eliminan de la base de datos PostgreSQL.
    * Se ejecuta un comando `VACUUM ANALYZE` en PostgreSQL para reclamar el espacio liberado y optimizar la base de datos.

### 3.2. Flujo de Valor para el Usuario/Desarrollador

1.  **Configuración:** Un usuario o administrador define un `Watcher` a través de la API, especificando el token y el umbral de interés.
2.  **Monitorización Continua:** El servicio de polling de TokenWatcher-Cloud se encarga de vigilar la blockchain 24/7.
3.  **Detección:** Cuando ocurre una transferencia del token monitorizado que supera el umbral, el sistema la detecta.
4.  **Alerta Inmediata:** Se envía una notificación al canal configurado (Slack, Discord) con los detalles de la transacción.
5.  **Registro Persistente (y Efímero en BD Principal):** El evento se guarda en la base de datos para consultas recientes y luego se archiva a S3 para el histórico, manteniendo la base principal optimizada.

Este flujo permite a los interesados obtener información crítica de forma pasiva y oportuna, sin necesidad de supervisar activamente los exploradores de bloques.

## 4. Arquitectura Técnica

TokenWatcher-Cloud está construido sobre una pila tecnológica moderna, priorizando la eficiencia, la modularidad y la facilidad de despliegue y mantenimiento.

### 4.1. Componentes Principales

La plataforma se compone de los siguientes módulos interconectados:

* **API Backend (FastAPI):**
    * Escrita en Python, utilizando el framework FastAPI por su alto rendimiento y facilidad para construir APIs robustas con validación automática de datos (gracias a Pydantic) y generación de documentación interactiva (Swagger UI y ReDoc).
    * Proporciona endpoints RESTful para la gestión de `Watchers` (creación, consulta, actualización, eliminación) y la consulta de `TokenEvents`.
    * Utiliza SQLAlchemy como ORM para interactuar con la base de datos PostgreSQL, con modelos definidos en `models.py` y operaciones CRUD en `crud.py`.
    * Los esquemas de datos para la API (request/response) se definen en `schemas.py` utilizando Pydantic.

* **Servicio de Polling (`watcher.py`):**
    * Un script de Python independiente diseñado para ser ejecutado periódicamente (ej. mediante un Cron Job).
    * Se conecta a la API de Etherscan (configurable mediante `ETHERSCAN_API_KEY`) para obtener los eventos `Transfer` de los tokens ERC-20 configurados en los `Watchers` activos.
    * Implementa lógica para gestionar el `start_block` de cada watcher, asegurando que solo se procesen nuevas transacciones y optimizando el rango de bloques consultados (`MAX_BLOCK_RANGE`).
    * Si una transacción supera el umbral del watcher, invoca funciones de `crud.py` para registrar el `TokenEvent` en la base de datos.
    * Invoca al módulo `notifier.py` para enviar las alertas.

* **Módulo de Notificaciones (`notifier.py`):**
    * Responsable de formatear y enviar las alertas a los canales configurados.
    * Actualmente soporta Slack (usando `blocks` para mensajes enriquecidos) y Discord (usando `embeds`).
    * Las URLs de los webhooks se gestionan a través de variables de entorno (`SLACK_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL`).
    * Implementa una estrategia de reintentos con backoff exponencial (`_backoff_sleep`) para manejar errores temporales de las APIs de notificación (ej. `rate limits`).
    * Configurable con `NOTIFY_MAX_RETRIES` y `NOTIFY_BACKOFF_BASE`.

* **Base de Datos (PostgreSQL):**
    * Se utiliza PostgreSQL como sistema de gestión de bases de datos relacional para la persistencia de `Watchers` y `TokenEvents` recientes.
    * Desplegada como un servicio gestionado en Render.
    * La conexión se configura mediante la variable de entorno `DATABASE_URL`.
    * Se utilizan índices en las tablas para optimizar las consultas.

* **Servicio de Archivado y Limpieza (`cleanup_and_archive.py`):**
    * Un script de Python, también diseñado para ejecución periódica (Cron Job).
    * Selecciona `TokenEvents` de la base de datos PostgreSQL que superan una antigüedad definida (ej. 1 día).
    * Serializa estos eventos a formato JSON.
    * Sube los archivos JSON a un bucket de AWS S3 para almacenamiento a largo plazo. Las credenciales de AWS (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) y la configuración del bucket (`S3_BUCKET`, `AWS_REGION`) se gestionan mediante variables de entorno.
    * Elimina los eventos archivados de la base de datos PostgreSQL.
    * Ejecuta `VACUUM ANALYZE` en la tabla `token_events` para optimizar el espacio y el rendimiento de la base de datos.

* **Contenerización (Docker):**
    * La aplicación API (FastAPI) se empaqueta en una imagen Docker utilizando un `Dockerfile`. Esto asegura un entorno de ejecución consistente y facilita el despliegue en Render.
    * El `Dockerfile` gestiona la instalación de dependencias listadas en `requirements.txt` y define el comando de inicio para el servidor Uvicorn.

### 4.2. Flujo de Datos y Lógica de Control

1.  **Configuración del Watcher:** A través de la API, se crea un nuevo `Watcher` en la base de datos.
2.  **Ejecución del Polling:** El Cron Job `Poll Watchers` ejecuta `watcher.py`.
    * El script obtiene los `Watchers` activos de la base de datos.
    * Para cada `Watcher`, determina el bloque de inicio y consulta Etherscan.
    * Las transacciones que superan el umbral se convierten en `TokenEvent` y se guardan en PostgreSQL.
    * Se dispara una notificación a través de `notifier.py`.
3.  **Ejecución del Archivado:** El Cron Job `Purge Old TokenEvents` ejecuta `cleanup_and_archive.py`.
    * Los eventos antiguos se leen de PostgreSQL, se suben a S3 y se eliminan de PostgreSQL.
    * Se optimiza la base de datos.
4.  **Acceso a la API:** Los usuarios o sistemas externos pueden interactuar con la API para gestionar watchers o consultar eventos.

### 4.3. Consideraciones de Diseño para Eficiencia y Coste

* **Dependencia de Etherscan:** Actualmente, el polling depende de la API de Etherscan. Se implementan estrategias de manejo de `rate limits` (reintentos, backoff) y optimización de consultas (rangos de bloques, `start_block` por watcher) para un uso responsable. Una futura mejora podría incluir la opción de conectarse a un nodo EVM propio o a otros proveedores de API.
* **Gestión de Base de Datos:** La estrategia de archivado y purga es crucial para mantener los costes de la base de datos bajos y el rendimiento alto, especialmente en planes gratuitos o de bajo coste de servicios gestionados.
* **Stateless API:** La API de FastAPI está diseñada para ser *stateless*, lo que facilita su escalado horizontal si fuera necesario (aunque para un proyecto de portafolio, una única instancia suele ser suficiente).
* **Variables de Entorno:** Toda la configuración sensible (API keys, URLs de base de datos, webhooks) se gestiona mediante variables de entorno, siguiendo las mejores prácticas de seguridad y facilitando la configuración en diferentes entornos (desarrollo, producción).

## 5. Despliegue y Operación en Render

TokenWatcher-Cloud está completamente desplegado y operativo en la plataforma Render, aprovechando sus servicios gestionados para minimizar la carga administrativa.

### 5.1. Configuración de Servicios en Render

El proyecto utiliza los siguientes tipos de servicios en Render:

* **Web Service (`tokenwatcher-cloud`):**
    * Aloja la API de FastAPI.
    * Se despliega a partir de una imagen Docker construida desde el `Dockerfile` del repositorio.
    * Render gestiona la construcción de la imagen y el despliegue en cada `git push` a la rama principal del repositorio de GitHub.
    * Se le asigna una URL pública (ej. `https://tokenwatcher-cloud.onrender.com`).
    * Las variables de entorno necesarias (como `DATABASE_URL`, `ETHERSCAN_API_KEY`, webhooks de Slack/Discord, credenciales de AWS S3) se configuran directamente en el dashboard de Render.

* **Base de Datos PostgreSQL (`tokenwatcher-db-v3`):**
    * Un servicio de base de datos PostgreSQL gestionado por Render.
    * Proporciona la persistencia para los `Watchers` y los `TokenEvents` recientes.
    * La URL de conexión interna se utiliza en la variable de entorno `DATABASE_URL` del Web Service y los Cron Jobs.

* **Cron Job (`Poll Watchers`):**
    * Ejecuta el script `python -m api.app.watcher` a intervalos regulares (ej. cada minuto).
    * Responsable de realizar el sondeo de la blockchain y disparar las notificaciones.
    * Utiliza el mismo entorno y variables que el Web Service para acceder a la base de datos y a las APIs externas.

* **Cron Job (`Purge Old TokenEvents`):**
    * Ejecuta el script `python3 scripts/cleanup_and_archive.py` de forma programada (ej. diariamente a las 02:00 AM UTC).
    * Encargado del mantenimiento de la base de datos (archivado a S3 y purga).

* **Cron Job (`Keep-Alive Ping`):**
    * Un pequeño script que ejecuta `curl https://tokenwatcher-cloud.onrender.com/health` cada pocos minutos.
    * Su propósito es mantener activo el Web Service en el plan gratuito de Render, evitando que entre en estado de "sleep" por inactividad, lo que asegura que la API responda rápidamente.

### 5.2. Integración con GitHub

* El repositorio del proyecto en GitHub (`https://github.com/diegogalmarini/tokenwatcher-cloud`) está conectado a Render.
* La funcionalidad de "Auto-Deploy" de Render está habilitada, lo que significa que cualquier cambio enviado a la rama principal del repositorio dispara automáticamente un nuevo build y despliegue del Web Service y los Cron Jobs (si su código base ha cambiado).

Esta configuración proporciona un pipeline de CI/CD simple pero efectivo y una infraestructura robusta y de bajo mantenimiento para el proyecto.

## 6. TokenWatcher-Cloud como Proyecto de Portafolio y Potencial Open Source

Más allá de su utilidad funcional, TokenWatcher-Cloud ha sido desarrollado con la intención de servir como un ejemplo tangible de habilidades y conocimientos en el desarrollo de software moderno, especialmente en el contexto de aplicaciones Web3 y servicios en la nube.

### 6.1. Demostración de Habilidades Técnicas

Este proyecto ilustra la capacidad de:

* **Diseñar y desarrollar APIs RESTful robustas:** Utilizando Python, FastAPI, Pydantic para validación, y SQLAlchemy para la interacción con bases de datos.
* **Interactuar con Blockchains EVM:** A través de APIs como la de Etherscan para obtener datos on-chain (eventos de transferencia).
* **Gestionar Bases de Datos Relacionales:** Diseño de esquemas, implementación de operaciones CRUD, y estrategias de optimización y mantenimiento (PostgreSQL).
* **Desarrollar Lógica de Negocio Compleja:** Implementación del sistema de polling, filtrado de eventos, y gestión de umbrales.
* **Integrar Servicios de Terceros:** Conexión con Slack, Discord para notificaciones, y AWS S3 para almacenamiento de archivos.
* **Implementar Tareas Asíncronas y Programadas:** Uso de Cron Jobs para el polling y el mantenimiento de la base de datos.
* **Contenerizar Aplicaciones:** Creación de `Dockerfile` para empaquetar la aplicación y asegurar la portabilidad.
* **Desplegar y Operar Servicios en la Nube:** Utilización de la plataforma Render para alojar la API, la base de datos y los workers, incluyendo la configuración de variables de entorno y la automatización de despliegues (CI/CD con GitHub).
* **Escribir Código Modular y Mantenible:** Estructuración del proyecto en módulos cohesivos (`api/app`, `scripts`) con responsabilidades claras.
* **Considerar la Eficiencia y la Gestión de Costes:** Diseño de soluciones como el archivado en S3 y la purga de la base de datos para operar de manera sostenible en entornos con recursos limitados.

### 6.2. Potencial como Proyecto Open Source

El código fuente de TokenWatcher-Cloud está disponible públicamente en GitHub, lo que abre la puerta a varias posibilidades:

* **Aprendizaje y Referencia:** Otros desarrolladores pueden estudiar el código para aprender sobre las tecnologías y patrones utilizados.
* **Base para Proyectos Propios:** El proyecto puede ser bifurcado (`forked`) y adaptado para necesidades específicas o como punto de partida para herramientas más complejas.
* **Contribuciones de la Comunidad:** Aunque no es el objetivo principal en esta etapa, la estructura del proyecto podría permitir contribuciones futuras si surgiera interés (ej. añadir soporte para más blockchains, nuevos tipos de notificación, un frontend más elaborado).

Al compartir este proyecto, se busca no solo mostrar un producto final funcional, sino también el proceso de diseño, desarrollo y despliegue detrás de él.

## 7. Hoja de Ruta Futura y Posibles Mejoras

Si bien TokenWatcher-Cloud es actualmente un proyecto funcional que cumple con sus objetivos primarios, existen diversas vías para su evolución y mejora continua, tanto desde una perspectiva técnica como de utilidad. Estas ideas se presentan como posibles exploraciones futuras:

* **Interfaz de Usuario (Dashboard):**
    * Desarrollar un dashboard web (ej. utilizando React o Next.js) que permita a los usuarios:
        * Gestionar `Watchers` (crear, editar, eliminar) de forma visual.
        * Visualizar los `TokenEvents` recientes en tiempo real (ej. mediante WebSockets).
        * Consultar el historial de eventos con filtros y paginación.
        * Configurar los canales de notificación (`Transports`) de manera interactiva.
    * Esta interfaz mejoraría significativamente la usabilidad para usuarios no técnicos.

* **Autenticación y Gestión de Usuarios:**
    * Implementar un sistema de autenticación (ej. OAuth2 con JWTs, como se esboza en `auth.py`) para permitir que múltiples usuarios gestionen sus propios watchers de forma segura y aislada.
    * Esto transformaría el proyecto en una verdadera aplicación multiusuario.

* **Soporte Multi-Cadena Extendido:**
    * Aunque la lógica actual podría adaptarse a otras cadenas EVM, formalizar y probar el soporte para redes como BNB Smart Chain, Arbitrum, Optimism, etc.
    * Investigar la integración de adaptadores para cadenas no-EVM (ej. Solana, Avalanche), lo que requeriría diferentes mecanismos de consulta de eventos.

* **Mayor Flexibilidad en Notificaciones:**
    * Permitir plantillas de mensajes personalizadas por el usuario para las notificaciones.
    * Integrar más canales de notificación (ej. Telegram, Email, SMS).
    * Implementar un sistema de `Transports` más granular en la API y la base de datos para que cada `Watcher` pueda tener múltiples destinos de notificación con configuraciones individuales.

* **Optimización Avanzada del Polling:**
    * Explorar el uso de WebSockets directamente con nodos Ethereum (si se dispone de uno) para una detección de eventos más en tiempo real, en lugar de depender únicamente del polling a APIs como Etherscan.
    * Implementar mecanismos de `rate limiting` más sofisticados a nivel de aplicación para proteger los recursos propios y las APIs de terceros.

* **Análisis de Datos y Alertas Inteligentes (Visión a Largo Plazo):**
    * Incorporar funcionalidades de análisis sobre los datos de `TokenEvents` recopilados (ej. tendencias de volumen, patrones de actividad).
    * Explorar la integración de fuentes de datos externas (ej. sentimiento de noticias, como se menciona en los borradores iniciales del proyecto) para enriquecer las alertas y potencialmente ofrecer predicciones básicas.

* **Mejoras en la Experiencia de Desarrollador (DX) para Open Source:**
    * Añadir documentación más exhaustiva para contribuir al proyecto.
    * Incluir scripts de configuración y pruebas más completos.

Estas mejoras se plantean como una visión de lo que TokenWatcher-Cloud podría llegar a ser, manteniendo siempre el foco en la utilidad práctica y la viabilidad técnica.

## 8. Conclusión

TokenWatcher-Cloud demuestra ser una solución eficaz y pragmática para la monitorización en tiempo real de transferencias de tokens ERC-20. A través de una arquitectura bien definida, el uso de tecnologías modernas y un enfoque en la eficiencia operativa, el proyecto logra ofrecer una herramienta valiosa sin incurrir en la complejidad y los altos costes típicamente asociados con este tipo de sistemas.

El despliegue en Render.com, utilizando Docker y servicios gestionados, junto con la estrategia de archivado de datos en AWS S3, asegura un funcionamiento sostenible y de bajo mantenimiento, ideal para un proyecto de portafolio o una herramienta comunitaria. La disponibilidad del código fuente en GitHub subraya el compromiso con la transparencia y el aprendizaje compartido.

Este proyecto no solo cumple con su propósito funcional, sino que también sirve como un testimonio de la capacidad para diseñar, desarrollar y desplegar aplicaciones Web3 completas, desde la concepción hasta la puesta en producción. Es una base sólida que puede ser utilizada, extendida y adaptada, y representa una pieza significativa en la demostración de competencias técnicas en el desarrollo de software contemporáneo.

Invitamos a la comunidad de desarrolladores y entusiastas de Web3 a explorar el código, probar la funcionalidad y considerar TokenWatcher-Cloud como un ejemplo de lo que se puede lograr con ingenio y las herramientas adecuadas.

## 9. Apéndice Técnico

### 9.1. Diagrama de Arquitectura Simplificado
+---------------------+      +---------------------+      +---------------------+
|     Usuario/Admin   |----->|        API          |<---->|     Base de Datos   |
| (Postman/Frontend)  |      | (FastAPI en Render) |      | (PostgreSQL en Render)|
+---------------------+      +--------^--+---------+      +----------^----------+
|  |                        |
|  | (CRUD Watchers,        | (Eventos recientes,
|  |  Consulta Eventos)     |  Config. Watchers)
|  |                        |
|  +------------------------+
|
| (Lee Watchers,
|  Escribe Eventos)
v
+---------------------+      +--------+------------+      +---------------------+
| Etherscan API /     |<---->|   Servicio Polling  |----->| Módulo Notificación |
| Otras Blockchains   |      | (Cron Job en Render)|      | (Slack, Discord)    |
+---------------------+      |   (watcher.py)      |      +---------------------+
+---------+-----------+
|
| (Lee Eventos antiguos)
v
+---------------------+      +---------+-----------+
| AWS S3              |<---->|Servicio Archivado/  |
| (Almacenamiento     |      |Limpieza (Cron Job)  |
|  JSON histórico)    |      | (cleanup_and_archive.py)|
+---------------------+      +---------------------+

*Diagrama 1: Arquitectura simplificada de TokenWatcher-Cloud y flujo de datos principal.*

### 9.2. Ejemplos de Payloads de API

**Crear un Watcher (POST /watchers/):**

*Request Body:*
```json
{
  "name": "Monitor Grandes Movimientos de USDC",
  "contract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 
  "threshold": 100000.0 
}
Response Body (ejemplo):

JSON

{
  "name": "Monitor Grandes Movimientos de USDC",
  "contract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "threshold": 100000.0,
  "id": 1,
  "created_at": "2025-05-07T14:30:00.000Z",
  "updated_at": "2025-05-07T14:30:00.000Z"
}
Consultar Eventos de un Watcher (GET /events/{watcher_id}):

Response Body (ejemplo para watcher_id=1):

JSON

[
  {
    "watcher_id": 1,
    "contract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "volume": 150000.0,
    "tx_hash": "0xabcdef1234567890...",
    "block_number": 17000000,
    "id": 101,
    "timestamp": "2025-05-07T15:00:00.000Z"
  },
  {
    "watcher_id": 1,
    "contract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "volume": 250000.0,
    "tx_hash": "0x1234567890abcdef...",
    "block_number": 17000010,
    "id": 102,
    "timestamp": "2025-05-07T15:05:00.000Z"
  }
]
9.3. Formato de Notificaciones (Ejemplos Conceptuales)
Notificación en Slack (usando Block Kit):

JSON

{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": ":rotating_light: Alerta TokenWatcher: Monitor Grandes Movimientos de USDC",
        "emoji": true
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*Contrato:*\n`0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`"},
        {"type": "mrkdwn", "text": "*Volumen:*\n150000.0 USDC"},
        {"type": "mrkdwn", "text": "*Bloque:*\n17000000"},
        {"type": "mrkdwn", "text": "*Fecha (UTC):*\n2025-05-07 15:00:00"},
        {"type": "mrkdwn", "text": "*Tx:*\n<[https://etherscan.io/tx/0xabcdef1234567890](https://etherscan.io/tx/0xabcdef1234567890)...|Ver en Etherscan>"}
      ]
    }
  ]
}
Notificación en Discord (usando Embeds):

JSON

{
  "embeds": [
    {
      "title": "🚨 Alerta TokenWatcher: Monitor Grandes Movimientos de USDC",
      "color": 14696747, 
      "fields": [
        {"name": "Contrato", "value": "`0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`", "inline": false},
        {"name": "Volumen", "value": "150000.0 USDC", "inline": true},
        {"name": "Bloque", "value": "17000000", "inline": true},
        {"name": "Fecha (UTC)", "value": "2025-05-07 15:00:00", "inline": false},
        {"name": "Tx", "value": "[Ver en Etherscan](https://etherscan.io/tx/0xabcdef1234567890...)", "inline": false}
      ],
      "footer": {"text": "TokenWatcher-Cloud"}
    }
  ]
}