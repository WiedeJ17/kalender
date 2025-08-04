import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";

const Calendar = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [calendarDays, setCalendarDays] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedResource, setSelectedResource] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [busDestination, setBusDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [reservedResources, setReservedResources] = useState([]);
  const [selectedDayReservations, setSelectedDayReservations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState(null);

  const groupColors = {
    Fußball: '#4CAF50',
    Volleyball: '#FF9800',
    Gymnastik: '#E91E63',
    Sonstige: '#2196F3',
  };

  const fetchReservations = async () => {
    try {
      const response = await fetch('/api/reservations/get');
      const data = await response.json();
      setReservedResources(data);
      return data;
    } catch (error) {
      console.error('Fehler beim Laden der Reservierungen:', error);
      setErrorMessage('Fehler beim Laden der Reservierungen');
      setIsErrorModalOpen(true);
      return [];
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchReservations().then(() => setLoading(false));
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, session, router]);

  useEffect(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const firstDayOfMonth = getDay(start);
    const paddedDays = Array(firstDayOfMonth).fill(null).concat(days);
    setCalendarDays(paddedDays);
  }, [currentMonth]);

  if (loading) return <p>Lädt...</p>;

  const handleLogout = () => signOut({ callbackUrl: "/" });

  const checkTimeConflict = (newReservation, reservations) => {
    const newStart = new Date(`${newReservation.date}T${newReservation.startTime}:00`);
    const newEnd = new Date(`${newReservation.date}T${newReservation.endTime}:00`);

    const conflicts = reservations.filter((existing) => {
      if (
        existing.resource === newReservation.resource &&
        format(new Date(existing.date), 'yyyy-MM-dd') === newReservation.date
      ) {
        const existingStart = new Date(`${existing.date}T${existing.startTime}:00`);
        const existingEnd = new Date(`${existing.date}T${existing.endTime}:00`);
        return newStart < existingEnd && newEnd > existingStart;
      }
      return false;
    });

    return conflicts.length > 0 ? conflicts : null;
  };

  const handleReserve = async () => {
    if (session.user.role === "observer") {
      setErrorMessage('Beobachter haben keine Berechtigung, Reservierungen zu erstellen.');
      setIsErrorModalOpen(true);
      return;
    }

    if (status !== 'authenticated' || !session?.user?.username) {
      setErrorMessage('Bitte melden Sie sich an, um eine Reservierung zu erstellen.');
      setIsErrorModalOpen(true);
      router.push('/auth/signin');
      return;
    }

    if (!selectedResource || !selectedGroup || !selectedDate || !startTime || !endTime) {
      setErrorMessage('Bitte alle Pflichtfelder ausfüllen (Ressource, Gruppe, Datum, Startzeit, Endzeit).');
      setIsErrorModalOpen(true);
      return;
    }

    const isBus = ["VW Bus weiß", "VW Bus silber", "Bus Opel"].includes(selectedResource);

    if (isBus && !busDestination) {
      setErrorMessage('Bitte das Ziel der Fahrt angeben.');
      setIsErrorModalOpen(true);
      return;
    }

    if (!isBus && !purpose) {
      setErrorMessage('Bitte den Verwendungszweck angeben.');
      setIsErrorModalOpen(true);
      return;
    }

    const startDateTime = new Date(`${selectedDate}T${startTime}:00`);
    const endDateTime = new Date(`${selectedDate}T${endTime}:00`);
    if (endDateTime <= startDateTime) {
      setErrorMessage('Die Endzeit muss nach der Startzeit liegen.');
      setIsErrorModalOpen(true);
      return;
    }

    const reservation = {
      resource: selectedResource,
      group: selectedGroup,
      date: selectedDate,
      busDestination: isBus ? busDestination : '',
      purpose: !isBus ? purpose : '',
      startTime: startTime,
      endTime: endTime,
      user: session.user.username,
      username: session.user.username,
    };

    const latestReservations = await fetchReservations();
    const conflicts = checkTimeConflict(reservation, latestReservations);
    if (conflicts) {
      setErrorMessage(
        `Die Ressource "${selectedResource}" ist bereits am ${selectedDate} von ${conflicts[0].startTime} bis ${conflicts[0].endTime} reserviert.`
      );
      setIsErrorModalOpen(true);
      return;
    }

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservation),
      });

      const data = await response.json();

      if (response.ok) {
        setErrorMessage('Reservierung erfolgreich erstellt');
        setIsErrorModalOpen(true);
        fetchReservations();
        setSelectedResource('');
        setSelectedGroup('');
        setSelectedDate('');
        setBusDestination('');
        setPurpose('');
        setStartTime('');
        setEndTime('');
      } else {
        setErrorMessage(data.message || 'Fehler bei der Reservierung');
        setIsErrorModalOpen(true);
      }
    } catch (error) {
      console.error('Fehler bei der Reservierung:', error);
      setErrorMessage('Fehler beim Senden der Reservierung');
      setIsErrorModalOpen(true);
    }
  };

  const handleDayClick = (day) => {
    const dayReservations = reservedResources.filter(
      (res) => format(new Date(res.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    );
    setSelectedDayReservations(dayReservations);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDayReservations([]);
  };

  const handleCloseErrorModal = () => {
    setIsErrorModalOpen(false);
    setErrorMessage('');
  };

  const handleDelete = (reservation) => {
    setReservationToDelete(reservation);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!reservationToDelete) return;

    try {
      const res = await fetch('/api/reservations/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: reservationToDelete._id }),
      });

      if (res.ok) {
        setErrorMessage('Reservierung gelöscht');
        setIsErrorModalOpen(true);
        fetchReservations();
        setIsModalOpen(false);
      } else {
        setErrorMessage('Fehler beim Löschen');
        setIsErrorModalOpen(true);
      }
    } catch (error) {
      console.error('Fehler:', error);
      setErrorMessage('Fehler beim Löschen');
      setIsErrorModalOpen(true);
    } finally {
      setIsDeleteModalOpen(false);
      setReservationToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setReservationToDelete(null);
  };

  return (
    <div className="dashboardWrapper">
      <button
        className="hamburger"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        ☰
      </button>
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="userInfo">
          <h2>{session.user.username}</h2>
          <p className="userRole">Rolle: {session.user.role}</p>
        </div>
        <div className="navLinks">
          <button onClick={() => router.push("/calendar")}>Kalender</button>
          {session.user.role === "admin" && (
            <>
              <button onClick={() => router.push("/analytics")}>Analytics</button>
              <button onClick={() => router.push("/register")}>Benutzerverwaltung</button>
            </>
          )}
          <button onClick={() => router.push("/dashboard")}>Zurück</button>
        </div>
        <button className="logoutButton" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className="mainContent">
        <header className="header">
          <h1>Kalender / Reservierung</h1>
        </header>
        <section className="calendar-section">
          <h2 className="monat">
            <button
              className="monat-button"
              onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            >
              ←
            </button>
            {format(currentMonth, "MMMM yyyy")}
            <button
              className="monat-button"
              onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            >
              →
            </button>
          </h2>
          <div className="kalender">
            <div className="kalender-header">
              {['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'].map((tag) => (
                <div key={tag} className="wochentag">{tag}</div>
              ))}
            </div>
            <div className="kalender-tage">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className="tag"
                  onClick={() => day && handleDayClick(day)}
                >
                  {day ? (
                    <>
                      <span>{format(day, "d")}</span>
                      {reservedResources
                        .filter((res) => format(new Date(res.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
                        .map((res, resIndex) => (
                          <div
                            key={resIndex}
                            style={{
                              backgroundColor: groupColors[res.group] || '#ccc',
                              fontSize: '0.7rem',
                              color: '#fff',
                              padding: '2px',
                              borderRadius: '3px',
                              marginTop: '2px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {res.group}
                          </div>
                        ))}
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
        {isModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <button onClick={handleCloseModal} className="modal-close">X</button>
              <h3>
                {selectedDayReservations.length > 0
                  ? `Reservierungen am ${format(new Date(selectedDayReservations[0].date), "dd.MM.yyyy")}`
                  : "Keine Termine eingetragen"}
              </h3>
              <div className="modal-reservations">
                {selectedDayReservations.map((res, index) => (
                  <div key={index} className="reservation-item">
                    <p><strong>Ressource:</strong> {res.resource}</p>
                    <p><strong>Gruppe:</strong> {res.group}</p>
                    <p><strong>Von:</strong> {res.startTime}</p>
                    <p><strong>Bis:</strong> {res.endTime}</p>
                    <p><strong>Angemeldet von:</strong> {res.username}</p>
                    {["VW Bus weiß", "VW Bus silber", "Bus Opel"].includes(res.resource) && res.busDestination && (
                      <p><strong>Ziel der Fahrt:</strong> {res.busDestination}</p>
                    )}
                    {!["VW Bus weiß", "VW Bus silber", "Bus Opel"].includes(res.resource) && res.purpose && (
                      <p><strong>Verwendungszweck:</strong> {res.purpose}</p>
                    )}
                    {(session.user.role === 'admin' || session.user.role === 'vorstand') && (
                      <button onClick={() => handleDelete(res)} className="delete-button">
                        Löschen
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {isErrorModalOpen && (
          <div className="modal error-modal">
            <div className="modal-content error-modal-content">
              <button onClick={handleCloseErrorModal} className="modal-close">X</button>
              <h3>Information</h3>
              <p>{errorMessage}</p>
              <button onClick={handleCloseErrorModal} className="modal-ok-button">
                OK
              </button>
            </div>
          </div>
        )}
        {isDeleteModalOpen && (
          <div className="modal delete-modal">
            <div className="modal-content delete-modal-content">
              <button onClick={cancelDelete} className="modal-close">X</button>
              <h3>Reservierung löschen</h3>
              <p>Möchtest du diese Reservierung wirklich löschen?</p>
              <div className="modal-buttons">
                <button onClick={confirmDelete} className="modal-confirm-button">
                  Ja
                </button>
                <button onClick={cancelDelete} className="modal-cancel-button">
                  Nein
                </button>
              </div>
            </div>
          </div>
        )}
        {session.user.role !== "observer" && (
          <div className="reservierungs-section">
            <h3>Reservierung hinzufügen</h3>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-field">
                <label>Ressource:</label>
                <select value={selectedResource} onChange={(e) => setSelectedResource(e.target.value)}>
                  <option value="">Wählen Sie eine Ressource</option>
                  {(session.user.role === "admin" || session.user.role === "vorstand") && (
                    <>
                      <option value="Halle 1">Halle 1</option>
                      <option value="Halle 2">Halle 2</option>
                      <option value="Halle 3">Halle 3</option>
                    </>
                  )}
                  <option value="Bus Opel">Bus Opel</option>
                  <option value="VW Bus weiß">VW Bus weiß</option>
                  <option value="VW Bus silber">VW Bus silber</option>
                  <option value="Besprechungsraum">Besprechungsraum</option>
                  <option value="Kiosk">Kiosk</option>
                  <option value="Vereinsheim">Vereinsheim</option>
                  <option value="Raum Frankenried">Raum Frankenried</option>
                  <option value="Raum Steinholz">Raum Steinholz</option>
                  <option value="Zelt Sportplatz">Zelt Sportplatz</option>
                  <option value="JBL Box">JBL Box</option>
                </select>
              </div>
              <div className="form-field">
                <label>Gruppe:</label>
                <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                  <option value="">Wählen Sie eine Gruppe</option>
                  <option value="Fußball">Fußball</option>
                  <option value="Volleyball">Volleyball</option>
                  <option value="Gymnastik">Gymnastik</option>
                  <option value="Sonstige">Sonstige</option>
                </select>
              </div>
              <div className="form-field">
                <label>Angemeldet von:</label>
                <input type="text" value={session.user.username} disabled />
              </div>
              <div className="form-field">
                <label>Datum:</label>
                <input type="date" lang="de" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>
              {["VW Bus weiß", "VW Bus silber", "Bus Opel"].includes(selectedResource) && (
                <div className="form-field">
                  <label>Ziel der Fahrt:</label>
                  <input type="text" value={busDestination} onChange={(e) => setBusDestination(e.target.value)} />
                </div>
              )}
              {!["VW Bus weiß", "VW Bus silber", "Bus Opel"].includes(selectedResource) && (
                <div className="form-field">
                  <label>Verwendungszweck:</label>
                  <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
                </div>
              )}
              <div className="form-field">
                <label>Startzeit:</label>
                <select value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                  {[...Array(24).keys()].map((hour) => (
                    <>
                      <option key={`${hour}:00`} value={`${hour.toString().padStart(2, '0')}:00`}>
                        {`${hour.toString().padStart(2, '0')}:00`}
                      </option>
                      <option key={`${hour}:30`} value={`${hour.toString().padStart(2, '0')}:30`}>
                        {`${hour.toString().padStart(2, '0')}:30`}
                      </option>
                    </>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Endzeit:</label>
                <select value={endTime} onChange={(e) => setEndTime(e.target.value)}>
                  {[...Array(24).keys()].map((hour) => (
                    <>
                      <option key={`${hour}:00`} value={`${hour.toString().padStart(2, '0')}:00`}>
                        {`${hour.toString().padStart(2, '0')}:00`}
                      </option>
                      <option key={`${hour}:30`} value={`${hour.toString().padStart(2, '0')}:30`}>
                        {`${hour.toString().padStart(2, '0')}:30`}
                      </option>
                    </>
                  ))}
                </select>
              </div>
              <button type="button" onClick={handleReserve}>
                Reservierung speichern
              </button>
            </form>
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboardWrapper {
          display: flex;
          min-height: 100vh;
          background-color: #fff;
          font-family: 'Arial', sans-serif;
          color: #111111;
        }

        .hamburger {
          display: none;
          position: fixed;
          top: 10px;
          right: 10px;
          background: #b30000;
          color: #fff;
          border: none;
          padding: 8px 12px;
          font-size: 1.2rem;
          cursor: pointer;
          z-index: 1100;
          border-radius: 5px;
        }

        .sidebar {
          width: 240px;
          background-color: #111;
          color: #fff;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          position: fixed;
          height: 100%;
          transition: transform 0.3s ease;
          z-index: 1000;
        }

        .sidebar.open {
          transform: translateX(0);
        }

        .userInfo {
          border-bottom: 1px solid #333;
          padding-bottom: 0.5rem;
          padding-right: 2rem;
        }

        .userInfo h2 {
          font-size: 1.2rem;
          margin: 0;
        }

        .userRole {
          font-size: 0.8rem;
          color: #999;
        }

        .navLinks {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .navLinks button {
          background-color: #000;
          color: #fff;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 0.5rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }

        .navLinks button:hover {
          background-color: #b30000;
          border-color: #b30000;
        }

        .logoutButton {
          background-color: #b30000;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 0.5rem;
          font-size: 0.9rem;
          cursor: pointer;
          margin-top: auto;
        }

        .logoutButton:hover {
          background-color: #800000;
        }

        .mainContent {
          flex: 1;
          padding: 1rem;
          margin-left: 240px;
        }

        .header {
          background-color: #b30000;
          color: #fff;
          height: 50px;
          display: flex;
          align-items: center;
          font-size: 1.2rem;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 1rem;
        }

        .calendar-section {
          border: 1px solid #ccc;
          padding: 1rem;
          border-radius: 8px;
          max-width: 100%;
          box-sizing: border-box;
        }

        .monat {
          text-align: center;
          font-size: 1.2rem;
          color: #333;
          margin-bottom: 1rem;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
        }

        .monat-button {
          background: none;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          color: #333;
        }

        .monat-button:hover {
          color: #b30000;
        }

        .kalender-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          font-weight: 600;
          color: #555;
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .wochentag {
          font-size: 0.8rem;
        }

        .kalender-tage {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.3rem;
        }

        .tag {
          background-color: #f1f1f1;
          border-radius: 0.3rem;
          min-height: 50px;
          text-align: right;
          padding: 0.3rem;
          font-size: 0.8rem;
          color: #333;
          box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.05);
          touch-action: manipulation;
        }

        .tag:hover {
          background-color: #e0f7fa;
          cursor: pointer;
        }

        .reservierungs-section {
          background-color: #f0f0f0;
          border: 1px solid #ccc;
          padding: 1rem;
          border-radius: 8px;
          max-width: 50%;
          margin: 1rem auto;
        }

        .reservierungs-section h3 {
          font-size: 1.2rem;
          margin-bottom: 1rem;
          text-align: center;
        }

        .form-field {
          margin-bottom: 0.8rem;
        }

        .form-field label {
          display: block;
          margin-bottom: 0.3rem;
          font-weight: bold;
          font-size: 0.9rem;
        }

        .form-field input,
        .form-field select {
          padding: 0.5rem;
          width: 100%;
          border-radius: 5px;
          border: 1px solid #ccc;
          font-size: 0.9rem;
        }

        .form-field input[disabled] {
          background-color: #e0e0e0;
        }

        button[type="button"] {
          padding: 0.5rem 1rem;
          background-color: #b30000;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          border-radius: 5px;
          width: 100%;
          margin-top: 0.5rem;
        }

        button[type="button"]:hover {
          background-color: #800000;
        }

        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background-color: #636363;
          padding: 1rem;
          border-radius: 8px;
          width: 90%;
          max-width: 350px;
          max-height: 80vh;
          overflow-y: auto;
          color: #fff;
          position: relative;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #e53e3e;
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
        }

        .modal-reservations {
          margin-top: 1rem;
        }

        .reservation-item {
          background-color: #f7fafc;
          padding: 0.8rem;
          border-radius: 5px;
          margin-bottom: 0.5rem;
          border: 1px solid #ccc;
          color: #000;
        }

        .reservation-item p {
          margin: 0.3rem 0;
          font-size: 0.85rem;
        }

        .delete-button {
          background-color: #e53e3e;
          color: #fff;
          border: none;
          padding: 0.3rem 0.6rem;
          border-radius: 5px;
          cursor: pointer;
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }

        .delete-button:hover {
          background-color: #b32d2d;
        }

        @media (max-width: 768px) {
          .hamburger {
            display: block;
            right: 10px;
          }

          .sidebar {
            transform: translateX(-100%);
            width: 200px;
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .mainContent {
            margin-left: 0;
            padding: 0.5rem;
          }

          .header {
            font-size: 1rem;
            height: 40px;
          }

          .calendar-section {
            padding: 0.5rem;
          }

          .monat {
            font-size: 1rem;
          }

          .kalender-header {
            font-size: 0.7rem;
          }

          .tag {
            min-height: 40px;
            font-size: 0.7rem;
            padding: 0.2rem;
          }

          .tag span {
            font-size: 0.8rem;
          }

          .reservierungs-section {
            padding: 0.5rem;
          }

          .form-field label {
            font-size: 0.8rem;
          }

          .form-field input,
          .form-field select {
            padding: 0.4rem;
            font-size: 0.8rem;
          }

          button[type="button"] {
            padding: 0.4rem;
            font-size: 0.8rem;
          }

          .modal-content {
            width: 95%;
            padding: 0.8rem;
          }

          .modal-reservations {
            font-size: 0.8rem;
          }
        }

        @media (max-width: 480px) {
          .kalender-tage {
            gap: 0.2rem;
          }

          .tag {
            min-height: 35px;
            font-size: 0.65rem;
          }

          .modal-content {
            max-height: 70vh;
          }

          .reservation-item {
            padding: 0.5rem;
          }

          .reservation-item p {
            font-size: 0.75rem;
          }

          .header {
            font-size: 0.9rem;
          }
        }

        .error-modal,
        .delete-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .error-modal-content,
        .delete-modal-content {
          background: white;
          padding: 20px;
          border-radius: 8px;
          max-width: 400px;
          width: 90%;
          position: relative;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          text-align: center;
        }

        .error-modal-content h3,
        .delete-modal-content h3 {
          margin: 0 0 15px;
          font-size: 1.5rem;
          color: #333;
        }

        .error-modal-content p,
        .delete-modal-content p {
          margin: 0 0 20px;
          font-size: 1rem;
          color: #555;
        }

        .modal-close {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #333;
        }

        .modal-ok-button {
          background-color: #d32f2f;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .modal-ok-button:hover {
          background-color: #b71c1c;
        }

        .modal-buttons {
          display: flex;
          justify-content: center;
          gap: 10px;
        }

        .modal-confirm-button {
          background-color: #d32f2f;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .modal-confirm-button:hover {
          background-color: #b71c1c;
        }

        .modal-cancel-button {
          background-color: #757575;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .modal-cancel-button:hover {
          background-color: #616161;
        }
      `}</style>
    </div>
  );
};

export default Calendar;