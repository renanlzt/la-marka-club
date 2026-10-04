import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-lamarka-50 flex flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}
