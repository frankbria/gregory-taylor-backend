'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function AddPhoto() {
  const router = useRouter()
  const [photo, setPhoto] = useState({
    title: '',
    description: '',
    category: '',
    useDefaultSizes: true,
    sizes: [],
    location: ''
  })
  const [categories, setCategories] = useState([])
  const [sizes, setSizes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesRes = await fetch('/api/categories')
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)

        // Fetch sizes
        const sizesRes = await fetch('/api/sizes')
        const sizesData = await sizesRes.json()
        setSizes(sizesData)

        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load data')
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(photo),
      })

      if (!res.ok) throw new Error('Failed to create photo')

      toast.success('Photo created successfully')
      router.push('/admin/photos')
    } catch (error) {
      console.error('Error creating photo:', error)
      toast.error('Failed to create photo')
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setPhoto(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Photo</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2">Title</label>
          <input
            type="text"
            name="title"
            value={photo.title}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-2">Description</label>
          <textarea
            name="description"
            value={photo.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows="4"
          />
        </div>

        <div>
          <label className="block mb-2">Location</label>
          <input
            type="text"
            name="location"
            value={photo.location}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">Category</label>
          <select
            name="category"
            value={photo.category}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="useDefaultSizes"
              checked={photo.useDefaultSizes}
              onChange={handleChange}
              className="rounded"
            />
            <span>Use Default Sizes</span>
          </label>
        </div>

        {!photo.useDefaultSizes && (
          <div>
            <label className="block mb-2">Sizes</label>
            <select
              multiple
              name="sizes"
              value={photo.sizes}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value)
                setPhoto(prev => ({ ...prev, sizes: values }))
              }}
              className="w-full p-2 border rounded"
            >
              {sizes.map(size => (
                <option key={size._id} value={size._id}>
                  {size.name} - ${size.price}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Photo
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/photos')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
} 