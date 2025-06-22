import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Google OAuth Demo with Next.js</h1>
      <p>Click the button below to connect your Google Account.</p>
      <Link 
        href="/api/auth/google" 
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          backgroundColor: '#4285F4',
          color: 'white',
          borderRadius: '4px',
          textDecoration: 'none',
          fontWeight: 'bold',
          marginTop: '20px'
        }}
      >
        Connect with Google
      </Link>
    </main>
  );
}