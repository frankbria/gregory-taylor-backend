// app/admin/page.js
'use client'

import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from '@clerk/nextjs'
import { useState } from 'react'
import { redirect } from 'next/navigation'
import axios from 'axios'

import ImageUpload from '@/components/ImageUpload'

console.log("Clerk secret is:", !!process.env.CLERK_SECRET_KEY);


export default function AdminPage() {
    redirect('/admin/photos')
}

/*
export default function AdminPage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    keywords: '',
    useDefaultSizes: true,
    sizes: [{ size: '', price: '', override: false }],
  })
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSizeChange = (index, field, value) => {
    const sizes = [...form.sizes]
    sizes[index][field] = value
    setForm(prev => ({ ...prev, sizes }))
  }

  const addSize = () => {
    setForm(prev => ({
      ...prev,
      sizes: [...prev.sizes, { size: '', price: '', override: false }]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!imageFile) return alert("Please select an image!")

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', imageFile)

      const uploadRes = await axios.post('/api/upload', formData)

      console.log('Upload response:', uploadRes.data)


      const imageUrl = uploadRes.data.url
      console.log('Image URL:', imageUrl)

      const photoData = {
        ...form,
        keywords: form.keywords.split(',').map(k => k.trim()),
        imageUrl,
        sizes: form.useDefaultSizes ? [] : form.sizes,
      }

      await axios.post('/api/photos', photoData)
      alert('Photo uploaded successfully!')
      setForm({ title: '', description: '', keywords: '', useDefaultSizes: true, sizes: [{ size: '', price: '', override: false }] })
      setImageFile(null)
    } catch (err) {
      console.error(err)
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <SignedIn>
        <div className="p-6 max-w-xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <UserButton />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <ImageUpload onImageSelect={setImageFile} />

            <input type="text" name="title" placeholder="Title" className="w-full p-2 border" value={form.title} onChange={handleChange} required />
            <textarea name="description" placeholder="Description" className="w-full p-2 border" value={form.description} onChange={handleChange} />

            <input type="text" name="keywords" placeholder="Comma-separated keywords" className="w-full p-2 border" value={form.keywords} onChange={handleChange} />

            <label className="block">
              <input type="checkbox" name="useDefaultSizes" checked={form.useDefaultSizes} onChange={handleChange} />
              <span className="ml-2">Use default sizes and prices</span>
            </label>

            {!form.useDefaultSizes && (
              <div className="space-y-2">
                {form.sizes.map((s, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Size (e.g., 8x10)"
                      value={s.size}
                      onChange={e => handleSizeChange(idx, 'size', e.target.value)}
                      className="flex-1 p-2 border"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={s.price}
                      onChange={e => handleSizeChange(idx, 'price', e.target.value)}
                      className="w-24 p-2 border"
                    />
                  </div>
                ))}
                <button type="button" className="text-blue-500 underline" onClick={addSize}>+ Add Size</button>
              </div>
            )}

            <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Submit Photo'}
            </button>
          </form>
        </div>
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn afterSignInUrl="/admin/photos" />
      </SignedOut>
    </>
  )
}
*/