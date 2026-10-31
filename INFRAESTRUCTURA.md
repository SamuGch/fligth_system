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



Voy a reconstruir el flujo desde el enrutador y las pantallas de compra, siguiendo imports, estado y llamadas de API; omitiré valores sensibles del `.env` y señalaré únicamente nombres de variables/configuración relevantes.

Find files matching `**/*`

Search for `(SeatSelection|checkout|Checkout|passenger|Passenger|payment|Payment|booking|...`

Ran terminal command: git status --short && printf '\n--- top-level ---\n' && find . -maxdepth 2 -type f | sort | sed -n '1,160p'

La estructura confirma un flujo concentrado en `src/router`, `src/pages`, hooks y servicios; ahora voy a leer esos puntos de entrada junto con las pantallas de compra y los componentes de autenticación para reconstruir navegación, persistencia y backend sin inspeccionar el contenido secreto del `.env`.

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/router/AppRouter.jsx"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/App.jsx"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/Home.jsx"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/pages/SeatSelection.jsx"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/pages/PassengerConfirmationPage.jsx"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/pages/CheckoutPage.jsx"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/pages/DepositPaymentPage.jsx"
}

Search for `navigate\(|onClick|Seleccionar|select|seat|pasaj|payment|pago|reservation|res...`

Read , lines 1 to 260
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/components/FlightSearch.jsx",
  "view_range": [
    1,
    260
  ]
}

Read , lines 1 to 260
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/data/mockFlights.js",
  "view_range": [
    1,
    260
  ]
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/services/flightService.js"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/services/asientoService.js"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/services/apiClient.js"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/hooks/useReservationTrip.js"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/hooks/useReservationPayments.js"
}

Ran terminal command: wc -l src/components/FlightSearch.jsx src/components/FlightSearchModal.jsx src/pages/SeatSelection.jsx src/pages/PassengerConfirmationPage.jsx src/pages/CheckoutPage.jsx src/pages/DepositPaymentPage.jsx src/tools/Api.js src/providers/AuthProvider.jsx src/components/auth/ProtectedRoute.jsx src/hooks/useTrips.js

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/tools/Api.js"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/providers/AuthProvider.jsx"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/components/auth/ProtectedRoute.jsx"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/hooks/useTrips.js"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/services/seatSelectionStorage.js"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/lib/supabase.js"
}

Read , lines 240 to 520
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/components/FlightSearch.jsx",
  "view_range": [
    240,
    520
  ]
}

Read , lines 520 to 776
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/components/FlightSearch.jsx",
  "view_range": [
    520,
    776
  ]
}

Read , lines 1 to 220
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/components/FlightSearchModal.jsx",
  "view_range": [
    1,
    220
  ]
}

Read , lines 220 to 369
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/components/FlightSearchModal.jsx",
  "view_range": [
    220,
    369
  ]
}

Read , lines 380 to 700
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/pages/SeatSelection.jsx",
  "view_range": [
    380,
    700
  ]
}

Read , lines 700 to 1003
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/pages/SeatSelection.jsx",
  "view_range": [
    700,
    1003
  ]
}

El flujo ya muestra un punto clave: la selección exige autenticación antes de asientos, y el bloqueo temporal ocurre al continuar desde `SeatSelection`, no al elegir el asiento. Falta precisar el checkout, la confirmación de pasajeros, el registro de pagos y los temporizadores/limpieza; leeré esas secciones y luego contrastaré todas las rutas API.

Read , lines 1 to 260
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/pages/CheckoutPage.jsx",
  "view_range": [
    1,
    260
  ]
}

Read , lines 260 to 540
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/pages/CheckoutPage.jsx",
  "view_range": [
    260,
    540
  ]
}

Read , lines 540 to 727
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/pages/CheckoutPage.jsx",
  "view_range": [
    540,
    727
  ]
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/pages/PassengerConfirmationPage.jsx"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/pages/DepositPaymentPage.jsx"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/services/tripsCache.js"
}

Search for `createTemporaryReservation|purchaseReservation|confirmReservationPassengers|r...`

Read , lines 1 to 134
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/pages/PassengerConfirmationPage.jsx",
  "view_range": [
    1,
    134
  ]
}

Read , lines 1 to 115
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/pages/DepositPaymentPage.jsx",
  "view_range": [
    1,
    115
  ]
}

Read , lines 680 to 728
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/pages/CheckoutPage.jsx",
  "view_range": [
    680,
    728
  ]
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/main.jsx"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/config/paymentMethods.js"
}

Search for `setExpired|expired|releaseTemporarySeats|pagehide|confirmReservationPassenger...`

Search for `guardarSeleccion|obtenerSeleccion|limpiarSeleccion`

Search for `useLocation\(\)|location\.state|navigate\("/checkout|navigate\("/seleccion-as...`

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/hooks/usePendingSeats.js"
}

Read 
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/services/pendingSeatsCache.js"
}

Search for `mock|ficticio|simulad|hardcode|fake|demo|45|PAYMENT_METHOD_IDS|GUATEMALAN_BANKS`

Ran terminal command: git ls-files .env .env.example && git status --short --untracked-files=all | sed -n '1,120p'

Read , lines 60 to 110
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/components/auth/AuthModal.jsx",
  "view_range": [
    60,
    110
  ]
}

Read , lines 50 to 100
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/components/auth/AuthStatusModals.jsx",
  "view_range": [
    50,
    100
  ]
}

Read , lines 720 to 776
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/components/FlightSearch.jsx",
  "view_range": [
    720,
    776
  ]
}

Read , lines 130 to 215
Completed with input: {
  "path": "/home/ander/Documentos/fligth_system/src/services/flightService.js",
  "view_range": [
    130,
    215
  ]
}

Search for `<FlightSearchModal|obtenerAeropuertos|obtenerFechasDisponibles|setModalOpen`

# Auditoría técnica del flujo de compra y reserva

## Resumen ejecutivo

El flujo actual es **frontend React con autenticación obligatoria**. El recorrido principal es:

1. Búsqueda de vuelos.
2. Modal de resultados.
3. Redirección a autenticación si el usuario no ha iniciado sesión.
4. Selección de asientos.
5. Creación de una reserva temporal.
6. Checkout con método de pago.
7. Registro de pasajeros opcional durante el checkout.
8. Confirmación de compra o creación de reserva pendiente.
9. Consulta posterior del detalle de reserva, confirmación de pasajeros o registro de depósito.

El flujo **no permite guest checkout**. La selección de asientos está protegida y requiere sesión válida de Supabase.

El repositorio contiene principalmente el frontend. La implementación real del backend no está incluida, por lo que la auditoría de reglas de negocio, persistencia definitiva, expiración server-side y procesamiento financiero queda limitada a los contratos HTTP observables desde React.

---

# 1. Mapa del flujo actual paso a paso

## 1.1 Búsqueda de vuelos

### Pantalla/componente

- Página inicial: `Home.jsx`
- Buscador: `FlightSearch.jsx`
- Selector de aeropuertos: `AirportCombobox.jsx`
- Selector de pasajeros/clase: `PassengerClassSelector.jsx`
- Calendario: `FlightDateRangeCalendar.jsx`

El estado de búsqueda se mantiene internamente en `FlightSearch`:

- `OrigenID`
- `DestinationID`
- `departureDate`
- `returnDate`
- `tripType`
- número de pasajeros
- tipo/clase de asiento

Referencias principales: `FlightSearch.jsx:65`, `FlightSearch.jsx:261`.

### Llamadas realizadas

Antes o durante la búsqueda:

```text
GET /aeropuerto
GET /vuelo
GET /ruta
GET /tipo-asiento
GET /vuelo/{id}/asientos
```

Estas llamadas se realizan desde:

- `aeropuertoService.js`
- `flightService.js:166`
- `flightService.js:193`
- `asientoService.js`

Al pulsar **Buscar vuelos**:

```http
POST /vuelo/buscar
```

Referencia: `FlightSearch.jsx:261`.

Las fechas alternativas vuelven a ejecutar:

```http
POST /vuelo/buscar
```

Referencia: `FlightSearch.jsx:280`.

---

## 1.2 Modal de resultados de vuelos

### Componente

- `FlightSearchModal.jsx`

El modal muestra:

- número de vuelo;
- aerolínea;
- origen y destino;
- horarios;
- duración;
- escalas;
- precios por clase;
- disponibilidad informada;
- fechas alternativas;
- botón **Seleccionar**.

El botón se renderiza en `FlightSearchModal.jsx:333`.

### Acción al seleccionar

`handleSelectFlight` construye:

```js
{
  ...flight,
  vueloId: flight.vueloId ?? flight.id,
  avionId: flight.avionId ?? flight.avion_id
}
```

Después:

- Si hay sesión: navega directamente a `/seleccion-asientos`.
- Si no hay sesión: navega a `/login` conservando los datos del vuelo en `location.state`.

Referencia: `FlightSearchModal.jsx:77`.

---

## 1.3 Autenticación obligatoria

### Router y protección

Las rutas de compra están protegidas en:

- `AppRouter.jsx:18`
- `ProtectedRoute.jsx`

Las rutas protegidas son:

```text
/checkout
/seleccion-asientos
/perfil
/reservas
/reservas/:reservaId
/reservas/:reservaId/registrar-pago
/reservas/:reservaId/confirmar-datos
```

Si el usuario no está autenticado, `ProtectedRoute` lo redirige a:

```text
/login
```

Referencia: `ProtectedRoute.jsx:33`.

### Persistencia de la redirección

Los datos del vuelo se conservan temporalmente en `location.state`:

```js
{
  backgroundLocation,
  returnTo: "/seleccion-asientos",
  seatSelectionData
}
```

La continuación después del login está implementada en:

- `AuthModal.jsx:72`
- `AuthStatusModals.jsx:65`

### Supabase

La sesión se administra desde:

- `AuthProvider.jsx`
- `supabase.js`

Al iniciar sesión:

1. Supabase entrega el `access_token`.
2. El frontend sincroniza el cliente con el backend.
3. Se consulta el perfil del cliente.

Llamadas:

```http
POST /clientes/sync
GET  /clientes/me
```

Referencias: `AuthProvider.jsx:24`, `apiClient.js:66`.

---

## 1.4 Selección de asientos

### Componente

- `SeatSelection.jsx`

La ruta es:

```text
/seleccion-asientos
```

El componente recibe el vuelo desde:

```js
location.state?.flight
```

Referencia: `SeatSelection.jsx:402`.

### Consulta de asientos

Por cada tramo del vuelo se ejecuta:

```http
GET /vuelo/{vueloId}/asientos
```

También se consulta:

```http
GET /tipo-asiento
```

Referencias:

- `SeatSelection.jsx:451`
- `SeatSelection.jsx:455`

### Estado local

Los asientos seleccionados se almacenan en:

```js
const [selectedSeats, setSelectedSeats] = useState([]);
```

Referencia: `SeatSelection.jsx:420`.

No se envía ninguna solicitud al backend al hacer clic individualmente en un asiento. El bloqueo ocurre solamente al pulsar continuar.

### Cálculo de precios

El subtotal se calcula con el precio de cada asiento:

```js
const subtotal = selectedSeats.reduce(...)
```

Sin embargo, el cargo adicional es fijo y está explícitamente marcado como ficticio:

```js
const serviceFee = selectedSeats.length * 45;
```

Referencia: `SeatSelection.jsx:566`.

---

## 1.5 Creación de reserva temporal

Al continuar desde selección de asientos se llama:

```http
POST /clientes/reserva/temporal
```

Body enviado:

```json
{
  "cliente_id": "...",
  "vuelos_asientos_id": ["..."]
}
```

Implementación:

- `SeatSelection.jsx:589`
- `apiClient.js:102`

La respuesta debe incluir un identificador de reserva:

```js
reservation.id
```

Después se navega a:

```text
/checkout
```

con este estado:

```js
{
  flight,
  passengers,
  selectedSeats,
  subtotal,
  serviceFee,
  total,
  reservation,
  paymentDeadline
}
```

Referencia: `SeatSelection.jsx:600`.

---

## 1.6 Checkout

### Componente

- `CheckoutPage.jsx`

La ruta está protegida:

```text
/checkout
```

El checkout muestra:

- resumen del vuelo;
- asientos seleccionados;
- precio base;
- cargo adicional;
- total;
- formulario por pasajero;
- método de pago;
- aceptación de términos;
- contador de expiración;
- modal final de resultado.

### Métodos de pago disponibles

En `paymentMethods.js`:

```js
{
  card: 1,
  deposit: 2
}
```

La interfaz ofrece:

1. Tarjeta de crédito/débito.
2. Depósito bancario.

El pago con tarjeta no solicita:

- número de tarjeta;
- CVV;
- vencimiento;
- nombre del titular.

La propia UI lo describe como:

> Pago simulado por el servidor.

Referencia: `CheckoutPage.jsx:439`.

### Datos de pasajeros

El checkout mantiene los pasajeros en estado local:

```js
const [passengers, setPassengers] = useState(...)
```

Cada pasajero está asociado a un asiento. Los campos son:

- nombre;
- apellido;
- tipo de documento;
- número de documento.

La validación exige que, si se llena un campo, se completen los cuatro. La información se envía únicamente al completar la compra.

Referencias:

- `CheckoutPage.jsx:71`
- `CheckoutPage.jsx:231`

---

## 1.7 Confirmación de compra

Al pulsar el botón de finalizar:

```http
POST /clientes/reserva/{reservationId}/compra
```

Body:

```json
{
  "cliente_id": "...",
  "metodo_pago_id": 1,
  "pasajeros": [
    {
      "vuelo_asiento_id": "...",
      "nombre_pasajero": "...",
      "apellido_pasajero": "...",
      "tipo_documento": "...",
      "numero_documento": "..."
    }
  ]
}
```

La llamada está implementada en:

- `CheckoutPage.jsx:273`
- `apiClient.js:125`

El resultado puede producir:

- compra confirmada;
- reserva pendiente;
- reserva pendiente por falta de datos de pasajeros;
- reserva pendiente de depósito.

El resultado se muestra en un modal dentro de `CheckoutPage.jsx:630`.

---

## 1.8 Confirmación final y detalle de compra

Después de la respuesta de compra, el usuario puede:

- ver el detalle de compra;
- regresar al inicio.

La navegación al detalle es:

```text
/reservas/{reservationId}
```

Referencia: `CheckoutPage.jsx:343`.

La vista de detalle se encuentra en:

- `ReservationDetailPage.jsx`

No se observa un componente dedicado a generar o descargar un boleto PDF. La “confirmación/boleto” actual parece limitarse al detalle de la reserva y a los datos mostrados en pantalla.

---

## 1.9 Flujo posterior para reservas pendientes

### Confirmación de pasajeros

Ruta:

```text
/reservas/:reservaId/confirmar-datos
```

Componente:

- `PassengerConfirmationPage.jsx`

Primero consulta los asientos pendientes:

```http
GET /clientes/reserva/{reservationId}/asientos-pendientes
```

Referencia: `apiClient.js:86`.

Luego confirma los pasajeros:

```http
POST /clientes/reserva/{reservationId}/confirmar
```

Body:

```json
{
  "cliente_id": "...",
  "pasajeros": [...]
}
```

Referencia: `PassengerConfirmationPage.jsx:90`.

### Registro de depósito

Ruta:

```text
/reservas/:reservaId/registrar-pago
```

Componente:

- `DepositPaymentPage.jsx`

Consulta pagos existentes:

```http
GET /clientes/reserva/{reservationId}/pagos
```

Referencia: `apiClient.js:86`.

Registra un depósito:

```http
POST /clientes/reserva/{reservationId}/pago-deposito
```

Body:

```json
{
  "cliente_id": "...",
  "metodo_pago_id": 2,
  "monto": 0,
  "referencia": "..."
}
```

Referencia: `DepositPaymentPage.jsx:69`.

---

# 2. Manejo de estado y persistencia

## 2.1 Contexto global

El estado global principal es autenticación:

- `session`
- `client`
- `loading`
- `syncStatus`
- errores de autenticación

Está implementado con React Context en:

- `AuthProvider.jsx`
- `AuthContext.jsx`

Supabase mantiene su sesión persistida mediante su cliente en el navegador.

## 2.2 Datos del flujo de compra

La información de compra se transporta principalmente mediante:

```text
React Router location.state
```

Ejemplo:

```js
navigate("/checkout", {
  state: {
    flight,
    selectedSeats,
    subtotal,
    serviceFee,
    total,
    reservation,
    paymentDeadline,
  },
});
```

No se utiliza Redux ni Zustand.

## 2.3 `sessionStorage`

Existe un servicio de almacenamiento:

- `seatSelectionStorage.js`

Utiliza la clave:

```text
airtravel_seat_selection
```

Pero actualmente:

- `guardarSeleccion` no aparece utilizado;
- `obtenerSeleccion` no aparece utilizado;
- solamente se invoca `limpiarSeleccion` desde checkout.

Por tanto, en la práctica no funciona como mecanismo de recuperación de selección de asientos.

## 2.4 Qué ocurre al refrescar

### Refrescar en la pantalla de selección de asientos

Se pierde:

- `location.state.flight`;
- el vuelo seleccionado;
- los asientos seleccionados.

El componente depende de:

```js
location.state?.flight
```

Si se refresca directamente `/seleccion-asientos`, la página no dispone del vuelo y puede mostrar:

```text
No se recibieron vuelos para cargar sus asientos.
```

### Refrescar en checkout

Se pierde el estado de React Router:

- vuelo;
- asientos;
- subtotal;
- total;
- reserva;
- `paymentDeadline`;
- formulario local de pasajeros.

El checkout entra en el estado:

```text
No hay una compra pendiente
```

porque valida que existan `flight`, `selectedSeats` y `reservation.id`.

Referencia: `CheckoutPage.jsx:348`.

La reserva temporal podría seguir existiendo en backend, pero la interfaz no tiene un mecanismo robusto para recuperarla desde el navegador.

### Refrescar en confirmación de pasajeros

La página obtiene la reserva desde backend mediante:

```text
GET /clientes/mis-viajes
GET /clientes/reserva/{id}/asientos-pendientes
```

Por tanto, la reserva sí puede recuperarse, pero los valores no guardados del formulario local se pierden.

### Refrescar en registro de depósito

Los datos no enviados todavía se pierden:

- banco;
- monto;
- referencia.

Los pagos ya registrados se recuperan desde backend.

---

# 3. Integración con backend y Supabase

## 3.1 Cliente HTTP

Existen dos clientes HTTP:

### Cliente general sin autenticación explícita

- `tools/Api.js`

Se utiliza principalmente para búsqueda y asientos públicos:

```text
GET /...
POST /...
PUT /...
```

### Cliente autenticado

- `services/apiClient.js`

Obtiene el token desde:

```js
supabase.auth.getSession()
```

y agrega el bearer token a las solicitudes.

Referencia: `apiClient.js:12`.

## 3.2 Endpoints identificados

| Paso | Método | Endpoint |
|---|---:|---|
| Cargar aeropuertos | GET | `/aeropuerto` |
| Cargar vuelos/fechas | GET | `/vuelo` |
| Cargar rutas | GET | `/ruta` |
| Cargar tipos de asiento | GET | `/tipo-asiento` |
| Consultar asientos | GET | `/vuelo/{vueloId}/asientos` |
| Buscar vuelos | POST | `/vuelo/buscar` |
| Sincronizar usuario | POST | `/clientes/sync` |
| Obtener perfil | GET | `/clientes/me` |
| Crear reserva temporal | POST | `/clientes/reserva/temporal` |
| Liberar asientos temporales | POST | `/clientes/reserva/{id}/liberar-asientos-temporales` |
| Confirmar compra | POST | `/clientes/reserva/{id}/compra` |
| Obtener reservas | GET | `/clientes/mis-viajes` |
| Obtener asientos pendientes | GET | `/clientes/reserva/{id}/asientos-pendientes` |
| Confirmar pasajeros | POST | `/clientes/reserva/{id}/confirmar` |
| Obtener pagos | GET | `/clientes/reserva/{id}/pagos` |
| Registrar depósito | POST | `/clientes/reserva/{id}/pago-deposito` |
| Cancelar reserva | PUT | `/clientes/reserva/{id}/cancelar` |

El mapa de contratos autenticados está en `apiClient.js`.

## 3.3 ¿Se requiere autenticación?

Sí.

El usuario debe estar autenticado antes de:

- acceder a selección de asientos;
- crear una reserva temporal;
- entrar al checkout;
- confirmar compra;
- consultar reservas;
- registrar depósitos;
- confirmar datos de pasajeros.

El flujo no permite compra como invitado porque `ProtectedRoute.jsx` redirige cualquier sesión inexistente a login.

---

# 4. Brechas técnicas y puntos ciegos

## 4.1 Cargo de servicio ficticio

El cargo adicional se calcula localmente:

```js
const serviceFee = selectedSeats.length * 45;
```

Referencia: `SeatSelection.jsx:566`.

Esto implica que:

- el precio final depende de una regla hardcodeada en frontend;
- el usuario puede observar un total que potencialmente no coincide con backend;
- no se observa una consulta de impuestos, tasas, equipaje o cargos reales;
- el backend debería recalcular y validar siempre el total.

## 4.2 Pago con tarjeta simulado

El checkout indica explícitamente:

```text
Pago simulado por el servidor
```

No hay integración visible con:

- Stripe;
- PayPal;
- Adyen;
- Mercado Pago;
- tokenización de tarjeta;
- 3-D Secure;
- webhook de confirmación;
- estado de transacción externa.

La tarjeta únicamente se representa como `paymentMethodId = 1`.

Referencia: `paymentMethods.js`.

## 4.3 Métodos de pago hardcodeados

Los identificadores:

```js
card: 1
deposit: 2
```

están fijos en frontend.

Esto es frágil si los IDs de la base de datos cambian. Lo recomendable sería que los métodos válidos fueran entregados por backend o que los IDs se configuraran de forma centralizada y validada contra servidor.

## 4.4 No existe bloqueo al seleccionar el asiento

El asiento solamente se marca en estado React. El bloqueo ocurre cuando se pulsa continuar:

```http
POST /clientes/reserva/temporal
```

Esto significa que entre selección visual y confirmación de reserva otro usuario puede ocupar el asiento. El frontend maneja el error, pero no existe una reserva provisional por asiento ni polling de disponibilidad.

## 4.5 Temporizador incompleto

El checkout crea un deadline local de cinco minutos si backend no envía uno:

```js
Date.now() + 5 * 60 * 1000
```

Referencia: `CheckoutPage.jsx:88`.

El contador:

- se actualiza cada segundo;
- muestra un modal al llegar a cero;
- bloquea el botón de compra.

Sin embargo, al expirar el contador no se observa una llamada inmediata a:

```http
POST /clientes/reserva/{id}/liberar-asientos-temporales
```

La liberación depende de:

- navegación hacia atrás;
- `pagehide`;
- acciones específicas de abandono;
- expiración server-side.

Esto puede producir un intervalo en el cual la UI indica que la reserva expiró, pero el backend todavía no ha liberado los asientos.

## 4.6 Posible fuga al pulsar “Ir al inicio” después de expirar

En el modal de expiración, `goHome()` ejecuta:

```js
limpiarSeleccion();
navigate("/");
```

Pero no llama directamente a `releaseTemporarySeats()`.

Referencia: `CheckoutPage.jsx:337`.

Si `pagehide` no se dispara o la solicitud keepalive falla, la liberación queda únicamente en manos del backend y su expiración automática.

## 4.7 Estado crítico solamente en `location.state`

El vuelo, los asientos y la reserva se transportan mediante estado de navegación. Esto genera una fuerte dependencia del historial del navegador.

Problemas:

- refrescar checkout destruye el contexto;
- abrir checkout en una nueva pestaña puede producir una compra inválida;
- compartir la URL no permite recuperar la operación;
- navegación directa a `/checkout` no puede reconstruir el flujo;
- no existe una ruta de recuperación por `reservationId`.

## 4.8 Formulario de pasajeros inconsistente

En checkout los datos aparecen como opcionales:

```text
Puedes dejar los cuatro campos vacíos.
```

Pero también se indica que para confirmar una compra con tarjeta hay que completar todos los pasajeros.

El comportamiento real es:

- sin pasajeros: puede crearse una reserva pendiente;
- con un pasajero parcialmente llenado: se rechaza;
- con todos los pasajeros completos: puede confirmarse.

Existe un segundo flujo posterior en `PassengerConfirmationPage.jsx`, donde todos los datos son obligatorios.

La UX puede resultar confusa porque el usuario no sabe con claridad si:

- está comprando;
- está creando una reserva pendiente;
- debe completar datos después.

## 4.9 Sin boleto descargable visible

El flujo termina en:

```text
¡Compra exitosa!
```

y en el detalle de reserva.

No se identificó:

- generación de boleto;
- descarga PDF;
- código QR;
- número de ticket;
- envío de correo;
- descarga de comprobante;
- enlace de factura.

La confirmación visual está implementada dentro de `CheckoutPage.jsx`, pero no existe una fase especializada de emisión de boleto.

## 4.10 Datos mock

El archivo:

- `mockFlights.js`

contiene vuelos simulados, pero actualmente está completamente comentado. No parece participar en el flujo activo.

El cargo de servicio y el texto de pago simulado sí forman parte del flujo activo.

## 4.11 Liberación de reserva durante abandono

El checkout intenta liberar asientos al:

- usar el botón de regreso;
- interceptar `popstate`;
- ejecutar `pagehide`.

Referencias:

- `CheckoutPage.jsx:105`
- `CheckoutPage.jsx:173`
- `CheckoutPage.jsx:188`

La llamada es:

```http
POST /clientes/reserva/{id}/liberar-asientos-temporales
```

El manejo usa `keepalive` para `pagehide`, pero el frontend ignora los errores en ese evento:

```js
.catch(() => undefined)
```

Por tanto, no hay garantía visible de que el backend haya recibido la liberación.

---

# Conclusiones prioritarias

## Prioridad alta

1. **Persistir la operación de checkout por `reservationId`**, no únicamente mediante `location.state`.
2. **Recuperar checkout después de refresh** consultando la reserva temporal en backend.
3. **Liberar explícitamente la reserva al expirar**, no solamente al abandonar la página.
4. **Mover el cálculo de total y cargo de servicio al backend**, usando el frontend solamente como presentación.
5. **Sustituir el pago simulado por integración real o marcar claramente el entorno como demo**.
6. **Definir una política única de pasajeros**: obligatorios antes de pagar o flujo explícito de reserva pendiente.

## Prioridad media

1. Validar formato y longitud de documentos.
2. Validar que el número de pasajeros coincida con los asientos seleccionados.
3. Confirmar disponibilidad inmediatamente antes de pagar.
4. Obtener métodos de pago desde backend.
5. Añadir recuperación de errores de red y reintentos controlados.
6. Añadir una vista de boleto/comprobante después de la compra confirmada.

## Prioridad baja

1. Eliminar o integrar de forma coherente `seatSelectionStorage.js`.
2. Eliminar código mock comentado si ya no se utiliza.
3. Separar el checkout en componentes más pequeños: resumen, pasajeros, pago, temporizador y resultado.
4. Agregar pruebas de navegación, expiración y recuperación después de refresh.