# Admin Functionality Issues - Backend

> **Priority: P2-P3 - Enhance admin experience**
>
> These issues improve admin dashboard functionality, workflow efficiency, and management capabilities.

---

## Issue: Add user management page to admin dashboard

**Labels:** `feature`, `admin`, `user-management`
**Priority:** P2
**Estimated Effort:** 6 hours

### Summary

Admins cannot view registered users, reset passwords, manage permissions, or ban accounts from the admin panel. All user management must be done directly in the database.

### Current State

- Better Auth stores users in MongoDB `user`, `session`, `account` collections
- No admin UI to view or manage users
- Cannot see who's registered, when they joined, or their activity

### Proposed Solution

**Create user management page:**

```javascript
// app/admin/users/page.js
'use client'

import { useState, useEffect } from 'react'
import AdminShell from '@/components/AdminShell'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    const res = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}`,
      },
    })
    const data = await res.json()
    setUsers(data)
    setLoading(false)
  }

  async function handleBanUser(userId) {
    if (!confirm('Ban this user?')) return

    await fetch('/api/admin/users/ban', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    })

    loadUsers()
  }

  return (
    <AdminShell>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">User Management</h1>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Joined</th>
              <th className="text-left p-3">Orders</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.name || '—'}</td>
                <td className="p-3">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3">{user.orderCount || 0}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-sm ${
                    user.banned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {user.banned ? 'Banned' : 'Active'}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleBanUser(user.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    {user.banned ? 'Unban' : 'Ban'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  )
}
```

**Create API endpoint:**

```javascript
// app/api/admin/users/route.js
import { adminAuth } from '@/lib/adminAuth'
import dbConnect from '@/lib/db'
import mongoose from 'mongoose'
import Order from '@/models/Order'

export async function GET(req) {
  return adminAuth(async (req) => {
    await dbConnect()

    // Fetch users from Better Auth collection
    const db = mongoose.connection.db
    const usersCollection = db.collection('user')

    const users = await usersCollection.find({}).sort({ createdAt: -1 }).toArray()

    // Enrich with order counts
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.countDocuments({ userId: user.id })
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          banned: user.banned || false,
          orderCount,
        }
      })
    )

    return NextResponse.json(enrichedUsers)
  })(req)
}
```

### Acceptance Criteria

- [ ] User management page accessible from admin navigation
- [ ] List all registered users with email, name, join date
- [ ] Show order count per user
- [ ] Ban/unban functionality
- [ ] Search users by email/name
- [ ] Filter by status (active/banned)
- [ ] Pagination for large user lists

### Testing

1. Register multiple users → See in admin panel
2. Ban user → User cannot sign in
3. Unban user → User can sign in again
4. Search by email → Find specific user
5. Verify order count matches actual orders

---

## Issue: Add bulk actions for photos and orders

**Labels:** `feature`, `admin`, `productivity`
**Priority:** P2
**Estimated Effort:** 5 hours

### Summary

Admins must delete/update photos and orders one at a time. With large catalogs, this is inefficient. Need ability to select multiple items and perform bulk actions.

### Proposed Features

1. **Bulk photo deletion** - Select multiple photos and delete at once
2. **Bulk category assignment** - Move photos to different category
3. **Bulk featured toggle** - Mark/unmark as featured
4. **Bulk order status update** - Mark multiple orders as fulfilled

### Proposed Solution

**Photo management with bulk actions:**

```javascript
// app/admin/photos/page.js
'use client'

import { useState } from 'react'

export default function PhotosPage() {
  const [selectedPhotos, setSelectedPhotos] = useState(new Set())
  const [photos, setPhotos] = useState([])

  const toggleSelection = (photoId) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(photoId)) {
        newSet.delete(photoId)
      } else {
        newSet.add(photoId)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedPhotos(new Set(photos.map(p => p._id)))
  }

  const deselectAll = () => {
    setSelectedPhotos(new Set())
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedPhotos.size} photos?`)) return

    await fetch('/api/admin/photos/bulk-delete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        photoIds: Array.from(selectedPhotos),
      }),
    })

    // Reload photos
    loadPhotos()
    deselectAll()
  }

  const handleBulkCategoryChange = async (categoryId) => {
    await fetch('/api/admin/photos/bulk-update', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        photoIds: Array.from(selectedPhotos),
        updates: { category: categoryId },
      }),
    })

    loadPhotos()
    deselectAll()
  }

  return (
    <div>
      {/* Bulk actions toolbar */}
      {selectedPhotos.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 p-4 flex items-center justify-between">
          <div>
            <span className="font-medium">{selectedPhotos.size} selected</span>
            <button onClick={deselectAll} className="ml-4 text-sm text-blue-600 hover:underline">
              Deselect All
            </button>
          </div>
          <div className="flex gap-2">
            <select
              onChange={(e) => handleBulkCategoryChange(e.target.value)}
              className="border rounded px-3 py-1"
            >
              <option value="">Move to category...</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Photo grid with checkboxes */}
      <div className="grid grid-cols-4 gap-4 p-6">
        {photos.map((photo) => (
          <div key={photo._id} className="relative">
            <input
              type="checkbox"
              checked={selectedPhotos.has(photo._id)}
              onChange={() => toggleSelection(photo._id)}
              className="absolute top-2 left-2 w-5 h-5 z-10"
            />
            <img
              src={photo.imageUrl}
              alt={photo.title}
              className="w-full h-48 object-cover rounded"
            />
            <p className="mt-2 text-sm font-medium">{photo.title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Backend bulk endpoints:**

```javascript
// app/api/admin/photos/bulk-delete/route.js
export async function POST(req) {
  return adminAuth(async (req) => {
    const { photoIds } = await req.json()

    // Fetch photos to get publicIDs
    const photos = await Photo.find({ _id: { $in: photoIds } })

    // Delete from Cloudinary
    await Promise.all(
      photos.map(photo =>
        cloudinary.uploader.destroy(photo.publicID)
      )
    )

    // Delete from database
    await Photo.deleteMany({ _id: { $in: photoIds } })

    return NextResponse.json({ deleted: photoIds.length })
  })(req)
}

// app/api/admin/photos/bulk-update/route.js
export async function POST(req) {
  return adminAuth(async (req) => {
    const { photoIds, updates } = await req.json()

    await Photo.updateMany(
      { _id: { $in: photoIds } },
      { $set: updates }
    )

    return NextResponse.json({ updated: photoIds.length })
  })(req)
}
```

### Acceptance Criteria

- [ ] Select individual photos with checkboxes
- [ ] "Select All" / "Deselect All" buttons
- [ ] Bulk actions toolbar appears when items selected
- [ ] Bulk delete with confirmation
- [ ] Bulk category reassignment
- [ ] Bulk featured toggle
- [ ] Bulk order status update
- [ ] Progress indicator for bulk operations

### Testing

1. Select 10 photos → Bulk delete → All deleted
2. Select 5 photos → Move to different category → All moved
3. Select all photos → Deselect all → None selected
4. Test with 100+ photos → Performance acceptable

---

## Issue: Add analytics dashboard with key metrics

**Labels:** `feature`, `admin`, `analytics`
**Priority:** P3
**Estimated Effort:** 8 hours

### Summary

Admin dashboard has no overview/summary page. Admins must navigate to individual pages to see photo count, pending orders, revenue, etc. Need an "at-a-glance" dashboard with key metrics.

### Proposed Features

1. **Total revenue** (all-time, this month)
2. **Pending orders count**
3. **Photo count** (total, by category)
4. **Recent orders** (last 5-10)
5. **Popular photos** (most ordered)
6. **Sales chart** (last 30 days)

### Proposed Solution

```javascript
// app/admin/page.js (admin home/dashboard)
'use client'

import { useState, useEffect } from 'react'
import AdminShell from '@/components/AdminShell'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    loadMetrics()
  }, [])

  async function loadMetrics() {
    const res = await fetch('/api/admin/metrics', {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}`,
      },
    })
    const data = await res.json()
    setMetrics(data)
  }

  if (!metrics) return <div>Loading...</div>

  return (
    <AdminShell>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={`$${(metrics.totalRevenue / 100).toFixed(2)}`}
            subtitle={`$${(metrics.monthlyRevenue / 100).toFixed(2)} this month`}
            icon="💰"
          />
          <MetricCard
            title="Pending Orders"
            value={metrics.pendingOrders}
            subtitle="Awaiting fulfillment"
            icon="📦"
          />
          <MetricCard
            title="Total Photos"
            value={metrics.totalPhotos}
            subtitle={`${metrics.featuredPhotos} featured`}
            icon="📸"
          />
          <MetricCard
            title="Categories"
            value={metrics.totalCategories}
            subtitle={`Avg ${Math.round(metrics.photosPerCategory)} photos/category`}
            icon="🗂️"
          />
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Order ID</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Total</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentOrders.map(order => (
                <tr key={order._id} className="border-b">
                  <td className="p-2">#{order._id.slice(-8)}</td>
                  <td className="p-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-2">${(order.totalAmount / 100).toFixed(2)}</td>
                  <td className="p-2">{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Popular Photos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Most Popular Photos</h2>
          <div className="grid grid-cols-5 gap-4">
            {metrics.popularPhotos.map(photo => (
              <div key={photo._id}>
                <img src={photo.imageUrl} alt={photo.title} className="w-full h-32 object-cover rounded" />
                <p className="text-sm mt-2">{photo.title}</p>
                <p className="text-xs text-gray-600">{photo.orderCount} orders</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  )
}

function MetricCard({ title, value, subtitle, icon }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  )
}
```

**Backend metrics endpoint:**

```javascript
// app/api/admin/metrics/route.js
export async function GET(req) {
  return adminAuth(async (req) => {
    await dbConnect()

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalRevenue,
      monthlyRevenue,
      pendingOrders,
      totalPhotos,
      featuredPhotos,
      totalCategories,
      recentOrders,
      popularPhotos,
    ] = await Promise.all([
      // Total revenue
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]).then(r => r[0]?.total || 0),

      // Monthly revenue
      Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]).then(r => r[0]?.total || 0),

      // Pending orders
      Order.countDocuments({ status: { $in: ['created', 'paid'] } }),

      // Total photos
      Photo.countDocuments(),

      // Featured photos
      Photo.countDocuments({ featured: true }),

      // Total categories
      Category.countDocuments(),

      // Recent orders
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('_id createdAt totalAmount status'),

      // Popular photos (most ordered)
      Order.aggregate([
        { $unwind: '$items' },
        { $group: {
          _id: '$items.productId',
          orderCount: { $sum: 1 },
          title: { $first: '$items.title' },
          imageUrl: { $first: '$items.imageUrl' },
        }},
        { $sort: { orderCount: -1 } },
        { $limit: 5 },
      ]),
    ])

    const photosPerCategory = totalCategories > 0
      ? totalPhotos / totalCategories
      : 0

    return NextResponse.json({
      totalRevenue,
      monthlyRevenue,
      pendingOrders,
      totalPhotos,
      featuredPhotos,
      totalCategories,
      photosPerCategory,
      recentOrders,
      popularPhotos,
    })
  })(req)
}
```

### Acceptance Criteria

- [ ] Dashboard accessible at `/admin` route
- [ ] Key metrics displayed (revenue, orders, photos, categories)
- [ ] Recent orders table (last 10)
- [ ] Popular photos grid (top 5)
- [ ] Metrics update in real-time or on page refresh
- [ ] Quick links to relevant pages (pending orders, photo management)
- [ ] Optional: Sales chart for last 30 days

### Testing

1. Create orders → Verify revenue metrics update
2. Mark orders as fulfilled → Pending count decreases
3. Add photos → Total photo count increases
4. Verify popular photos reflect actual order data

---

## Issue: Add export functionality for orders and photos

**Labels:** `feature`, `admin`, `data-export`
**Priority:** P3
**Estimated Effort:** 4 hours

### Summary

No way to export orders to CSV for accounting, or export photo metadata for backup/analysis. Admins must manually copy data or use database tools.

### Proposed Features

1. **Export orders to CSV** - All fields, filterable by date range
2. **Export photos to JSON** - Full metadata including URLs
3. **Export customer list** - Emails for marketing (with consent)

### Proposed Solution

```javascript
// app/api/admin/export/orders/route.js
export async function GET(req) {
  return adminAuth(async (req) => {
    const url = new URL(req.url)
    const format = url.searchParams.get('format') || 'csv'
    const startDate = url.searchParams.get('start')
    const endDate = url.searchParams.get('end')

    const query = {}
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const orders = await Order.find(query)
      .populate('items.productId')
      .sort({ createdAt: -1 })
      .lean()

    if (format === 'csv') {
      const csv = convertOrdersToCSV(orders)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    return NextResponse.json(orders)
  })(req)
}

function convertOrdersToCSV(orders) {
  const headers = ['Order ID', 'Date', 'Customer Email', 'Total', 'Status', 'Items']
  const rows = orders.map(order => [
    order._id,
    new Date(order.createdAt).toLocaleDateString(),
    order.customerEmail || '',
    (order.totalAmount / 100).toFixed(2),
    order.status,
    order.items.map(i => `${i.title} (${i.quantity}x)`).join('; '),
  ])

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
}
```

**Frontend export button:**

```javascript
// app/admin/orders/page.js
<button
  onClick={handleExport}
  className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
  Export to CSV
</button>

async function handleExport() {
  const response = await fetch('/api/admin/export/orders?format=csv', {
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}`,
    },
  })

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}
```

### Acceptance Criteria

- [ ] Export orders to CSV with all fields
- [ ] Filter exports by date range
- [ ] Export photos to JSON with metadata
- [ ] Download triggers browser download dialog
- [ ] File names include export date
- [ ] Large exports don't timeout (stream or paginate)

### Testing

1. Export 10 orders → CSV downloads with correct data
2. Export with date filter → Only matching orders included
3. Export 1000+ orders → Completes without timeout
4. Open CSV in Excel → Formatting correct

---

## Summary Table

| Issue | Priority | Estimated Effort |
|-------|----------|------------------|
| User management page | P2 | 6 hours |
| Bulk actions | P2 | 5 hours |
| Analytics dashboard | P3 | 8 hours |
| Export functionality | P3 | 4 hours |

**Total estimated effort:** ~23 hours (3 days for one developer)

**Priority Breakdown:**
- **P2 (Should Have):** 11 hours - Important admin features
- **P3 (Nice to Have):** 12 hours - Productivity enhancements
