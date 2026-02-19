"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, type IChartApi, type ISeriesApi, ColorType } from "lightweight-charts";
import { getHistoricalData } from "@/app/actions/stocks";
import { Timeframe } from "@/lib/providers/types";
import { Loader2, X } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Note {
  id: string;
  content: string;
  createdAt: string | Date;
}

interface StockChartProps {
  symbol: string;
  exchange: string;
  timeframe: Timeframe;
  notes?: Note[];
}

function computeNoteMarkers(
  notes: Note[],
  data: Array<{ time: any; value: number }>,
  isIntraday: boolean
) {
  if (data.length === 0) return [];
  const first = data[0].time;
  const last = data[data.length - 1].time;

  return notes
    .map((note) => ({
      time: (isIntraday
        ? Math.floor(new Date(note.createdAt).getTime() / 1000)
        : new Date(note.createdAt).toISOString().split("T")[0]) as any,
      position: "aboveBar" as const,
      color: "#3b82f6",
      shape: "circle" as const,
      id: note.id,
      size: 2,
    }))
    .filter((m) =>
      typeof m.time === "number"
        ? m.time >= (first as number) && m.time <= (last as number)
        : m.time >= first && m.time <= last
    )
    .sort((a, b) =>
      typeof a.time === "number"
        ? (a.time as number) - (b.time as number)
        : String(a.time).localeCompare(String(b.time))
    );
}

export function StockChart({ symbol, exchange, timeframe, notes }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);

  // Persist chart data for marker recomputation and click matching
  const lastChartDataRef = useRef<{
    data: Array<{ time: any; value: number }>;
    isIntraday: boolean;
  }>({ data: [], isIntraday: false });

  // Always-current notes reference (avoids stale closures in chart event handlers)
  const notesRef = useRef<Note[] | undefined>(notes);
  useEffect(() => {
    notesRef.current = notes;
  });

  // Track the currently hovered marker ID via crosshair move (most reliable)
  const hoveredObjectIdRef = useRef<string | null>(null);

  // Chart initialization
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#888",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.1)", width: 1, style: 3 },
        horzLine: { color: "rgba(255,255,255,0.1)", width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.1)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.1)",
        timeVisible: timeframe === Timeframe.ONE_DAY,
      },
      handleScale: false,
      handleScroll: false,
    });

    const series = chart.addAreaSeries({
      lineColor: "#22c55e",
      topColor: "rgba(34, 197, 94, 0.3)",
      bottomColor: "rgba(34, 197, 94, 0.02)",
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Track which marker the cursor is over via crosshair move
    // hoveredObjectId is the correct field in lightweight-charts v4.1.x
    chart.subscribeCrosshairMove((param) => {
      const id = param.hoveredObjectId;
      hoveredObjectIdRef.current = typeof id === "string" ? id : null;
    });

    // On click: identify the note from the hovered marker ID or time-based fallback
    chart.subscribeClick((param) => {
      if (!param.point) {
        setSelectedNoteId(null);
        setPopoverPos(null);
        return;
      }

      // Strategy 1: use hoveredObjectId from the click param itself
      let markerId: string | null =
        typeof param.hoveredObjectId === "string" ? param.hoveredObjectId : null;

      // Strategy 2: use the marker last tracked by crosshair move
      if (!markerId) {
        markerId = hoveredObjectIdRef.current;
      }

      // Strategy 3: time-based matching (tolerance ±5 min for intraday, exact date for daily)
      if (!markerId && param.time && notesRef.current?.length) {
        const { isIntraday } = lastChartDataRef.current;
        const clickedTime = param.time;

        const matched = notesRef.current.find((note) => {
          const noteTime = isIntraday
            ? Math.floor(new Date(note.createdAt).getTime() / 1000)
            : new Date(note.createdAt).toISOString().split("T")[0];

          if (typeof clickedTime === "number" && typeof noteTime === "number") {
            return Math.abs(clickedTime - noteTime) < 300;
          }
          return noteTime === String(clickedTime);
        });

        if (matched) markerId = matched.id;
      }

      if (markerId) {
        setSelectedNoteId(markerId);
        setPopoverPos({ x: param.point.x, y: param.point.y });
      } else {
        setSelectedNoteId(null);
        setPopoverPos(null);
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [timeframe]);

  // Fetch data when symbol/exchange/timeframe changes
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      const result = await getHistoricalData(symbol, exchange, timeframe);

      if (cancelled || !seriesRef.current) return;

      if (result.success && result.candles && result.candles.length > 0) {
        const isIntraday =
          timeframe === Timeframe.ONE_DAY || timeframe === Timeframe.ONE_WEEK;

        const seen = new Set<string | number>();
        const data: Array<{ time: any; value: number }> = [];
        for (const c of result.candles) {
          const time = isIntraday
            ? Math.floor(new Date(c.timestamp).getTime() / 1000)
            : c.timestamp.split("T")[0];
          const key = String(time);
          if (seen.has(key)) continue;
          seen.add(key);
          data.push({ time: time as any, value: c.close });
        }
        data.sort((a, b) =>
          typeof a.time === "number" ? a.time - b.time : a.time.localeCompare(b.time)
        );

        lastChartDataRef.current = { data, isIntraday };
        seriesRef.current.setData(data);

        const firstPrice = result.candles[0].close;
        const lastPrice = result.candles[result.candles.length - 1].close;
        const isPositive = lastPrice >= firstPrice;

        seriesRef.current.applyOptions({
          lineColor: isPositive ? "#22c55e" : "#ef4444",
          topColor: isPositive ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)",
          bottomColor: isPositive ? "rgba(34, 197, 94, 0.02)" : "rgba(239, 68, 68, 0.02)",
        });

        // Apply note markers now that data is set
        const currentNotes = notesRef.current;
        if (currentNotes && currentNotes.length > 0) {
          seriesRef.current.setMarkers(computeNoteMarkers(currentNotes, data, isIntraday));
        }

        chartRef.current?.timeScale().fitContent();
      }
      setLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [symbol, exchange, timeframe]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-apply markers when notes change (e.g. after adding/deleting a note)
  useEffect(() => {
    if (!seriesRef.current) return;
    const { data, isIntraday } = lastChartDataRef.current;
    if (!notes || notes.length === 0 || data.length === 0) {
      seriesRef.current.setMarkers([]);
      return;
    }
    seriesRef.current.setMarkers(computeNoteMarkers(notes, data, isIntraday));
  }, [notes]);

  const selectedNote = notes?.find((n) => n.id === selectedNoteId);
  const containerWidth = chartContainerRef.current?.clientWidth ?? 300;

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <div ref={chartContainerRef} className="h-[300px] w-full" />

      {/* Note annotation popover */}
      {selectedNote && popoverPos && !loading && (
        <div
          className="absolute z-20 w-64 rounded-lg border bg-card shadow-xl"
          style={{
            left: Math.min(popoverPos.x + 8, Math.max(containerWidth - 272, 0)),
            top: popoverPos.y - 130 < 8 ? popoverPos.y + 20 : popoverPos.y - 130,
          }}
        >
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs text-muted-foreground">
              {format(new Date(selectedNote.createdAt), "MMM d, yyyy, h:mm a")}
            </span>
            <button
              onClick={() => {
                setSelectedNoteId(null);
                setPopoverPos(null);
              }}
              className="rounded p-0.5 hover:bg-muted"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto px-3 py-2">
            <div className="prose prose-sm prose-invert max-w-none text-xs prose-p:my-0.5 prose-ul:my-0.5 prose-li:my-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedNote.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
