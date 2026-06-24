export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8">You do not have permission to access this page.</p>
        <a
          href="/login"
          className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Back to Login
        </a>
      </div>
    </div>
  )
}
