import type { EvaluationType, Subject } from '@/sync'
import { ArrowDown, Calendar, ChevronLeft, ChevronRight, Filter, Loader2, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useHistory } from '@/hooks/use-history'
import { formatDisplayDate } from '@/lib/date-utils'

interface HistoricalViewProps {
  subjects: Subject[]
  evaluationTypes: EvaluationType[]
}

export function HistoricalView({ subjects, evaluationTypes }: HistoricalViewProps) {
  const {
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
    observerTarget,
    visibleDaysCount,
  } = useHistory(subjects)

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Lade Verlauf...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen (Fach, Notiz)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
          {search && <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-3"><X className="h-3 w-3 text-muted-foreground" /></button>}
        </div>

        <Select
          value={subjectFilter}
          onValueChange={(v) => {
            setSubjectFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="Fach" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Fächer</SelectItem>
            {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select
          value={timeFilter}
          onValueChange={(v) => {
            setTimeFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Zeitraum" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Gesamt</SelectItem>
            <SelectItem value="7days">Letzte 7 Tage</SelectItem>
            <SelectItem value="30days">Letzte 30 Tage</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {paginatedHistory.length === 0
        ? (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg">Keine Einträge gefunden</h3>
                <p className="text-muted-foreground text-sm mt-1">{isFiltering ? 'Filter anpassen' : 'Noch keine Meldungen erfasst'}</p>
              </CardContent>
            </Card>
          )
        : (
            <div className="space-y-4">
              {isFiltering && (
                <div className="flex justify-between text-sm text-muted-foreground px-1">
                  <span>
                    {filteredData.length}
                    {' '}
                    Treffer
                  </span>
                  <span>
                    Seite
                    {page}
                    {' '}
                    von
                    {totalPages}
                  </span>
                </div>
              )}

              {paginatedHistory.map(day => (
                <Card key={day.date} className="overflow-hidden">
                  <CardHeader className="bg-muted/20 py-3">
                    <div className="flex justify-between">
                      <CardTitle className="text-base font-medium flex gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        {formatDisplayDate(day.date)}
                      </CardTitle>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {day.totalCount}
                        {' '}
                        {day.totalCount === 1 ? 'Eintrag' : 'Einträge'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {Object.entries(day.bySubject).map(([subjectId, count]) => {
                      const subEntries = day.entries.filter(e => e.subjectId === subjectId)
                      const sub = subjects.find(s => s.id === subjectId)
                      return (
                        <div key={subjectId} className="pl-4 border-l-2" style={{ borderColor: sub?.color || '#ccc' }}>
                          <div className="flex gap-2 mb-2">
                            <span className="font-semibold text-sm">{sub?.name}</span>
                            <span className="text-xs text-muted-foreground">
                              (
                              {count}
                              )
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {subEntries.map((entry) => {
                              const et = evaluationTypes.find(t => t.id === entry.evaluationTypeId)
                              return (
                                <div key={entry.id} className="text-sm bg-card border rounded-md p-2 flex gap-2 shadow-sm">
                                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: et?.color }} />
                                  <div>
                                    <div className="font-medium text-xs text-muted-foreground">{et?.name}</div>
                                    {entry.note && (
                                      <div className="text-sm mt-0.5">
                                        "
                                        {entry.note}
                                        "
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              ))}

              {isFiltering && totalPages > 1 && (
                <div className="flex justify-center gap-2 py-4">
                  <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-sm font-medium py-2">
                    {page}
                    {' '}
                    /
                    {' '}
                    {totalPages}
                  </span>
                  <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              )}

              {!isFiltering && visibleDaysCount < groupedHistory.length && (
                <div ref={observerTarget} className="py-8 flex justify-center text-muted-foreground animate-pulse"><ArrowDown className="h-5 w-5 animate-bounce" /></div>
              )}
            </div>
          )}
    </div>
  )
}
