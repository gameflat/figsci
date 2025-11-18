import './globals.css';

export const metadata = {
  title: 'Figsci - AI-Powered Diagram Generator',
  description: 'Generate beautiful diagrams using AI and Excalidraw',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
