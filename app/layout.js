export const metadata = {
  title: 'SIF NAV & Journey Returns Tracker',
  description: 'Track latest SIF rates and journey returns',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f8fafc', color: '#0f172a' }}>
        {children}
      </body>
    </html>
  );
}