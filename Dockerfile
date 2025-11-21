FROM node:20-alpine AS build_stage 

WORKDIR /app/frontend/Habit-Tracker-V

COPY frontend/Habit-Tracker-V/package*.json .
RUN npm install

COPY frontend/Habit-Tracker-V/ .
RUN npm run build

FROM denoland/deno:alpine-1.40.0

WORKDIR /app

COPY backend/server.ts .

COPY --from=build_stage /app/frontend/Habit-Tracker-V/dist ./frontend/Habit-Tracker-V/dist

RUN deno cache server.ts

EXPOSE 8000

CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "--unstable-kv", "server.ts"]