const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const users = [
  { username: 'gerente', password: '123', role: 'gerente', name: 'Gerente ZeroMart' },
  { username: 'cliente', password: '123', role: 'cliente', name: 'Cliente Demo' }
];

let products = [
  { id: 1, name: 'Pack Refrescos 12pz', price: 185, stock: 12, aisle: 1, shelf: 1, color: '#00b4d8', category: 'Bebidas' },
  { id: 2, name: 'Agua Mineral 24pz', price: 140, stock: 8, aisle: 1, shelf: 2, color: '#48cae4', category: 'Bebidas' },
  { id: 3, name: 'Audífonos Gamer RGB', price: 650, stock: 5, aisle: 2, shelf: 1, color: '#9b5de5', category: 'Electrónica' },
  { id: 4, name: 'Teclado Mecánico', price: 890, stock: 4, aisle: 2, shelf: 2, color: '#f15bb5', category: 'Electrónica' },
  { id: 5, name: 'Caja Cereal Familiar', price: 95, stock: 15, aisle: 3, shelf: 1, color: '#fee440', category: 'Despensa' },
  { id: 6, name: 'Café Soluble 400g', price: 130, stock: 10, aisle: 3, shelf: 2, color: '#d4a373', category: 'Despensa' },
  { id: 7, name: 'Mega Pack Papas', price: 110, stock: 20, aisle: 4, shelf: 1, color: '#f77f00', category: 'Botanas' },
  { id: 8, name: 'Galletas Surtidas', price: 78, stock: 14, aisle: 4, shelf: 2, color: '#e63946', category: 'Botanas' }
];

let orders = [];

app.post('/api/register', (req, res) => {
  const { username, password, name, role } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ ok: false, message: 'Completa todos los campos.' });
  }
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ ok: false, message: 'El usuario ya existe.' });
  }
  const newUser = {
    username,
    password,
    name,
    role: role === 'gerente' ? 'gerente' : 'cliente'
  };
  users.push(newUser);
  res.json({ ok: true, user: { username: newUser.username, name: newUser.name, role: newUser.role } });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const found = users.find(u => u.username === username && u.password === password);
  if (!found) {
    return res.status(401).json({ ok: false, message: 'Usuario o contraseña incorrectos.' });
  }
  res.json({ ok: true, user: { username: found.username, name: found.name, role: found.role } });
});

io.on('connection', (socket) => {
  socket.emit('init_data', { products, orders });

  socket.on('add_product', (data) => {
    const newProd = {
      id: Date.now(),
      name: data.name,
      price: Number(data.price),
      stock: Number(data.stock),
      aisle: Number(data.aisle),
      shelf: Number(data.shelf),
      color: data.color || '#00f5d4',
      category: data.category || 'General'
    };
    products.push(newProd);
    io.emit('products_updated', products);
  });

  socket.on('restock_product', ({ id, amount }) => {
    const prod = products.find(p => p.id === id);
    if (prod) {
      prod.stock += Number(amount);
      io.emit('products_updated', products);
    }
  });

  socket.on('checkout', (orderData) => {
    const { customerName, items, deliveryType, address, total } = orderData;

    for (const item of items) {
      const prod = products.find(p => p.id === item.id);
      if (!prod || prod.stock < item.qty) {
        socket.emit('checkout_error', `Stock insuficiente para: ${item.name}`);
        return;
      }
    }

    for (const item of items) {
      const prod = products.find(p => p.id === item.id);
      prod.stock -= item.qty;
    }

    const folio = 'ZM-' + Math.floor(100000 + Math.random() * 900000);
    const newOrder = {
      folio,
      customerName,
      items,
      deliveryType,
      address: deliveryType === 'domicilio' ? address : 'Recoger en Sucursal Principal',
      total,
      date: new Date().toLocaleTimeString()
    };

    orders.unshift(newOrder);

    socket.emit('checkout_success', newOrder);
    io.emit('products_updated', products);
    io.emit('orders_updated', orders);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor ZeroMart 3D corriendo en http://localhost:${PORT}`);
});
