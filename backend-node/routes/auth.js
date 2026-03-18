import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = Router();
const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error("Falta JWT_SECRET (requerido).");

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(422).json({ detail: "Usuario y contraseña requeridos" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(username);
  if (!user || !bcrypt.compareSync(password, user.hashed_password)) {
    return res.status(401).json({ detail: "Credenciales incorrectas" });
  }

  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, SECRET, {
    expiresIn: "24h",
  });

  return res.json({ access_token: token, token_type: "bearer" });
});

export default router;
