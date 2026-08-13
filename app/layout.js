import "./globals.css";

export const metadata = {
  title: "What's Live: sport & events, right now",
  description: "A single feed of what sport and events are on today, tonight, and this week.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
