import React, { useState, useEffect, useCallback } from 'react'
import { TabResult, useTabs } from './useTabs'
import './FuzzyModal.css' 

const createSearchUrl = (query: string) => {
    return `https://kagi.com/search?q=${encodeURIComponent(query)}`
  }

export const FuzzyModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [currentTabId, setCurrentTabId] = useState<number>()
  const { filteredTabs } = useTabs(searchQuery)

  // Reset selection when results change
  useEffect(() => {
    if (filteredTabs.length > 0) {
      setSelectedIndex(0)
    } else {
      setSelectedIndex(-1)
    }
  }, [filteredTabs])

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (!isOpen && 
          !event.ctrlKey && 
          !event.altKey && 
          !event.metaKey && 
          event.key.length === 1) {
        event.preventDefault()
        setIsOpen(true)
        setSearchQuery(event.key)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isOpen])

  const handleNoResults = useCallback(() => {
    chrome.tabs.create({ url: createSearchUrl(searchQuery) }, (newTab) => {
      if (currentTabId) {
        chrome.tabs.remove(currentTabId)
      }
    })
    setIsOpen(false)
  }, [searchQuery, currentTabId])

  const handleTabClick = useCallback((item: TabResult) => {
    if (item.type === 'tab' && item.id > 0) {
      chrome.tabs.update(item.id, { active: true }, () => {
        if (currentTabId) {
          chrome.tabs.remove(currentTabId)
        }
      })
    } else {
      chrome.tabs.create({ url: item.url }, (newTab) => {
        if (currentTabId) {
          chrome.tabs.remove(currentTabId)
        }
      })
    }
    setIsOpen(false)
  }, [currentTabId])
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsOpen((prev) => !prev)
      } else if (event.key === 'Escape') {
        setIsOpen(false)
      } else if (isOpen) {
        switch (event.key.toLowerCase()) {
          case 'arrowdown':
            event.preventDefault()
            setSelectedIndex((prev) => 
              prev < filteredTabs.length - 1 ? prev + 1 : prev
            )
            break
          case 'n':
            if (event.ctrlKey) {
              event.preventDefault()
              setSelectedIndex((prev) => 
                prev < filteredTabs.length - 1 ? prev + 1 : prev
              )
            }
            break
          case 'arrowup':
            event.preventDefault()
            setSelectedIndex((prev) => prev > 0 ? prev - 1 : prev)
            break
          case 'p':
            if (event.ctrlKey) {
              event.preventDefault()
              setSelectedIndex((prev) => prev > 0 ? prev - 1 : prev)
            }
            break
          case 'enter':
            event.preventDefault()
            if (filteredTabs.length > 0 && filteredTabs[selectedIndex]) {
              handleTabClick(filteredTabs[selectedIndex])
            } else if (searchQuery.trim()) {
              handleNoResults()
            }
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredTabs, selectedIndex, searchQuery, handleTabClick, handleNoResults])

  useEffect(() => {
    if (isOpen) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          setCurrentTabId(tabs[0].id)
        }
      })
    }
  }, [isOpen])




  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <input
            type="text"
            placeholder="Search tabs..."
            autoFocus
            className="modal-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="modal-results">
          {filteredTabs.map((tab, index) => (
            <div
              key={tab.id}
              className={`tab-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab.favIconUrl && <img src={tab.favIconUrl} alt="" className="tab-favicon" />}
              <span className="tab-title">{tab.title}</span>
              <span className="tab-url">{tab.url}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

