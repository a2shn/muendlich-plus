import type { ParticipationEntry, Subject } from '@/sync'
import { useEffect, useMemo, useRef, useState } from 'react'
import { levenshtein, useQueryState } from '@/lib/utils'
import { db } from '@/sync'

export interface DayStats {
  date: string
  entries: ParticipationEntry[]
  totalCount: number
  bySubject: Record<string, number>
}

export function useHistory(subjects: Subject[]) {
  const [allEntries, setAllEntries] = useState<ParticipationEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // URL State
  const [search, setSearch] = useQueryState('q')
  const [subjectFilter, setSubjectFilter] = useQueryState('subject', 'all')
  const [timeFilter, setTimeFilter] = useQueryState('time', 'all')

  // Pagination
  const [page, setPage] = useState(1)
  const [visibleDaysCount, setVisibleDaysCount] = useState(10)
  const observerTargetRef = useRef<HTMLDivElement>(null)
  const ITEMS_PER_PAGE = 10

  // Load Data
  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const data = await db.getAllEntries()
        setAllEntries(data)
      }
      catch (e) {
        console.error(e)
      }
      finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  // Filter Logic
  const filteredData = useMemo(() => {
    let data = [...allEntries]

    if (search) {
      const lowerSearch = search.toLowerCase()
      data = data.filter((e) => {
        const subject = subjects.find(s => s.id === e.subjectId)
        const subjectName = subject?.name.toLowerCase() || ''

        if (subjectName.includes(lowerSearch))
          return true

        // Fuzzy (only > 2 chars)
        if (lowerSearch.length > 2) {
          if (levenshtein(subjectName, lowerSearch) <= 2)
            return true
        }
        return false
      })
    }

    if (subjectFilter && subjectFilter !== 'all') {
      data = data.filter(e => e.subjectId === subjectFilter)
    }

    if (timeFilter !== 'all') {
      const days = timeFilter === '7days' ? 7 : 30
      const limit = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      data = data.filter(e => e.date >= limit)
    }

    return data.sort((a, b) => b.date.localeCompare(a.date))
  }, [allEntries, search, subjectFilter, timeFilter, subjects])

  // Grouping
  const groupedHistory = useMemo(() => {
    const groups: Record<string, ParticipationEntry[]> = {}
    filteredData.forEach((e) => {
      if (!groups[e.date])
        groups[e.date] = []
      groups[e.date].push(e)
    })
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, entries]) => {
        const bySubject: Record<string, number> = {}
        entries.forEach(e => bySubject[e.subjectId] = (bySubject[e.subjectId] || 0) + 1)
        return { date, entries, totalCount: entries.length, bySubject } as DayStats
      })
  }, [filteredData])

  const isFiltering = !!search || subjectFilter !== 'all' || timeFilter !== 'all'
  const totalPages = Math.ceil(groupedHistory.length / ITEMS_PER_PAGE)

  const paginatedHistory = useMemo(() => {
    if (!isFiltering)
      return groupedHistory.slice(0, visibleDaysCount)
    const start = (page - 1) * ITEMS_PER_PAGE
    return groupedHistory.slice(start, start + ITEMS_PER_PAGE)
  }, [groupedHistory, isFiltering, page, visibleDaysCount])

  // Infinite Scroll Logic
  useEffect(() => {
    if (isFiltering || isLoading)
      return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting)
        setVisibleDaysCount(p => Math.min(p + 10, groupedHistory.length))
    }, { threshold: 0.1 })

    if (observerTargetRef.current)
      observer.observe(observerTargetRef.current)
    return () => observer.disconnect()
  }, [groupedHistory.length, isFiltering, isLoading])

  return {
    isLoading,
    search,
    setSearch,
    subjectFilter,
    setSubjectFilter,
    timeFilter,
    setTimeFilter,
    page,
    setPage,
    totalPages,
    paginatedHistory,
    groupedHistory,
    filteredData,
    isFiltering,
    observerTarget: observerTargetRef,
    visibleDaysCount,
  }
}
