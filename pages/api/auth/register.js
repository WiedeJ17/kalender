import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Nur POST erlaubt" });

  const { username, password, role } = req.body;

  if (!username || !password || !role) return res.status(400).json({ message: "Fehlende Daten" });

  await connectToDatabase();

  const existing = await User.findOne({ username });
  if (existing) return res.status(409).json({ message: "Benutzername vergeben" });

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ username, password: hashedPassword, role });

  res.status(201).json({ message: "Registriert" });
}
