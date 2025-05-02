'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await axios.get(`/api/orders?id=${id}`)
        setOrder(res.data)
      } catch (err) {
        console.error(err)
        toast.error('Error loading order')
      }
    }
    fetchOrder()
  }, [id])

  const handleStatusChange = async (newStatus) => {
    setLoading(true)
    try {
      const res = await axios.put('/api/orders', { id, status: newStatus })
      setOrder(res.data)
      toast.success('Order status updated')
    } catch (err) {
      console.error(err)
      toast.error('Error updating order')
    }
    setLoading(false)
  }

  if (!order) return <p className="text-gray-800">Loading...</p>

  // Ensure items is always an array
  const itemsList = Array.isArray(order.items) ? order.items : [order.items]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Order Details</h1>
      <div className="bg-gray-200 p-4 rounded-2xl border border-gray-300 shadow text-gray-900">
        <p><strong>Order ID:</strong> {order._id}</p>
        <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
        <p><strong>Total:</strong> ${order.totalAmount.toFixed(2)}</p>
        <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
        <p><strong>Order Status:</strong> {order.status}</p>
        <p><strong>Stripe Session ID:</strong> {order.stripeSessionId}</p>
      </div>

      <div className="bg-gray-200 p-4 rounded-2xl border border-gray-300 shadow text-gray-900">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Items</h2>
        <ul className="space-y-2">
          {itemsList.map((item, idx) => (
            <li key={idx} className="border-t border-gray-700 pt-2">
              <p className="text-gray-800">{item.title} × {item.quantity}</p>
              <p className="text-sm text-gray-600">Unit Price: ${item.unitPrice.toFixed(2)}</p>
              <p className="text-sm text-gray-600">
                {item.size && `Size: ${item.size}`}
                {item.frame && `, Frame: ${item.frame}`}
                {item.format && `, Format: ${item.format}`}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {order.status !== 'fulfilled' && (
        <button
          onClick={() => handleStatusChange('fulfilled')}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {loading ? 'Updating...' : 'Mark as Fulfilled'}
        </button>
      )}
      {/* Cancel Order Button */}
      {order.status !== 'cancelled' && (
        <button
          onClick={() => handleStatusChange('cancelled')}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ml-2"
        >
          {loading ? 'Updating...' : 'Cancel Order'}
        </button>
      )}
    </div>
  )
} 