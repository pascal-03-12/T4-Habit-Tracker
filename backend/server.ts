import { Application, Router, Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const kv = await Deno.openKv();
const app = new Application();
const router = new Router();

// JWT Setup
const JWT_SECRET_KEY = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"],
);

// --- HILFSFUNKTION: Auth prüfen ---
// Versucht User-ID aus dem Token zu lesen.
// Wirft Fehler, wenn kein gültiges Token da ist.
async function getUserIdFromContext(ctx: Context): Promise<string> {
  const authHeader = ctx.request.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("Kein Token vorhanden");
  }
  const token = authHeader.split(" ")[1]; 
  if (!token) {
    throw new Error("Token-Format ungültig");
  }
  const payload = await verify(token, JWT_SECRET_KEY);
  return payload.sub as string; 
}


// --- API ENDPUNKTE ---

router.get("/api/test", (ctx) => {
  ctx.response.body = { message: "Hallo vom Deno-Backend!" };
});

// REGISTER
router.post("/api/register", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { email, password } = body;
    if (!email || !password || password.length < 6) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Ungültige Daten (Passwort min 6 Zeichen)." };
      return;
    }
    const userEntry = await kv.get(["users", email]);
    if (userEntry.value) {
      ctx.response.status = 409;
      ctx.response.body = { message: "User existiert bereits." };
      return;
    }
    const hashedPassword = await bcrypt.hash(password);
    const userId = crypto.randomUUID();
    const user = { id: userId, email, hashedPassword };
    
    await kv.set(["users", email], user);
    ctx.response.status = 201;
    ctx.response.body = { message: "Registriert!", userId };
  } catch (err) {
    console.error(err);
    ctx.response.status = 500;
  }
});

//LOGIN
router.post("/api/login", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { email, password } = body;
    const userEntry = await kv.get(["users", email]);
    if (!userEntry.value) {
      ctx.response.status = 401;
      ctx.response.body = { message: "Falsche Daten." };
      return;
    }
    const user = userEntry.value as any;
    const match = await bcrypt.compare(password, user.hashedPassword);
    if (!match) {
      ctx.response.status = 401;
      ctx.response.body = { message: "Falsche Daten." };
      return;
    }
    const jwt = await create({ alg: "HS512", typ: "JWT" }, { iss: "habit-tracker", sub: user.id, exp: getNumericDate(60 * 60 * 24) }, JWT_SECRET_KEY);
    ctx.response.body = { message: "Login ok", token: jwt };
  } catch (err) {
    console.error(err);
    ctx.response.status = 500;
  }
});

// HABITS LADEN (GET)
router.get("/api/habits", async (ctx) => {
  try {
    // Wer fragt? (Auth Check)
    const userId = await getUserIdFromContext(ctx);

    // Daten aus DB holen (Nur Habits DIESES Users)
    const entries = kv.list({ prefix: ["habits", userId] });
    const habits = [];
    for await (const entry of entries) {
      habits.push(entry.value);
    }

    ctx.response.body = habits;
  } catch (err) {
    ctx.response.status = 401;
    ctx.response.body = { message: "Nicht autorisiert" };
  }
});

//HABIT ERSTELLEN (POST)
router.post("/api/habits", async (ctx) => {
  try {
    // (Auth Check)
    const userId = await getUserIdFromContext(ctx);

    // Daten lesen
    const body = await ctx.request.body({ type: "json" }).value;
    const { name, type } = body; 

    if (!name) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Name fehlt." };
      return;
    }

    // Speichern
    const habitId = crypto.randomUUID();
    const newHabit = {
      id: habitId,
      userId: userId, 
      name: name,
      type: type || "positive", 
      createdAt: new Date().toISOString()
    };

    // Schlüssel: ["habits", userId, habitId]
    // finden alle Habits eines Users
    await kv.set(["habits", userId, habitId], newHabit);

    ctx.response.status = 201;
    ctx.response.body = newHabit;

  } catch (err) {
    console.error(err);
    ctx.response.status = 401;
    ctx.response.body = { message: "Nicht autorisiert" };
  }
});

// --- START ---
app.use(oakCors({ origin: "http://localhost:5173" }));
app.use(router.routes());
app.use(router.allowedMethods());

router.delete("/api/habits/:id", async (ctx) => {
  try {
    const userId = await getUserIdFromContext(ctx);
    const habitId = ctx.params.id;

    if (!habitId) {
      ctx.response.status = 400;
      return;
    }


    const key = ["habits", userId, habitId];

    const entry = await kv.get(key);
    if (!entry.value) {
      ctx.response.status = 404; 
      ctx.response.body = { message: "Habit nicht gefunden." };
      return;
    }

    await kv.delete(key);

    ctx.response.status = 200;
    ctx.response.body = { message: "Gelöscht" };

  } catch (err) {
    console.error(err);
    ctx.response.status = 401;
  }
});

console.log("Backend-Server startet auf http://localhost:8000 ...");
await app.listen({ port: 8000 });