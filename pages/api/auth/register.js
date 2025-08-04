import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Nur POST erlaubt" });
  }

  const { username, password, role } = req.body;

  // Validate input
  if (!username || !password || !role) {
    return res.status(400).json({ message: "Fehlende Daten" });
  }

  // Validate role
  const validRoles = ["admin", "vorstand", "standard", "observer"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Ungültige Rolle" });
  }

  try {
    await connectToDatabase();

    // Check for existing user
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: "Benutzername vergeben" });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword, role });

    return res.status(201).json({ message: "Registriert" });
  } catch (error) {
    console.error("Fehler bei der Registrierung:", error);
    return res.status(500).json({ message: "Serverfehler bei der Registrierung" });
  }
}