# Lépés 1: React alkalmazás buildelése Vite-tal
FROM node:20-alpine AS build
WORKDIR /app

# Függőségek telepítése
COPY package*.json ./
RUN npm ci

# Forráskód másolása és buildelés
COPY . .
RUN npm run build

# Lépés 2: Nginx a statikus fájlok kiszolgálására
FROM nginx:alpine
# Beépített default.conf felülírása a SPA routing (React Router) támogatásához
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf

# Lefordított alkalmazás másolása az nginx gyökérkönyvtárába
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
