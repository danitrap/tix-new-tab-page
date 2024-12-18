import { useState, useEffect } from 'react'

export interface Tab {
  id: number
  title: string
  url: string
  favIconUrl?: string
}

export type TabResult = {
  id: string;
  url: string;
  title: string;
  favIconUrl?: string;
  type: 'history';
} | {
  id: number;
  url: string;
  title: string;
  favIconUrl?: string;
  type: 'tab' ;
}

const fuzzyMatch = (pattern: string, str: string): number => {
  pattern = pattern.toLowerCase()
  str = str.toLowerCase()
  
  let score = 0
  let patternIdx = 0
  let prevMatchIdx = -1
  let consecutive = 0

  for (let strIdx = 0; strIdx < str.length && patternIdx < pattern.length; strIdx++) {
    if (str[strIdx] === pattern[patternIdx]) {
      // Consecutive matches get bonus points
      if (prevMatchIdx !== -1 && strIdx === prevMatchIdx + 1) {
        consecutive++
      } else {
        consecutive = 1
      }
      
      // Award points based on match position and consecutive matches
      score += (100 - strIdx) + (consecutive * 10)
      prevMatchIdx = strIdx
      patternIdx++
    }
  }

  // If we didn't match all characters, return 0
  return patternIdx === pattern.length ? score : 0
}

export const useTabs = (searchQuery: string) => {
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([])
  const [history, setHistory] = useState<chrome.history.HistoryItem[]>([])
  const [filteredTabs, setFilteredTabs] = useState<TabResult[]>([])

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      const [currentTabs, historyItems] = await Promise.all([
        chrome.tabs.query({}),
        chrome.history.search({
          text: searchQuery, // Update history search with query
          maxResults: 100,
          startTime: Date.now() - (7 * 24 * 60 * 60 * 1000)
        })
      ])
      // generate ids where missing
        currentTabs.forEach((tab, index) => {
            if (tab.id === undefined) {
            tab.id = index
            }
        })
        historyItems.forEach((historyItem ) => {
            if (historyItem.id === undefined) {
               historyItem.id = crypto.randomUUID() 
            }
        }
        )
      setTabs(currentTabs)
      setHistory(historyItems)
    }
    loadData()
  }, [searchQuery]) // Add searchQuery as dependency

  // Filter and combine results
  useEffect(() => {
    const query = searchQuery.toLowerCase()

    if (!query) {
      setFilteredTabs([])
      return
    }

    
    // Filter tabs
    const matchedTabs = tabs
    .filter(t => t.url)
    .map(tab => ({
      item: {
        id: tab.id || -1,
        title: tab.title || tab.url || '',
        url: tab.url!,
        type: 'tab' as const
      },
      score: Math.max(
        fuzzyMatch(query, tab.title || ''),
        fuzzyMatch(query, tab.url || '')
      )
    }))

    // Filter history with new query
    const openUrls = new Set(tabs.map(t => t.url))
    const matchedHistory = history
      .filter(h => !openUrls.has(h.url))
      .filter(h => h.url !== undefined)
      .map(h => ({
        item: {
          id: h.id,
          url: h.url!,
          title: h.title || h.url || '',
          type: 'history' as const
        },
        score: Math.max(
          fuzzyMatch(query, h.title || ''),
          fuzzyMatch(query, h.url || '')
        )
      }))


    // Combine and sort all results
    const combined = [...matchedTabs, ...matchedHistory]
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item)

    setFilteredTabs(combined)
  }, [searchQuery, tabs, history]) // Ensure all dependencies are listed

  return { filteredTabs }
}