import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MENU_CATEGORIES } from '../../assets/assets'
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
  const [activeTab, setActiveTab] = useState('products')
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
    if (!adminUser?.role || adminUser.role !== 'admin') {
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
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.')
      }

      if (data.user.role !== 'admin') {
        throw new Error('This account is not an admin account.')
      }

      sessionStorage.setItem('minifour-token', data.token)
      sessionStorage.setItem('minifour-user', JSON.stringify(data.user))
      setAdminUser(data.user)
      setMessage('Logged in as admin.')
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
      const signatureResponse = await fetch(`${API_URL}/api/admin/upload-signature`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ folder: 'minifour/products' }),
      })

      const signatureData = await signatureResponse.json()
      if (signatureResponse.ok && signatureData.uploadUrl) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('api_key', signatureData.apiKey)
        formData.append('timestamp', String(signatureData.timestamp))
        formData.append('signature', signatureData.signature)
        formData.append('folder', signatureData.folder)

        const uploadResponse = await fetch(signatureData.uploadUrl, {
          method: 'POST',
          body: formData,
        })

        const uploadData = await uploadResponse.json()
        if (uploadResponse.ok && (uploadData.secure_url || uploadData.url)) {
          setProductForm((prev) => ({ ...prev, image: uploadData.secure_url || uploadData.url }))
          return
        }
      }

      const reader = new FileReader()
      reader.onload = () => {
        setProductForm((prev) => ({ ...prev, image: String(reader.result || '') }))
      }
      reader.readAsDataURL(file)
    } catch {
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

    const printBlob = new Blob([printHtml], { type: 'text/html;charset=utf-8' })
    const printUrl = URL.createObjectURL(printBlob)
    const printWindow = window.open(printUrl, '_blank', 'width=520,height=700')

    if (!printWindow) {
      URL.revokeObjectURL(printUrl)
      return
    }

    printWindow.addEventListener('load', () => {
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
        setTimeout(() => URL.revokeObjectURL(printUrl), 1000)
      }, 300)
    }, { once: true })
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
          <h2>Admin Login</h2>
          <p>Use the default admin account or a created admin account to manage the restaurant.</p>
          <form onSubmit={handleLogin} className='admin-login-form'>
            <input
              type='email'
              name='email'
              value={loginForm.email}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder='admin@minifour.com'
              required
            />
            <input
              type='password'
              name='password'
              value={loginForm.password}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder='Admin@Minifour123'
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
    <div className='admin-page'>
      <div className='admin-header'>
        <div>
          <p className='eyebrow'>Dashboard</p>
          <h1>Minifour Management</h1>
        </div>
        <button type='button' className='logout-button' onClick={handleLogout}>Logout</button>
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

      <section className='admin-panel summary-panel'>
        <div className='panel-header'>
          <h2>Business overview</h2>
        </div>
        <div className='stats-grid'>
          <div className='stat-card'>
            <span>Total revenue</span>
            <strong>${summary.totalRevenue.toFixed(2)}</strong>
          </div>
          <div className='stat-card'>
            <span>Total cost</span>
            <strong>${summary.totalCost.toFixed(2)}</strong>
          </div>
          <div className='stat-card'>
            <span>Gross profit</span>
            <strong>${summary.grossProfit.toFixed(2)}</strong>
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

      <div className='admin-tabs'>
        <button type='button' className={activeTab === 'products' ? 'admin-tab active' : 'admin-tab'} onClick={() => setActiveTab('products')}>Products</button>
        <button type='button' className={activeTab === 'users' ? 'admin-tab active' : 'admin-tab'} onClick={() => setActiveTab('users')}>Users</button>
        <button type='button' className={activeTab === 'ingredients' ? 'admin-tab active' : 'admin-tab'} onClick={() => setActiveTab('ingredients')}>Ingredients</button>
        <button type='button' className={activeTab === 'tables' ? 'admin-tab active' : 'admin-tab'} onClick={() => setActiveTab('tables')}>Tables</button>
        <button type='button' className={activeTab === 'analytics' ? 'admin-tab active' : 'admin-tab'} onClick={() => setActiveTab('analytics')}>Analytics</button>
        <button type='button' className={activeTab === 'reservations' ? 'admin-tab active' : 'admin-tab'} onClick={() => setActiveTab('reservations')}>Reservations</button>
        <button type='button' className={activeTab === 'payments' ? 'admin-tab active' : 'admin-tab'} onClick={() => setActiveTab('payments')}>Payments</button>
      </div>

      {activeTab === 'products' && (
        <div className='admin-grid'>
          <section className='admin-panel'>
            <div className='panel-header'>
              <h2>{editingProductId ? 'Edit product' : 'Add product'}</h2>
            </div>

            <form onSubmit={handleSubmitProduct} className='admin-product-form'>
              <input name='name' value={productForm.name} onChange={handleProductInput} placeholder='Product name' required />
              <textarea name='description' value={productForm.description} onChange={handleProductInput} placeholder='Description' required />
              <div className='two-column'>
                <input name='price' type='number' min='0' step='0.01' value={productForm.price} onChange={handleProductInput} placeholder='Selling price' required />
                <input name='costPrice' type='number' min='0' step='0.01' value={productForm.costPrice} onChange={handleProductInput} placeholder='Cost price' />
              </div>
              <div className='two-column'>
                <select name='category' value={productForm.category} onChange={handleProductInput} required>
                  {MENU_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <input type='text' name='image' value={productForm.image} onChange={handleProductInput} placeholder='Image URL or data URL' required />
              </div>
              <label className='upload-box'>
                <span>Upload product image</span>
                <input type='file' accept='image/*' onChange={handleProductImageChange} />
              </label>
              <div className='two-column'>
                <input name='stock' type='number' min='0' value={productForm.stock} onChange={handleProductInput} placeholder='Stock' required />
                <label className='checkbox-row'>
                  <input type='checkbox' name='featured' checked={productForm.featured} onChange={handleProductInput} />
                  Featured
                </label>
              </div>

              <div className='ingredient-lines-header'>
                <h3>Ingredient usage</h3>
                <button type='button' className='secondary-btn small' onClick={addIngredientLine}>Add ingredient</button>
              </div>

              {(productForm.ingredients || []).map((line, index) => (
                <div className='ingredient-line' key={`ingredient-${index}`}>
                  <input
                    placeholder='Ingredient name'
                    value={line.name}
                    onChange={(event) => updateIngredientLine(index, 'name', event.target.value)}
                  />
                  <input
                    type='number'
                    min='0'
                    step='0.1'
                    placeholder='Qty'
                    value={line.quantity}
                    onChange={(event) => updateIngredientLine(index, 'quantity', event.target.value)}
                  />
                  <input
                    placeholder='Unit'
                    value={line.unit}
                    onChange={(event) => updateIngredientLine(index, 'unit', event.target.value)}
                  />
                  <button type='button' className='danger small' onClick={() => removeIngredientLine(index)}>Remove</button>
                </div>
              ))}

              <div className='admin-form-actions'>
                <button type='submit' className='primary-btn'>{editingProductId ? 'Update product' : 'Create product'}</button>
                {editingProductId && (
                  <button type='button' className='secondary-btn' onClick={resetProductForm}>Cancel</button>
                )}
              </div>
            </form>
          </section>

          <section className='admin-panel'>
            <div className='panel-header'>
              <h2>Products</h2>
            </div>

            <div className='admin-list'>
              {products.map((product) => (
                <div className='admin-item' key={product._id}>
                  <div>
                    <strong>{product.name}</strong>
                    <p>{product.category} • Sell ${product.price} • Cost ${Number(product.costPrice || 0).toFixed(2)} • Stock: {product.stock}</p>
                  </div>
                  <div className='admin-item-actions'>
                    <button type='button' onClick={() => handleEditProduct(product)}>Edit</button>
                    <button type='button' className='danger' onClick={() => handleDeleteProduct(product._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'users' && (
        <div className='admin-grid'>
          <section className='admin-panel'>
            <div className='panel-header'>
              <h2>Create user</h2>
            </div>
            <form onSubmit={handleUserCreate} className='admin-product-form'>
              <input name='name' value={customerForm.name} onChange={handleUserInput} placeholder='Full name' required />
              <input name='email' type='email' value={customerForm.email} onChange={handleUserInput} placeholder='Email' required />
              <input name='password' type='password' value={customerForm.password} onChange={handleUserInput} placeholder='Temporary password' required />
              <select name='role' value={customerForm.role} onChange={handleUserInput}>
                <option value='admin'>Admin</option>
                <option value='chef'>Chef</option>
                <option value='client'>Client</option>
              </select>
              <button type='submit' className='primary-btn'>Create user</button>
            </form>
          </section>

          <section className='admin-panel'>
            <div className='panel-header'>
              <h2>Users</h2>
            </div>
            <div className='admin-list'>
              {users.map((user) => (
                <div className='admin-item' key={user._id}>
                  <div>
                    <strong>{user.name}</strong>
                    <p>{user.role} • {user.email}</p>
                  </div>
                  <div className='admin-item-actions'>
                    <button type='button' className='danger' onClick={() => handleDeleteUser(user._id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'ingredients' && (
        <div className='admin-grid'>
          <section className='admin-panel'>
            <div className='panel-header'>
              <h2>{editingIngredientId ? 'Edit ingredient' : 'Add ingredient'}</h2>
            </div>
            <form onSubmit={handleIngredientSubmit} className='admin-product-form'>
              <input name='name' value={ingredientForm.name} onChange={handleIngredientInput} placeholder='Ingredient name' required />
              <div className='two-column'>
                <input name='category' value={ingredientForm.category} onChange={handleIngredientInput} placeholder='Category' />
                <input name='unit' value={ingredientForm.unit} onChange={handleIngredientInput} placeholder='Unit' />
              </div>
              <div className='two-column'>
                <input name='stock' type='number' min='0' value={ingredientForm.stock} onChange={handleIngredientInput} placeholder='Stock' />
                <input name='costPerUnit' type='number' min='0' step='0.01' value={ingredientForm.costPerUnit} onChange={handleIngredientInput} placeholder='Cost per unit' />
              </div>
              <input name='minimumLevel' type='number' min='0' value={ingredientForm.minimumLevel} onChange={handleIngredientInput} placeholder='Minimum alert level' />
              <div className='admin-form-actions'>
                <button type='submit' className='primary-btn'>{editingIngredientId ? 'Update ingredient' : 'Add ingredient'}</button>
                {editingIngredientId && (
                  <button type='button' className='secondary-btn' onClick={() => { setEditingIngredientId(null); setIngredientForm(emptyIngredientForm) }}>Cancel</button>
                )}
              </div>
            </form>
          </section>

          <section className='admin-panel'>
            <div className='panel-header'>
              <h2>Ingredient stock</h2>
            </div>
            <div className='admin-list'>
              {ingredients.map((ingredient) => (
                <div className='admin-item' key={ingredient._id}>
                  <div>
                    <strong>{ingredient.name}</strong>
                    <p>{ingredient.stock} {ingredient.unit} • {ingredient.category} • cost ${Number(ingredient.costPerUnit || 0).toFixed(2)}</p>
                  </div>
                  <div className='admin-item-actions'>
                    <button type='button' onClick={() => handleEditIngredient(ingredient)}>Edit</button>
                    <button type='button' className='danger' onClick={() => handleDeleteIngredient(ingredient._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'tables' && (
        <div className='admin-grid'>
          <section className='admin-panel'>
            <div className='panel-header'>
              <h2>Add restaurant table</h2>
            </div>
            <form onSubmit={handleTableCreate} className='admin-product-form'>
              <input name='number' type='number' min='1' value={tableForm.number} onChange={handleTableInput} placeholder='Table number' required />
              <input name='name' value={tableForm.name} onChange={handleTableInput} placeholder='Display name (optional)' />
              <button type='submit' className='primary-btn'>Create table QR</button>
            </form>
          </section>

          <section className='admin-panel'>
            <div className='panel-header'>
              <h2>Table QR codes</h2>
            </div>
            <div className='table-qr-list'>
              {tables.map((table) => {
                const qrUrl = table.qrCodeUrl || ''
                return (
                  <div className='table-qr-item' key={table._id}>
                    <div className='table-qr-meta'>
                      <strong>{table.name || `Table ${table.number}`}</strong>
                      <small>{window.location.origin}/?table={table.number}</small>
                    </div>
                    {qrUrl ? <img src={qrUrl} alt={`QR code for table ${table.number}`} /> : <p className='admin-empty-state'>QR code not available yet.</p>}
                    <div className='admin-table-actions'>
                      <button type='button' className='secondary-btn small' onClick={() => handlePrintQrLabel(table)}>Print label</button>
                      <button type='button' className='danger small' onClick={() => setTableToDelete(table)}>Remove table</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className='admin-grid payment-layout'>
          <section className='admin-panel'>
            <div className='panel-header'>
              <h2>Payment simulation</h2>
            </div>
            <div className='payment-table-wrap'>
              <table className='payment-table'>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Table</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                      <td>{payment.customer}</td>
                      <td>{payment.tableNumber ?? '—'}</td>
                      <td>${Number(payment.total || 0).toFixed(2)}</td>
                      <td>{payment.paymentMethod}</td>
                      <td>{payment.paymentStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className='admin-panel'>
            <div className='panel-header'>
              <h2>Table QR links</h2>
            </div>
            <div className='table-qr-grid'>
              {tableLinks.map((table) => (
                <div className='table-qr-card' key={table.number}>
                  <strong>{table.name}</strong>
                  <img src={table.qrCodeUrl || table.url} alt={`QR for table ${table.number}`} />
                  <small>{table.url}</small>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className='admin-grid analytics-layout'>
              <section className='admin-panel'>
            <div className='panel-header analytics-header'>
              <h2>Revenue trend</h2>
              <button type='button' className='secondary-btn small' onClick={handleExportAnalytics}>Export CSV</button>
            </div>

            <div className='analytics-chart-wrap'>
              <ResponsiveContainer width='100%' height={260}>
                <BarChart data={analytics.revenueTrend || []}>
                  <CartesianGrid strokeDasharray='3 3' vertical={false} />
                  <XAxis dataKey='day' />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Bar dataKey='total' fill='#f26b4a' radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className='admin-panel'>
            <div className='panel-header'>
              <h2>Performance summary</h2>
            </div>
            <div className='analytics-summary-list'>
              <div className='analytics-summary-item'>
                <span>Total revenue</span>
                <strong>${Number(analytics.summary?.totalRevenue || 0).toFixed(2)}</strong>
              </div>
              <div className='analytics-summary-item'>
                <span>Total orders</span>
                <strong>{Number(analytics.summary?.totalOrders || 0)}</strong>
              </div>
              <div className='analytics-summary-item'>
                <span>Average order value</span>
                <strong>${Number(analytics.summary?.avgOrderValue || 0).toFixed(2)}</strong>
              </div>
              <div className='analytics-summary-item'>
                <span>Best day</span>
                <strong>{analytics.summary?.bestDay?.day || 'N/A'}</strong>
              </div>
            </div>

            <div className='analytics-breakdown'>
              <h3>Top products</h3>
              <ul>
                {(analytics.topProducts || []).map((product) => (
                  <li key={product.name}><span>{product.name}</span><strong>{product.quantity}</strong></li>
                ))}
              </ul>
            </div>

            <div className='analytics-breakdown'>
              <h3>Category mix</h3>
              <ul>
                {Object.entries(analytics.categoryTotals || {}).map(([name, value]) => (
                  <li key={name}><span>{name}</span><strong>{Number(value || 0)}</strong></li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'reservations' && (
        <div className='admin-grid reservation-layout'>
          <section className='admin-panel'>
            <div className='panel-header'>
              <h2>Reservation calendar</h2>
            </div>

            <div className='reservation-toolbar'>
              <button type='button' className='secondary-btn small' onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>Prev</button>
              <strong>{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
              <button type='button' className='secondary-btn small' onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>Next</button>
            </div>

            <div className='reservation-filters'>
              <input
                type='date'
                value={reservationFilters.date}
                onChange={(event) => setReservationFilters((prev) => ({ ...prev, date: event.target.value }))}
              />
              <select
                value={reservationFilters.status}
                onChange={(event) => setReservationFilters((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value='all'>All statuses</option>
                <option value='pending'>Pending</option>
                <option value='confirmed'>Confirmed</option>
                <option value='arrived'>Arrived</option>
                <option value='seated'>Seated</option>
                <option value='cancelled'>Cancelled</option>
              </select>
              <input
                type='search'
                placeholder='Search guest'
                value={reservationFilters.search}
                onChange={(event) => setReservationFilters((prev) => ({ ...prev, search: event.target.value }))}
              />
            </div>

            <div className='reservation-calendar-grid'>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className='calendar-weekday'>{day}</div>
              ))}

              {calendarDays.map(({ date, dateKey }) => {
                const dayReservations = reservationDayMap.get(dateKey) || []
                const isCurrentMonth = date.getMonth() === calendarMonth.getMonth()
                const isSelected = reservationFilters.date === dateKey

                return (
                  <button
                    key={dateKey}
                    type='button'
                    className={`calendar-day ${isCurrentMonth ? '' : 'calendar-day-muted'} ${isSelected ? 'calendar-day-selected' : ''}`}
                    onClick={() => setReservationFilters((prev) => ({ ...prev, date: prev.date === dateKey ? '' : dateKey }))}
                  >
                    <span className='calendar-date'>{date.getDate()}</span>
                    {dayReservations.slice(0, 2).map((reservation) => (
                      <small key={`${dateKey}-${reservation._id}`} className='calendar-reservation'>
                        {reservation.guestName.split(' ')[0]}
                      </small>
                    ))}
                    {dayReservations.length > 2 && <small>+{dayReservations.length - 2}</small>}
                  </button>
                )
              })}
            </div>
          </section>

          <section className='admin-panel'>
            <div className='panel-header'>
              <h2>Create reservation</h2>
            </div>
            <form onSubmit={handleReservationSubmit} className='admin-product-form'>
              <input name='guestName' value={reservationForm.guestName} onChange={handleReservationInput} placeholder='Guest name' required />
              <div className='two-column'>
                <input name='email' type='email' value={reservationForm.email} onChange={handleReservationInput} placeholder='Email' />
                <input name='phone' value={reservationForm.phone} onChange={handleReservationInput} placeholder='Phone' />
              </div>
              <div className='two-column'>
                <input name='tableNumber' type='number' min='1' value={reservationForm.tableNumber} onChange={handleReservationInput} placeholder='Table number' />
                <input name='partySize' type='number' min='1' value={reservationForm.partySize} onChange={handleReservationInput} placeholder='Party size' required />
              </div>
              <div className='two-column'>
                <input name='reservationDate' type='date' value={reservationForm.reservationDate} onChange={handleReservationInput} required />
                <input name='reservationTime' type='time' value={reservationForm.reservationTime} onChange={handleReservationInput} required />
              </div>
              <textarea name='notes' value={reservationForm.notes} onChange={handleReservationInput} placeholder='Guest notes' />
              <button type='submit' className='primary-btn'>Book reservation</button>
            </form>
          </section>

          <section className='admin-panel reservations-list-panel'>
            <div className='panel-header'>
              <h2>Reservations</h2>
              <span className='status-pill'>{filteredReservations.length}</span>
            </div>

            <div className='admin-list'>
              {filteredReservations.length === 0 && (
                <p className='admin-empty-state'>No reservations match the current filters.</p>
              )}

              {filteredReservations.map((reservation) => (
                <div className='admin-item' key={reservation._id}>
                  <div>
                    <strong>{reservation.guestName}</strong>
                    <p>
                      {reservation.reservationDate} at {reservation.reservationTime} • Party of {reservation.partySize}
                      {reservation.tableNumber ? ` • Table ${reservation.tableNumber}` : ''}
                    </p>
                    {reservation.notes && <p>{reservation.notes}</p>}
                  </div>
                  <div className='admin-item-actions'>
                    <select
                      value={reservation.status}
                      onChange={(event) => handleReservationStatusChange(reservation._id, event.target.value)}
                      aria-label={`Status for ${reservation.guestName}`}
                    >
                      <option value='pending'>pending</option>
                      <option value='confirmed'>confirmed</option>
                      <option value='arrived'>arrived</option>
                      <option value='seated'>seated</option>
                      <option value='cancelled'>cancelled</option>
                    </select>
                    <button type='button' className='danger' onClick={() => handleDeleteReservation(reservation._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

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
                {order.items.map((item, index) => (
                  <div key={`${order._id}-${index}`}>
                    {item.quantity}x {item.name} • ${Number(item.price).toFixed(2)}
                  </div>
                ))}
              </div>

              <div className='order-summary'>
                <span>Total: ${Number(order.total || 0).toFixed(2)}</span>
                <select value={order.status} onChange={(event) => handleStatusChange(order._id, event.target.value)}>
                  <option value='pending'>pending</option>
                  <option value='confirmed'>confirmed</option>
                  <option value='preparing'>preparing</option>
                  <option value='ready'>ready</option>
                  <option value='served'>served</option>
                  <option value='cancelled'>cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Admin
