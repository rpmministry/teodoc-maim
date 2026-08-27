# TeoDoc - Analizador Teológico Ministerial 🕊️

TeoDoc es una herramienta web de alto rendimiento impulsada por Inteligencia Artificial, diseñada específicamente para servir al entorno ministerial y eclesiástico. 

## 🎯 Objetivo de la Aplicación

El propósito de TeoDoc es resolver un desafío común en las iglesias: transformar horas de contenido hablado (prédicas, enseñanzas, conferencias) en material escrito de estudio estructurado, profundo y visualmente útil. 

TeoDoc procesa grabaciones de audio y, mediante inteligencia artificial avanzada, extrae una estructura teológica coherente, identifica los versículos bíblicos utilizados y prepara el contenido para la generación de infografías y materiales de estudio. Todo esto, operando bajo un modelo de **costo cero (Cost-Zero Architecture)**, cumpliendo con el principio de mayordomía de recursos ministeriales.

## 🧠 Arquitectura de Inteligencia Artificial Implementada

Para garantizar que TeoDoc sea gratuito, extremadamente rápido y resistente a caídas, hemos diseñado una arquitectura de **Enrutamiento Dinámico con Tolerancia a Fallos (Failover) de dos fases**:

### 1. Transcripción de Audio de Alta Precisión (Speech-to-Text)

- **Motor Principal:** **AssemblyAI**. Se encarga de procesar audios pesados (hasta ~40MB) con alta fidelidad.

- **Motor de Respaldo:** **Deepgram**. Si AssemblyAI experimenta saturación, el sistema conmuta automáticamente al modelo `nova-2` de Deepgram, garantizando que la transcripción no se interrumpa.

### 2. Análisis Teológico Profundo (LLMs)

Dada la magnitud del texto (transcripciones que superan los 35,000 caracteres), la IA debe extraer un formato JSON estricto que incluye título, idea principal, desglose progresivo, versículos en Reina-Valera 1960 y aplicaciones prácticas.

- **Fase 1 (Motor Principal Híbrido):** Integración con la API de **OpenRouter**. El servidor busca en tiempo real y selecciona dinámicamente modelos que sean 100% gratuitos y posean un contexto amplio (ej. `google/gemini-2.0-flash-exp:free` o `qwen/qwen-2.5-72b-instruct:free`). 

- **Fase 2 (Motor Nativo de Respaldo):** Si OpenRouter agota sus opciones, el sistema activa automáticamente la API nativa de **Google Gemini `gemini-3.6-flash`)**, un modelo altamente estable y capaz de procesar hasta un millón de tokens de forma gratuita.

### 🛡️ Tolerancia a Fallos y Exponential Backoff

Implementamos lógica de **Retroceso Exponencial (Exponential Backoff)**. Si los servidores de IA experimentan cuellos de botella (errores 429 Too Many Requests o 503 Service Unavailable), TeoDoc no colapsa. El código lee las cabeceras `Retry-After` o calcula matemáticamente pausas incrementales (2s, 4s, 8s) antes de reintentar, comportándose como un software de nivel *Enterprise*.

## 🛠️ Tecnologías Utilizadas

- **Frontend & Backend:** [Next.js (App Router)]([https://nextjs.org/](https://nextjs.org/)) + React 18 + Tailwind CSS.

- **Generación de Archivos:** 

  - `jspdf` para exportar el bosquejo de estudio a PDF de manera estructurada.

  - `dom-to-image-more` para renderizar el póster digital (infografía) directamente en el navegador del usuario en alta calidad.

- **APIs:** OpenRouter (OpenAI SDK), Google GenAI SDK, AssemblyAI SDK.

## 📦 Instalación y Desarrollo Local

1. Clona el repositorio:

   ```bash

   git clone [[https://github.com/rpmministry/teodoc-app.git](https://github.com/rpmministry/teodoc-app.git)](https://github.com/rpmministry/teodoc-app.git](https://github.com/rpmministry/teodoc-app.git))