# Imagen base: Node 22 LTS en su version slim (mas liviana)
FROM node:22-slim

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiamos primero los manifiestos de dependencias.
# Docker cachea esta capa: si no cambian, no reinstala en cada build.
COPY package*.json ./

# Instalamos solo dependencias de produccion (sin jest/nodemon)
RUN npm install --omit=dev

# Copiamos el resto del codigo
COPY . .

# El backend escucha en este puerto
EXPOSE 3000

# Comando de arranque
CMD ["node", "server.js"]
