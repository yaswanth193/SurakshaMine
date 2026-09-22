"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ShieldAlert,
  FileText,
  Newspaper,
  Building2,
  CheckCheck,
  Calendar,
  Layers,
  ArrowLeft,
  Copy,
  Check,
  Scale,
  AlertOctagon,
  Printer,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { MiningNewsItem } from "@/app/api/news/route";

interface MiningNewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  news: MiningNewsItem[];
  isRead: (id: string) => boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  activeItem?: MiningNewsItem | null;
  onActiveItemChange?: (item: MiningNewsItem | null) => void;
}

const CATEGORIES = [
  "All",
  "DGMS Circular",
  "Safety Directive",
  "Ministry of Coal",
  "Industry News",
] as const;

export function MiningNewsModal({
  open,
  onOpenChange,
  news,
  isRead,
  markRead,
  markAllRead,
  activeItem,
  onActiveItemChange,
}: MiningNewsModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedItem, setSelectedItem] = useState<MiningNewsItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync activeItem prop if provided externally (e.g. clicked in header dropdown)
  useEffect(() => {
    if (activeItem) {
      setSelectedItem(activeItem);
      markRead(activeItem.id);
    }
  }, [activeItem, markRead]);

  // Reset selected item when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedItem(null);
      if (onActiveItemChange) onActiveItemChange(null);
    }
  }, [open, onActiveItemChange]);

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query) ||
        item.authority.toLowerCase().includes(query) ||
        item.source.toLowerCase().includes(query) ||
        (item.referenceNumber && item.referenceNumber.toLowerCase().includes(query)) ||
        (item.statutoryAct && item.statutoryAct.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [news, selectedCategory, search]);

  const handleSelectItem = (item: MiningNewsItem) => {
    setSelectedItem(item);
    markRead(item.id);
    if (onActiveItemChange) onActiveItemChange(item);
  };

  const handleBackToList = () => {
    setSelectedItem(null);
    if (onActiveItemChange) onActiveItemChange(null);
  };

  const handleCopyText = (item: MiningNewsItem) => {
    const fullText = `${item.title}\nReference: ${item.referenceNumber || "Official Notification"}\nAuthority: ${item.authority}\nDate: ${item.date}\n\n${item.summary}\n\n${(item.content || []).join("\n\n")}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Circular text copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryBadge = (category: MiningNewsItem["category"]) => {
    switch (category) {
      case "DGMS Circular":
        return (
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 gap-1 text-[11px]">
            <FileText className="h-3 w-3" /> DGMS Circular
          </Badge>
        );
      case "Safety Directive":
        return (
          <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30 gap-1 text-[11px]">
            <ShieldAlert className="h-3 w-3" /> Safety Directive
          </Badge>
        );
      case "Ministry of Coal":
        return (
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30 gap-1 text-[11px]">
            <Building2 className="h-3 w-3" /> Ministry of Coal
          </Badge>
        );
      case "Industry News":
      default:
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 gap-1 text-[11px]">
            <Newspaper className="h-3 w-3" /> National News
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
        {/* If an item is selected: IN-APP COMPLETE DOCUMENT READER (Zero external redirects) */}
        {selectedItem ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Reader Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/60 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="gap-1.5 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Circulars
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyText(selectedItem)}
                  className="h-8 text-xs gap-1.5 border-gray-200 dark:border-gray-700"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy Document"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="h-8 text-xs gap-1.5 border-gray-200 dark:border-gray-700 hidden sm:inline-flex"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </Button>
              </div>
            </div>

            {/* Reader Document Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-gray-800 dark:text-gray-200">
              {/* Document Meta Header Banner */}
              <div className="p-4 rounded-xl border border-yellow-200 dark:border-yellow-900/40 bg-yellow-50/30 dark:bg-yellow-950/20 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(selectedItem.category)}
                    {selectedItem.priority === "critical" && (
                      <Badge className="bg-red-600 text-white text-[10px] uppercase font-bold tracking-wider">
                        High Priority Mandate
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Published: {selectedItem.date}
                  </span>
                </div>

                <h1 className="text-lg md:text-xl font-bold text-gray-950 dark:text-white leading-snug">
                  {selectedItem.title}
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-yellow-200/60 dark:border-yellow-900/30">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Statutory Reference: </span>
                    <strong className="text-gray-900 dark:text-gray-100 font-mono text-[11px]">
                      {selectedItem.referenceNumber || "DGMS/DIRECTIVE/IN-APP"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Issuing Body: </span>
                    <strong className="text-gray-900 dark:text-gray-100">
                      {selectedItem.authority}
                    </strong>
                  </div>
                  {selectedItem.statutoryAct && (
                    <div className="sm:col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">Legal Authority: </span>
                      <strong className="text-gray-900 dark:text-gray-100">
                        {selectedItem.statutoryAct}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5" /> Statutory Executive Summary
                </h3>
                <p className="text-sm leading-relaxed p-3.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                  {selectedItem.summary}
                </p>
              </div>

              {/* Full Multi-Paragraph Content */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Complete Operative Text & Directives
                </h3>
                <div className="space-y-2.5 text-sm leading-relaxed">
                  {(selectedItem.content || [selectedItem.summary]).map((paragraph, idx) => (
                    <p key={idx} className="text-gray-800 dark:text-gray-200">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Action Checklist for Colliery Management */}
              {selectedItem.keyActionPoints && selectedItem.keyActionPoints.length > 0 && (
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <CheckCheck className="h-4 w-4" /> Mandatory Colliery Compliance Checklist
                  </h4>
                  <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                    {selectedItem.keyActionPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Statutory Penal Clause */}
              {selectedItem.penaltyClause && (
                <div className="p-3.5 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/20 text-xs text-red-900 dark:text-red-300 flex items-start gap-2.5">
                  <AlertOctagon className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase tracking-wider">Statutory Penalty Provision: </span>
                    <span>{selectedItem.penaltyClause}</span>
                  </div>
                </div>
              )}

              {/* Authority Authentication Seal */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-right text-xs text-gray-500">
                <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedItem.authority}</p>
                <p>{selectedItem.source}</p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">Verified Internal Document · SurakshaMine Governance</p>
              </div>
            </div>

            {/* Reader Footer */}
            <div className="p-3 px-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between text-xs text-gray-500">
              <span>Viewing complete statutory circular record in SurakshaMine</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="h-7 text-xs"
              >
                Back to List
              </Button>
            </div>
          </div>
        ) : (
          /* Circulars List View */
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-sm">
                      🇮🇳
                    </span>
                    Indian Mining Circulars & Live News
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Official DGMS Directives, Ministry of Coal notifications, and real-time coal industry updates — readable in full inside SurakshaMine
                  </DialogDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllRead}
                  className="text-xs gap-1.5 h-8 shrink-0 border-gray-300 dark:border-gray-700"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all as read
                </Button>
              </div>

              {/* Search & Filter bar */}
              <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by keyword, circular number, CMR regulation..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                  />
                </div>
                {/* Category selection */}
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                        selectedCategory === cat
                          ? "bg-yellow-600 text-white font-medium shadow-xs"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {filteredNews.length === 0 ? (
                <div className="py-12 text-center">
                  <Layers className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    No circulars or news matching your criteria
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Try searching for another keyword or selecting "All"
                  </p>
                </div>
              ) : (
                filteredNews.map((item) => {
                  const read = isRead(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        read
                          ? "bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-800 opacity-80 hover:opacity-100 hover:border-yellow-300 dark:hover:border-yellow-700"
                          : "bg-yellow-50/30 dark:bg-yellow-950/10 border-yellow-200 dark:border-yellow-900/40 shadow-xs hover:border-yellow-400"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {getCategoryBadge(item.category)}
                          {item.priority === "critical" && (
                            <Badge className="bg-red-500 text-white text-[10px] uppercase tracking-wider font-bold">
                              Urgent Directive
                            </Badge>
                          )}
                          {item.referenceNumber && (
                            <span className="text-[10px] font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                              {item.referenceNumber}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {item.date}
                          </span>
                        </div>
                        {!read && (
                          <span className="h-2 w-2 rounded-full bg-yellow-600 shrink-0 mt-1" title="Unread" />
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-2 leading-snug">
                        {item.title}
                      </h3>

                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed line-clamp-2">
                        {item.summary}
                      </p>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800/80">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          Authority: <strong className="text-gray-700 dark:text-gray-300">{item.authority}</strong> · Source: {item.source}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                          Read In-App <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 px-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between text-xs text-gray-500">
              <span>
                Displaying <strong>{filteredNews.length}</strong> official circulars & statutory directives
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-7 text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
