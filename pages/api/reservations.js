import connectToDatabase from '/lib/mongodb';
import Reservation from '/models/Reservation';

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === 'POST') {
    try {
      const { date, startTime, endTime } = req.body; // Annahme: Datum und Zeitraum werden im Request-Body gesendet

      // Prüfen, ob der gewünschte Zeitraum bereits reserviert ist
      const existingReservations = await Reservation.find({
        date: new Date(date), // Datum vergleichen
        $or: [
          // Überlappungsbedingungen
          { startTime: { $lte: endTime }, endTime: { $gte: startTime } },
        ],
      });

      if (existingReservations.length > 0) {
        return res.status(400).json({ message: 'Der gewünschte Zeitraum ist bereits reserviert' });
      }

      // Wenn frei, neue Reservierung speichern
      const reservation = new Reservation(req.body);
      await reservation.save();
      res.status(201).json({ message: 'Reservierung erfolgreich gespeichert', reservation });
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      res.status(500).json({ message: 'Fehler beim Speichern der Reservierung' });
    }
  } else {
    res.status(405).json({ message: 'Methode nicht erlaubt' });
  }
}