# AirFly frontend

## Variables de entorno

El frontend necesita tres variables en `.env` antes de iniciar Vite:

```env
VITE_API_URL=http://localhost:8080/api
VITE_SUPABASE_URL=https://<proyecto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
```

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

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
