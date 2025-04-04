'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'

function useIsHydrated() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}

export default function ImageUpload({ onImageSelect }) {
  const [preview, setPreview] = useState(null)
  const dropRef = useRef(null)
  const hydrated = useIsHydrated()

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file))
      onImageSelect(file)
    }
  }

  const handleBrowse = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file))
      onImageSelect(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    dropRef.current.classList.add('border-blue-400')
  }

  const handleDragLeave = () => {
    dropRef.current.classList.remove('border-blue-400')
  }

  return (
    <div
      ref={dropRef}
      className="border-2 border-dashed border-gray-300 p-6 text-center rounded-md cursor-pointer hover:border-blue-500"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <label className="cursor-pointer">
        {preview && hydrated ? (
            <Image
              src={preview}
              alt="Preview"
              width={300}
              height={200}
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
        ) : (
          <div>
            <p className="mb-2 text-gray-600">Drag and drop an image here, or click to browse</p>
            <div className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">Choose File</div>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleBrowse}
          className="hidden"
        />
      </label>
    </div>
  )
}
