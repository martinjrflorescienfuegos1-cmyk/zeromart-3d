const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

const DEFAULT_DATA = {
  users: [],
  products: [
    { id: 1, name: "Refresco Cola 600ml", price: 18, stock: 25, aisle: "Bebidas" },
    { id: 2, name: "Pan de Caja Blanco", price: 42, stock: 15, aisle: "Panadería" },
    { id: 3, name: "Leche Entera 1L", price: 26, stock: 20, aisle: "Lácteos" }
  ],
  cartItems: []
};

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_DATA, null, 2), "utf8");
  }
}

function readStore() {
  ensureStore();
  try {
    const raw = fs.readFileSync(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      products: Array.isArray(parsed.products) ? parsed.products : DEFAULT_DATA.products,
      cartItems: Array.isArray(parsed.cartItems) ? parsed.cartItems : []
    };
  } catch (err) {
    console.error("Error leyendo store.json, usando respaldo:", err.message);
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function writeStore(data) {
  ensureStore();
  const tempFile = `${STORE_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tempFile, STORE_FILE);
}

module.exports = {
  readStore,
  writeStore
};
