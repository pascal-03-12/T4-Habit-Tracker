// backend/server.ts
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

// Wir verwenden jetzt das stabile, offizielle 'cors'-Modul.
import { oakCors } from "https://deno.land/x/cors/mod.ts"; 

const app = new Application();
const router = new Router();

router.get("/api/test", (ctx) => {
  console.log("Anfrage an /api/test erhalten!");
  ctx.response.body = { message: "Hallo vom Deno-Backend!" };
});

// WICHTIG: Die Funktion wird jetzt als Middleware *aufgerufen*: oakCors()
// Wir erlauben den Ursprung von deinem Vue-Server.
app.use(oakCors({ origin: "http://localhost:5173" })); 

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Backend-Server startet auf http://localhost:8000 ...");
await app.listen({ port: 8000 });