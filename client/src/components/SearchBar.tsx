import React, { useState } from 'react'

interface Props {
  onSearch: (query: string) => void
}

export default function SearchBar({ onSearch }: Props) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleReset = () => {
    setQuery('')
    onSearch('') // Restores the full list
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100"
    >
      <div className="flex-grow relative">
        <input
          type="text"
          placeholder="Search Catalogue..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={handleReset}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-xs"
          >
            ✕
          </button>
        )}
      </div>

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg shadow-blue-200 active:transform active:scale-95"
      >
        Search
      </button>
    </form>
  )
}
