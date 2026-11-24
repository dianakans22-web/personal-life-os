'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { MODULES } from '@/lib/seed-data';
import { useLifeOs } from '@/store/life-os-context';
import type { ModuleId, UiStateMode } from '@/lib/types';
import {
  BellIcon,
  CloseIcon,
  MenuDotsIcon,
  ModuleIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SunIcon,
} from './Icons';
import { RightDetailPanel } from './RightDetailPanel';
import { QuickCaptureModal } from './QuickCaptureModal';
import { CustomizeWidgetsModal } from './CustomizeWidgetsModal';
import { OverviewView } from './views/OverviewView';
import { DailyLifeView } from './views/DailyLifeView';
import { FinanceView } from './views/FinanceView';
import { TravelView } from './views/TravelView';
import { AcademicView } from './views/AcademicView';
import { TasksView } from './views/TasksView';
import { CalendarView } from './views/CalendarView';
import { JournalView } from './views/JournalView';
import { DocsDriveView } from './views/DocsDriveView';
import { SettingsView } from './views/SettingsView';

export function AppShell() {
  const {
    data,
    activeModule,
    setActiveModule,
    sidebarCollapsed,
    setSidebarCollapsed,
    theme,
    toggleTheme,
    uiState,
    setUiState,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    mobileMoreOpen,
    setMobileMoreOpen,
    openQuickCapture,
    searchQuery,
    setSearchQuery,
    setSelectedDetail,
    unreadNotificationsCount,
    markAllNotificationsRead,
    toasts,
  } = useLifeOs();

  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setMobileMoreOpen(false);
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setMobileDrawerOpen, setMobileMoreOpen]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: Array<{ id: string; label: string; meta: string; onClick: () => void }> = [];

    data.events
      .filter((e) => e.title.toLowerCase().includes(q) || e.module.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((e) =>
        results.push({
          id: e.id,
          label: e.title,
          meta: `Agenda · ${e.module}`,
          onClick: () => {
            setSelectedDetail({ type: 'event', id: e.id });
            setSearchQuery('');
          },
        })
      );

    data.transactions
      .filter((t) => t.merchant.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((t) =>
        results.push({
          id: t.id,
          label: t.merchant,
          meta: `Finance · ${t.type}`,
          onClick: () => {
            setActiveModule('finance');
            setSelectedDetail({ type: 'transaction', id: t.id });
            setSearchQuery('');
          },
        })
      );

    data.tasks
      .filter((t) => t.title.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((t) =>
        results.push({
          id: t.id,
          label: t.title,
          meta: `Task · ${t.status}`,
          onClick: () => {
            setActiveModule('tasks');
            setSelectedDetail({ type: 'task', id: t.id });
            setSearchQuery('');
          },
        })
      );

    data.trips
      .filter((t) => t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((t) =>
        results.push({
          id: t.id,
          label: t.name,
          meta: `Travel · ${t.city}`,
          onClick: () => {
            setActiveModule('travel');
            setSearchQuery('');
          },
        })
      );

    data.drive.files
      .filter((f) => f.name.toLowerCase().includes(q) || f.folderPath.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((f) =>
        results.push({
          id: f.id,
          label: f.name,
          meta: `Google Drive · ${f.folderPath}`,
          onClick: () => {
            setActiveModule('docs');
            setSearchQuery('');
          },
        })
      );

    return results.slice(0, 10);
  }, [data.drive.files, data.events, data.tasks, data.transactions, data.trips, searchQuery, setActiveModule, setSearchQuery, setSelectedDetail]);

  const groups: Array<'Utama' | 'Pengelolaan' | 'Memori & Sistem'> = ['Utama', 'Pengelolaan', 'Memori & Sistem'];

  const renderActiveView = () => {
    if (uiState === 'loading') {
      return (
        <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Memuat data">
          <div className="h-24 rounded-2xl card-surface" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-44 rounded-2xl card-surface" />
            <div className="h-44 rounded-2xl card-surface" />
          </div>
          <div className="h-56 rounded-2xl card-surface" />
        </div>
      );
    }

    if (uiState === 'error') {
      return (
        <div className="rounded-2xl p-6 border border-[var(--status-danger-fg)] bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] space-y-3">
          <h2 className="text-base font-bold">Simulasi Error State (Verifikasi UX)</h2>
          <p className="text-xs">
            Gagal memuat data dari server contoh. Periksa koneksi jaringan atau coba muat ulang workspace.
          </p>
          <button
            type="button"
            onClick={() => setUiState('populated')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-panel-deep)] text-white"
          >
            Pulihkan ke Mode Populated
          </button>
        </div>
      );
    }

    if (uiState === 'empty') {
      return (
        <div className="rounded-2xl p-8 card-surface text-center space-y-3">
          <h2 className="text-base font-bold">Belum Ada Data di Tampilan Ini (Empty State)</h2>
          <p className="text-xs text-[var(--ink-muted)] max-w-md mx-auto">
            Mulai dengan menambahkan agenda, transaksi, atau dokumen pertama melalui Quick Capture, atau kembali ke Data Simulasi Blueprint.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => openQuickCapture('Event')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white"
            >
              + Tambah Data Pertama
            </button>
            <button
              type="button"
              onClick={() => setUiState('populated')}
              className="px-4 py-2 rounded-xl text-xs font-semibold card-canvas"
            >
              Tampilkan Data Simulasi
            </button>
          </div>
        </div>
      );
    }

    switch (activeModule) {
      case 'overview':
        return <OverviewView />;
      case 'daily':
        return <DailyLifeView />;
      case 'calendar':
        return <CalendarView />;
      case 'finance':
        return <FinanceView />;
      case 'travel':
        return <TravelView />;
      case 'academic':
        return <AcademicView />;
      case 'tasks':
        return <TasksView />;
      case 'journal':
        return <JournalView />;
      case 'docs':
        return <DocsDriveView />;
      case 'settings':
        return <SettingsView />;
    }
  };

  const handleSelectModule = (id: ModuleId) => {
    setActiveModule(id);
    setMobileMoreOpen(false);
  };

  return (
    <div
      className="plos-shell min-h-screen lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row"
      data-theme={theme}
    >
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:rounded-lg focus:bg-[var(--bg-panel-deep)] focus:text-white focus:text-xs"
      >
        Lompat ke konten utama
      </a>

      {/* Left Collapsible Desktop Sidebar */}
      <aside
        aria-label="Navigasi modul utama"
        className={`hidden md:flex flex-col shrink-0 border-r border-[var(--border-hairline)] bg-[var(--bg-subtle)] transition-[width] duration-200 ${
          sidebarCollapsed ? 'w-[74px]' : 'w-[252px]'
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--border-hairline)] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[var(--bg-panel-deep)] text-[var(--bg-lime)] font-bold text-xs flex items-center justify-center shrink-0">
              OS
            </div>
            {!sidebarCollapsed && (
              <span className="text-[13px] font-bold whitespace-nowrap truncate">
                Personal Life OS
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label={sidebarCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-xs font-bold shrink-0"
          >
            {sidebarCollapsed ? '>>' : '<<'}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto thin-scroll p-3 space-y-4">
          {groups.map((grp) => (
            <div key={grp} className="space-y-1">
              {!sidebarCollapsed && (
                <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                  {grp}
                </p>
              )}
              {MODULES.filter((m) => m.group === grp).map((mod) => {
                const active = activeModule === mod.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    title={mod.label}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => handleSelectModule(mod.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[var(--bg-panel-deep)] text-white'
                        : 'text-[var(--ink-primary)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <ModuleIcon id={mod.id} />
                    {!sidebarCollapsed && (
                      <span className="truncate flex-1 text-left">{mod.label}</span>
                    )}
                    {!sidebarCollapsed && (
                      <span
                        className={`text-[10px] tabular-nums ${
                          active ? 'text-[var(--bg-lime)]' : 'text-[var(--ink-muted)]'
                        }`}
                      >
                        {mod.num}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Center Column (Top Bar + Scrollable Workspace) */}
      <div className="flex-1 min-w-0 flex flex-col lg:h-screen lg:overflow-hidden">
        {/* Sticky Top Bar */}
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-5 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]/95 backdrop-blur flex items-center justify-between gap-2 shrink-0">
          {/* Global Search */}
          <div className="relative flex-1 max-w-md">
            <label htmlFor="global-search" className="sr-only">Cari lintas modul</label>
            <SearchIcon className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="global-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari agenda, transaksi, tugas, trip, atau file Drive..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs card-surface"
            />
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 rounded-2xl card-canvas shadow-xl p-2 z-40 max-h-72 overflow-y-auto thin-scroll space-y-1">
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={r.onClick}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-hover)] text-xs"
                  >
                    <p className="font-semibold truncate">{r.label}</p>
                    <p className="text-[11px] text-[var(--ink-muted)] truncate">{r.meta}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <label htmlFor="top-ui-state" className="sr-only">Status UI</label>
            <select
              id="top-ui-state"
              value={uiState}
              onChange={(e) => setUiState(e.target.value as UiStateMode)}
              className="hidden xl:block px-2.5 py-2 rounded-xl text-xs card-surface"
            >
              <option value="populated">Populated</option>
              <option value="empty">Empty</option>
              <option value="loading">Loading</option>
              <option value="error">Error</option>
            </select>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Aktifkan mode gelap' : 'Aktifkan mode terang'}
              className="p-2.5 rounded-xl card-surface hover:bg-[var(--bg-hover)]"
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Buka notifikasi"
                className="p-2.5 rounded-xl card-surface hover:bg-[var(--bg-hover)] relative"
              >
                <BellIcon />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--bg-lime)] text-[var(--ink-on-lime)] text-[10px] font-bold flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl card-canvas shadow-xl p-3 z-40 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold">Notifikasi ({unreadNotificationsCount})</p>
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-[11px] font-semibold text-[var(--link-accent)] hover:underline"
                    >
                      Tandai dibaca
                    </button>
                  </div>
                  {data.notifications.map((n) => (
                    <div key={n.id} className="p-2 rounded-xl card-surface text-xs">
                      <p className="font-medium">{n.title}</p>
                      <p className="text-[10px] text-[var(--ink-muted)] mt-0.5">{n.module}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Buka ringkasan profil"
              className="lg:hidden px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-panel-deep)] text-white"
            >
              Profil
            </button>

            <button
              type="button"
              onClick={() => openQuickCapture('Event')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] hover:bg-[var(--cta-primary-hover)] text-white"
            >
              <PlusIcon className="w-3.5 h-3.5" /> Tambah
            </button>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto thin-scroll p-4 sm:p-5 pb-28 md:pb-6"
        >
          {renderActiveView()}
        </main>
      </div>

      {/* Desktop Pinned Right Panel (340px) */}
      <div className="hidden lg:block w-[340px] shrink-0 h-screen">
        <RightDetailPanel />
      </div>

      {/* Mobile / Tablet Slide-over Right Drawer */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex justify-end lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Panel ringkasan seluler"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div className="w-full max-w-sm h-full" onClick={(e) => e.stopPropagation()}>
            <RightDetailPanel compact />
          </div>
        </div>
      )}

      {/* Mobile Bottom 5-Tab Navigation */}
      <nav
        aria-label="Navigasi seluler bawah"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2 py-1.5 grid grid-cols-5 gap-1"
      >
        <button
          type="button"
          onClick={() => handleSelectModule('overview')}
          className={`tap-target flex flex-col items-center justify-center rounded-xl text-[10px] font-semibold ${
            activeModule === 'overview' ? 'bg-[var(--bg-panel-deep)] text-white' : 'text-[var(--ink-primary)]'
          }`}
        >
          <ModuleIcon id="overview" className="w-4 h-4 mb-0.5" />
          Home
        </button>
        <button
          type="button"
          onClick={() => handleSelectModule('calendar')}
          className={`tap-target flex flex-col items-center justify-center rounded-xl text-[10px] font-semibold ${
            activeModule === 'calendar' ? 'bg-[var(--bg-panel-deep)] text-white' : 'text-[var(--ink-primary)]'
          }`}
        >
          <ModuleIcon id="calendar" className="w-4 h-4 mb-0.5" />
          Calendar
        </button>
        <button
          type="button"
          onClick={() => openQuickCapture('Event')}
          aria-label="Tambah cepat"
          className="tap-target flex flex-col items-center justify-center rounded-xl text-[10px] font-bold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]"
        >
          <PlusIcon className="w-4 h-4 mb-0.5" />
          Add
        </button>
        <button
          type="button"
          onClick={() => handleSelectModule('finance')}
          className={`tap-target flex flex-col items-center justify-center rounded-xl text-[10px] font-semibold ${
            activeModule === 'finance' ? 'bg-[var(--bg-panel-deep)] text-white' : 'text-[var(--ink-primary)]'
          }`}
        >
          <ModuleIcon id="finance" className="w-4 h-4 mb-0.5" />
          Finance
        </button>
        <button
          type="button"
          onClick={() => setMobileMoreOpen(true)}
          className="tap-target flex flex-col items-center justify-center rounded-xl text-[10px] font-semibold text-[var(--ink-primary)]"
        >
          <MenuDotsIcon className="w-4 h-4 mb-0.5" />
          More
        </button>
      </nav>

      {/* Mobile More Sheet (All 10 Modules) */}
      {mobileMoreOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Semua modul Personal Life OS"
          onClick={() => setMobileMoreOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl card-canvas p-5 space-y-4 max-h-[82vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Semua 10 Modul Personal Life OS</h2>
              <button
                type="button"
                onClick={() => setMobileMoreOpen(false)}
                aria-label="Tutup daftar modul"
                className="p-2 rounded-lg card-surface"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MODULES.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => handleSelectModule(mod.id)}
                  className={`tap-target p-3 rounded-xl text-left flex items-center gap-2 text-xs font-semibold ${
                    activeModule === mod.id
                      ? 'bg-[var(--bg-panel-deep)] text-white'
                      : 'card-surface hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <ModuleIcon id={mod.id} />
                  <span className="truncate">{mod.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <QuickCaptureModal />
      <CustomizeWidgetsModal />

      {/* Live Toast Region */}
      <div aria-live="polite" className="fixed bottom-20 md:bottom-5 right-5 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="px-4 py-2.5 rounded-xl bg-[var(--bg-panel-deep)] text-white text-xs font-medium shadow-lg border border-white/15"
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
