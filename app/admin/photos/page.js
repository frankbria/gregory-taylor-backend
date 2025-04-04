'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState([])

  const handleDelete = async (id) => {
  if (!confirm('Are you sure you want to delete this photo?')) return

  try {
    await toast.promise(
      axios.delete(`/api/photos/${id}`),
      {
        loading: 'Deleting photo...',
        success: 'Photo deleted!',
        error: 'Failed to delete photo.',
      }
    )

    // Re-fetch photos after delete
    setPhotos(prev => prev.filter(photo => photo._id !== id))
  } catch (err) {
    console.error(err)
    toast.error('Unexpected error during delete.')
  }
}

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await axios.get('/api/photos')
        setPhotos(res.data)
      } catch (err) {
        console.error('Failed to load photos:', err)
      }
    }

    fetchPhotos()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Manage Photos</h1>
        <Link
          href="/admin/photos/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Photo
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {photos.map(photo => (
          <div key={photo._id} className="relative group border rounded overflow-hidden shadow-sm bg-white">
        {photo.imageUrl ? (
            <Image 
                src={photo.imageUrl}
                alt={photo.title || 'Photo'}
                width={400}
                height={300}
                className="object-cover w-full h-48"
            />
        ) : (
        <div className="flex items-center justify-center w-full h-48 bg-gray-200 text-gray-500">
            No Image
        </div>
        )}

            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-4 transition">
              <Link
                href={`/admin/photos/${photo._id}`}
                className="text-white bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(photo._id)}
                className="text-white bg-red-600 px-3 py-1 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
