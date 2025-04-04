'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'

export default function ManageSizesPage() {
  const [sizes, setSizes] = useState([])
  const [form, setForm] = useState({ name: '', width: '', height: '', price: '' })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    const fetchSizes = async () => {
      const res = await axios.get('/api/sizes')
      setSizes(res.data)
    }
    fetchSizes()
  }, [])

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      if (editingId) {
        await toast.promise(
          axios.put(`/api/sizes/${editingId}`, form),
          { loading: 'Saving...', success: 'Size updated!', error: 'Update failed.' }
        )
      } else {
        await toast.promise(
          axios.post('/api/sizes', form),
          { loading: 'Creating...', success: 'Size added!', error: 'Create failed.' }
        )
      }

      const res = await axios.get('/api/sizes')
      setSizes(res.data)
      setForm({ name: '', width: '', height: '', price: '' })
      setEditingId(null)
    } catch (err) {
      console.error(err)
      toast.error('Unexpected error')
    }
  }

  const handleEdit = size => {
    setForm(size)
    setEditingId(size._id)
  }

  const handleDelete = async id => {
    if (!confirm('Delete this size?')) return
    await toast.promise(
      axios.delete(`/api/sizes/${id}`),
      { loading: 'Deleting...', success: 'Size deleted!', error: 'Delete failed.' }
    )
    setSizes(prev => prev.filter(s => s._id !== id))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800">Manage Sizes</h1>

      <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow">
        <input name="name" placeholder="Label (e.g. 8x10)" value={form.name} onChange={handleChange}
          className="w-full p-2 border border-gray-400 rounded text-gray-800" />
        <div className="flex space-x-2">
          <input name="width" type="number" placeholder="Width" value={form.width} onChange={handleChange}
            className="w-1/2 p-2 border border-gray-400 rounded text-gray-800" />
          <input name="height" type="number" placeholder="Height" value={form.height} onChange={handleChange}
            className="w-1/2 p-2 border border-gray-400 rounded text-gray-800" />
        </div>
        <input name="price" type="number" placeholder="Default Price" value={form.price} onChange={handleChange}
          className="w-full p-2 border border-gray-400 rounded text-gray-800" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {editingId ? 'Update Size' : 'Add Size'}
        </button>
      </form>

      <ul className="bg-white divide-y divide-gray-200 rounded shadow-sm">
        {sizes.map(size => (
          <li key={size._id} className="flex justify-between items-center px-4 py-2 hover:bg-gray-50 transition">
            <div className="flex items-baseline space-x-4">
                <span className="text-gray-800 font-medium">
                    {size.name} — {size.width}×{size.height} {size.unit}
                </span> 
                <span className="text-gray-700 font-semibold ml-4"> 
                    ${Number(size.price).toFixed(2)}
                </span>
            </div>
            <div className="space-x-2">
              <button onClick={() => handleEdit(size)} className="text-blue-600 hover:underline">Edit</button>
              <button onClick={() => handleDelete(size._id)} className="text-red-600 hover:underline">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
