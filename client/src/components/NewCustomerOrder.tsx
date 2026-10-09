import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'
import { API_BASE } from '../config.js'
import { useCatalogue } from '../hooks/useCatalogue.js'
import {
  useCreateCustomerOrder,
  useCreateCustomer,
} from '../hooks/useCustomers.js'
import SearchBar from './SearchBar.js'
import AMSQuoteModal from './AMSQuoteModal.js'
import FloatingCustomerDocket from './FloatingCustomerDocket.js'
import { formatCurrency } from '../utils/pricing.js'

export default function NewCustomerOrder() {
  const navigate = useNavigate()
  const { getAccessTokenSilently } = useAuth0()

  // Hooks
  const { results, loading, performSearch } = useCatalogue()
  const createOrderMutation = useCreateCustomerOrder()
  const createCustomerMutation = useCreateCustomer()

  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [exchangeRate, setExchangeRate] = useState(0.57)
  const [docketItems, setDocketItems] = useState<any[]>([])
  const [quotingItem, setQuotingItem] = useState<any | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(true)
  const [isCustomerModalMinimized, setIsCustomerModalMinimized] =
    useState(false)

  // UI Filters
  const [formatFilter, setFormatFilter] = useState('All Vinyl')
  const [sortOrder, setSortOrder] = useState('a-z')

  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  })

  // NZ Phone Validator
  const validatePhone = (phone: string) => {
    // Check for letters
    if (/[a-zA-Z]/.test(phone)) {
      setPhoneError('try entering numbers')
      return false
    }
    // Basic NZ check: 0 followed by 8-10 digits, or +64 followed by 8-10 digits
    const nzPhoneRegex = /^(\+64|0)[0-9]{8,10}$/
    const sanitized = phone.replace(/\s/g, '')

    if (phone.length > 0 && !nzPhoneRegex.test(sanitized)) {
      setPhoneError('please enter a valid nz number')
      return false
    }

    setPhoneError(null)
    return true
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setCustomerForm({ ...customerForm, phone: val })
    validatePhone(val)
  }

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = await getAccessTokenSilently()
        const res = await request
          .get(`${API_BASE}/api/v1/admin/settings`)
          .set('Authorization', `Bearer ${token}`)
        const rateObj = res.body.settings.find(
          (s: any) => s.key === 'usd_exchange_rate',
        )
        if (rateObj) setExchangeRate(Number(rateObj.value))
      } catch (err) {
        console.error('Failed to fetch exchange rate', err)
      }
    }
    fetchSettings()
  }, [getAccessTokenSilently])

  // 🎯 Hardcoded 'artist' prevents SQL crash while fetching search payload
  useEffect(() => {
    performSearch(searchTerm, 'All', 'artist', 'All', 0)
  }, [searchTerm])

  // Filtered and Sorted Results
  const processedResults = useMemo(() => {
    let filtered = [...results]

    // Format filtering logic
    if (formatFilter === 'All Vinyl') {
      filtered = filtered.filter((item) => {
        const fmt = (item.format || '').toLowerCase()
        return (
          fmt.includes('lp') ||
          fmt.includes('7"') ||
          fmt.includes('12"') ||
          fmt.includes('vinyl')
        )
      })
    } else if (formatFilter !== 'All') {
      filtered = filtered.filter((item) => item.format === formatFilter)
    }

    // Sorting logic
    filtered.sort((a, b) => {
      if (sortOrder === 'price-low') return (a.price || 0) - (b.price || 0)
      if (sortOrder === 'price-high') return (b.price || 0) - (a.price || 0)
      return (a.artist || '').localeCompare(b.artist || '') // Default A-Z
    })

    return filtered
  }, [results, formatFilter, sortOrder])

  const handleAddStandardItem = (item: any) => {
    const manualQuote = window.prompt(
      `Quote retail price for ${item.title} (Cost is $${item.price || 0}):`,
      String(Math.ceil((item.price || 0) * 1.5)),
    )
    if (!manualQuote) return

    setDocketItems((prev) => [
      ...prev,
      {
        ...item,
        quantity: 1,
        quoted_price: Number(manualQuote),
        master_catalogue_id: item.id,
      },
    ])
    setIsCustomerModalOpen(true)
  }

  const handleRemoveFromDocket = (indexToRemove: number) => {
    setDocketItems((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleFinalizeDocket = async () => {
    if (!customerForm.name || !customerForm.phone || phoneError)
      return alert('Name and a valid Phone number are strictly required.')
    if (docketItems.length === 0)
      return alert('You must add at least one record to the docket.')

    try {
      const newCustomer = await createCustomerMutation.mutateAsync({
        name: customerForm.name,
        phone: customerForm.phone,
        email: customerForm.email,
      })

      await createOrderMutation.mutateAsync({
        customerId: newCustomer.id,
        notes: customerForm.notes,
        items: docketItems.map((item) => ({
          master_catalogue_id: item.master_catalogue_id,
          quantity: item.quantity,
          quoted_price: item.quoted_price,
          base_usd_price: item.base_usd_price || null,
          exchange_rate_used: item.exchange_rate_used || null,
        })),
      })

      navigate('/customer-orders')
    } catch (err) {
      console.error(err)
      alert('Failed to save customer docket.')
    }
  }

  return (
    <div className="relative max-w-7xl mx-auto space-y-6 pb-20 pt-10 px-6">
      <div>
        <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
          Customer Request
        </h2>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2 mb-8">
          Search & Quote records
        </p>

        {/* Dropdowns and Search Bar Layout Adjusted */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <div className="flex-1">
            {/* 🎯 Aligned with updated SearchBar signature */}
            <SearchBar onSearch={(q) => setSearchTerm(q)} />
          </div>

          <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full items-center">
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-lg font-bold text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="All Vinyl">All Vinyl</option>
              <option value="LP">LP</option>
              <option value='7"'>7"</option>
              <option value='12"'>12"</option>
              <option value="CD">CD</option>
              <option value="Cassette">Cassette</option>
              <option value="All">Everything</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-blue-600 py-3 px-4 rounded-lg font-bold text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="a-z">A-Z</option>
              <option value="price-low">Price Low-High</option>
              <option value="price-high">Price High-Low</option>
            </select>
          </div>
        </div>

        <div className="bg-white shadow-xl rounded-[40px] overflow-hidden border border-gray-100">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase text-left tracking-widest">
                  Record
                </th>
                <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase text-right tracking-widest">
                  Supplier Data
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase text-center tracking-widest">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {processedResults.slice(0, 30).map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-gray-900">
                      {item.artist || 'Various'}
                    </p>
                    <p className="text-xs font-bold text-gray-500">
                      {item.title}
                    </p>
                    <span className="inline-block mt-1 bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                      {item.format}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {item.source_distributor}
                    </p>
                    <p className="text-sm font-mono font-bold text-gray-900 mt-1">
                      Cost: ${(item.price ?? 0).toFixed(2)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {/* Uniform Buttons: Local on Top */}
                    <div className="flex flex-col items-center gap-1.5 w-full max-w-[90px] mx-auto">
                      <button
                        onClick={() => handleAddStandardItem(item)}
                        className="w-full text-[9px] font-black uppercase text-blue-600 hover:text-white border border-blue-200 hover:border-blue-500 bg-blue-50 hover:bg-blue-500 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
                      >
                        + Local Quote
                      </button>
                      <button
                        onClick={() => setQuotingItem(item)}
                        className="w-full text-[9px] font-black uppercase text-purple-600 hover:text-white border border-purple-200 hover:border-purple-500 bg-purple-50 hover:bg-purple-500 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
                      >
                        + Import Quote
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {processedResults.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-10 text-center text-gray-400 text-[10px] font-black uppercase tracking-widest"
                  >
                    No items found matching those filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {loading && (
            <div className="p-10 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">
              Scanning Data...
            </div>
          )}
        </div>
      </div>

      <FloatingCustomerDocket
        isOpen={isCustomerModalOpen}
        isMinimized={isCustomerModalMinimized}
        onToggleMinimize={() =>
          setIsCustomerModalMinimized(!isCustomerModalMinimized)
        }
        onClose={() => setIsCustomerModalOpen(false)}
        docketItems={docketItems}
        onRemoveItem={handleRemoveFromDocket}
        customerForm={customerForm}
        setCustomerForm={setCustomerForm}
        onFinalize={handleFinalizeDocket}
        isPending={createOrderMutation.isPending}
      />

      {quotingItem && (
        <AMSQuoteModal
          item={quotingItem}
          exchangeRate={exchangeRate}
          onClose={() => setQuotingItem(null)}
          onSaveQuote={(quotedItem) => {
            setDocketItems((prev) => [...prev, quotedItem])
            setIsCustomerModalOpen(true)
          }}
        />
      )}
    </div>
  )
}
