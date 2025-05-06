import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Hilfsfunktion zur Berechnung der Nutzungsdauer
function calculateDuration(startTime, endTime, date) {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) throw new Error("Ungültiges Datum");

    const startDate = new Date(`${dateObj.toISOString().split("T")[0]}T${startTime}:00`);
    const endDate = new Date(`${dateObj.toISOString().split("T")[0]}T${endTime}:00`);

    const diffMs = endDate - startDate;
    if (diffMs < 0) return "Ungültige Zeit";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  } catch (error) {
    console.error("Fehler bei der Dauerberechnung:", error);
    return "—";
  }
}

// Hilfsfunktion zur Berechnung der Nutzungsdauer in Stunden (für Statistiken)
function getDurationInHours(startTime, endTime, date) {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 0;

    const startDate = new Date(`${dateObj.toISOString().split("T")[0]}T${startTime}:00`);
    const endDate = new Date(`${dateObj.toISOString().split("T")[0]}T${endTime}:00`);

    const diffMs = endDate - startDate;
    return diffMs >= 0 ? diffMs / (1000 * 60 * 60) : 0;
  } catch (error) {
    return 0;
  }
}

// Hilfsfunktion zum Gruppieren der Daten nach Monaten
function groupByMonth(reservations) {
  const grouped = {};
  reservations.forEach((eintrag) => {
    const date = new Date(eintrag.date);
    const monthYear = date.toLocaleString("de-DE", { month: "long", year: "numeric" });
    if (!grouped[monthYear]) {
      grouped[monthYear] = [];
    }
    grouped[monthYear].push(eintrag);
  });
  return grouped;
}

// Hilfsfunktion für PDF-Export
function exportToPDF(monthYear, reservations) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Reservierungen für ${monthYear}`, 14, 20);

  autoTable(doc, {
    startY: 30,
    head: [["Ressource", "Benutzer", "Zeitraum", "Verwendungsdauer"]],
    body: reservations.map((eintrag) => [
      eintrag.resource || "—",
      eintrag.username || "—",
      `${new Date(eintrag.date).toLocaleDateString("de-DE")} ${eintrag.startTime} - ${eintrag.endTime}`,
      calculateDuration(eintrag.startTime, eintrag.endTime, eintrag.date),
    ]),
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [25, 118, 210], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`Reservierungen_${monthYear}.pdf`);
}

// Statistiken berechnen
function calculateStatistics(reservations) {
  const resourceCounts = {};
  const userCounts = {};
  const resourceDurations = {};

  reservations.forEach((eintrag) => {
    // Ressourcen-Häufigkeit
    resourceCounts[eintrag.resource] = (resourceCounts[eintrag.resource] || 0) + 1;

    // Benutzer-Häufigkeit
    userCounts[eintrag.username] = (userCounts[eintrag.username] || 0) + 1;

    // Nutzungsdauer pro Ressource
    const duration = getDurationInHours(eintrag.startTime, eintrag.endTime, eintrag.date);
    resourceDurations[eintrag.resource] =
      (resourceDurations[eintrag.resource] || 0) + duration;
  });

  return { resourceCounts, userCounts, resourceDurations };
}

export default function Analytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [daten, setDaten] = useState([]);

  useEffect(() => {
    if (status === "authenticated" && session?.user.role === "admin") {
      fetch("/api/analytics")
        .then((res) => {
          if (!res.ok) throw new Error("Fehler beim Abrufen der Daten");
          return res.json();
        })
        .then(setDaten)
        .catch((err) => console.error("Fehler beim Abrufen:", err));
    }
  }, [status, session]);

  if (status === "loading") return <p className="loading">Wird geladen...</p>;
  if (!session) {
    router.push("/login");
    return null;
  }

  if (session.user.role !== "admin") {
    return <p className="error">Zugriff verweigert</p>;
  }

  // Gruppiere Daten nach Monaten
  const groupedReservations = groupByMonth(daten);
  const stats = calculateStatistics(daten);

  return (
    <div className="dashboard">
      <h1>Dashboard – Reservierungsanalyse</h1>

      {/* Statistik-Sektion */}
      {daten.length > 0 && (
        <div className="statsSection">
          <h2>Statistiken</h2>
          <div className="statsGrid">
            {/* Ressourcen-Häufigkeit */}
            <div className="statCard">
              <h3>Ressourcen-Buchungen</h3>
              <table className="statsTable">
                <thead>
                  <tr>
                    <th>Ressource</th>
                    <th>Anzahl Buchungen</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.resourceCounts).map(([resource, count]) => (
                    <tr key={resource}>
                      <td>{resource}</td>
                      <td>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top-Benutzer */}
            <div className="statCard">
              <h3>Top-Benutzer</h3>
              <table className="statsTable">
                <thead>
                  <tr>
                    <th>Benutzer</th>
                    <th>Anzahl Buchungen</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.userCounts).map(([user, count]) => (
                    <tr key={user}>
                      <td>{user}</td>
                      <td>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Nutzungsdauer pro Ressource */}
            <div className="statCard">
              <h3>Gesamtnutzungsdauer</h3>
              <table className="statsTable">
                <thead>
                  <tr>
                    <th>Ressource</th>
                    <th>Dauer (Stunden)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.resourceDurations).map(([resource, duration]) => (
                    <tr key={resource}>
                      <td>{resource}</td>
                      <td>{duration.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Alle Termine */}
      {daten.length > 0 && (
        <div className="monthSection">
          <h2>Alle Termine</h2>
          <table className="reservationsTable">
            <thead>
              <tr>
                <th>Ressource</th>
                <th>Benutzer</th>
                <th>Zeitraum</th>
                <th>Verwendungsdauer</th>
              </tr>
            </thead>
            <tbody>
              {daten
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((eintrag) => (
                  <tr key={eintrag._id}>
                    <td>{eintrag.resource || "—"}</td>
                    <td>{eintrag.username || "—"}</td>
                    <td>
                      {new Date(eintrag.date).toLocaleDateString("de-DE")}{" "}
                      {eintrag.startTime} - {eintrag.endTime}
                    </td>
                    <td>
                      {calculateDuration(eintrag.startTime, eintrag.endTime, eintrag.date)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Monatliche Reservierungen */}
      {daten.length === 0 ? (
        <p className="noData">Keine Daten gefunden.</p>
      ) : (
        <div className="monthSections">
          {Object.keys(groupedReservations)
            .sort((a, b) => new Date(b) - new Date(a))
            .map((monthYear) => (
              <div key={monthYear} className="monthSection">
                <div className="monthHeader">
                  <h2>{monthYear}</h2>
                  <button
                    className="exportButton"
                    onClick={() => exportToPDF(monthYear, groupedReservations[monthYear])}
                  >
                    PDF Export
                  </button>
                </div>
                <table className="reservationsTable">
                  <thead>
                    <tr>
                      <th>Ressource</th>
                      <th>Benutzer</th>
                      <th>Zeitraum</th>
                      <th>Verwendungsdauer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedReservations[monthYear].map((eintrag) => (
                      <tr key={eintrag._id}>
                        <td>{eintrag.resource || "—"}</td>
                        <td>{eintrag.username || "—"}</td>
                        <td>
                          {new Date(eintrag.date).toLocaleDateString("de-DE")}{" "}
                          {eintrag.startTime} - {eintrag.endTime}
                        </td>
                        <td>
                          {calculateDuration(
                            eintrag.startTime,
                            eintrag.endTime,
                            eintrag.date
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
        </div>
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');

        .dashboard {
          max-width: 1400px;
          margin: 0 auto;
          padding: 30px;
          font-family: 'Roboto', sans-serif;
          background: #f4f6f8;
          min-height: 100vh;
          color: #111111; 
        }

        .dashboard h1 {
          font-size: 2.8rem;
          font-weight: 700;
          color: #1976d2;
          text-align: center;
          margin-bottom: 40px;
        }

        .loading,
        .error,
        .noData {
          font-size: 1.3rem;
          text-align: center;
          color: #555;
          margin-top: 30px;
          font-weight: 500;
        }

        .error {
          color: #d32f2f;
        }

        .noData {
          color: #757575;
        }

        .statsSection {
          margin-bottom: 40px;
        }

        .statsSection h2 {
          font-size: 2rem;
          font-weight: 500;
          color: #333;
          margin-bottom: 20px;
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .statCard {
          background: #ffffff;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }

        .statCard:hover {
          transform: translateY(-5px);
        }

        .statCard h3 {
          font-size: 1.5rem;
          font-weight: 500;
          color: #1976d2;
          margin-bottom: 15px;
        }

        .statsTable {
          width: 100%;
          border-collapse: collapse;
        }

        .statsTable th,
        .statsTable td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
          font-size: 0.95rem;
        }

        .statsTable th {
          background: #f5f5f5;
          font-weight: 500;
          color: #333;
        }

        .monthSections {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .monthSection {
          background: #ffffff;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }

        .monthSection:hover {
          transform: translateY(-5px);
        }

        .monthHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .monthHeader h2 {
          font-size: 1.8rem;
          font-weight: 500;
          color: #333;
        }

        .exportButton {
          padding: 10px 20px;
          background: #1976d2;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.3s, transform 0.2s;
        }

        .exportButton:hover {
          background: #1565c0;
          transform: scale(1.05);
        }

        .exportButton:active {
          transform: scale(0.95);
        }

        .reservationsTable {
          width: 100%;
          border-collapse: collapse;
          background: #ffffff;
        }

        .reservationsTable th,
        .reservationsTable td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
          font-size: 0.95rem;
        }

        .reservationsTable th {
          background: #1976d2;
          color: #ffffff;
          font-weight: 500;
        }

        .reservationsTable tr:hover {
          background: #f5f5f5;
        }

        @media (max-width: 768px) {
          .dashboard {
            padding: 15px;
          }

          .dashboard h1 {
            font-size: 2rem;
          }

          .statsGrid {
            grid-template-columns: 1fr;
          }

          .monthSection {
            padding: 15px;
          }

          .monthHeader h2 {
            font-size: 1.5rem;
          }

          .reservationsTable {
            display: block;
            overflow-x: auto;
            white-space: nowrap;
          }

          .reservationsTable th,
          .reservationsTable td {
            padding: 8px;
            font-size: 0.9rem;
            min-width: 100px;
          }

          .exportButton {
            padding: 8px 16px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}