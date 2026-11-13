import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

const productos = [
  { id: 1, nombre: "Teclado", precio: 80000, stock: 10 },
  { id: 2, nombre: "Mouse", precio: 35000, stock: 25 },
];
let siguienteId = 3;

app.get("/productos", (req, res) => {
  const { max } = req.query;

  if (max === undefined) {
    return res.status(200).json(productos);
  }

  const precioMaximo = Number(max);
  if (
    typeof max !== "string" ||
    max.trim() === "" ||
    !Number.isFinite(precioMaximo) ||
    precioMaximo < 0
  ) {
    return res.status(400).json({ mensaje: "El parámetro max no es válido" });
  }

  const filtrados = productos.filter((producto) => producto.precio <= precioMaximo);
  return res.status(200).json(filtrados);
});

app.get("/productos/:id", (req, res) => {
  const id = Number(req.params.id);
  const producto = productos.find((item) => item.id === id);

  if (!producto) {
    return res.status(404).json({ mensaje: "Producto no encontrado" });
  }

  return res.status(200).json(producto);
});

app.post("/productos", (req, res) => {
  const datos = req.body;

  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return res.status(400).json({ mensaje: "Faltan datos o no son válidos" });
  }

  const { nombre, precio, stock = 0 } = datos;
  if (
    typeof nombre !== "string" ||
    nombre.trim() === "" ||
    typeof precio !== "number" ||
    !Number.isFinite(precio) ||
    precio < 0 ||
    typeof stock !== "number" ||
    !Number.isFinite(stock) ||
    stock < 0
  ) {
    return res.status(400).json({ mensaje: "Faltan datos o no son válidos" });
  }

  const nuevoProducto = { id: siguienteId++, nombre, precio, stock };
  productos.push(nuevoProducto);
  return res.status(201).json(nuevoProducto);
});

app.put("/productos/:id", (req, res) => {
  const id = Number(req.params.id);
  const indice = productos.findIndex((producto) => producto.id === id);

  if (indice === -1) {
    return res.status(404).json({ mensaje: "Producto no encontrado" });
  }

  const datos = req.body;
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return res.status(400).json({ mensaje: "Faltan datos o no son válidos" });
  }

  const { nombre, precio, stock } = datos;
  if (
    typeof nombre !== "string" ||
    nombre.trim() === "" ||
    typeof precio !== "number" ||
    !Number.isFinite(precio) ||
    precio < 0 ||
    typeof stock !== "number" ||
    !Number.isFinite(stock) ||
    stock < 0
  ) {
    return res.status(400).json({ mensaje: "Faltan datos o no son válidos" });
  }

  productos[indice] = { id, nombre, precio, stock };
  return res.status(200).json(productos[indice]);
});

app.patch("/productos/:id", (req, res) => {
  const id = Number(req.params.id);
  const producto = productos.find((item) => item.id === id);

  if (!producto) {
    return res.status(404).json({ mensaje: "Producto no encontrado" });
  }

  const datos = req.body;
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return res.status(400).json({ mensaje: "Faltan datos o no son válidos" });
  }

  const campos = Object.keys(datos);
  if (campos.length === 0 || campos.some((campo) => !["nombre", "precio", "stock"].includes(campo))) {
    return res.status(400).json({ mensaje: "Faltan datos o no son válidos" });
  }

  if (
    ("nombre" in datos && (typeof datos.nombre !== "string" || datos.nombre.trim() === "")) ||
    ("precio" in datos &&
      (typeof datos.precio !== "number" || !Number.isFinite(datos.precio) || datos.precio < 0)) ||
    ("stock" in datos &&
      (typeof datos.stock !== "number" || !Number.isFinite(datos.stock) || datos.stock < 0))
  ) {
    return res.status(400).json({ mensaje: "Faltan datos o no son válidos" });
  }

  Object.assign(producto, datos);
  return res.status(200).json(producto);
});

app.delete("/productos/:id", (req, res) => {
  const id = Number(req.params.id);
  const indice = productos.findIndex((producto) => producto.id === id);

  if (indice === -1) {
    return res.status(404).json({ mensaje: "Producto no encontrado" });
  }

  productos.splice(indice, 1);
  return res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});
