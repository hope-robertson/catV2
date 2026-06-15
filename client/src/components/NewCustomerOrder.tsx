import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import request from 'superagent'
import { useCatalogue } from '../hooks/useCatalogue.js'
import {
  useCreateCustomerOrder,
  useCreateCustomer,
} from '../hooks/useCustomers.js'
import SearchBar from './SearchBar.js'
import AMSQuoteModal from './AMSQuoteModal.js'
import { formatCurrency } from '../utils/pricing.js'

export default function NewCustomerOrder() {
  const navigate = useNavigate()
  const { getAccessTokenSilently } = useAuth0()

  // 📦 Hooks
  const { results, loading, performSearch } = useCatalogue()
  const createOrderMutation = useCreateCustomerOrder()
  const createCustomerMutation = useCreateCustomer()

  // 🗃️ State
  const [searchTerm, setSearchTerm] = useState('')
  const [exchangeRate, setExchangeRate] = useState(0.57) // Fallback
  const [docketItems, setDocketItems] = useState<any[]>([])
  const [quotingItem, setQuotingItem] = useState<any | null>(null)

  // Non-negotiable Customer Details
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  })

  // Fetch store settings on mount to get the exchange rate
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = await getAccessTokenSilently()
        const res = await request
          .get('/api/v1/admin/settings')
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

  // Search trigger
  useEffect(() => {
    performSearch(searchTerm, 'All', 'artist', 'All', 0)
  }, [searchTerm])

  // Adds standard local items straight to the docket
  const handleAddStandardItem = (item: any) => {
    // Prompt for standard retail price quote
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
  }

  const handleRemoveFromDocket = (indexToRemove: number) => {
    setDocketItems((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  // The Big Submit
  const handleFinalizeDocket = async () => {
    // Guard Clause: Non-negotiables
    if (!customerForm.name || !customerForm.phone)
      return alert('Name and Phone are strictly required.')
    if (docketItems.length === 0)
      return alert('You must add at least one record to the docket.')

    try {
      // 1. Create the customer in the DB first
      const newCustomer = await createCustomerMutation.mutateAsync({
        name: customerForm.name,
        phone: customerForm.phone,
        email: customerForm.email,
      })

      // 2. Attach their ID and items to the Order Docket
      await createOrderMutation.mutateAsync({
        customerId: newCustomer.id,
        notes: customerForm.notes,
        items: docketItems.map((item) => ({
          master_catalogue_id: item.master_catalogue_id,
          quantity: item.quantity,
          quoted_price: item.quoted_price,
          base_usd_price: item.base_usd_price,
          exchange_rate_used: item.exchange_rate_used,
        })),
      })

      // 3. Success! Boot them back to the Hub
      navigate('/customers')
    } catch (err) {
      console.error(err)
      alert('Failed to save customer docket.')
    }
  }

  const docketTotal = docketItems.reduce(
    (sum, item) => sum + item.quoted_price * item.quantity,
    0,
  )
  const isFormValid =
    customerForm.name.length > 1 &&
    customerForm.phone.length > 5 &&
    docketItems.length > 0

  return (
    <div className="relative max-w-7xl mx-auto space-y-6 pb-20 pr-[380px] pt-10 px-6">
      {/* LEFT COLUMN: CATALOGUE SEARCH */}
      <div>
        <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
          Customer Request
        </h2>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2 mb-8">
          Search & Quote records
        </p>

        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <SearchBar onSearch={setSearchTerm} />
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
              {results.slice(0, 30).map((item) => (
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
                  <td className="px-6 py-4 text-center">
                    {/* The Quote Logic Button */}
                    <button
                      onClick={() =>
                        item.source_distributor === 'AMS'
                          ? setQuotingItem(item)
                          : handleAddStandardItem(item)
                      }
                      className={`text-[9px] font-black px-4 py-2 rounded-xl uppercase shadow-md active:scale-95 transition-all ${item.source_distributor === 'AMS' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-900 hover:bg-gray-700 text-white'}`}
                    >
                      {item.source_distributor === 'AMS'
                        ? 'Quote Import'
                        : 'Quote Local'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && (
            <div className="p-10 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">
              Scanning Data...
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: THE DOCKET (Sticky Sidebar) */}
      <div className="fixed top-10 right-6 w-[340px] z-40 h-[calc(100vh-80px)] flex flex-col gap-4">
        {/* Customer Details Form */}
        <div className="bg-white shadow-2xl rounded-[32px] border border-gray-100 flex flex-col overflow-hidden shrink-0">
          <div className="bg-gray-900 p-5">
            <h3 className="text-sm font-black uppercase tracking-widest text-white">
              Docket Details
            </h3>
          </div>
          <div className="p-5 space-y-4 bg-gray-50/50">
            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerForm.name}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, name: e.target.value })
                }
                className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none font-bold text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all mt-1"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={customerForm.phone}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, phone: e.target.value })
                }
                className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none font-bold text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all mt-1"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                Email (Optional)
              </label>
              <input
                type="email"
                value={customerForm.email}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, email: e.target.value })
                }
                className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none font-bold text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all mt-1"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                Internal Notes
              </label>
              <textarea
                value={customerForm.notes}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, notes: e.target.value })
                }
                className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none font-bold text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all mt-1 resize-none h-16"
                placeholder="e.g. Needs it by Friday..."
              ></textarea>
            </div>
          </div>
        </div>

        {/* Selected Items & Total */}
        <div className="bg-white shadow-2xl rounded-[32px] border border-gray-100 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-white">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Requested Items
            </h3>
            <span className="bg-blue-100 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded-full">
              {docketItems.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 bg-gray-50/50">
            {docketItems.length === 0 ? (
              <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-10">
                Search & Quote a record
              </p>
            ) : (
              <div className="space-y-2">
                {docketItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-3 rounded-2xl border border-gray-100 flex justify-between items-center group shadow-sm"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-[10px] font-black text-gray-900 truncate">
                        {item.artist}
                      </p>
                      <p className="text-[9px] font-bold text-gray-400 truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] font-black text-blue-600 mt-1">
                        Quoted: ${item.quoted_price}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromDocket(idx)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-900 p-5 shrink-0">
            <div className="flex justify-between items-end mb-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Total Value
              </span>
              <span className="text-2xl font-black text-white">
                {formatCurrency(docketTotal)}
              </span>
            </div>

            {/* 🎯 Non-Negotiable Enforcement */}
            <button
              onClick={handleFinalizeDocket}
              disabled={!isFormValid || createOrderMutation.isPending}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl ${isFormValid ? 'bg-green-500 hover:bg-green-400 text-white active:scale-95' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
            >
              {createOrderMutation.isPending
                ? 'Saving...'
                : 'Save & Lock Docket'}
            </button>
          </div>
        </div>
      </div>

      {/* Renders the Import Calculator when needed */}
      {quotingItem && (
        <AMSQuoteModal
          item={quotingItem}
          exchangeRate={exchangeRate}
          onClose={() => setQuotingItem(null)}
          onSaveQuote={(quotedItem) =>
            setDocketItems((prev) => [...prev, quotedItem])
          }
        />
      )}
    </div>
  )
}
