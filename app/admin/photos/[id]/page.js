// /admin/photos/[id]/page.js

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import Image from 'next/image'
import { toast } from 'react-hot-toast'

export default function EditPhotoPage() {
  const { id } = useParams()
  const router = useRouter()
  const [photo, setPhoto] = useState(null)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [categories, setCategories] = useState([])
  const [sizesList, setSizesList] = useState([])

  const [form, setForm] = useState({
    title: '',
    description: '',
    keywords: '',
    category: '',
    featured: false,
    fullLength: false,
    useDefaultSizes: true,
    sizes: [],
  })

  useEffect(() => {
    const fetchPhoto = async () => {
      try {
        const res = await axios.get(`/api/photos/${id}`)
        setPhoto(res.data)
      } catch (err) {
        console.error(err)
        toast.error('Could not load photo.')
      }
    }
    fetchPhoto()
  }, [id])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/categories')
        setCategories(res.data)
      } catch (err) {
        console.error('Error loading categories:', err)
        toast.error('Failed to fetch categories')
      }
    }

    const fetchSizes = async () => {
      try {
        const res = await axios.get('/api/sizes')
        setSizesList(res.data)
      } catch (err) {
        console.error('Error loading sizes:', err)
        toast.error('Failed to fetch sizes')
      }
    }

    fetchCategories()
    fetchSizes()
  }, [])

  useEffect(() => {
    if (photo) {
      setForm({
        title: photo.title || '',
        description: photo.description || '',
        keywords: photo.keywords?.join(', ') || '',
        category: photo.category?._id || '',
        featured: photo.featured || false,
        fullLength: photo.fullLength || false,
        useDefaultSizes: photo.useDefaultSizes ?? true,
        sizes: photo.sizes?.map(s => s._id || s) || [],
      })
    }
  }, [photo])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSave = async e => {
    e.preventDefault()
    try {
      await toast.promise(
        axios.put(`/api/photos/${id}`, {
          ...form,
          keywords: form.keywords.split(',').map(k => k.trim()),
          sizes: form.useDefaultSizes ? [] : form.sizes,
        }),
        {
          loading: 'Saving changes...',
          success: 'Photo updated!',
          error: 'Failed to save changes.',
        }
      )
    } catch (err) {
      console.error(err)
      toast.error('Unexpected error during save.')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      await toast.promise(
        axios.delete(`/api/photos/${id}`),
        {
          loading: 'Deleting...',
          success: 'Photo deleted!',
          error: 'Failed to delete photo.',
        }
      )
      router.push('/admin/photos')
    } catch (err) {
      console.error(err)
      toast.error('Unexpected error during delete.')
    }
  }

  if (!photo) return <p className="text-gray-600">Loading photo…</p>

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Edit Photo</h1>

      <div className="relative w-full aspect-video">
        <Image
          src={photo.imageUrl}
          alt="Uploaded"
          fill
          className="object-contain rounded"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          className="w-full p-2 border border-gray-400 rounded text-gray-800"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full p-2 border border-gray-400 rounded text-gray-800"
        />
        <input
          type="text"
          name="keywords"
          value={form.keywords}
          onChange={handleChange}
          className="w-full p-2 border border-gray-400 rounded text-gray-800"
        />
        <label className="flex items-center space-x-2 text-gray-800">
          <input
            type="checkbox"
            name="useDefaultSizes"
            checked={form.useDefaultSizes}
            onChange={handleChange}
          />
          <span>Use Default Sizes</span>
        </label>
        {!form.useDefaultSizes && (
          <select
            name="sizes"
            multiple
            value={form.sizes}
            onChange={e =>
              setForm(prev => ({
                ...prev,
                sizes: [...e.target.selectedOptions].map(o => o.value),
              }))
            }
            className="w-full p-2 border border-gray-400 rounded text-gray-800"
          >
            {sizesList.map(size => (
              <option key={size._id} value={size._id}>
                {size.name} - ${size.price.toFixed(2)}
              </option>
            ))}
          </select>
        )}
        <label className="flex items-center space-x-2 text-gray-800">
          <input
            type="checkbox"
            name="featured"
            checked={form.featured}
            onChange={handleChange}
          />
          <span>Featured</span>
        </label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full p-2 border border-gray-400 rounded text-gray-800"
        >
          <option value="">Select a category</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
        <label className="flex items-center space-x-2 text-gray-800">
          <input
            type="checkbox"
            name="fullLength"
            checked={form.fullLength}
            onChange={handleChange}
          />
          <span>Full Length</span>
        </label>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Changes
        </button>
      </form>

      <button
        onClick={handleDelete}
        className="mt-4 text-red-600 hover:text-red-800"
      >
        Delete Photo
      </button>

      {status.message && (
        <div
          className={`mt-4 p-2 rounded text-sm ${
            status.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {status.message}
        </div>
      )}
    </div>
  )
}
