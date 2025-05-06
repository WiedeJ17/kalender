import connectToDatabase from '/lib/mongodb';
import Reservation from '/models/Reservation';

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === 'POST') {
    try {
      const { id } = req.body;
      await Reservation.findByIdAndDelete(id);
      res.status(200).json({ message: 'Reservierung gelöscht' });
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      res.status(500).json({ message: 'Fehler beim Löschen der Reservierung' });
    }
  } else {
    res.status(405).json({ message: 'Methode nicht erlaubt' });
  }
}