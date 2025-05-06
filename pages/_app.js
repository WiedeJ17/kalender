import { SessionProvider } from "next-auth/react"; // Importiere SessionProvider
import "../styles/globals.css"; // Deine globalen Styles, falls vorhanden

function MyApp({ Component, pageProps }) {
  return (
    <SessionProvider session={pageProps.session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
