import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SearchBar from './SearchBar.js'
import { useCatalogue } from '../hooks/useCatalogue.js'
import { useStaff } from '../hooks/useStaff.js'
import { formatCurrency } from '../utils/pricing.js'
import { useAuth0 } from '@auth0/auth0-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import request from 'superagent'

// Hooks
import {
  useCreateCustomerOrder,
  useCreateCustomer,
} from '../hooks/useCustomers.js'
import AMSQuoteModal from './AMSQuoteModal.js'

export default function CatalogueList() {
  const { id } = useParams() // If undefined, we are in Global Mode
  const navigate = useNavigate()
  const { getAccessTokenSilently } = useAuth0()
  const queryClient = useQueryClient()

  const { results, loading, hasMore, performSearch } = useCatalogue()
  const { isTrusted } = useStaff()

  // -- MAIN CATALOGUE STATE --
  const [distFilter, setDistFilter] = useState('All')
  const [formatFilter, setFormatFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState('artist')
  const [searchTerm, setSearchTerm] = useState('')
  const [offset, setOffset] = useState(0)
  const observerTarget = useRef(null)

  // -- SHOP ORDER STATE --
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [dbTotal, setDbTotal] = useState(0)
  const [dbCount, setDbCount] = useState(0)
  const [budgetLimit, setBudgetLimit] = useState(0)
  const [sessionName, setSessionName] = useState('')
  const [quantities, setQuantities] = useState<{ [key: number]: string }>({})

  // -- 🗃️ FLOATING CUSTOMER DOCKET STATE --
  const createOrderMutation = useCreateCustomerOrder()
  const createCustomerMutation = useCreateCustomer()
  const [globalCustomerDocket, setGlobalCustomerDocket] = useState<any[]>([])
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [isCustomerModalMinimized, setIsCustomerModalMinimized] =
    useState(false)
  const [quotingItem, setQuotingItem] = useState<any | null>(null)
  const [exchangeRate, setExchangeRate] = useState(0.57)
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  })

  const distributors = [
    'All',
    'Southbound',
    'Universal Music',
    'Border Music',
    'Collective (LP)',
    'Collective (CD)',
    'Rhythmethod',
    'Sony Music',
    'Warner Music',
  ]
  const formats = ['All', 'LP', 'CD', '7"', '12"', 'Cassette']

  const addToWishlistMutation = useMutation({
    mutationFn: async (master_catalogue_id: number) => {
      const token = await getAccessTokenSilently()
      await request
        .post('/api/v1/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ master_catalogue_id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })

  // Sync Logic...
  const syncOrderContext = async () => {
    if (!id) return
    try {
      const token = await getAccessTokenSilently()
      const orderRes = await request
        .get(`/api/v1/orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
      setBudgetLimit(orderRes.body.budget_limit)
      setSessionName(orderRes.body.name)

      const summaryRes = await request
        .get(`/api/v1/orders/${id}/summary`)
        .set('Authorization', `Bearer ${token}`)
      setOrderItems(summaryRes.body.items)
      setDbTotal(summaryRes.body.stats.totalCost)
      setDbCount(
        summaryRes.body.items.reduce(
          (acc: number, item: any) => acc + item.quantity,
          0,
        ),
      )
    } catch (err) {
      console.error('Sync failed')
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const token = await getAccessTokenSilently()
        const settingsRes = await request
          .get('/api/v1/admin/settings')
          .set('Authorization', `Bearer ${token}`)
        const rateObj = settingsRes.body.settings?.find(
          (s: any) => s.key === 'usd_exchange_rate',
        )
        if (rateObj) setExchangeRate(Number(rateObj.value))

        if (id) {
          const orderRes = await request
            .get(`/api/v1/orders/${id}`)
            .set('Authorization', `Bearer ${token}`)
          setDistFilter(orderRes.body.distributor)
          await syncOrderContext()
        }
      } catch (err) {
        console.error(err)
      }
    }
    init()
  }, [id])

  useEffect(() => {
    setOffset(0)
    performSearch(searchTerm, distFilter, sortOrder, formatFilter, 0)
  }, [searchTerm, distFilter, sortOrder, formatFilter])

  useEffect(() => {
    if (offset > 0)
      performSearch(searchTerm, distFilter, sortOrder, formatFilter, offset)
  }, [offset])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading)
          setOffset((prev) => prev + 50)
      },
      { threshold: 1.0 },
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasMore, loading])

  // --- ACTIONS ---
  const handleAddToOrder = async (item: any) => {
    const qty = parseInt(quantities[item.id] || '1', 10)
    try {
      const token = await getAccessTokenSilently()
      await request
        .post(`/api/v1/orders/${id}/items`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          master_catalogue_id: item.id,
          quantity: qty,
          ams_price: item.price,
        })
      await syncOrderContext()
      setQuantities((prev) => ({ ...prev, [item.id]: '1' }))
    } catch (err) {
      console.error('Add failed')
    }
  }

  const handleRemoveItem = async (itemId: number) => {
    try {
      const token = await getAccessTokenSilently()
      await request
        .delete(`/api/v1/orders/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
      await syncOrderContext()
    } catch (err) {
      console.error('Remove failed')
    }
  }

  const handleFinalize = async () => {
    if (!window.confirm('Finalize this mission? This will lock the order.'))
      return
    try {
      const token = await getAccessTokenSilently()
      await request
        .patch(`/api/v1/orders/${id}/finalize`)
        .set('Authorization', `Bearer ${token}`)
      navigate('/')
    } catch (err) {
      console.error('Finalize failed')
    }
  }

  const handleDeleteOrder = async () => {
    if (!window.confirm('ABORT MISSION: Delete this entire order?')) return
    try {
      const token = await getAccessTokenSilently()
      await request
        .delete(`/api/v1/orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
      navigate('/')
    } catch (err) {
      console.error('Delete order failed')
    }
  }

  const handleReset = () => {
    setSearchTerm('')
    setDistFilter('All')
    setSortOrder('artist')
    setFormatFilter('All')
  }

  // --- CUSTOMER DOCKET LOGIC ---
  const handleAddCustomerItem = (item: any) => {
    const manualQuote = window.prompt(
      `Quote retail price for ${item.title} (Cost is $${item.price || 0}):`,
      String(Math.ceil((item.price || 0) * 1.5)),
    )
    if (!manualQuote) return

    setGlobalCustomerDocket((prev) => [
      ...prev,
      {
        ...item,
        quantity: 1,
        quoted_price: Number(manualQuote),
        master_catalogue_id: item.id,
      },
    ])
    setIsCustomerModalOpen(true)
    setIsCustomerModalMinimized(false)
  }

  const handleSaveQuote = (quotedItem: any) => {
    setGlobalCustomerDocket((prev) => [...prev, quotedItem])
    setIsCustomerModalOpen(true)
    setIsCustomerModalMinimized(false)
  }

  const handleFinalizeCustomerDocket = async () => {
    if (!customerForm.name || !customerForm.phone)
      return alert('Name and Phone are strictly required.')

    try {
      const newCustomer = await createCustomerMutation.mutateAsync({
        name: customerForm.name,
        phone: customerForm.phone,
        email: customerForm.email,
      })

      await createOrderMutation.mutateAsync({
        customerId: newCustomer.id,
        notes: customerForm.notes,
        items: globalCustomerDocket.map((item) => ({
          master_catalogue_id: item.master_catalogue_id,
          quantity: item.quantity,
          quoted_price: item.quoted_price,
          base_usd_price: item.base_usd_price,
          exchange_rate_used: item.exchange_rate_used,
        })),
      })

      alert('Customer Docket Successfully Created!')
      setGlobalCustomerDocket([])
      setCustomerForm({ name: '', phone: '', email: '', notes: '' })
      setIsCustomerModalOpen(false)
    } catch (err) {
      console.error(err)
      alert('Failed to save customer docket.')
    }
  }

  const getItemQuantityInOrder = (masterId: number) => {
    const match = orderItems.find((oi) => oi.master_catalogue_id === masterId)
    return match ? match.quantity : 0
  }

  return (
    <div
      className={`relative space-y-6 pb-20 ${id ? 'pr-80' : 'max-w-6xl mx-auto'}`}
    >
      {/* MAIN DATA TABLE */}
      <div className="bg-white shadow-xl rounded-[40px] overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase text-left tracking-widest">
                Artist
              </th>
              <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase text-left tracking-widest">
                Title
              </th>
              <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase text-left tracking-widest">
                Format
              </th>
              <th className="px-6 py-5 text-[9px] font-black text-gray-400 uppercase text-right tracking-widest">
                Wholesale
              </th>
              <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase text-center tracking-widest">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {results.map((item) => {
              const qtyInOrder = getItemQuantityInOrder(item.id)
              return (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50/20 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">
                      {item.artist || 'Various'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-500 font-medium">
                      {item.title}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${item.format?.includes('LP') ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}
                    >
                      {item.format || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-mono font-bold text-gray-400">
                    ${(item.price ?? 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {qtyInOrder > 0 && (
                        <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-lg animate-in fade-in zoom-in duration-300 whitespace-nowrap">
                          <span className="text-[9px] font-black">
                            ({qtyInOrder})
                          </span>
                        </div>
                      )}

                      {/* ACTION BUTTONS */}
                      {id ? (
                        isTrusted ? (
                          <>
                            <input
                              type="number"
                              min="1"
                              value={quantities[item.id] ?? '1'}
                              onChange={(e) =>
                                setQuantities({
                                  ...quantities,
                                  [item.id]: e.target.value,
                                })
                              }
                              className="w-10 p-2 bg-gray-50 border-none rounded-xl text-xs font-black text-center outline-none focus:ring-2 focus:ring-blue-100"
                            />
                            <button
                              onClick={() => handleAddToOrder(item)}
                              className="bg-gray-900 group-hover:bg-blue-600 text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase shadow-lg active:scale-95 transition-all"
                            >
                              Add
                            </button>
                          </>
                        ) : (
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            View Only
                          </span>
                        )
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 w-full max-w-[90px]">
                          {isTrusted && (
                            <>
                              <button
                                onClick={() => setQuotingItem(item)}
                                className="text-[9px] w-full font-black uppercase text-purple-600 hover:text-white border border-purple-200 hover:border-purple-500 bg-purple-50 hover:bg-purple-500 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
                              >
                                + Import Quote
                              </button>
                              <button
                                onClick={() => handleAddCustomerItem(item)}
                                className="text-[9px] w-full font-black uppercase text-blue-600 hover:text-white border border-blue-200 hover:border-blue-500 bg-blue-50 hover:bg-blue-500 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
                              >
                                + Local Quote
                              </button>
                            </>
                          )}
                          <button
                            onClick={() =>
                              addToWishlistMutation.mutate(item.id)
                            }
                            className="text-[9px] w-full font-black uppercase text-pink-600 hover:text-white border border-pink-200 hover:border-pink-500 bg-pink-50 hover:bg-pink-500 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
                          >
                            + Wishlist
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MODALS & WIDGETS */}
      {quotingItem && (
        <AMSQuoteModal
          item={quotingItem}
          exchangeRate={exchangeRate}
          onClose={() => setQuotingItem(null)}
          onSaveQuote={handleSaveQuote}
        />
      )}

      {/* FLOATING CUSTOMER DOCKET WIDGET */}
      {isCustomerModalOpen && (
        <div
          className={`fixed z-[100] right-6 transition-all duration-300 shadow-2xl flex flex-col border-[2px] border-white border-r-[#404040] border-b-[#404040] bg-[#C0C0C0] ${isCustomerModalMinimized ? 'bottom-0 w-[280px] h-8' : 'bottom-6 w-[340px] max-h-[85vh]'}`}
        >
          <div
            className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center cursor-pointer select-none"
            onClick={() =>
              setIsCustomerModalMinimized(!isCustomerModalMinimized)
            }
          >
            <span className="font-bold text-[10px] tracking-widest truncate pr-2">
              📝 Cust. Docket ({globalCustomerDocket.length})
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsCustomerModalOpen(false)
              }}
              className="text-white"
            >
              X
            </button>
          </div>

          {!isCustomerModalMinimized && (
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              <input
                placeholder="Customer Name *"
                value={customerForm.name}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, name: e.target.value })
                }
                className="w-full text-xs font-bold p-1.5 border border-gray-300 outline-none"
              />
              <input
                placeholder="Phone Number *"
                value={customerForm.phone}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, phone: e.target.value })
                }
                className="w-full text-xs font-bold p-1.5 border border-gray-300 outline-none"
              />
              <button
                onClick={handleFinalizeCustomerDocket}
                className="w-full bg-[#C0C0C0] border-2 border-white border-r-gray-600 border-b-gray-600 font-bold py-2"
              >
                Lock Docket
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
