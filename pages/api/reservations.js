import connectToDatabase from '/lib/mongodb';
import Reservation from '/models/Reservation';

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === 'POST') {
    try {
      const { date, startTime, endTime, resource, username, user, group, busDestination, purpose } = req.body;

      // Debugging: Logge die eingehenden Daten
      console.log('Eingehende Reservierungsdaten:', { date, startTime, endTime, resource, username, user, group, busDestination, purpose });

      // Validierung der erforderlichen Felder
      if (!date || !startTime || !endTime || !resource || !username || !user || !group) {
        return res.status(400).json({ message: 'Alle Pflichtfelder müssen ausgefüllt sein' });
      }

      // Validierung des Verwendungszwecks für Nicht-Bus-Ressourcen
      if (resource !== 'Bus alt' && resource !== 'VW Bus weiß' && resource !== 'VW Bus silber' && (!purpose || purpose.trim() === '')) {
        return res.status(400).json({ message: 'Verwendungszweck ist für diese Ressource erforderlich' });
    }

      // Prüfen, ob der gewünschte Zeitraum für die spezifische Ressource bereits reserviert ist
      const existingReservations = await Reservation.find({
        date: new Date(date),
        resource,
        $or: [
          { startTime: { $lte: endTime }, endTime: { $gte: startTime } },
        ],
      });

      if (existingReservations.length > 0) {
        return res.status(400).json({
          message: `Der gewünschte Zeitraum ist für die Ressource ${resource} bereits reserviert`,
        });
      }

      // Neue Reservierung speichern
      const reservationData = {
        date: new Date(date),
        startTime,
        endTime,
        resource,
        username,
        user,
        group,
        busDestination: busDestination || '',
        purpose: purpose || '', // Konsistent mit Schema (default: '')
      };

      // Debugging: Logge die zu speichernde Reservierung
      console.log('Zu speichernde Reservierung:', reservationData);

      const reservation = new Reservation(reservationData);
      await reservation.save();

      // Debugging: Logge die gespeicherte Reservierung
      console.log('Gespeicherte Reservierung:', reservation);

      res.status(201).json({ message: 'Reservierung erfolgreich gespeichert', reservation });
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      res.status(500).json({ message: 'Fehler beim Speichern der Reservierung', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Methode nicht erlaubt' });
  }
}