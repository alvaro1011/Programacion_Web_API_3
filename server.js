import express from "express";
import { db } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

function datosInvalidos(nombre, precio, stock) {
  return (
    typeof nombre !== "string" ||
    nombre.trim() === "" ||
    typeof precio !== "number" ||
    precio < 0 ||
    typeof stock !== "number" ||
    stock < 0
  );
}

const ERROR_BD = { error: "Error en la base de datos" };

// 1. GET /productos  -> SELECT
// Lista todos los productos. Reto: filtrar por precio máximo (?max=).
app.get("/productos", async (req, res) => {
  try {
    const { max } = req.query;

    if (max === undefined) {
      const [filas] = await db.query("SELECT * FROM productos");
      return res.status(200).json(filas);
    }

    const precioMaximo = Number(max);

    if (Number.isNaN(precioMaximo) || precioMaximo < 0) {
      return res.status(400).json({
        error: "El parámetro max debe ser un número mayor o igual a cero"
      });
    }

    const [filas] = await db.query(
      "SELECT * FROM productos WHERE precio <= ?",
      [precioMaximo]
    );

    res.status(200).json(filas);
  } catch (error) {
    res.status(500).json(ERROR_BD);
  }
});

// 2. GET /productos/:id  -> SELECT ... WHERE
app.get("/productos/:id", async (req, res) => {
  try {
    const [filas] = await db.query(
      "SELECT * FROM productos WHERE id = ?",
      [req.params.id]
    );

    if (filas.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.status(200).json(filas[0]);
  } catch (error) {
    res.status(500).json(ERROR_BD);
  }
});

// 3. POST /productos  -> INSERT
app.post("/productos", async (req, res) => {
  try {
    const { nombre, precio, stock = 0 } = req.body;

    if (datosInvalidos(nombre, precio, stock)) {
      return res.status(400).json({
        error: "Nombre, precio o stock no son válidos"
      });
    }

    const [resultado] = await db.query(
      "INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)",
      [nombre.trim(), precio, stock]
    );

    res.status(201).json({
      id: resultado.insertId,
      nombre: nombre.trim(),
      precio,
      stock
    });
  } catch (error) {
    res.status(500).json(ERROR_BD);
  }
});

// 4. PUT /productos/:id  -> UPDATE (reemplaza todos los campos)
app.put("/productos/:id", async (req, res) => {
  try {
    const { nombre, precio, stock } = req.body;

    if (datosInvalidos(nombre, precio, stock)) {
      return res.status(400).json({
        error: "PUT requiere nombre, precio y stock válidos"
      });
    }

    const [resultado] = await db.query(
      "UPDATE productos SET nombre = ?, precio = ?, stock = ? WHERE id = ?",
      [nombre.trim(), precio, stock, req.params.id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.status(200).json({
      id: Number(req.params.id),
      nombre: nombre.trim(),
      precio,
      stock
    });
  } catch (error) {
    res.status(500).json(ERROR_BD);
  }
});

// 5. PATCH /productos/:id  -> UPDATE (solo los campos enviados)
app.patch("/productos/:id", async (req, res) => {
  try {
    const camposPermitidos = ["nombre", "precio", "stock"];
    const camposRecibidos = Object.keys(req.body);

    if (
      camposRecibidos.length === 0 ||
      camposRecibidos.some((campo) => !camposPermitidos.includes(campo))
    ) {
      return res.status(400).json({
        error: "Envía al menos un campo válido: nombre, precio o stock"
      });
    }

    // Se lee el producto actual para combinarlo con los campos enviados
    const [filas] = await db.query(
      "SELECT * FROM productos WHERE id = ?",
      [req.params.id]
    );

    if (filas.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const actual = filas[0];
    const nombre = req.body.nombre ?? actual.nombre;
    const precio = req.body.precio ?? actual.precio;
    const stock = req.body.stock ?? actual.stock;

    if (datosInvalidos(nombre, precio, stock)) {
      return res.status(400).json({
        error: "Los datos enviados no son válidos"
      });
    }

    await db.query(
      "UPDATE productos SET nombre = ?, precio = ?, stock = ? WHERE id = ?",
      [nombre.trim(), precio, stock, req.params.id]
    );

    res.status(200).json({
      id: actual.id,
      nombre: nombre.trim(),
      precio,
      stock
    });
  } catch (error) {
    res.status(500).json(ERROR_BD);
  }
});

// 6. DELETE /productos/:id  -> DELETE
app.delete("/productos/:id", async (req, res) => {
  try {
    const [resultado] = await db.query(
      "DELETE FROM productos WHERE id = ?",
      [req.params.id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.status(204).end();
  } catch (error) {
    res.status(500).json(ERROR_BD);
  }
});

// Arranque del servidor
app.listen(PORT, (error) => {
  if (error) {
    console.error(`No se pudo iniciar en el puerto ${PORT}:`, error.message);
    process.exit(1);
  }
  console.log(`Servidor listo en http://localhost:${PORT}`);
});