'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/apiClient'
import { toast } from 'react-hot-toast'

export default function AdminFormatsPage() {
  const [formats, setFormats] = useState([])
  const [form, setForm] = useState({ name: '', price: '' })
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    fetchFormats()
  }, [])
  const fetchFormats = async () => {
    try {
      const res = await apiClient.get('/api/formats')
      setFormats(res.data)
    } catch (err) {
      console.error('Error loading formats:', err)
      toast.error('Failed to fetch formats')
    }
  }

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'price' ? value : value
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    if (form.price === '' || form.price < 0) return toast.error('Price must be a positive number')

    try {
      if (editing) {
        await toast.promise(
          apiClient.put(`/api/formats/${editing._id}`, form),
          { loading: 'Saving...', success: 'Format updated!', error: 'Update failed.' }
        )
      } else {
        await toast.promise(
          apiClient.post('/api/formats', form),
          { loading: 'Creating...', success: 'Format added!', error: 'Create failed.' }
        )
      }

      fetchFormats()
      setForm({ name: '', price: '' })
      setEditing(null)
    } catch (err) {
      console.error(err)
      toast.error('Unexpected error')
    }
  }

  const handleEdit = format => {
    setForm({ name: format.name, price: format.price })
    setEditing(format)
  }

  const handleDelete = async id => {
    if (!confirm('Are you sure you want to delete this format?')) return

    try {
      await toast.promise(
        apiClient.delete(`/api/formats/${id}`),
        { loading: 'Deleting...', success: 'Format deleted!', error: 'Delete failed.' }
      )
      setFormats(prev => prev.filter(format => format._id !== id))
    } catch (err) {
      console.error(err)
      toast.error('Unexpected error during delete')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Manage Formats</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {editing ? 'Edit Format' : 'Add New Format'}
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
              <label className="block text-sm font-medium text-gray-800 mb-1">Price</label>
              <input
                type="text"
                name="price"
                value={form.price}
                onChange={handleChange}
                className="w-full p-2 border rounded text-gray-800"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {editing ? 'Update Format' : 'Add Format'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null)
                  setForm({ name: '', price: '' })
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
        <h2 className="text-xl font-semibold p-6 border-b text-gray-800">Formats</h2>
        {formats.length === 0 ? (
          <div className="p-6 text-center text-gray-800">No formats found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                    Name
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
                {formats.map(format => (
                  <tr key={format._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">{format.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">${format.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(format)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(format._id)}
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