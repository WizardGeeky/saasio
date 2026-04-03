"use client"

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <h2 className="text-2xl font-bold text-slate-900">Welcome to your Premium Dashboard</h2>
        <p className="leading-relaxed text-slate-500">
          This is a responsive, high-end dashboard layout designed with a fresh green and white aesthetic. 
          The sidebar automatically collapses on smaller screens and provides smooth transitions. You can start populating your data here.
        </p>
      </div>
    </div>
  )
}
