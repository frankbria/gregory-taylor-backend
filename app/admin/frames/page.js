'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function FramesPage() {
  const [frames, setFrames] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingFrame, setEditingFrame] = useState(null)
  const [formData, setFormData] = useState({
    style: '',
    price: ''
  })

  useEffect(() => {
    fetchFrames()
  }, [])

  const fetchFrames = async () => {
    try {
      const response = await fetch('/api/frames')
      if (!response.ok) throw new Error('Failed to fetch frames')
      const data = await response.json()
      setFrames(data)
    } catch (error) {
      toast.error('Error loading frames: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingFrame 
        ? '/api/frames' 
        : '/api/frames'
      
      const method = editingFrame ? 'PUT' : 'POST'
      
      const payload = {
        ...formData,
        price: parseFloat(formData.price)
      }
      
      if (editingFrame) {
        payload._id = editingFrame._id
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) throw new Error('Failed to save frame')
      
      toast.success(editingFrame ? 'Frame updated successfully' : 'Frame added successfully')
      setFormData({ style: '', price: '' })
      setEditingFrame(null)
      fetchFrames()
    } catch (error) {
      toast.error('Error saving frame: ' + error.message)
    }
  }

  const handleEdit = (frame) => {
    setEditingFrame(frame)
    setFormData({
      style: frame.style,
      price: frame.price.toString()
    })
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this frame?')) return
    
    try {
      const response = await fetch(`/api/frames/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete frame')
      
      toast.success('Frame deleted successfully')
      fetchFrames()
    } catch (error) {
      toast.error('Error deleting frame: ' + error.message)
    }
  }

  const handleCancel = () => {
    setEditingFrame(null)
    setFormData({ style: '', price: '' })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Manage Frames</h1>
      
      {/* Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {editingFrame ? 'Edit Frame' : 'Add New Frame'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Frame Style
              </label>
              <input
                type="text"
                name="style"
                value={formData.style}
                onChange={handleInputChange}
                className="w-full p-2 border rounded text-gray-800"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full p-2 border rounded text-gray-800"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {editingFrame ? 'Update Frame' : 'Add Frame'}
            </button>
            
            {editingFrame && (
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Frames Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b text-gray-800">Frames</h2>
        
        {loading ? (
          <div className="p-6 text-center text-gray-800">Loading frames...</div>
        ) : frames.length === 0 ? (
          <div className="p-6 text-center text-gray-800">No frames found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                    Style
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
                {frames.map((frame) => (
                  <tr key={frame._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                      {frame.style}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                      ${frame.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(frame)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(frame._id)}
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