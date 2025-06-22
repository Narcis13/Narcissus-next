// This page is where the user lands after a successful login.
// In a real app, you would likely fetch user-specific data here.

export default function DashboardPage() {
    return (
        <main style={{ padding: '50px', textAlign: 'center' }}>
            <h1>Authentication Successful!</h1>
            <p>Welcome to your dashboard.</p>
            <p>Your Google tokens have been securely stored.</p>
        </main>
    );
}