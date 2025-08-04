import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function RegisterPage() {
  const [passwordInput, setPasswordInput] = useState(""); // Passwort für den Zugriff
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentifizierungsstatus
  const [formData, setFormData] = useState({ username: "", password: "", role: "standard" });
  const [message, setMessage] = useState(""); // Erfolgs- oder Fehlermeldung
  const [error, setError] = useState(""); // Fehlernachricht
  const router = useRouter(); // Router für Weiterleitung

  // Passwortänderung
  const handlePasswordChange = (e) => setPasswordInput(e.target.value);

  // Überprüfe das Passwort
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_REGISTRATION_PASSWORD;

    if (passwordInput === correctPassword) {
      setIsAuthenticated(true); // Authentifizierung erfolgreich
      setError("");
    } else {
      setError("Falsches Passwort. Bitte versuche es erneut.");
    }
  };

  // Formularänderung für die Registrierung
  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Registrierung abschicken
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    setMessage(data.message);
  };

  // Wenn der Benutzer authentifiziert ist, zeige das Registrierungsformular an
  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.formContainer}>
          <h1 style={styles.title}>Passwort erforderlich</h1>
          <form onSubmit={handlePasswordSubmit} style={styles.form}>
            <input
              type="password"
              value={passwordInput}
              onChange={handlePasswordChange}
              placeholder="Bitte Passwort eingeben"
              style={styles.input}
            />
            <button type="submit" style={styles.submitButton}>Einloggen</button>
          </form>
          {error && <p style={styles.error}>{error}</p>}
        </div>
      </div>
    );
  }

  // Wenn der Benutzer authentifiziert ist, zeige das Registrierungsformular an
  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <h1 style={styles.title}>Registrieren</h1>
        <form onSubmit={handleFormSubmit} style={styles.form}>
          <input
            name="username"
            onChange={handleFormChange}
            placeholder="Benutzername"
            required
            style={styles.input}
          />
          <input
            type="password"
            name="password"
            onChange={handleFormChange}
            placeholder="Passwort"
            required
            style={styles.input}
          />
          <select name="role" onChange={handleFormChange} required style={styles.select}>
            <option value="standard">Standard</option>
            <option value="vorstand">Vorstand</option>
            <option value="admin">Admin</option>
            <option value="observer">Beobachter</option>
          </select>
          <button type="submit" style={styles.submitButton}>Registrieren</button>
        </form>
        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  );
}

// Inline CSS
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f4f7fc',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    textAlign: 'center',
    fontSize: '24px',
    marginBottom: '20px',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    padding: '12px',
    margin: '10px 0',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
  },
  select: {
    padding: '12px',
    margin: '10px 0',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
  },
  submitButton: {
    padding: '12px',
    backgroundColor: '#4caf50',
    color: '#fff',
    fontSize: '16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  error: {
    color: 'red',
    fontSize: '14px',
    textAlign: 'center',
  },
  message: {
    color: 'green',
    fontSize: '16px',
    textAlign: 'center',
  },
};