import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MENU_CATEGORIES } from '../../assets/assets'
import { formatCurrency } from '../../utils/currency'
import './Admin.css'

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin)).replace(/\/+$/, '')

const emptyProductForm = {
  name: '',
  description: '',
  price: '',
  costPrice: '',
  category: MENU_CATEGORIES[0],
  image: 'menu-chicken-rice.webp',
  stock: '10',
  featured: false,
  ingredients: [],
}

const emptyUserForm = {
  name: '',
  email: '',
  password: '',
  role: 'client',
}

const emptyIngredientForm = {
  name: '',
  category: 'vegetable',
  unit: 'pcs',
  stock: '0',
  costPerUnit: '0',
  minimumLevel: '0',
}

const emptyReservationForm = {
  guestName: '',
  email: '',
  phone: '',
  tableNumber: '',
  partySize: '2',
  reservationDate: new Date().toISOString().slice(0, 10),
  reservationTime: '19:00',
  notes: '',
}

const Admin = () => {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem('minifour-user')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })
  const [loginForm, setLoginForm] = useState({
    email: 'admin@minifour.com',
    password: 'Admin@Minifour123',
  })
  const [authError, setAuthError] = useState('')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [tables, setTables] = useState([])
  const [reservations, setReservations] = useState([])
  const [payments, setPayments] = useState([])
  const [analytics, setAnalytics] = useState({
    summary: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, bestDay: { day: 'N/A', total: 0 } },
    revenueTrend: [],
    topProducts: [],
    categoryTotals: {},
  })
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCost: 0,
    grossProfit: 0,
    activeOrders: 0,
    lowStockIngredients: 0,
    ingredientCount: 0,
  })
  const isManagerOnly = adminUser?.role === 'manager'
  const isAdminUser = adminUser?.role === 'admin'

  const tabs = useMemo(() => {
    if (isManagerOnly) {
      return ['orders', 'payments']
    }
    return ['products', 'users', 'ingredients', 'tables', 'analytics', 'reservations', 'payments']
  }, [isManagerOnly])
  const [loading, setLoading] = useState(false)
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [customerForm, setCustomerForm] = useState(emptyUserForm)
  const [ingredientForm, setIngredientForm] = useState(emptyIngredientForm)
  const [tableForm, setTableForm] = useState({ number: '', name: '' })
  const [reservationForm, setReservationForm] = useState(emptyReservationForm)
  const [reservationFilters, setReservationFilters] = useState({ date: '', status: 'all', search: '' })
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [editingProductId, setEditingProductId] = useState(null)
  const [editingIngredientId, setEditingIngredientId] = useState(null)
  const [tableToDelete, setTableToDelete] = useState(null)
  const [message, setMessage] = useState('')
  const [driveImages, setDriveImages] = useState([])
  const [showDriveGallery, setShowDriveGallery] = useState(false)
  const [loadingDrive, setLoadingDrive] = useState(false)
  const [activeTab, setActiveTab] = useState('products')

  const loadDriveImages = async () => {
    if (!token) return
    setLoadingDrive(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/drive-images`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setDriveImages(data)
      }
    } catch {
      setAuthError('Failed to load Google Drive images.')
    } finally {
      setLoadingDrive(false)
    }
  }

  const token = sessionStorage.getItem('minifour-token')
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  const fetchAdminData = useCallback(async () => {
    if (!token) return

    try {
      const [productsResponse, ordersResponse, usersResponse, ingredientsResponse, tablesResponse, summaryResponse, paymentsResponse, reservationsResponse, analyticsResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/products`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/ingredients`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/tables`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/summary`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/payments`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/reservations`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (!productsResponse.ok || !ordersResponse.ok || !usersResponse.ok || !ingredientsResponse.ok || !tablesResponse.ok || !summaryResponse.ok || !paymentsResponse.ok || !reservationsResponse.ok || !analyticsResponse.ok) {
        throw new Error('Unable to fetch admin data.')
      }

      const [productsData, ordersData, usersData, ingredientsData, tablesData, summaryData, paymentsData, reservationsData, analyticsData] = await Promise.all([
        productsResponse.json(),
        ordersResponse.json(),
        usersResponse.json(),
        ingredientsResponse.json(),
        tablesResponse.json(),
        summaryResponse.json(),
        paymentsResponse.json(),
        reservationsResponse.json(),
        analyticsResponse.json(),
      ])

      setProducts(productsData)
      setOrders(ordersData)
      setUsers(usersData)
      setIngredients(ingredientsData)
      setTables(tablesData)
      setSummary(summaryData)
      setPayments(paymentsData)
      setReservations(reservationsData)
      setAnalytics(analyticsData)
    } catch (error) {
      setAuthError(error.message)
    }
  }, [token])


  useEffect(() => {
    if (!adminUser?.role || !['admin', 'manager'].includes(adminUser.role)) {
      return undefined
    }

    const timer = setTimeout(() => {
      void fetchAdminData()
    }, 0)

    return () => clearTimeout(timer)
  }, [adminUser, fetchAdminData])

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    setAuthError('')

    try {
      const response = await fetch(`${API_URL}/api/auth/manager-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.')
      }

      if (!['admin', 'manager'].includes(data.user.role)) {
        throw new Error('This account is not authorized for admin/manager access.')
      }

      sessionStorage.setItem('minifour-token', data.token)
      sessionStorage.setItem('minifour-user', JSON.stringify(data.user))
      setAdminUser(data.user)
      setMessage('Logged in as manager/admin.')
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('minifour-token')
    sessionStorage.removeItem('minifour-user')
    setAdminUser(null)
    setProducts([])
    setOrders([])
    setUsers([])
    setIngredients([])
    setMessage('Logged out.')
  }

  const handleProductInput = (event) => {
    const { name, value, type, checked } = event.target
    setProductForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleUserInput = (event) => {
    const { name, value } = event.target
    setCustomerForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleIngredientInput = (event) => {
    const { name, value } = event.target
    setIngredientForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleReservationInput = (event) => {
    const { name, value } = event.target
    setReservationForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleProductImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const base64 = await toBase64(file)
      const response = await fetch(`${API_URL}/api/admin/upload-image`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          file: base64,
          filename: file.name,
          mimeType: file.type,
          folderId: 'minifour/products',
        }),
      })

      const data = await response.json()

      if (response.ok && data.url) {
        setProductForm((prev) => ({ ...prev, image: data.url }))
        return
      }

      // Fallback to local preview if the backend upload fails.
      setProductForm((prev) => ({ ...prev, image: base64 }))
      setAuthError(data.message || 'Image upload failed. Falling back to local preview.')
    } catch (error) {
      console.error('Upload error:', error)
      setAuthError('Image upload failed. Falling back to the local preview copy.')
    }
  }

  const handleTableInput = (event) => {
    const { name, value } = event.target
    setTableForm((prev) => ({ ...prev, [name]: value }))
  }

  const addIngredientLine = () => {
    setProductForm((prev) => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), { name: '', quantity: '', unit: 'pcs' }],
    }))
  }

  const updateIngredientLine = (index, key, value) => {
    setProductForm((prev) => ({
      ...prev,
      ingredients: (prev.ingredients || []).map((item, itemIndex) => (
        itemIndex === index ? { ...item, [key]: value } : item
      )),
    }))
  }

  const removeIngredientLine = (index) => {
    setProductForm((prev) => ({
      ...prev,
      ingredients: (prev.ingredients || []).filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const resetProductForm = () => {
    setProductForm(emptyProductForm)
    setEditingProductId(null)
  }

  const handleSubmitProduct = async (event) => {
    event.preventDefault()
    if (!token) return

    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        costPrice: Number(productForm.costPrice || 0),
        category: productForm.category,
        image: productForm.image,
        stock: Number(productForm.stock || 0),
        featured: productForm.featured,
        ingredients: (productForm.ingredients || []).map((line) => ({
          name: line.name,
          quantity: Number(line.quantity || 0),
          unit: line.unit || 'pcs',
        })),
      }

      const method = editingProductId ? 'PUT' : 'POST'
      const url = editingProductId
        ? `${API_URL}/api/admin/products/${editingProductId}`
        : `${API_URL}/api/admin/products`

      const response = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Product action failed.')
      }

      setMessage(editingProductId ? 'Product updated.' : 'Product created.')
      resetProductForm()
      await fetchAdminData()
    } catch (error) {
      setAuthError(error.message)
    }
  }

  const handleEditProduct = (product) => {
    setEditingProductId(product._id)
    setProductForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      costPrice: String(product.costPrice || 0),
      category: product.category,
      image: product.image,
      stock: String(product.stock),
      featured: Boolean(product.featured),
      ingredients: Array.isArray(product.ingredients) ? product.ingredients : [],
    })
    setActiveTab('products')
  }

  const handleDeleteProduct = async (productId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Product delete failed.')
      }

      setMessage('Product deleted.')
      await fetchAdminData()
    } catch (error) {
      setAuthError(error.message)
    }
  }

  const handleStatusChange = async (orderId, nextStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ status: nextStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Order update failed.')
      }

      setMessage('Order status updated.')
      await fetchAdminData()
    } catch (error) {
      setAuthError(error.message)
    }
  }

  const handleUserCreate = async (event) => {
    event.preventDefault()
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(customerForm),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'User creation failed.')
      }

      setMessage(`Created ${data.role} account for ${data.name}.`)
      setCustomerForm(emptyUserForm)
      await fetchAdminData()
    } catch (error) {
      setAuthError(error.message)
    }
  }

  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'User delete failed.')
      }

      setMessage('User removed.')
      await fetchAdminData()
    } catch (error) {
      setAuthError(error.message)
    }
  }

  const handleIngredientSubmit = async (event) => {
    event.preventDefault()

    try {
      const payload = {
        name: ingredientForm.name,
        category: ingredientForm.category,
        unit: ingredientForm.unit,
        stock: Number(ingredientForm.stock || 0),
        costPerUnit: Number(ingredientForm.costPerUnit || 0),
        minimumLevel: Number(ingredientForm.minimumLevel || 0),
      }

      const method = editingIngredientId ? 'PUT' : 'POST'
      const url = editingIngredientId
        ? `${API_URL}/api/admin/ingredients/${editingIngredientId}`
        : `${API_URL}/api/admin/ingredients`

      const response = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Ingredient action failed.')
      }

      setMessage(editingIngredientId ? 'Ingredient updated.' : 'Ingredient added.')
      setIngredientForm(emptyIngredientForm)
      setEditingIngredientId(null)
      await fetchAdminData()
    } catch (error) {
      setAuthError(error.message)
    }
  }

  const handleEditIngredient = (ingredient) => {
    setEditingIngredientId(ingredient._id)
    setIngredientForm({
      name: ingredient.name,
      category: ingredient.category,
      unit: ingredient.unit,
      stock: String(ingredient.stock),
      costPerUnit: String(ingredient.costPerUnit),
      minimumLevel: String(ingredient.minimumLevel),
    })
    setActiveTab('ingredients')
  }

  const handleDeleteIngredient = async (ingredientId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/ingredients/${ingredientId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Ingredient delete failed.')
      }

      setMessage('Ingredient removed.')
      await fetchAdminData()
    } catch (error) {
      setAuthError(error.message)
    }
  }

  const handleTableCreate = async (event) => {
    event.preventDefault()

    try {
      const response = await fetch(`${API_URL}/api/admin/tables`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          number: Number(tableForm.number),
          name: tableForm.name || `Table ${tableForm.number}`,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Table creation failed.')
      }

      setMessage(`Table ${data.number} created and QR code generated.`)
      setTableForm({ number: '', name: '' })
      await fetchAdminData()
    } catch (error) {
      setAuthError(error.message)
    }
  }

  const handleDeleteTable = async (tableId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/tables/${tableId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Table delete failed.')
      }

      setMessage('Table removed.')
      setTableToDelete(null)
      await fetchAdminData()
    } catch (error) {
      setAuthError(error.message)
    }
  }

  const handleReservationSubmit = async (event) => {
    event.preventDefault()

    try {
      const payload = {
        ...reservationForm,
        tableNumber: reservationForm.tableNumber ? Number(reservationForm.tableNumber) : null,
        partySize: Number(reservationForm.partySize || 1),
      }

      const response = await fetch(`${API_URL}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Reservation failed.')
      }

      setMessage('Table reservation created.')
      setReservationForm(emptyReservationForm)
      await fetchAdminData()
    } catch (error) {
      setAuthError(error.message)
    }
  }

  const handleReservationStatusChange = async (reservationId, nextStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/reservations/${reservationId}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ status: nextStatus }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Reservation update failed.')
      }

      setMessage('Reservation updated.')
      await fetchAdminData()
    } catch (error) {
      setAuthError(error.message)
    }
  }

  const handleDeleteReservation = async (reservationId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Reservation delete failed.')
      }

      setMessage('Reservation removed.')
      await fetchAdminData()
    } catch (error) {
      setAuthError(error.message)
    }
  }

  const handlePrintQrLabel = (table) => {
    const qrUrl = table.qrCodeUrl || ''

    if (!qrUrl) {
      const blankPrintWindow = window.open('', '_blank', 'width=520,height=700')
      if (!blankPrintWindow) return
      blankPrintWindow.document.write('<html><body><p>QR code is not available for this table yet.</p></body></html>')
      blankPrintWindow.document.close()
      return
    }

    const printHtml = `
      <!doctype html>
      <html>
        <head>
          <title>QR Label</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A5 portrait; margin: 8mm; }
            * { box-sizing: border-box; }
            html, body {
              margin: 0;
              background: #ffffff;
              font-family: Arial, sans-serif;
              color: #111827;
            }
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .card {
              width: 100%;
              max-width: 260px;
              border: 2px solid #111827;
              border-radius: 18px;
              padding: 18px 14px;
              text-align: center;
              background: #fff;
            }
            h2 {
              margin: 0 0 12px;
              font-size: 26px;
              line-height: 1.2;
            }
            img {
              display: block;
              width: 170px;
              height: 170px;
              margin: 0 auto 12px;
              object-fit: contain;
              background: #fff;
            }
            p {
              margin: 0;
              font-size: 12px;
              font-weight: 600;
              word-break: break-all;
            }
            @media print {
              body { margin: 0; }
              .card { border-width: 2px; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>${String(table.name || `Table ${table.number}`).replace(/</g, '&lt;')}</h2>
            <img src="${qrUrl}" alt="QR code for table ${table.number}" />
            <p>${window.location.origin}/?table=${table.number}</p>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank', 'width=520,height=700')
    if (!printWindow) {
      // Fallback: use an iframe
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      document.body.appendChild(iframe)
      const doc = iframe.contentWindow.document
      doc.open()
      doc.write(printHtml)
      doc.close()
      setTimeout(() => {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
        setTimeout(() => document.body.removeChild(iframe), 1000)
      }, 300)
      return
    }
    printWindow.document.open()
    printWindow.document.write(printHtml)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 300)
  }

  const filteredReservations = useMemo(() => {
    const term = reservationFilters.search.trim().toLowerCase()

    return reservations.filter((reservation) => {
      const matchesDate = reservationFilters.date ? reservation.reservationDate === reservationFilters.date : true
      const matchesStatus = reservationFilters.status === 'all' ? true : reservation.status === reservationFilters.status
      const matchesSearch = !term || [reservation.guestName, reservation.email, reservation.phone, reservation.tableNumber].join(' ').toLowerCase().includes(term)
      return matchesDate && matchesStatus && matchesSearch
    })
  }, [reservationFilters, reservations])

  const reservationDayMap = useMemo(() => {
    const map = new Map()

    reservations.forEach((reservation) => {
      if (!reservation.reservationDate) return
      const existing = map.get(reservation.reservationDate) || []
      existing.push(reservation)
      map.set(reservation.reservationDate, existing)
    })

    return map
  }, [reservations])

  const calendarDays = useMemo(() => {
    const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)
    const startDate = new Date(monthStart)
    startDate.setDate(startDate.getDate() - monthStart.getDay())

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + index)
      const dateKey = date.toISOString().slice(0, 10)
      return { date, dateKey }
    })
  }, [calendarMonth])

  const handleExportAnalytics = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total revenue', Number(analytics.summary?.totalRevenue || 0).toFixed(2)],
      ['Total orders', Number(analytics.summary?.totalOrders || 0)],
      ['Average order value', Number(analytics.summary?.avgOrderValue || 0).toFixed(2)],
      ['Best day', analytics.summary?.bestDay?.day || 'N/A'],
      ['', ''],
      ['Day', 'Revenue'],
      ...((analytics.revenueTrend || []).map((entry) => [entry.day, Number(entry.total || 0).toFixed(2)])),
      ['', ''],
      ['Top product', 'Quantity'],
      ...((analytics.topProducts || []).map((product) => [product.name, Number(product.quantity || 0)])),
      ['', ''],
      ['Category', 'Units sold'],
      ...Object.entries(analytics.categoryTotals || {}).map(([key, value]) => [key, Number(value || 0)])
    ]

    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'restaurant-analytics.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!adminUser) {
    return (
      <div className='admin-auth-page'>
        <div className='admin-auth-card'>
          <h2>Manager / Admin Login</h2>
          <p>Use a manager or admin account to manage orders and restaurant settings.</p>
          <form onSubmit={handleLogin} className='admin-login-form'>
            <input
              type='email'
              name='email'
              value={loginForm.email}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder='manager@minifour.com'
              required
            />
            <input
              type='password'
              name='password'
              value={loginForm.password}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder='Password'
              required
            />
            {authError && <p className='admin-error'>{authError}</p>}
            <button type='submit' disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
          </form>
        </div>
      </div>
    )
  }

  const tableLinks = (tables.length ? tables : Array.from({ length: 6 }, (_, index) => ({
    _id: `seed-${index + 1}`,
    number: index + 1,
    name: `Table ${index + 1}`,
    qrCodeUrl: '',
  }))).map((table) => ({
    number: table.number,
    name: table.name || `Table ${table.number}`,
    url: `${window.location.origin}/?table=${table.number}`,
    qrCodeUrl: table.qrCodeUrl || '',
  }))

  return (
    <>
      <div className='admin-page'>
      <div className='admin-header'>
        <div>
          <p className='eyebrow'>Dashboard</p>
          <h1>Minifour Management</h1>
        </div>
          {adminUser?.role !== 'manager' && (
            <button type='button' className='logout-button' onClick={handleLogout}>Logout</button>
          )}
      </div>

      {message && <div className='admin-message'>{message}</div>}
      {authError && <div className='admin-error'>{authError}</div>}

      {tableToDelete && (
        <div className='admin-confirm-overlay' onClick={() => setTableToDelete(null)}>
          <div className='admin-confirm-modal' onClick={(event) => event.stopPropagation()}>
            <h3>Remove table?</h3>
            <p>
              Are you sure you want to delete <strong>{tableToDelete.name || `Table ${tableToDelete.number}`}</strong>?
              This action cannot be undone.
            </p>
            <div className='admin-form-actions'>
              <button type='button' className='danger' onClick={() => handleDeleteTable(tableToDelete._id)}>Confirm removal</button>
              <button type='button' className='secondary-btn' onClick={() => setTableToDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <section className='admin-panel orders-panel'>
          <div className='panel-header'>
            <h2>Orders</h2>
          </div>
          <div className='admin-orders'>
            {orders.map((order) => (
              <div className='order-card' key={order._id}>
                <div className='order-card-top'>
                  <div>
                    <strong>#{order._id.slice(-6)}</strong>
                    <p>{order.user?.name || order.guestName || 'Guest'} • {order.tableNumber ? `Table ${order.tableNumber}` : order.address?.city || 'Walk-in'}</p>
                  </div>
                  <span className='status-pill'>{order.status}</span>
                </div>
                <div className='order-items'>
                  {(order.items || []).map((item, index) => (
                    <div key={`${order._id}-${index}`}>
                      {item.quantity}x {item.name} • {formatCurrency(Number(item.price))}
                    </div>
                  ))}
                </div>
                <div className='order-summary'>
                  <span>Total: {formatCurrency(Number(order.total || 0))}</span>
                  {order.status === 'awaiting_approval' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type='button' className='primary-btn small' onClick={() => handleStatusChange(order._id, 'approved')}>Approve</button>
                      <button type='button' className='danger small' onClick={() => handleStatusChange(order._id, 'cancelled')}>Reject</button>
                    </div>
                  )}
                  {order.status === 'approved' && (
                    <button type='button' className='primary-btn small' onClick={() => handleStatusChange(order._id, 'confirmed')}>Send to kitchen</button>
                  )}
                  {!['awaiting_approval', 'approved'].includes(order.status) && (
                    <select value={order.status} onChange={(event) => handleStatusChange(order._id, event.target.value)}>
                      <option value='confirmed'>confirmed</option>
                      <option value='preparing'>preparing</option>
                      <option value='ready'>ready</option>
                      <option value='served'>served</option>
                      <option value='cancelled'>cancelled</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {adminUser?.role !== 'manager' && (
        <section className='admin-panel summary-panel'>
          <div className='panel-header'>
            <h2>Business overview</h2>
          </div>
          <div className='stats-grid'>
            <div className='stat-card'>
              <span>Total revenue</span>
              <strong>{formatCurrency(summary.totalRevenue)}</strong>
            </div>
            <div className='stat-card'>
              <span>Total cost</span>
              <strong>{formatCurrency(summary.totalCost)}</strong>
            </div>
            <div className='stat-card'>
              <span>Gross profit</span>
              <strong>{formatCurrency(summary.grossProfit)}</strong>
            </div>
            <div className='stat-card'>
              <span>Active orders</span>
              <strong>{summary.activeOrders}</strong>
            </div>
            <div className='stat-card'>
              <span>Orders placed</span>
              <strong>{summary.totalOrders}</strong>
            </div>
            <div className='stat-card'>
              <span>Low stock</span>
              <strong>{summary.lowStockIngredients}</strong>
            </div>
          </div>
        </section>
      )}
    </div>

    {showDriveGallery && (
      <div className='admin-confirm-overlay' onClick={() => setShowDriveGallery(false)}>
        <div className='admin-confirm-modal' style={{ width: 'min(700px, 95%)', maxHeight: '80vh', overflowY: 'auto' }} onClick={(event) => event.stopPropagation()}>
          <h3 style={{ marginTop: 0 }}>Google Drive images</h3>
          <p style={{ color: '#555', marginBottom: '16px' }}>Pick an image from your Google Drive to use as a product photo.</p>

          {loadingDrive ? (
            <p className='empty-state'>Loading images from Google Drive...</p>
          ) : (
            <div className='table-qr-grid'>
              {driveImages.map((file) => (
                <div className='table-qr-card' key={file.id}>
              <img
                src={file.thumbnailLink || `https://drive.google.com/thumbnail?id=${file.id}`}
                alt={file.name}
                loading='lazy'
              />
              <small style={{ wordBreak: 'break-all' }}>{file.name}</small>
              <button
                type='button'
                className='secondary-btn small'
                onClick={() => {
                  const url = `https://drive.google.com/uc?export=view&id=${file.id}`
                  setProductForm((prev) => ({ ...prev, image: url }))
                  setShowDriveGallery(false)
                }}
              >
                    Use image
                  </button>
                </div>
              ))}
              {!driveImages.length && (
                <p className='empty-state'>No images found in Google Drive.</p>
              )}
            </div>
          )}

          <div className='admin-form-actions' style={{ marginTop: '20px' }}>
            <button type='button' className='secondary-btn' onClick={() => setShowDriveGallery(false)}>Close</button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default Admin
