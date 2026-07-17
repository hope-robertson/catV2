import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import request from 'superagent'
import { useAuth0 } from '@auth0/auth0-react'
import { useStaff } from '../hooks/useStaff.js'
import { formatCurrency } from '../utils/pricing.js'
import ExcelJS from 'exceljs'

export default function OrderReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getAccessTokenSilently } = useAuth0()
  const { isTrusted } = useStaff()

  // UI State
  const [isFinalized, setIsFinalized] = useState(false)
  const [showAbortConfirm, setShowAbortConfirm] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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

  // 📝 Export Text
  const handleExportText = () => {
    if (!summary) return
    const text = summary.items
      .map((i: any) => `${i.quantity}x ${i.artist} - ${i.title} (${i.format})`)
      .join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `PO_${id}.txt`
    a.click()
  }

  // 📊 Export Excel
  const handleExportExcel = async () => {
    if (!summary) return
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Manifest')
    sheet.columns = [
      { header: 'Artist', key: 'artist', width: 30 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Format', key: 'format', width: 15 },
      { header: 'Cat No', key: 'cat_no', width: 20 },
      { header: 'Qty', key: 'qty', width: 10 },
      { header: 'Price', key: 'price', width: 15 },
    ]
    summary.items.forEach((i: any) =>
      sheet.addRow([
        i.artist,
        i.title,
        i.format,
        i.catalogue_number,
        i.quantity,
        i.ams_price,
      ]),
    )
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `PO_${id}.xlsx`
    a.click()
  }

  const handleFinalize = async () => {
    try {
      const token = await getAccessTokenSilently()
      await request
        .patch(`/api/v1/orders/${id}/finalize`)
        .set('Authorization', `Bearer ${token}`)
      setIsFinalized(true)
      setErrorMessage('')
    } catch (err: any) {
      setErrorMessage('Finalization failed: ' + err.message)
    }
  }

  const handleDelete = async () => {
    try {
      const token = await getAccessTokenSilently()
      await request
        .delete(`/api/v1/orders/${id}`)
        .set('Authorization', `Bearer ${token}`)
      navigate('/orders')
    } catch (err) {
      setErrorMessage('Delete failed')
    }
  }

  if (isLoading)
    return (
      <div className="p-20 text-center font-black animate-pulse">
        Syncing...
      </div>
    )

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6">
      {errorMessage && (
        <div className="bg-red-500 text-white p-4 rounded-xl mb-4">
          {errorMessage}
        </div>
      )}

      {isFinalized ? (
        <div className="bg-white p-12 rounded-[40px] shadow-2xl border text-center space-y-6">
          <h2 className="text-3xl font-black uppercase">Mission Locked</h2>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleExportText}
              className="bg-gray-900 text-white px-8 py-4 rounded-2xl"
            >
              Download .TXT
            </button>
            <button
              onClick={handleExportExcel}
              className="bg-green-600 text-white px-8 py-4 rounded-2xl"
            >
              Download .XLSX
            </button>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="underline text-gray-400"
          >
            Return to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-2xl border">
            <h3 className="font-black uppercase mb-4">Review Order #{id}</h3>
            <p className="text-gray-500">Review manifest before locking.</p>
          </div>

          <div className="flex justify-end gap-4">
            {showAbortConfirm ? (
              <>
                <button
                  onClick={() => setShowAbortConfirm(false)}
                  className="bg-gray-200 px-6 py-3 rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-6 py-3 rounded-2xl"
                >
                  Confirm Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowAbortConfirm(true)}
                  className="text-red-500 underline"
                >
                  Abort Mission
                </button>
                <button
                  onClick={handleFinalize}
                  className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase"
                >
                  Finalize Mission
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
