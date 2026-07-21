import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import request from 'superagent'
import { useAuth0 } from '@auth0/auth0-react'
import { useStaff } from '../hooks/useStaff.js'
import { formatCurrency } from '../utils/pricing.js'
import * as ExcelJS from 'exceljs' // 🎯 Safe import for Vite

export default function OrderReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getAccessTokenSilently } = useAuth0()

  const [sliderVal, setSliderVal] = useState(0)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Custom UI confirm state to replace window.confirm()
  const [confirmAbort, setConfirmAbort] = useState(false)

  const { isTrusted } = useStaff()

  // 1. Fetch Header Info
  const { data: orderHeader, refetch: refetchHeader } = useQuery({
    queryKey: ['orderHeader', id],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      const res = await request
        .get(`/api/v1/orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
      setSliderVal(res.body.budget_limit)

      // 🎯 Auto-show modal if already finalized
      if (res.body.status === 'finalized') {
        setShowExportModal(true)
      }
      return res.body
    },
  })

  // 2. Fetch Detailed Summary
  const { data: summary, isLoading } = useQuery({
    queryKey: ['orderSummary', id],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      const res = await request
        .get(`/api/v1/orders/${id}/summary`)
        .set('Authorization', `Bearer ${token}`)
      return res.body
    },
  })

  const updateBudget = async (newVal: number) => {
    if (!isTrusted) return
    try {
      const token = await getAccessTokenSilently()
      await request
        .patch(`/api/v1/orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ budget_limit: newVal })
      await refetchHeader()
    } catch (err) {
      console.error('🔥 Patch failed:', err)
    }
  }

  // 🎯 THE FIX: Lock the order and POP THE MODAL (No Navigation!)
  const handleFinalize = async () => {
    setIsFinalizing(true)
    setErrorMsg(null)
    try {
      const token = await getAccessTokenSilently()
      await request
        .patch(`/api/v1/orders/${id}/finalize`)
        .set('Authorization', `Bearer ${token}`)

      // Show the export overlay!
      setShowExportModal(true)
    } catch (err: any) {
      console.error('Finalize failed:', err)
      setErrorMsg('Failed to lock the mission. Please check permissions.')
    } finally {
      setIsFinalizing(false)
    }
  }

  const handleDeleteOrder = async () => {
    try {
      const token = await getAccessTokenSilently()
      await request
        .delete(`/api/v1/orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
      navigate('/orders')
    } catch (err) {
      console.error('Delete order failed')
      setErrorMsg('Failed to delete the order.')
    }
  }

  // 📝 GENERATE TEXT FILE
  const handleExportText = () => {
    if (!summary) return

    let text = `PURCHASE ORDER: ${orderHeader?.name || `Session #${id}`}\n`
    text += `Distributor: ${orderHeader?.distributor}\n`
    text += `Date: ${new Date().toLocaleDateString()}\n\n`
    text += `MANIFEST:\n-------------------------------------------------\n`

    summary.items.forEach((item: any) => {
      text += `${item.quantity}x | ${item.artist} - ${item.title}\n`
      text += `    Format: ${item.format || 'N/A'} | Cat: ${item.catalogue_number || 'N/A'}\n\n`
    })

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `PO_${orderHeader?.distributor.replace(/\s+/g, '_')}_${id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 📊 GENERATE EXCEL FILE
  const handleExportExcel = async () => {
    if (!summary) return
    try {
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Manifest')

      sheet.columns = [
        { header: 'Qty', key: 'qty', width: 10 },
        { header: 'Artist', key: 'artist', width: 30 },
        { header: 'Title', key: 'title', width: 40 },
        { header: 'Format', key: 'format', width: 15 },
        { header: 'Catalogue No', key: 'cat_no', width: 20 },
        { header: 'Wholesale Cost', key: 'cost', width: 15 },
      ]

      sheet.getRow(1).font = { bold: true }
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' },
      }

      summary.items.forEach((item: any) => {
        sheet.addRow({
          qty: item.quantity,
          artist: item.artist,
          title: item.title,
          format: item.format,
          cat_no: item.catalogue_number,
          cost: item.ams_price,
        })
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `PO_${orderHeader?.distributor.replace(/\s+/g, '_')}_${id}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Excel generation failed:', err)
      setErrorMsg('Failed to generate Excel file.')
    }
  }

  if (isLoading)
    return (
      <div className="p-20 text-center font-black animate-pulse uppercase tracking-widest text-gray-400">
        Syncing Manifest...
      </div>
    )

  const items = summary?.items || []
  const stats = summary?.stats || { totalCost: 0 }
  const remaining = sliderVal - stats.totalCost

  return (
    <div className="relative max-w-5xl mx-auto mt-10 space-y-8 pb-20 px-4 pr-80">
      {/* 🚀 THE EXPORT MODAL OVERLAY */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl border-4 border-blue-100 text-center space-y-6">
            <div>
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">
                Mission Locked
              </h2>
              <p className="text-xs font-bold text-gray-400 mt-2">
                Select your preferred export format to download the manifest
                locally.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleExportText}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 py-6 rounded-3xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-sm"
              >
                .TXT File
              </button>
              <button
                onClick={handleExportExcel}
                className="bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-lg"
              >
                Excel File
              </button>
            </div>

            <button
              onClick={() => navigate('/orders')}
              className="w-full text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 pt-4"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* 🚀 TOP RIGHT HUD (Budget Slider) */}
      <div className="fixed top-24 right-6 w-72 z-40">
        <div className="bg-gray-900 shadow-2xl rounded-[32px] p-6 text-white border-2 border-white/10">
          <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-4">
            Budget Control
          </p>
          <input
            type="range"
            min="0"
            max="4000"
            step="50"
            value={sliderVal}
            onChange={(e) => isTrusted && setSliderVal(Number(e.target.value))}
            onMouseUp={() => isTrusted && updateBudget(sliderVal)}
            disabled={!isTrusted}
            className={`w-full h-2 bg-gray-700 rounded-lg appearance-none mb-2 ${isTrusted ? 'cursor-pointer accent-blue-500' : 'cursor-not-allowed opacity-50'}`}
          />
          <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase mb-4">
            <span>$0</span>
            <span className="text-white font-black text-sm">${sliderVal}</span>
            <span>$4000</span>
          </div>
          <div className="pt-4 border-t border-white/5 space-y-2">
            <div className="flex justify-between">
              <span className="text-[9px] font-black uppercase opacity-50">
                Spend
              </span>
              <span className="text-sm font-bold">
                {formatCurrency(stats.totalCost)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/5">
              <span className="text-[9px] font-black uppercase opacity-50 tracking-widest">
                Available
              </span>
              <span
                className={`text-sm font-bold ${remaining < 0 ? 'text-red-400' : 'text-green-400'}`}
              >
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-2xl font-bold text-sm text-center">
          {errorMsg}
        </div>
      )}

      {/* 🚀 HEADER & ACTION BUTTONS */}
      <div className="flex justify-between items-end border-b-4 border-gray-900 pb-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
            Review
          </h2>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-2">
            {orderHeader?.distributor} • Session #{id}
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/orders/${id}/catalogue`)}
            className="px-6 py-3 border-2 border-gray-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all active:scale-95"
          >
            ← Back
          </button>

          {isTrusted && !showExportModal && (
            <>
              <button
                onClick={handleFinalize}
                disabled={isFinalizing}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {isFinalizing ? 'Locking...' : 'Finalize & Export'}
              </button>

              {/* Custom UI Abort Confirmation (No window.confirm!) */}
              {confirmAbort ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDeleteOrder}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm transition-all active:scale-95"
                  >
                    Confirm Abort
                  </button>
                  <button
                    onClick={() => setConfirmAbort(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmAbort(true)}
                  className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-5 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  title="Abort Mission"
                >
                  <svg
                    style={{ width: '14px', height: '14px' }}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Abort
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 🚀 MANIFEST TABLE */}
      <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-left">
                Artist / Title
              </th>
              <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
                Qty
              </th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item: any) => (
              <tr
                key={item.item_id}
                className="hover:bg-blue-50/20 transition-colors"
              >
                <td className="px-8 py-6">
                  <p className="font-black text-gray-900 uppercase text-sm leading-none">
                    {item.artist}
                  </p>
                  <p className="text-xs font-bold text-gray-400 mt-1">
                    {item.title}
                  </p>
                  <p className="text-[9px] font-black text-blue-500 uppercase mt-1">
                    By: {item.staff_member || 'System'}
                  </p>
                </td>
                <td className="px-8 py-6 text-center font-mono font-bold text-gray-900">
                  {item.quantity}
                </td>
                <td className="px-8 py-6 text-right font-mono font-bold text-gray-600">
                  {formatCurrency(item.ams_price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
