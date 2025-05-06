import { getSession } from "next-auth/react";
import connectToDatabase from "../../lib/mongodb";
import Reservation from "../../models/Reservation";

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session || session.user.role !== "admin") {
    return res.status(401).json({ error: "Nicht autorisiert" });
  }

  try {
    // Verbindung zur Datenbank herstellen
    await connectToDatabase();

    // Alle Reservations-Dokumente abrufen
    const daten = await Reservation.find({}).lean();

    res.status(200).json(daten);
  } catch (error) {
    console.error("Fehler beim Laden der Reservierungen:", error);
    res.status(500).json({ error: "Serverfehler" });
  }
}