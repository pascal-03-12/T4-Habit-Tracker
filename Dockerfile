
FROM node:20-alpine AS build_stage

WORKDIR /app/frontend


COPY frontend/package*.json ./

RUN npm install

COPY frontend/ ./
RUN npm run build

FROM denoland/deno:alpine-1.40.0

WORKDIR /app

COPY backend/server.ts .

COPY --from=build_stage /app/frontend/dist ./frontend/Habit-Tracker-V/dist

RUN deno cache server.ts

EXPOSE 8000

CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "--unstable-kv", "server.ts"]