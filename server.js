require("dotenv").config();
const path = require("path");
const http = require("http");
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const { Server } = require("socket.io");
const { readStore, writeStore } = require("./storage");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 10000;
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-cambiar-en-produccion";

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.use(express.json({ limit: "100kb" }));

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  session({
    name: "zeromart.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

app.use(express.static(path.join(__dirname, "public")));

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt
  };
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const username = String(req.body?.username || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (username.length < 3 || username.length > 30 || password.length < 6) {
      return res.status(400).json({
        error: "Usuario de 3-30 caracteres y contraseña de mínimo 6 caracteres."
      });
    }

    const store = readStore();
    const exists = store.users.some((u) => u.username === username);
    if (exists) {
      return res.status(409).json({ error: "Ese usuario ya existe." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = {
      id: Date.now().toString(),
      username,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    store.users.push(newUser);
    writeStore(store);

    req.session.userId = newUser.id;
    return res.status(201).json({ user: sanitizeUser(newUser) });
  } catch (err) {
    console.error("Error en registro:", err.message);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const username = String(req.body?.username || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!username || !password) {
      return res.status(400).json({ error: "Faltan credenciales." });
    }

    const store = readStore();
    const user = store.users.find((u) => u.username === username);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    req.session.userId = user.id;
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Error en login:", err.message);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

app.get("/api/auth/me", (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ authenticated: false });
  }
  const store = readStore();
  const user = store.users.find((u) => u.id === req.session.userId);
  if (!user) {
    return res.status(401).json({ authenticated: false });
  }
  return res.json({ authenticated: true, user: sanitizeUser(user) });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("zeromart.sid");
    res.json({ ok: true });
  });
});

app.get("/api/products", (req, res) => {
  const store = readStore();
  res.json({ products: store.products });
});

io.on("connection", (socket) => {
  const store = readStore();
  socket.emit("store:init", { products: store.products });

  socket.on("product:select", (productId) => {
    io.emit("product:selected", { productId, by: socket.id });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor ZeroMart 3D corriendo en http://localhost:${PORT}`);
});
