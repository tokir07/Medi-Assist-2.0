import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Sparkles, AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { healthTipsService } from '../services/healthTipsService';
import type {
  HealthTipItem,
  CategoryCountItem,
  HealthActivityData,
} from '../types/healthTips';

import { CategoryTabs } from '../components/healthTips/CategoryTabs';
import { TipOfTheDayCard } from '../components/healthTips/TipOfTheDayCard';
import { RecommendedSection } from '../components/healthTips/RecommendedSection';
import { HealthTipGrid } from '../components/healthTips/HealthTipGrid';
import { ExploreTopicsCard } from '../components/healthTips/ExploreTopicsCard';
import { RecentlyViewedSection } from '../components/healthTips/RecentlyViewedSection';
import { HealthActivityCard } from '../components/healthTips/HealthActivityCard';
import { TipDetailsModal } from '../components/healthTips/TipDetailsModal';

export const HealthTipsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL State Synchronization
  const activeCategory = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('search') || '';
  const savedOnly = searchParams.get('saved') === 'true';

  // Data States
  const [tips, setTips] = useState<HealthTipItem[]>([]);
  const [tipOfTheDay, setTipOfTheDay] = useState<HealthTipItem | null>(null);
  const [recommendedTips, setRecommendedTips] = useState<HealthTipItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<HealthTipItem[]>([]);
  const [categories, setCategories] = useState<CategoryCountItem[]>([]);
  const [activity, setActivity] = useState<HealthActivityData | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [recLoading, setRecLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Selected tip modal state
  const [selectedTip, setSelectedTip] = useState<HealthTipItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  // Search input local state
  const [searchInput, setSearchInput] = useState<string>(searchQuery);

  // Load Main Tip Library
  const fetchTips = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await healthTipsService.getHealthTips({
        category: activeCategory === 'All' ? undefined : activeCategory,
        search: searchQuery || undefined,
        saved_only: savedOnly || undefined,
      });

      setTips(res.tips || []);
    } catch (err: any) {
      console.error('Failed to load health tips:', err);
      setError(err?.response?.data?.message || 'Unable to load health tips from server.');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery, savedOnly]);

  // Load Auxiliary Data (Tip of Day, Recommendations, Categories, Recents, Activity)
  const fetchAuxiliaryData = useCallback(async () => {
    try {
      setRecLoading(true);
      const [todayRes, recRes, catsRes, recentsRes, actRes] = await Promise.allSettled([
        healthTipsService.getTipOfTheDay(),
        healthTipsService.getRecommendedTips(4),
        healthTipsService.getCategories(),
        healthTipsService.getRecentlyViewedTips(6),
        healthTipsService.getHealthActivity(),
      ]);

      if (todayRes.status === 'fulfilled') setTipOfTheDay(todayRes.value);
      if (recRes.status === 'fulfilled') setRecommendedTips(recRes.value);
      if (catsRes.status === 'fulfilled') setCategories(catsRes.value.categories || []);
      if (recentsRes.status === 'fulfilled') setRecentlyViewed(recentsRes.value);
      if (actRes.status === 'fulfilled') setActivity(actRes.value);
    } catch (err) {
      console.error('Failed to load auxiliary health tips data:', err);
    } finally {
      setRecLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  useEffect(() => {
    fetchAuxiliaryData();
  }, [fetchAuxiliaryData]);

  // Filter actions
  const handleSelectCategory = (cat: string) => {
    const params = new URLSearchParams(searchParams);
    if (cat === 'All') {
      params.delete('category');
    } else {
      params.set('category', cat);
    }
    params.delete('saved');
    setSearchParams(params);
  };

  const handleToggleSavedOnly = () => {
    const params = new URLSearchParams(searchParams);
    if (savedOnly) {
      params.delete('saved');
    } else {
      params.set('saved', 'true');
      params.delete('category');
    }
    setSearchParams(params);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      params.set('search', searchInput.trim());
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    setSearchParams(params);
  };

  // Toggle Save handler
  const handleToggleSave = async (tipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Optimistic update
      setTips((prev) =>
        prev.map((t) => (t.id === tipId ? { ...t, is_saved: !t.is_saved } : t))
      );
      if (tipOfTheDay && tipOfTheDay.id === tipId) {
        setTipOfTheDay((prev) => (prev ? { ...prev, is_saved: !prev.is_saved } : null));
      }
      setRecommendedTips((prev) =>
        prev.map((t) => (t.id === tipId ? { ...t, is_saved: !t.is_saved } : t))
      );
      setRecentlyViewed((prev) =>
        prev.map((t) => (t.id === tipId ? { ...t, is_saved: !t.is_saved } : t))
      );
      if (selectedTip && selectedTip.id === tipId) {
        setSelectedTip((prev) => (prev ? { ...prev, is_saved: !prev.is_saved } : null));
      }

      await healthTipsService.toggleSaveTip(tipId);

      // Refresh activity stats
      const act = await healthTipsService.getHealthActivity();
      setActivity(act);
    } catch (err) {
      console.error('Failed to toggle save tip:', err);
    }
  };

  const handleOpenTip = (tip: HealthTipItem) => {
    setSelectedTip(tip);
    setIsDetailsOpen(true);
    // Refresh recently viewed after opening
    healthTipsService.getRecentlyViewedTips(6).then(setRecentlyViewed).catch(console.error);
    healthTipsService.getHealthActivity().then(setActivity).catch(console.error);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Health Tips</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Simple, practical guidance for everyday health.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search health tips..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-500 shadow-2xs transition"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-700"
            >
              ×
            </button>
          )}
        </form>
      </div>

      {/* 2. Primary Navigation Category Tabs */}
      <CategoryTabs
        activeCategory={activeCategory}
        savedOnly={savedOnly}
        onSelectCategory={handleSelectCategory}
        onToggleSavedOnly={handleToggleSavedOnly}
      />

      {/* 3. Tip of the Day (Only on All Tips default view without search) */}
      {!searchQuery && !savedOnly && activeCategory === 'All' && (
        <TipOfTheDayCard
          tip={tipOfTheDay}
          onReadMore={handleOpenTip}
          onToggleSave={handleToggleSave}
        />
      )}

      {/* 4. Main Grid: 8 Columns Left / 4 Columns Right on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns (Recommended Section & Health Tip Library Grid) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Personalized Recommendations (on default view) */}
          {!searchQuery && !savedOnly && activeCategory === 'All' && (
            <RecommendedSection
              tips={recommendedTips}
              loading={recLoading}
              onReadMore={handleOpenTip}
              onToggleSave={handleToggleSave}
            />
          )}

          {/* Section Heading */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {savedOnly
                  ? 'Your Saved Health Tips'
                  : searchQuery
                  ? `Search Results for "${searchQuery}"`
                  : activeCategory === 'All'
                  ? 'Explore All Health Tips'
                  : `${activeCategory} Articles`}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {tips.length} {tips.length === 1 ? 'article' : 'articles'}
            </span>
          </div>

          {/* Tips Grid */}
          <HealthTipGrid
            tips={tips}
            loading={loading}
            error={error}
            savedOnly={savedOnly}
            onRetry={fetchTips}
            onSelectTip={handleOpenTip}
            onToggleSave={handleToggleSave}
          />
        </div>

        {/* Right 4 Columns (Explore Topics, Health Activity, Recently Viewed) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Explore Topics Card */}
          <ExploreTopicsCard
            categories={categories}
            activeCategory={activeCategory}
            onSelectCategory={handleSelectCategory}
          />

          {/* Health Activity Summary (Saved Tips count, Recently Viewed count - strictly non-biometric activity counts!) */}
          <HealthActivityCard
            activity={activity}
            onViewSaved={handleToggleSavedOnly}
          />

          {/* Recently Viewed Articles */}
          <RecentlyViewedSection
            tips={recentlyViewed}
            onReadMore={handleOpenTip}
            onToggleSave={handleToggleSave}
          />
        </div>
      </div>

      {/* Tip Details Modal */}
      <TipDetailsModal
        tip={selectedTip}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTip(null);
        }}
        onToggleSave={handleToggleSave}
        onSelectTip={handleOpenTip}
      />
    </div>
  );
};
