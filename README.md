# AirFly frontend

## Variables de entorno

El frontend necesita tres variables en `.env` antes de iniciar Vite:

```env
VITE_API_URL=http://localhost:8080/api
VITE_SUPABASE_URL=https://<proyecto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
VITE_AUTH_REDIRECT_URL=http://localhost:5173/auth/callback
```

Para confirmación de correo y Google OAuth, registra en Supabase Authentication
> URL Configuration las URLs de callback de cada entorno:

- `http://localhost:5173/auth/callback`
- `https://fly.astracode.org/auth/callback`

En cada despliegue, `VITE_AUTH_REDIRECT_URL` debe apuntar al callback del mismo
origen que sirve la aplicación. No mezcles `localhost` con `fly.astracode.org`:
`sessionStorage` y la sesión del navegador son aislados por origen.

Puedes copiar `.env.example` como punto de partida. `VITE_API_URL` debe
incluir el prefijo `/api`; por ejemplo, el backend desplegado usa
`https://fly.astracode.org/api`.

Las variables del contenedor del backend (`DBUSER`, `DBNAME`, `PASSWORD`,
`JWT_SECRET`, `HOST`, `PORT` y similares) no se usan en el navegador y no
deben copiarse al `.env` del frontend. La clave de Supabase debe ser la
publishable/anon; nunca uses una service-role key.

Para ejecutar:

```bash
npm install
npm run dev
```

## Validación de formularios

Los nombres y apellidos requieren de 4 letras a 20 caracteres en total; se
permiten letras acentuadas y espacios entre palabras. Para pasajeros, el DPI
requiere 13 dígitos y el pasaporte entre 6 y 20 dígitos. Los documentos se
muestran en grupos de cuatro dígitos y se envían sin espacios. Solo se
admiten estos dos tipos de documento. Los demás campos tienen límites acordes
con su uso, como importes decimales y referencias de depósito.
Los campos de nombre y apellido filtran números y símbolos al escribir o pegar.

Estas comprobaciones son únicamente del frontend y no sustituyen la validación
en la API ni el bloqueo transaccional de asientos en la base de datos.

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
