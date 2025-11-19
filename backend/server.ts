import { Application, Router, Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const kv = await Deno.openKv();
const app = new Application();
const router = new Router();

const JWT_SECRET_KEY = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"],
);

async function getUserIdFromContext(ctx: Context): Promise<string> {
  const authHeader = ctx.request.headers.get("Authorization");
  if (!authHeader) throw new Error("Kein Token vorhanden");
  const token = authHeader.split(" ")[1];
  if (!token) throw new Error("Token-Format ungültig");
  const payload = await verify(token, JWT_SECRET_KEY);
  return payload.sub as string;
}


router.get("/api/test", (ctx) => {
  ctx.response.body = { message: "Hallo vom Deno-Backend!" };
});

router.post("/api/register", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { email, password } = body;
    if (!email || !password || password.length < 6) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Ungültige Daten." };
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

router.get("/api/habits", async (ctx) => {
  try {
    const userId = await getUserIdFromContext(ctx);
    
    const iter = kv.list({ prefix: ["habits", userId] });
    const habits = [];
    
    for await (const entry of iter) {
      const habit = entry.value as any;
      
      const entriesIter = kv.list({ prefix: ["entries", habit.id] });
      const entries = [];
      for await (const e of entriesIter) {
        entries.push(e.value);
      }
      
      habit.entries = entries;
      habits.push(habit);
    }

    ctx.response.body = habits;
  } catch (err) {
    ctx.response.status = 401;
  }
});

router.post("/api/habits", async (ctx) => {
  try {
    const userId = await getUserIdFromContext(ctx);
    const body = await ctx.request.body({ type: "json" }).value;
    const { name, type } = body;
    if (!name) {
      ctx.response.status = 400; return;
    }
    const habitId = crypto.randomUUID();
    const newHabit = {
      id: habitId,
      userId: userId,
      name: name,
      type: type || "positive",
      createdAt: new Date().toISOString(),
      entries: [] 
    };
    await kv.set(["habits", userId, habitId], newHabit);
    ctx.response.status = 201;
    ctx.response.body = newHabit;
  } catch (err) {
    console.error(err);
    ctx.response.status = 401;
  }
});

router.delete("/api/habits/:id", async (ctx) => {
  try {
    const userId = await getUserIdFromContext(ctx);
    const habitId = ctx.params.id;
    const key = ["habits", userId, habitId];
    const entry = await kv.get(key);
    if (!entry.value) {
      ctx.response.status = 404; return;
    }
    await kv.delete(key);

    ctx.response.status = 200;
    ctx.response.body = { message: "Gelöscht" };
  } catch (err) {
    console.error(err);
    ctx.response.status = 401;
  }
});

router.post("/api/habits/:id/entries", async (ctx) => {
  try {
    await getUserIdFromContext(ctx); 
    const habitId = ctx.params.id;

    const body = await ctx.request.body({ type: "json" }).value;
    const { date, status } = body;

    if (!date || !status) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Datum und Status erforderlich" };
      return;
    }
    const entry = { habitId, date, status };

    await kv.set(["entries", habitId, date], entry);

    ctx.response.status = 201;
    ctx.response.body = entry;

  } catch (err) {
    console.error(err);
    ctx.response.status = 500;
  }
});

app.use(oakCors({ origin: "http://localhost:5173" }));
app.use(router.routes());
app.use(router.allowedMethods());

console.log("Backend-Server startet auf http://localhost:8000 ...");
await app.listen({ port: 8000 });
// git nervt, du bist nicht aktuell!!!!!