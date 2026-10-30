# Infraestructura de AirFly

## Alcance

Este repositorio contiene el frontend web de AirFly. Es una aplicación React
construida con Vite, empaquetada como archivos estáticos y servida mediante
Nginx dentro de un contenedor Docker.

La aplicación consume:

- Una API HTTP configurable mediante `VITE_API_URL`.
- Supabase para autenticación y servicios del proyecto mediante su URL y clave
  pública.

Este repositorio no contiene el backend ni la base de datos. Las credenciales
privadas del backend deben configurarse en su propio servicio y nunca en las
variables expuestas al navegador.

## Arquitectura

```text
Usuario
   │ HTTPS
   ▼
Proxy o balanceador externo
   │ HTTP :80
   ▼
Contenedor AirFly
   │
   ├── Nginx
   │     ├── /health  → respuesta 200 OK
   │     └── /*       → archivos estáticos o index.html
   │
   └── Aplicación React/Vite
           ├── API HTTP configurada en VITE_API_URL
           └── Supabase configurado en VITE_SUPABASE_URL
```

Durante el desarrollo, Vite sirve la aplicación directamente. En producción,
Vite genera `dist/` y Nginx entrega ese contenido.

## Componentes principales

| Componente | Responsabilidad |
|---|---|
| React | Renderiza la interfaz y administra el flujo de la aplicación. |
| Vite | Servidor de desarrollo y herramienta de compilación. |
| React Router | Navegación entre las vistas del frontend. |
| Supabase JS | Integración del navegador con Supabase y autenticación. |
| Three.js / React Three Fiber | Renderizado de la escena 3D del globo y el avión. |
| Docker | Construcción reproducible de la imagen de producción. |
| Nginx | Servidor de archivos estáticos y fallback para rutas del frontend. |

## Estructura relevante

```text
fligth_system/
├── Dockerfile
├── nginx.conf
├── .env.example
├── package.json
├── public/
│   └── recursos estáticos y modelos 3D
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/
│   ├── pages/
│   ├── providers/
│   └── services/
└── dist/
    └── salida generada por Vite
```

`dist/` se genera durante la compilación y no debe editarse manualmente.

## Variables de entorno

Las variables con prefijo `VITE_` se incorporan al JavaScript del navegador
durante `npm run build`. Por ese motivo, solo deben contener valores públicos.

```env
VITE_API_URL=http://localhost:8080/api
VITE_SUPABASE_URL=https://<proyecto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
```

| Variable | Uso | Sensibilidad |
|---|---|---|
| `VITE_API_URL` | URL base de la API; debe incluir `/api` cuando el backend lo requiere. | Pública |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase. | Pública |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave publishable/anon para uso desde el navegador. | Pública, con políticas RLS correctamente configuradas |

No se deben agregar al frontend `service_role`, contraseñas de base de datos,
JWT secrets ni credenciales administrativas. El archivo `.env` local está
excluido de Git; para nuevos entornos debe usarse `.env.example` como plantilla.

## Desarrollo local

Requisitos:

- Node.js compatible con la versión usada por el proyecto.
- npm.
- Acceso a la API y al proyecto Supabase configurados.

```bash
npm install
cp .env.example .env
npm run dev
```

El servidor de Vite muestra en consola la URL local, normalmente
`http://localhost:5173`.

## Construcción y despliegue con Docker

El `Dockerfile` utiliza dos etapas:

1. **Builder:** instala dependencias con `npm ci`, inyecta las variables
   públicas de Vite y ejecuta `npm run build`.
2. **Runtime:** copia `dist/` a Nginx y publica el puerto 80.

Ejemplo de construcción:

```bash
docker build \
  --build-arg API_ORIGIN=https://api.example.com/api \
  --build-arg SUPABASE_URL=https://<proyecto>.supabase.co \
  --build-arg SUPABASE_PUBLIC_TOKEN=<publishable-or-anon-key> \
  -t airfly-frontend .
```

Ejemplo de ejecución:

```bash
docker run --rm -p 8080:80 airfly-frontend
```

La aplicación queda disponible en `http://localhost:8080`.

Los argumentos `API_ORIGIN`, `SUPABASE_URL` y `SUPABASE_PUBLIC_TOKEN` no son
secretos en este frontend: sus valores terminan incluidos en el bundle
generado. Las claves privadas deben permanecer en el backend.

## Configuración de Nginx

`nginx.conf`:

- Escucha en el puerto 80.
- Sirve los archivos desde `/usr/share/nginx/html`.
- Expone `GET /health` con respuesta `200 OK`.
- Usa `try_files` para devolver `index.html` en las rutas de React Router.

El endpoint `/health` debe ser utilizado por el balanceador, la plataforma de
despliegue o el orquestador para comprobar que el contenedor está disponible.

## Flujo de una solicitud

1. El navegador solicita la aplicación al proxy o directamente al contenedor.
2. Nginx entrega el recurso solicitado; si es una ruta del frontend, entrega
   `index.html`.
3. React inicia desde `src/main.jsx`.
4. `AuthProvider` inicializa el estado de autenticación.
5. Los componentes llaman a la API usando `VITE_API_URL`.
6. La autenticación y las operaciones configuradas para Supabase usan el
   proyecto indicado por `VITE_SUPABASE_URL`.

## Operación y seguridad

- Servir la aplicación detrás de HTTPS en producción.
- Restringir CORS en el backend a los dominios reales del frontend.
- Mantener las políticas de Supabase RLS activas y probarlas por rol.
- No registrar tokens, claves ni respuestas que contengan información
  sensible.
- Reconstruir la imagen cuando cambien las variables `VITE_*`; no se actualizan
  en una imagen ya compilada.
- Mantener sincronizados `package.json` y `package-lock.json`.
- No versionar `.env`, archivos locales ni secretos.

## Verificación

Comandos disponibles:

```bash
npm run lint
npm run build
```

Después de levantar el contenedor, se puede comprobar la salud con:

```bash
curl -i http://localhost:8080/health
```

La respuesta esperada es `HTTP 200` y el texto `OK`.
