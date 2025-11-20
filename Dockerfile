FROM denoland/deno:alpine-1.40.0

WORKDIR /app

COPY backend/server.ts .

RUN deno cache server.ts


COPY frontend/Habit-Tracker-V/dist ./frontend/Habit-Tracker-V/dist

EXPOSE 8000

CMD ["run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "--unstable-kv", "server.ts"]