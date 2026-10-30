FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite embeds these public values in the generated JavaScript at build time.
# Keep API_ORIGIN empty when Kubernetes routes /api on the same host.
ARG API_ORIGIN
ARG SUPABASE_URL
ARG SUPABASE_PUBLIC_TOKEN
ARG BUILD_ID

RUN VITE_API_URL="${API_ORIGIN}" \
    VITE_SUPABASE_URL="${SUPABASE_URL}" \
    VITE_SUPABASE_PUBLISHABLE_KEY="${SUPABASE_PUBLIC_TOKEN}" \
    VITE_BUILD_ID="${BUILD_ID:-local}" \
    npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
