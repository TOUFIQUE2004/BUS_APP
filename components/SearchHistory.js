'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Clock, ArrowRight, Search } from 'lucide-react'

export default function SearchHistory({ onSelectRoute }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/search-history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setHistory(data.history)
      }
    } catch (error) {
      console.error('Error fetching search history:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Loading history...
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          No search history yet
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Recent Searches</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {history.map((item, index) => (
              <div
                key={index}
                className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                onClick={() => onSelectRoute(item.source, item.destination)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{item.source}</span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{item.destination}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.resultCount} buses found
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}