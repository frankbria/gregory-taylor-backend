'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/apiClient'
import { toast } from 'react-hot-toast'

export default function ManageSizesPage() {
  const [sizes, setSizes] = useState([])
  const [form, setForm] = useState({ name: '', width: '', height: '', price: '' })
  const [editingId, setEditingId] = useState(null)
  useEffect(() => {
    const fetchSizes = async () => {
      const res = await apiClient.get('/api/sizes')
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
    try {      if (editingId) {
        await toast.promise(
          apiClient.put(`/api/sizes/${editingId}`, form),
          { loading: 'Saving...', success: 'Size updated!', error: 'Update failed.' }
        )
      } else {
        await toast.promise(
          apiClient.post('/api/sizes', form),
          { loading: 'Creating...', success: 'Size added!', error: 'Create failed.' }
        )
      }

      const res = await apiClient.get('/api/sizes')
      setSizes(res.data)
      setForm({ name: '', width: '', height: '', price: '' })
      setEditingId(null)
    } catch (err) {
      console.error(err)
      toast.error('Unexpected error')
    }
  }

  const handleEdit = size => {
    setForm({
      name: size.name,
      width: size.width,
      height: size.height,
      price: size.price,
    })
    setEditingId(size._id)
  }

  const handleDelete = async id => {
    if (!confirm('Are you sure you want to delete this size?')) return

    try {
      await toast.promise(
        apiClient.delete(`/api/sizes/${id}`),
        { loading: 'Deleting...', success: 'Size deleted!', error: 'Delete failed.' }
      )
      setSizes(prev => prev.filter(size => size._id !== id))
    } catch (err) {
      console.error(err)
      toast.error('Unexpected error during delete')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Manage Sizes</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {editingId ? 'Edit Size' : 'Add New Size'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full p-2 border rounded text-gray-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Price ($)</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                className="w-full p-2 border rounded text-gray-800"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Width (inches)</label>
              <input
                type="number"
                name="width"
                value={form.width}
                onChange={handleChange}
                className="w-full p-2 border rounded text-gray-800"
                min="0"
                step="0.1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Height (inches)</label>
              <input
                type="number"
                name="height"
                value={form.height}
                onChange={handleChange}
                className="w-full p-2 border rounded text-gray-800"
                min="0"
                step="0.1"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {editingId ? 'Update Size' : 'Add Size'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm({ name: '', width: '', height: '', price: '' })
                }}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b text-gray-800">Sizes</h2>
        {sizes.length === 0 ? (
          <div className="p-6 text-center text-gray-800">No sizes found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                    Dimensions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sizes.map(size => (
                  <tr key={size._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">{size.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                      {size.width}&quot; × {size.height}&quot;
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                      ${size.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(size)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(size._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
