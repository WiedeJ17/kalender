import mongoose from 'mongoose';

const ReservationSchema = new mongoose.Schema({
  resource: { type: String, required: true },
  group: { type: String, required: true },
  date: { type: Date, required: true },
  busDestination: { type: String, default: '' },
  user: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  username: { type: String, required: true }, // Zusätzlich für den Benutzernamen
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Reservation || mongoose.model('Reservation', ReservationSchema);