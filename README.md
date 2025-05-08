# TokenWatcher-Cloud

**TokenWatcher-Cloud** es una plataforma de software para la **monitorización en tiempo real de transferencias significativas de tokens ERC-20** en redes compatibles con EVM (Ethereum, Polygon, etc.). Permite a usuarios, desarrolladores y DAOs recibir alertas instantáneas sobre movimientos on-chain relevantes sin necesidad de gestionar infraestructura compleja.

El proyecto está desplegado en Render y utiliza una arquitectura basada en microservicios/workers para el polling de la blockchain, la gestión de eventos y las notificaciones.

**[➡️ Lee el Whitepaper completo para más detalles técnicos y de arquitectura](WHITEPAPER.md)**

## ✨ Características Principales

* **Monitorización Personalizada:** Define "Watchers" para seguir contratos de tokens ERC-20 específicos y establece umbrales de volumen para las alertas.
* **Alertas en Tiempo Real:** Recibe notificaciones instantáneas en **Slack** y **Discord** cuando una transferencia supera el umbral configurado.
* **Polling Inteligente:** El sistema consulta periódicamente la blockchain (vía Etherscan API) buscando nuevos eventos de transferencia relevantes.
* **Archivado Automático:** Los eventos antiguos se archivan diariamente en **AWS S3** para mantener la base de datos principal (PostgreSQL) optimizada y dentro de límites de coste razonables.
* **Purga de Base de Datos:** Limpieza automática de eventos antiguos en la base de datos PostgreSQL tras el archivado.
* **API RESTful:** Una API desarrollada con FastAPI para gestionar los watchers y consultar eventos.
* **Despliegue en la Nube:** Totalmente desplegado en Render utilizando Docker, servicios gestionados de PostgreSQL y Cron Jobs.

## 🚀 Pila Tecnológica

* **Backend:** Python, FastAPI
* **Base de Datos:** PostgreSQL (gestionado en Render)
* **ORM:** SQLAlchemy
* **Validación de Datos:** Pydantic
* **Notificaciones:** Slack API, Discord API (Webhooks)
* **Almacenamiento Histórico:** AWS S3
* **Contenerización:** Docker
* **Plataforma de Despliegue (PaaS):** Render
* **Fuente de Datos On-Chain:** Etherscan API

## 🔧 Estado Actual y Despliegue

El proyecto está actualmente desplegado en Render y funcionando:

* **API Endpoint:** `https://tokenwatcher-cloud.onrender.com`
    * Endpoint de salud: `GET /health`
    * Endpoints CRUD para watchers: `POST /watchers/`, `GET /watchers/`, etc. (Ver código en `api/app/main.py` o la documentación generada por FastAPI en `/docs` en el endpoint de la API).
* **Workers (Cron Jobs en Render):**
    * `Poll Watchers`: Ejecuta el sondeo de la blockchain (`watcher.py`).
    * `Purge Old TokenEvents`: Ejecuta el archivado y limpieza (`cleanup_and_archive.py`).
    * `Keep-Alive Ping`: Mantiene activo el servicio web en el plan gratuito de Render.

## 📄 Documentación

Para una descripción técnica detallada, la arquitectura, el flujo de datos y las decisiones de diseño, por favor consulta el whitepaper completo:

* **[WHITEPAPER.md](WHITEPAPER.md)**

## 💡 Como Proyecto de Portafolio

Este proyecto sirve como una demostración práctica de habilidades en el desarrollo backend, arquitectura de sistemas en la nube, interacción con APIs Web3, gestión de bases de datos y despliegue de aplicaciones contenerizadas. El código fuente está disponible para consulta y estudio.

## 🤝 Contribuciones

Actualmente, el proyecto se mantiene principalmente como un ejemplo de portafolio. Sin embargo, si tienes ideas o encuentras errores, siéntete libre de abrir un *Issue* en el repositorio de GitHub.

---

*Desarrollado por Diego Raúl Galmarini*
