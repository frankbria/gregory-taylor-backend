'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { generateSlug } from '@/lib/utils'
import apiClient from '@/lib/apiClient'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ name: '', slug: '' })
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])
  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/api/categories')
      setCategories(res.data)
    } catch (err) {
      console.error('Error loading categories:', err)
      toast.error('Failed to fetch categories')
    }
  }

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'name' && !editing && { slug: generateSlug(value) }),
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    if (!form.slug.trim()) return toast.error('Slug is required')

    try {      if (editing) {
        await toast.promise(
          apiClient.put(`/api/categories/${editing._id}`, form),
          { loading: 'Saving...', success: 'Category updated!', error: 'Update failed.' }
        )
      } else {
        await toast.promise(
          apiClient.post('/api/categories', form),
          { loading: 'Creating...', success: 'Category added!', error: 'Create failed.' }
        )
      }

      fetchCategories()
      setForm({ name: '', slug: '' })
      setEditing(null)
    } catch (err) {
      console.error(err)
      toast.error('Unexpected error')
    }
  }

  const handleEdit = category => {
    setForm({ name: category.name, slug: category.slug })
    setEditing(category)
  }

  const handleDelete = async id => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {      await toast.promise(
        apiClient.delete(`/api/categories/${id}`),
        { loading: 'Deleting...', success: 'Category deleted!', error: 'Delete failed.' }
      )
      setCategories(prev => prev.filter(cat => cat._id !== id))
    } catch (err) {
      console.error(err)
      toast.error('Unexpected error during delete operation')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Manage Categories</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {editing ? 'Edit Category' : 'Add New Category'}
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
              <label className="block text-sm font-medium text-gray-800 mb-1">Slug</label>
              <input
                type="text"
                name="slug"
                value={form.slug}
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
              {editing ? 'Update Category' : 'Add Category'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null)
                  setForm({ name: '', slug: '' })
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
        <h2 className="text-xl font-semibold p-6 border-b text-gray-800">Categories</h2>
        {categories.length === 0 ? (
          <div className="p-6 text-center text-gray-800">No categories found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map(category => (
                  <tr key={category._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">{category.slug}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category._id)}
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
