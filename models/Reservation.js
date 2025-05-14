import mongoose from 'mongoose';

const ReservationSchema = new mongoose.Schema({
  resource: { type: String, required: true }, // Ressource (z. B. Vereinsheim, Bus alt)
  group: { type: String, required: true }, // Gruppe (z. B. Fußball, Gymnastik)
  date: { type: Date, required: true }, // Datum der Reservierung
  busDestination: { type: String, default: '' }, // Ziel der Fahrt für Bus-Ressourcen
  purpose: { type: String, default: '' }, // Verwendungszweck für Nicht-Bus-Ressourcen
  user: { type: String, required: true }, // Benutzer-ID oder Name
  startTime: { type: String, required: true }, // Startzeit der Reservierung (z. B. "12:00")
  endTime: { type: String, required: true }, // Endzeit der Reservierung (z. B. "22:00")
  username: { type: String, required: true }, // Benutzername für Anzeige
  createdAt: { type: Date, default: Date.now }, // Erstellungsdatum der Reservierung
});

// Sicherstellen, dass das Modell nur einmal erstellt wird
export default mongoose.models.Reservation || mongoose.model('Reservation', ReservationSchema);