'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const slugify = str =>
  str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ name: '', slug: '' })
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories')
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
      ...(name === 'name' && !editing && { slug: slugify(value) }),
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    if (!form.slug.trim()) return toast.error('Slug is required')

    try {
      if (editing) {
        await toast.promise(
          axios.put(`/api/categories/${editing._id}`, form),
          {
            loading: 'Updating...',
            success: 'Category updated',
            error: 'Failed to update',
          }
        )
      } else {
        await toast.promise(
          axios.post('/api/categories', form),
          {
            loading: 'Creating...',
            success: 'Category created',
            error: 'Failed to create',
          }
        )
      }
      setForm({ name: '', slug: '' })
      setEditing(null)
      fetchCategories()
    } catch (err) {
      console.error(err)
    }
  }

  const handleEdit = cat => {
    setEditing(cat)
    setForm({ name: cat.name, slug: cat.slug })
  }

  const handleDelete = async id => {
    try {
      await toast.promise(
        axios.delete(`/api/categories/${id}`),
        {
          loading: 'Deleting...',
          success: 'Category deleted',
          error: 'Failed to delete',
        }
      )
      fetchCategories()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Manage Categories</h1>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          name="name"
          value={form.name || ''}
          onChange={handleChange}
          placeholder="Category name"
          className="w-full border border-gray-400 rounded px-3 py-2 text-gray-800"
        />
        <input
          type="text"
          name="slug"
          value={form.slug || ''}
          onChange={handleChange}
          placeholder="Slug (e.g., majestic-mountains)"
          className="w-full border border-gray-400 rounded px-3 py-2 text-gray-800"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editing ? 'Update' : 'Add'}
        </button>
      </form>

      <ul className="space-y-2">
        {categories.map(cat => (
          <li
            key={cat._id}
            className="flex justify-between items-center border p-2 rounded bg-white shadow-sm"
          >
            <div>
              <div className="text-gray-800 font-medium">{cat.name}</div>
              <div className="text-gray-500 text-sm">{cat.slug}</div>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleEdit(cat)}
                className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(cat._id)}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
