import connectToDatabase from '/lib/mongodb'; // Pfad zu deiner Verbindung
import Reservation from '/models/Reservation';

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === 'POST') {
    try {
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