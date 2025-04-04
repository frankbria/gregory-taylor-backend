'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'

export default function ManagePricesPage() {
  const [prices, setPrices] = useState([])
  const [sizes, setSizes] = useState([])
  const [form, setForm] = useState({ sizeId: '', price: '', label: '' })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      const [sizesRes, pricesRes] = await Promise.all([
        axios.get('/api/sizes'),
        axios.get('/api/prices'),
      ])
      setSizes(sizesRes.data)
      setPrices(pricesRes.data)
    }

    fetchData()
  }, [])

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (!form.sizeId || !form.price) {
      toast.error('Size and price are required.')
      return
    }

    try {
      if (editingId) {
        await toast.promise(
          axios.put(`/api/prices/${editingId}`, form),
          { loading: 'Saving...', success: 'Price updated!', error: 'Update failed.' }
        )
      } else {
        await toast.promise(
          axios.post('/api/prices', form),
          { loading: 'Creating...', success: 'Price added!', error: 'Create failed.' }
        )
      }

      const res = await axios.get('/api/prices')
      setPrices(res.data)
      setForm({ sizeId: '', price: '', label: '' })
      setEditingId(null)
    } catch (err) {
      console.error(err)
      toast.error('Unexpected error')
    }
  }

  const handleEdit = price => {
    setForm({
      sizeId: price.sizeId._id,
      price: price.price,
      label: price.label || '',
    })
    setEditingId(price._id)
  }

  const handleDelete = async id => {
    if (!confirm('Delete this price?')) return
    await toast.promise(
      axios.delete(`/api/prices/${id}`),
      { loading: 'Deleting...', success: 'Price deleted!', error: 'Delete failed.' }
    )
    setPrices(prev => prev.filter(p => p._id !== id))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800">Manage Prices</h1>

      <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow">
        <select
          name="sizeId"
          value={form.sizeId}
          onChange={handleChange}
          className="w-full p-2 border border-gray-400 rounded text-gray-800"
        >
          <option value="">Select a size</option>
          {sizes.map(size => (
            <option key={size._id} value={size._id}>
              {size.name} — {size.width}×{size.height} {size.unit}
            </option>
          ))}
        </select>

        <input
          name="price"
          type="number"
          placeholder="Price in USD"
          value={form.price}
          onChange={handleChange}
          className="w-full p-2 border border-gray-400 rounded text-gray-800"
        />

        <input
          name="label"
          type="text"
          placeholder="Optional label (e.g., Holiday Sale)"
          value={form.label}
          onChange={handleChange}
          className="w-full p-2 border border-gray-400 rounded text-gray-800"
        />

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {editingId ? 'Update Price' : 'Add Price'}
        </button>
      </form>

      <ul className="bg-white divide-y divide-gray-200 rounded shadow-sm">
        {prices.map(price => (
          <li key={price._id} className="flex justify-between items-center px-4 py-3 hover:bg-gray-50 transition">
            <div className="flex flex-col">
              <span className="text-gray-800 font-medium">
                {price.sizeId?.name} — {price.sizeId?.width}×{price.sizeId?.height} {price.sizeId?.unit}
              </span>
              <span className="text-gray-700">
                ${Number(price.price).toFixed(2)} {price.label ? `– ${price.label}` : ''}
              </span>
            </div>
            <div className="space-x-2">
              <button onClick={() => handleEdit(price)} className="text-blue-600 hover:underline">Edit</button>
              <button onClick={() => handleDelete(price._id)} className="text-red-600 hover:underline">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
