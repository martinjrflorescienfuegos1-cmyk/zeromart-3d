const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

const DEFAULT_PRODUCTS = [
  { id: 1, name: "Refresco Cola 600ml", price: 18, stock: 25, aisle: "Bebidas", shape: "bottle", color: "#991b1b" },
  { id: 2, name: "Agua Mineral 600ml", price: 15, stock: 30, aisle: "Bebidas", shape: "bottle", color: "#0284c7" },
  { id: 3, name: "Jugo Naranja 1L", price: 24, stock: 18, aisle: "Bebidas", shape: "bottle", color: "#ea580c" },
  { id: 4, name: "Leche Entera 1L", price: 26, stock: 20, aisle: "Lácteos", shape: "carton", color: "#1d4ed8" },
  { id: 5, name: "Leche Deslactosada 1L", price: 28, stock: 16, aisle: "Lácteos", shape: "carton", color: "#0f766e" },
  { id: 6, name: "Yogurt Fresa 900g", price: 36, stock: 14, aisle: "Lácteos", shape: "bottle", color: "#db2777" },
  { id: 7, name: "Pan de Caja Blanco", price: 42, stock: 15, aisle: "Panadería", shape: "box", color: "#d97706" },
  { id: 8, name: "Pan Integral 680g", price: 46, stock: 12, aisle: "Panadería", shape: "box", color: "#78350f" },
  { id: 9, name: "Galletas Chispas", price: 22, stock: 24, aisle: "Panadería", shape: "box", color: "#4338ca" },
  { id: 10, name: "Papas Clásicas 170g", price: 34, stock: 22, aisle: "Botanas", shape: "bag", color: "#eab308" },
  { id: 11, name: "Totopos Queso 200g", price: 32, stock: 19, aisle: "Botanas", shape: "bag", color: "#dc2626" },
  { id: 12, name: "Cacahuates Salados", price: 19, stock: 28, aisle: "Botanas", shape: "bag", color: "#15803d" }
];

const DEFAULT_DATA = {
  users: [],
  products: DEFAULT_PRODUCTS,
  orders: []
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
    const existing = Array.isArray(parsed.products) ? parsed.products : [];
    const mergedProducts = [...existing];

    for (const defProd of DEFAULT_PRODUCTS) {
      const found = mergedProducts.find((p) => Number(p.id) === Number(defProd.id));
      if (!found) {
        mergedProducts.push({ ...defProd });
      } else {
        if (!found.shape) found.shape = defProd.shape;
        if (!found.color) found.color = defProd.color;
      }
    }

    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      products: mergedProducts,
      orders: Array.isArray(parsed.orders) ? parsed.orders : []
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
