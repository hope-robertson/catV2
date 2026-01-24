import React, { useState } from 'react'

interface Props {
  onSearch: (query: string, filter: string) => void
}

export default function SearchBar({ onSearch }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Don't search if the input is empty
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
          className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
        {/* Simple Search Icon (Magnifying Glass) */}
        <div className="absolute right-3 top-3.5 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
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
