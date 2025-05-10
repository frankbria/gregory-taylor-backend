// backend/app/admin/orders/page.js

'use client'

import { useState, useEffect } from 'react'
import apiClient from '@/lib/apiClient'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export default function ManageOrdersPage() {
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('pending')
  useEffect(() => {
    async function fetchOrders() {
      try {
        console.log('Admin API Key available:', !!process.env.NEXT_PUBLIC_ADMIN_API_KEY)
        const res = await apiClient.get('/api/orders')
        setOrders(res.data)
      } catch (err) {
        console.error('Error fetching orders:', err.response?.data || err.message)
        toast.error('Error loading orders')
      }
    }
    fetchOrders()
  }, [])

  // Filter orders by tab
  const filteredOrders = orders.filter(o => {
    if (activeTab === 'pending') return o.status === 'created'
    if (activeTab === 'complete') return ['paid','fulfilled'].includes(o.status)
    if (activeTab === 'cancelled') return o.status === 'cancelled'
    return false
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Manage Orders</h1>
      {/* Tabs */}
      <div className="flex space-x-4 border-b mb-4">
        <button onClick={() => setActiveTab('pending')} className={`px-3 py-1 ${activeTab==='pending'?'border-b-2 border-blue-600 text-blue-600':'text-gray-600'}`}>Pending</button>
        <button onClick={() => setActiveTab('complete')} className={`px-3 py-1 ${activeTab==='complete'?'border-b-2 border-blue-600 text-blue-600':'text-gray-600'}`}>Complete</button>
        <button onClick={() => setActiveTab('cancelled')} className={`px-3 py-1 ${activeTab==='cancelled'?'border-b-2 border-blue-600 text-blue-600':'text-gray-600'}`}>Cancelled</button>
      </div>

      {filteredOrders.length === 0 ? (
        <p className="text-gray-800">No {activeTab} orders.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-2 text-left text-white">Order ID</th>
                <th className="px-4 py-2 text-left text-white">Date</th>
                <th className="px-4 py-2 text-left text-white">Total</th>
                <th className="px-4 py-2 text-left text-white">Payment Status</th>
                <th className="px-4 py-2 text-left text-white">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order._id} className="border-t">
                  <td className="px-4 py-2">
                    <Link href={`/admin/orders/${order._id}`} className="text-blue-600 hover:underline">
                      {order._id}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-800">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-gray-800">${order.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-2 text-gray-800">{order.paymentStatus}</td>
                  <td className="px-4 py-2 text-gray-800">{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 