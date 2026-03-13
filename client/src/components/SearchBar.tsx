import React, { useState } from 'react'

interface Props {
  onSearch: (query: string, filter: string) => void
}

export default function SearchBar({ onSearch }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    onSearch(query, filter)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100"
    >
      <div className="flex-grow relative">
        <input
          type="text"
          placeholder="Artist, Title, or Barcode..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
      </div>

      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
      >
        <option value="all">All Fields</option>
        <option value="artist">Artist</option>
        <option value="title">Title</option>
        <option value="barcode">Barcode</option>
      </select>

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg shadow-blue-200 active:transform active:scale-95"
      >
        Search
      </button>
    </form>
  )
}
