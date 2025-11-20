import { Application, Router, Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { send } from "https://deno.land/x/oak@v12.6.1/send.ts";

interface User {
  id: string;
  email: string;
  hashedPassword: string;
}

interface Habit {
  id: string;
  userId: string;
  name: string;
  type: string;
  createdAt: string;
  entries: any[];
}

const kv = await Deno.openKv();
const app = new Application();
const router = new Router();

// feste Schlüssel verhindert, ungültige logins
const STATIC_SECRET = "project-t4-final-static-secret-key-999";
const encoder = new TextEncoder();
const keyBuf = encoder.encode(STATIC_SECRET);
const JWT_SECRET_KEY = await crypto.subtle.importKey(
  "raw", keyBuf, { name: "HMAC", hash: "SHA-512" }, true, ["sign", "verify"]
);

const SALT = "habit-salt-v2";

async function hashPassword(password: string): Promise<string> {
  const data = encoder.encode(password + SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

async function getUserIdFromContext(ctx: Context): Promise<string> {
  const authHeader = ctx.request.headers.get("Authorization");
  if (!authHeader) throw new Error("No token");
  const token = authHeader.split(" ")[1];
  const payload = await verify(token, JWT_SECRET_KEY);
  return payload.sub as string;
}

router.post("/api/register", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { email, password } = body;
    if (!email || !password || password.length < 6) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Invalid data" };
      return;
    }
    const userEntry = await kv.get(["users", email]);
    if (userEntry.value) {
      ctx.response.status = 409;
      ctx.response.body = { message: "User exists" };
      return;
    }
    const hashedPassword = await hashPassword(password);
    const userId = crypto.randomUUID();
    const user = { id: userId, email, hashedPassword };
    await kv.set(["users", email], user);
    ctx.response.status = 201;
    ctx.response.body = { message: "OK", userId };
  } catch (e) { ctx.response.status = 500; }
});

router.post("/api/login", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { email, password } = body;
    const userEntry = await kv.get(["users", email]);
    if (!userEntry.value) { ctx.response.status = 401; return; }
    const user = userEntry.value as User;
    if (!(await verifyPassword(password, user.hashedPassword))) { ctx.response.status = 401; return; }
    
    const jwt = await create({ alg: "HS512", typ: "JWT" }, { iss: "habit-app", sub: user.id, exp: getNumericDate(60 * 60 * 24 * 7) }, JWT_SECRET_KEY);
    ctx.response.body = { message: "OK", token: jwt };
  } catch (e) { ctx.response.status = 500; }
});

router.get("/api/habits", async (ctx) => {
  try {
    const userId = await getUserIdFromContext(ctx);
    const iter = kv.list({ prefix: ["habits", userId] });
    const habits = [];
    for await (const entry of iter) {
      const habit = entry.value as Habit;
      try {
        const entriesIter = kv.list({ prefix: ["entries", habit.id] });
        const entries = [];
        for await (const e of entriesIter) entries.push(e.value);
        habit.entries = entries;
      } catch (e) { habit.entries = []; }
      habits.push(habit);
    }
    ctx.response.body = habits;
  } catch (e) { ctx.response.status = 401; }
});

router.post("/api/habits", async (ctx) => {
  try {
    const userId = await getUserIdFromContext(ctx);
    const body = await ctx.request.body({ type: "json" }).value;
    const { name, type } = body;
    if (!name) { ctx.response.status = 400; return; }
    
    const habitId = crypto.randomUUID();
    const newHabit = {
      id: habitId, userId, name, type: type || "positive", createdAt: new Date().toISOString(), entries: []
    };
    await kv.set(["habits", userId, habitId], newHabit);
    ctx.response.status = 201;
    ctx.response.body = newHabit;
  } catch (e) { ctx.response.status = 401; }
});

router.patch("/api/habits/:id", async (ctx) => {
  try {
    const userId = await getUserIdFromContext(ctx);
    const habitId = ctx.params.id;
    const body = await ctx.request.body({ type: "json" }).value;
    const { name } = body;
    if (!name) {
      ctx.response.status = 400;
      return;
    }
    const key = ["habits", userId, habitId];
    const entry = await kv.get(key);
    if (!entry.value) {
      ctx.response.status = 404;
      return;
    }
    const habit = entry.value as any;
    habit.name = name; 
    await kv.set(key, habit);
    ctx.response.status = 200;
    ctx.response.body = habit;
  } catch (e) {
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
      ctx.response.status = 404; 
      return; 
    }
    const entriesIter = kv.list({ prefix: ["entries", habitId] });
    let atomic = kv.atomic();
    atomic = atomic.delete(key);
    for await (const entry of entriesIter) {
      atomic = atomic.delete(entry.key);
    }
    await atomic.commit();
    ctx.response.status = 200;
    ctx.response.body = { message: "Habit und alle Einträge gelöscht" };
  } catch (e) { 
    console.error(e);
    ctx.response.status = 401; 
  }
});
router.post("/api/habits/:id/entries", async (ctx) => {
  try {
    await getUserIdFromContext(ctx);
    const body = await ctx.request.body({ type: "json" }).value;
    const { date, status } = body;
    if (!date || !status) { ctx.response.status = 400; return; }
    const entry = { habitId: ctx.params.id, date, status };
    await kv.set(["entries", ctx.params.id, date], entry);
    ctx.response.status = 201;
    ctx.response.body = entry;
  } catch (e) { ctx.response.status = 500; }
});

app.use(oakCors({ origin: "*" }));
app.use(router.routes());
app.use(router.allowedMethods());

app.use(async (ctx) => {
  try {
    await send(ctx, ctx.request.url.pathname, { root: `${Deno.cwd()}/frontend/Habit-Tracker-V/dist`, index: "index.html" });
  } catch {
    try { await send(ctx, "index.html", { root: `${Deno.cwd()}/frontend/Habit-Tracker-V/dist` }); } catch {}
  }
});

console.log("Server running...");
await app.listen({ port: 8000 });