"use client"

export default function DashboardPage() {
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ padding: "24px", background: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a" }}>Welcome to your Premium Dashboard</h2>
        <p style={{ color: "#64748b", lineHeight: "1.6" }}>
          This is a responsive, high-end dashboard layout designed with a fresh green and white aesthetic. 
          The sidebar automatically collapses on smaller screens and provides smooth transitions. You can start populating your data here.
        </p>
      </div>
    </div>
  )
}
