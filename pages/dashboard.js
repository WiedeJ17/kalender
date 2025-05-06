import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Frühe Weiterleitung, wenn nicht angemeldet
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Zeige nichts, während der Status geladen wird oder wenn nicht angemeldet
  if (status === "loading" || status === "unauthenticated") {
    return null;
  }

  // Ab hier ist der Benutzer sicher angemeldet
  const handleLogout = () => {
    signOut().then(() => {
      router.push("/login");
    });
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="dashboardWrapper">
      <div className="sidebar">
        <div className="userInfo">
          <h2>{session.user.username}</h2>
          <p className="userRole">Rolle: {session.user.role}</p>
        </div>

        <button className="burgerButton" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navLinks ${isMenuOpen ? "open" : ""}`}>
          <button onClick={() => router.push("/calendar")}>Kalender</button>
          
          {session.user.role === "admin" && (
            <>
              <button onClick={() => router.push("/analytics")}>Analytics</button>
              <button onClick={() => router.push("/register")}>Benutzerverwaltung</button>
            </>
          )}

          <button className="logoutButton" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="mainContent">
        <header className="header">
          <h1>Herzlich Willkommen im Reservierungstool</h1>
        </header>

        <div className="content">
          <h2>Willkommen, {session.user.username}!</h2>
          <p>Hier ist dein Dashboard. Wähle eine Option aus der Navigation.</p>
        </div>
      </div>

      <style jsx>{`
        .dashboardWrapper {
          display: flex;
          min-height: 100vh;
          background-color: rgb(145, 145, 145);
          font-family: 'Arial', sans-serif;
        }

        .sidebar {
          width: 240px;
          background-color: #111;
          color: #fff;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 2rem;
        }

        .userInfo {
          border-bottom: 1px solid #333;
          padding-bottom: 1rem;
        }

        .userInfo h2 {
          font-size: 1.5rem;
          margin: 0;
        }

        .userRole {
          font-size: 0.95rem;
          color: #999;
        }

        .burgerButton {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 30px;
          height: 20px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .burgerButton span {
          width: 100%;
          height: 3px;
          background-color: #fff;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .navLinks {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .navLinks button {
          background-color: #000;
          color: #fff;
          border: 1px solid #333;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          width: 100%;
          text-align: left;
        }

        .navLinks button:hover {
          background-color: #b30000;
          border-color: #b30000;
        }

        .logoutButton {
          background-color:rgb(253, 0, 0);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          cursor: pointer;
          transition: box-shadow 0.3s ease;
          width: 100%;
        }

        .logoutButton:hover {
          box-shadow: 0 2px 8px rgba(179, 0, 0, 0.5);
        }

        .mainContent {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .header {
          background-color: #b30000;
          color: #fff;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: clamp(1.4rem, 4vw, 1.8rem);
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .content {
          padding: 2rem;
          color: #111;
          flex-grow: 1;
          background-color: #f9f9f9;
        }

        .content h2 {
          font-size: 2rem;
          color: #111;
          margin-bottom: 1rem;
        }

        .content p {
          font-size: 1rem;
          color: #333;
        }

        @media (max-width: 768px) {
          .dashboardWrapper {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            padding: 1rem;
            flex-direction: row;
            align-items: center;
            gap: 1rem;
            position: relative;
          }

          .userInfo {
            flex: 0 0 auto;
            border-bottom: none;
            padding-bottom: 0;
            margin-right: 1rem;
          }

          .userInfo h2 {
            font-size: 1.3rem;
          }

          .userRole {
            font-size: 0.85rem;
          }

          .burgerButton {
            display: flex;
          }

          .navLinks {
            display: ${isMenuOpen ? "flex" : "none"};
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background-color: #111;
            padding: 1rem;
            z-index: 1000;
            animation: slideIn 0.3s ease-in-out;
          }

          .navLinks.open {
            display: flex;
          }

          .navLinks button {
            padding: 0.6rem 0.8rem;
            font-size: 0.95rem;
          }

          .logoutButton {
            background-color: #b30000;
            padding: 0.6rem 0.8rem;
            font-size: 0.95rem;
          }

          .logoutButton:hover {
            box-shadow: 0 2px 8px rgba(179, 0, 0, 0.5);
          }

          .mainContent {
            margin-left: 0;
          }

          .header {
            font-size: clamp(1.2rem, 3.5vw, 1.4rem);
            height: 60px;
            padding: 1rem;
          }

          .content {
            padding: 1.5rem;
          }

          .content h2 {
            font-size: 1.5rem;
          }

          .content p {
            font-size: 0.95rem;
          }

          @keyframes slideIn {
            from {
              transform: translateY(-10px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        }

        @media (max-width: 480px) {
          .sidebar {
            padding: 0.75rem;
            gap: 0.5rem;
          }

          .userInfo h2 {
            font-size: 1.1rem;
          }

          .userRole {
            font-size: 0.8rem;
          }

          .navLinks {
            padding: 0.75rem;
          }

          .navLinks button {
            padding: 0.5rem 0.6rem;
            font-size: 0.9rem;
          }

          .logoutButton {
            background-color: #b30000;
            padding: 0.5rem 0.6rem;
            font-size: 0.9rem;
          }

          .logoutButton:hover {
            box-shadow: 0 2px 8px rgba(179, 0, 0, 0.5);
          }

          .header {
            font-size: clamp(1rem, 3vw, 1.2rem);
            height: 50px;
            padding: 0.75rem;
          }

          .content {
            padding: 1rem;
          }

          .content h2 {
            font-size: 1.3rem;
            margin-bottom: 0.75rem;
          }

          .content p {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}