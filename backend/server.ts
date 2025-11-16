// backend/server.ts

// --- Importe ---
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

// --- Setup & Konfiguration ---
const kv = await Deno.openKv();
const app = new Application();
const router = new Router();

// Statischer, geheimer Schlüssel für JWT-Signierung.
// In einer Produktionsumgebung MUSS dieser Wert aus einer Umgebungsvariable
// (z.B. Deno.env.get("JWT_SECRET")) geladen werden.
const SECRET_STRING = "dein-sehr-geheimer-schluessel-fuer-das-t4-projekt-mindestens-64-zeichen-lang";

// Konvertiert den String-Schlüssel in ein CryptoKey-Objekt für den 'djwt'-Einsatz
const JWT_SECRET_KEY = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(SECRET_STRING),
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"],
);

// --- API-Endpunkte ---

/**
 * @route GET /api/test
 * Einfacher Health-Check Endpunkt, um die Serververfügbarkeit zu prüfen.
 */
router.get("/api/test", (ctx) => {
  ctx.response.body = { message: "Hallo vom Deno-Backend!" };
});

/**
 * @route POST /api/register
 * Registriert einen neuen Benutzer.
 * Erfordert 'email' und 'password' (min. 6 Zeichen) im JSON-Body.
 * Speichert den Benutzer mit gehashtem Passwort in Deno KV.
 */
router.post("/api/register", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { email, password } = body;

    // Serverseitige Validierung der Eingaben
    if (!email || !password || password.length < 6) {
      ctx.response.status = 400;
      ctx.response.body = { message: "E-Mail oder Passwort ungültig (Passwort min. 6 Zeichen)." };
      return;
    }

    // Prüfung auf Duplikate
    const userEntry = await kv.get(["users", email]);
    if (userEntry.value) {
      ctx.response.status = 409; // Conflict
      ctx.response.body = { message: "Ein Benutzer mit dieser E-Mail existiert bereits." };
      return;
    }

    // Passwort-Hashing vor der Speicherung
    const hashedPassword = await bcrypt.hash(password);
    const userId = crypto.randomUUID();
    const user = {
      id: userId,
      email: email,
      hashedPassword: hashedPassword,
    };

    // Speicherung (indiziert nach E-Mail und nach ID)
    await kv.set(["users", email], user);
    await kv.set(["users_by_id", userId], user);

    console.log(`Neuer Benutzer registriert: ${email}`);
    ctx.response.status = 201; // Created
    ctx.response.body = { message: "Benutzer erfolgreich registriert!", userId: userId };

  } catch (err) {
    console.error(err);
    ctx.response.status = 500;
    ctx.response.body = { message: "Interner Serverfehler." };
  }
});

/**
 * @route POST /api/login
 * Authentifiziert einen Benutzer und gibt einen JWT zurück.
 * Erfordert 'email' und 'password' im JSON-Body.
 * Vergleicht das Passwort mit dem gespeicherten Hash.
 */
router.post("/api/login", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { email, password } = body;

    // 1. Benutzer finden
    const userEntry = await kv.get(["users", email]);
    if (!userEntry.value) {
      ctx.response.status = 401; // Unauthorized
      ctx.response.body = { message: "Anmeldedaten ungültig." }; // Vage Meldung (Security)
      return;
    }

    const user = userEntry.value as { id: string; email: string; hashedPassword: string };

    // 2. Passwort-Vergleich
    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordMatch) {
      ctx.response.status = 401;
      ctx.response.body = { message: "Anmeldedaten ungültig." }; // Vage Meldung (Security)
      return;
    }

    // 3. JWT-Payload erstellen (Gültigkeit: 24 Stunden)
    const payload = {
      iss: "habit-tracker-api", // Aussteller
      sub: user.id,             // Subject (Eindeutige User-ID)
      email: user.email,
      exp: getNumericDate(60 * 60 * 24), // Läuft ab in 24h
    };

    // 4. Token signieren und zurückgeben
    const token = await create({ alg: "HS512", typ: "JWT" }, payload, JWT_SECRET_KEY);

    console.log(`Benutzer eingeloggt: ${email}`);
    ctx.response.status = 200;
    ctx.response.body = { message: "Login erfolgreich!", token: token };

  } catch (err) {
    console.error(err);
    ctx.response.status = 500;
    ctx.response.body = { message: "Interner Serverfehler." };
  }
});


// --- Middleware & Serverstart ---

// CORS-Middleware: Erlaubt Anfragen vom Frontend (Vite-Dev-Server)
app.use(oakCors({ origin: "http://localhost:5173" }));

// Registriert die definierten Routen bei der Oak-Applikation
app.use(router.routes());
app.use(router.allowedMethods());

// Startet den Deno-Server auf Port 8000
console.log("Backend-Server startet auf http://localhost:8000 ...");
await app.listen({ port: 8000 });