import DashboardGuard from '@/components/auth/DashboardGuard'
import Sidebar from './Sidebar'
import Header from './Header'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardGuard>
      <div className="flex h-screen overflow-hidden bg-[#f1f5f9]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative [transform:translateZ(0)]">
          <div className="absolute inset-0 z-[-1] pointer-events-none opacity-50">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-slate-200/30 rounded-full blur-[120px]" />
          </div>
          <Header />
          <main id="main-content" className="flex-1 overflow-y-auto p-6 md:p-8 relative z-0 custom-scrollbar">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DashboardGuard>
  )
}
