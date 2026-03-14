import DashboardGuard from '@/components/auth/DashboardGuard'
import Sidebar from './Sidebar'
import Header from './Header'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardGuard>
      <div className="flex h-screen overflow-hidden bg-surface-100">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-5 animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </DashboardGuard>
  )
}
