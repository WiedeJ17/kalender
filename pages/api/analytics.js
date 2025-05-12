import { getSession } from "next-auth/react";
import connectToDatabase from "../../lib/mongodb";
import Reservation from "../../models/Reservation";

export default async function handler(req, res) {
  // Nur GET-Anfragen er

  // Session abrufen
  const session = await getSession({ req });

  // Debugging: Session-Informationen loggen
  console.log("Session:", JSON.stringify(session, null, 2));

  // Prüfen, ob eine Session existiert
  if (!session) {
    console.log("Keine Session vorhanden");
    return res.status(401).json({ error: "Nicht eingeloggt" });
  }

  // Prüfen, ob der Benutzer die Rolle 'admin' hat
  if (!session.user || session.user.role !== "admin") {
    console.log("Benutzerrolle:", session.user ? session.user.role : "Keine Benutzerdaten");
    return res.status(403).json({ error: "Nicht autorisiert: Benutzer ist kein Admin" });
  }

  try {
    // Verbindung zur Datenbank herstellen
    await connectToDatabase();

    // Alle Reservations-Dokumente abrufen
    const daten = await Reservation.find({}).lean();

    // Erfolgreiche Antwort senden
    return res.status(200).json(daten);
  } catch (error) {
    console.error("Fehler beim Laden der Reservierungen:", error);
    return res.status(500).json({ error: "Serverfehler beim Abrufen der Daten" });
  }
}