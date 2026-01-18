'use client';
import AdminLayout from '@/admin/components/AdminMenu'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PlayerForm from '../components/PlayerForm';

export default function NewPlayerPage() {
  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー部分 */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/players" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">チームメイト新規登録</h1>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border">
          <PlayerForm />
        </div>
      </div>
    </AdminLayout>
  )
}