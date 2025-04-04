'use client'

import { useState, useEffect, use } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'react-hot-toast'


export default function AddPhotoPage() {
    const [status, setStatus] = useState({ type: '', message: '' })
    const [preview, setPreview] = useState(null)

  const [form, setForm] = useState({
  title: '',
  description: '',
  keywords: '',
  category: '',
  featured: false,
  fullLength: false,
  useDefaultSizes: true,
  sizes: [], // Will contain ObjectId strings
})

  const [imageFile, setImageFile] = useState(null)
  const router = useRouter()

  const [categories, setCategories] = useState([])

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

    fetchCategories()
  }, [])

  useEffect(() => {
  return () => {
    if (preview) URL.revokeObjectURL(preview)
  }
}, [preview])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleImageSelect = e => {
    const file = e.target.files?.[0]
    if (file) {
        setImageFile(file)
        setPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!imageFile) {
        toast.error('Please select an image.')
        return
    }

    try {
        const formData = new FormData()
        formData.append('file', imageFile)

        const uploadRes = await toast.promise(
        axios.post('/api/upload', formData),
        {
            loading: 'Uploading image...',
            success: 'Image uploaded!',
            error: 'Image upload failed.',
        }
        )

        const { url, public_id } = uploadRes.data

        const photoData = {
            ...form,
            imageUrl: url,
            publicId: public_id,
            keywords: form.keywords.split(',').map(k => k.trim()),
            sizes: form.useDefaultSizes ? [] : form.sizes || [],
        }

        await toast.promise(
        axios.post('/api/photos', photoData),
        {
            loading: 'Saving photo...',
            success: 'Photo saved!',
            error: 'Failed to save photo.',
        }
        )

        router.push('/admin/photos')
    } catch (err) {
        console.error(err)
        toast.error('Unexpected error. Please try again.')
    }
}

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Add New Photo</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          placeholder="Title"
          className="w-full p-2 border border-gray-400 rounded text-gray-800 placeholder-gray-500"
          value={form.title}
          onChange={handleChange}
        />
        <textarea
          name="description"
          placeholder="Description"
          className="w-full p-2 border border-gray-400 rounded text-gray-800 placeholder-gray-500"
          value={form.description}
          onChange={handleChange}
        />
        <input
          type="text"
          name="keywords"
          placeholder="Comma-separated keywords"
          className="w-full p-2 border border-gray-400 rounded text-gray-800 placeholder-gray-500"
          value={form.keywords}
          onChange={handleChange}
        />
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
        <div>
          <label className="flex items-center space-x-2 border-gray-400 rounded text-gray-800 placeholder-gray-500">
            <input
              type="checkbox"
              name="useDefaultSizes"
              checked={form.useDefaultSizes}
              onChange={handleChange}
            />
            <span>Use default sizes</span>
          </label>
        </div>
          <div>
            <label
                htmlFor="imageUpload"
                className="cursor-pointer inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Choose Image
            </label>
            
            <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
                e.preventDefault()
                const file = e.dataTransfer.files?.[0]
                if (file) {
                setImageFile(file)
                setPreview(URL.createObjectURL(file))
                }
            }}
            className="border-2 border-dashed border-gray-400 rounded p-6 text-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
            onClick={() => document.getElementById('hiddenFileInput').click()}
            >
            {preview ? (
                <div className="relative w-full max-w-xs mx-auto aspect-video">
                <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-contain rounded"
                    sizes="(max-width: 768px) 100vw, 33vw"
                />
                </div>
            ) : (
                <p className="text-gray-600">Drag and drop an image here, or click to browse</p>
            )}
            <input
                type="file"
                id="hiddenFileInput"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
            />
            </div>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Photo
        </button>
      </form>
      {status.message && (
        <div className={`mt-4 p-2 rounded ${status.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {status.message}
        </div>
      )}
    </div>
  )
}
