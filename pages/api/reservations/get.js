import connectToDatabase from '/lib/mongodb';
import Reservation from '/models/Reservation';

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const reservations = await Reservation.find({}).lean(); // Alle Reservierungen abrufen
      res.status(200).json(reservations);
    } catch (error) {
      console.error('Fehler beim Abrufen:', error);
      res.status(500).json({ message: 'Fehler beim Abrufen der Reservierungen' });
    }
  } else {
    res.status(405).json({ message: 'Methode nicht erlaubt' });
  }
}