import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      redirect: false,
      username: credentials.username,
      password: credentials.password,
    });
    
    if (res.error) {
      setError("Benutzername oder Passwort sind nicht korrekt");
    } else {
      router.push("/dashboard");
    }
  };

  const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

  return (
    <div className="loginContainer">
      <div className="loginBox">
        <img src="/bilder/SVM_Banner.jpg" alt="Logo" className="loginLogo" />
        <h1>Login</h1>
        <form onSubmit={handleLogin}>
          <input
            name="username"
            placeholder="Benutzername"
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Passwort"
            onChange={handleChange}
            required
          />
          <button type="submit">Einloggen</button>
        </form>
        {error && <p className="errorMessage">{error}</p>}
      </div>

      <style jsx>{`
        .loginContainer {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f4f4f4;
          font-family: 'Arial', sans-serif;
          padding: 0 1rem;
        }

        .loginBox {
          background-color: #fff;
          padding: 2rem;
          border-radius: 10px;
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 400px;
          text-align: center;
        }

        .loginLogo {
          width: 100%;
          max-width: 250px;
          height: auto;
          margin-bottom: 1.5rem;
        }

        .loginBox h1 {
          margin-bottom: 1.5rem;
          font-size: 1.8rem;
          color: #2c3e50;
        }

        .loginBox input {
          width: 100%;
          padding: 0.8rem;
          margin: 0.6rem 0;
          border-radius: 8px;
          border: 1px solid #ddd;
          font-size: 1rem;
          box-sizing: border-box;
        }

        .loginBox button {
          width: 100%;
          padding: 0.9rem;
          background-color: rgb(27, 129, 57);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .loginBox button:hover {
          background-color: rgb(61, 61, 61);
        }

        .errorMessage {
          color: red;
          font-size: 0.9rem;
          margin-top: 0.8rem;
        }

        @media (max-width: 768px) {
          .loginContainer {
            padding: 0 0.5rem;
          }

          .loginBox {
            padding: 1.5rem;
            max-width: 90vw;
          }

          .loginLogo {
            max-width: 200px;
            margin-bottom: 1rem;
          }

          .loginBox h1 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
          }

          .loginBox input {
            padding: 0.7rem;
            font-size: 0.95rem;
            margin: 0.5rem 0;
          }

          .loginBox button {
            padding: 0.8rem;
            font-size: 1rem;
          }

          .errorMessage {
            font-size: 0.85rem;
            margin-top: 0.6rem;
          }
        }

        @media (max-width: 480px) {
          .loginBox {
            padding: 1rem;
          }

          .loginLogo {
            max-width: 150px;
          }

          .loginBox h1 {
            font-size: 1.3rem;
          }

          .loginBox input {
            padding: 0.6rem;
            font-size: 0.9rem;
          }

          .loginBox button {
            padding: 0.7rem;
            font-size: 0.95rem;
          }

          .errorMessage {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}