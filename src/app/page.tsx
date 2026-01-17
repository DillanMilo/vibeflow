'use client';

import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { cn } from '@/lib/utils';
import { PROJECT_COLORS } from '@/types';

type MobileView = 'board' | 'tasks' | 'notes';

function LoadingSkeleton() {
  return (
    <div className="flex flex-col h-dvh bg-background">
      <header className="flex-shrink-0 h-14 md:h-16 border-b border-border-subtle px-4 md:px-6 flex items-center">
        <div className="h-6 w-32 shimmer rounded" />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex gap-4 md:gap-6 p-4 md:p-6 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-72 md:w-80 flex-shrink-0 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-center gap-3 mb-4 px-1">
                <div className="h-4 w-4 shimmer rounded-full" />
                <div className="h-4 w-24 shimmer rounded" />
              </div>
              <div className="bg-surface/30 rounded-2xl p-3 min-h-[300px] border border-border-subtle">
                <div className="space-y-3">
                  {[1, 2].map((j) => (
                    <div key={j} className="h-24 shimmer rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </main>
        <aside className="hidden md:flex w-[340px] border-l border-border-subtle bg-background-elevated animate-slide-in flex-col">
          <div className="p-5 border-b border-border-subtle">
            <div className="h-5 w-28 shimmer rounded mb-4" />
            <div className="h-10 shimmer rounded-lg" />
          </div>
          <div className="p-5">
            <div className="h-5 w-20 shimmer rounded mb-4" />
            <div className="h-40 shimmer rounded-lg" />
          </div>
        </aside>
      </div>
      <div className="md:hidden h-16 border-t border-border-subtle bg-background-elevated" />
    </div>
  );
}

function ProjectSelector() {
  const { state, dispatch, activeProject } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setEditingId(null);
        setColorPickerId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddProject = () => {
    if (!newProjectName.trim()) return;
    dispatch({ type: 'ADD_PROJECT', payload: { name: newProjectName.trim() } });
    setNewProjectName('');
  };

  const handleSelectProject = (id: string) => {
    if (editingId || colorPickerId) return; // Don't select while editing
    dispatch({ type: 'SET_ACTIVE_PROJECT', payload: id });
    setIsOpen(false);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (state.projects.length <= 1) return;
    dispatch({ type: 'DELETE_PROJECT', payload: id });
  };

  const handleStartEdit = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingName(name);
    setColorPickerId(null);
  };

  const handleSaveEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!editingId || !editingName.trim()) return;
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: { id: editingId, updates: { name: editingName.trim() } },
    });
    setEditingId(null);
    setEditingName('');
  };

  const handleColorChange = (id: string, color: string) => {
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: { id, updates: { color } },
    });
    setColorPickerId(null);
  };

  const toggleColorPicker = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setColorPickerId(colorPickerId === id ? null : id);
    setEditingId(null);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Prevent iOS from auto-scrolling the input into view in PWA mode
    // This prevents the keyboard jump issue on iPad
    e.target.scrollIntoView({ behavior: 'instant', block: 'nearest' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Project selector button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200',
          'hover:bg-surface-hover active:bg-surface-active',
          'text-sm font-medium text-text-primary',
          isOpen && 'bg-surface-hover'
        )}
      >
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: activeProject?.color || PROJECT_COLORS[0] }}
        />
        <span className="truncate max-w-[120px] md:max-w-[180px]">
          {activeProject?.name || 'Select Project'}
        </span>
        <svg
          className={cn('w-4 h-4 text-text-muted transition-transform', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown - fixed on mobile for full display, absolute on desktop */}
      {isOpen && (
        <div
          className="fixed md:absolute top-14 md:top-full left-4 md:left-0 right-4 md:right-auto md:mt-2 md:w-80 border border-border rounded-xl shadow-2xl z-[9999] overflow-hidden"
          style={{ backgroundColor: '#18140f' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">Projects</h3>
            <p className="text-xs text-text-dim mt-0.5">Select or manage your projects</p>
          </div>

          {/* Project list - sorted by todo count (highest first) */}
          <div className="max-h-72 overflow-y-auto">
            {[...state.projects].sort((a, b) => b.todos.length - a.todos.length).map((project) => (
              <div
                key={project.id}
                className={cn(
                  'group relative border-b border-border/50 last:border-b-0',
                  project.id === activeProject?.id ? 'bg-accent/10' : 'hover:bg-surface-hover'
                )}
              >
                {/* Editing mode */}
                {editingId === project.id ? (
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onFocus={handleInputFocus}
                        autoFocus
                        className="flex-1 bg-background border border-border-accent rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        placeholder="Project name..."
                      />
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="p-2 bg-success/20 text-success hover:bg-success/30 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                        className="p-2 bg-surface hover:bg-surface-hover text-text-muted rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : colorPickerId === project.id ? (
                  /* Color picker mode */
                  <div className="px-4 py-3">
                    <p className="text-xs text-text-muted mb-2">Choose a color:</p>
                    <div className="flex flex-wrap gap-2">
                      {PROJECT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleColorChange(project.id, color)}
                          className={cn(
                            'w-7 h-7 rounded-full transition-all hover:scale-110',
                            project.color === color && 'ring-2 ring-offset-2 ring-offset-background ring-white/50'
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setColorPickerId(null); }}
                      className="mt-2 text-xs text-text-muted hover:text-text-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  /* Normal display mode */
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                    onClick={() => handleSelectProject(project.id)}
                  >
                    {/* Color dot - clickable to change color */}
                    <button
                      type="button"
                      onClick={(e) => toggleColorPicker(project.id, e)}
                      className="w-4 h-4 rounded-full flex-shrink-0 hover:ring-2 hover:ring-white/30 transition-all"
                      style={{ backgroundColor: project.color || PROJECT_COLORS[0] }}
                      title="Change color"
                    />

                    {/* Project name and todo count */}
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="text-sm text-text-primary truncate">
                        {project.name}
                      </span>
                      {project.todos.length > 0 && (
                        <span className="flex-shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-md bg-accent/20 text-accent">
                          {project.todos.length}
                        </span>
                      )}
                    </div>

                    {/* Active indicator */}
                    {project.id === activeProject?.id && (
                      <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}

                    {/* Action buttons - always visible on mobile, hover on desktop */}
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(project.id, project.name, e)}
                        className="p-1.5 text-text-muted hover:text-accent hover:bg-accent/20 rounded-md transition-colors"
                        title="Edit name"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      {state.projects.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/20 rounded-md transition-colors"
                          title="Delete project"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add new project */}
          <div className="border-t border-border p-3" style={{ backgroundColor: '#141210' }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddProject();
                }}
                onFocus={handleInputFocus}
                placeholder="New project name..."
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="button"
                onClick={handleAddProject}
                disabled={!newProjectName.trim()}
                className={cn(
                  'px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                  'bg-accent text-background hover:bg-accent-hover',
                  'disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  if (!user) return null;

  const email = user.email || 'User';
  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-8 h-8 rounded-full bg-accent/20 text-accent font-medium text-sm',
          'flex items-center justify-center transition-all hover:bg-accent/30',
          isOpen && 'ring-2 ring-accent/50'
        )}
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-text-primary truncate">{email}</p>
            <p className="text-xs text-text-muted mt-0.5">Signed in</p>
          </div>
          <div className="p-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SyncStatus() {
  const { isSyncing, syncError } = useApp();

  if (syncError) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-warning" />
        <span>Offline</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span>Syncing...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
      <span>All synced</span>
    </div>
  );
}

function Header() {
  return (
    <header className="flex-shrink-0 h-14 md:h-16 border-b border-border-subtle bg-background px-4 md:px-6 flex items-center justify-between animate-fade-in relative z-50">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Logo mark */}
        <div className="relative">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center">
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="absolute -inset-1 bg-accent/20 rounded-xl blur-md -z-10" />
        </div>

        {/* Brand name */}
        <h1 className="text-lg md:text-xl tracking-tight">
          <span className="font-semibold text-text-primary">vibe</span>
          <span className="font-display italic text-accent">flow</span>
        </h1>

        {/* Divider */}
        <div className="hidden md:block w-px h-6 bg-border-subtle" />

        {/* Project selector */}
        <ProjectSelector />
      </div>

      {/* Right side - sync status and user menu */}
      <div className="flex items-center gap-4">
        {/* Status indicator - hidden on mobile */}
        <div className="hidden md:flex items-center text-sm text-text-muted">
          <SyncStatus />
        </div>

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
}

function MobileNav({ activeView, onViewChange }: { activeView: MobileView; onViewChange: (view: MobileView) => void }) {
  const navItems: { id: MobileView; label: string; icon: React.ReactNode }[] = [
    {
      id: 'board',
      label: 'Board',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
  ];

  const handleNavClick = (view: MobileView) => (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onViewChange(view);
  };

  return (
    <nav className="md:hidden flex-shrink-0 h-16 border-t border-border-subtle bg-background-elevated safe-bottom z-50">
      <div className="flex h-full">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={handleNavClick(item.id)}
            onTouchEnd={handleNavClick(item.id)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 transition-colors',
              'touch-manipulation select-none',
              activeView === item.id
                ? 'text-accent'
                : 'text-text-muted active:text-text-secondary'
            )}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default function Home() {
  const { isHydrated } = useApp();
  const [mobileView, setMobileView] = useState<MobileView>('board');

  if (!isHydrated) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden">
      <Header />

      {/* Desktop layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <KanbanBoard />
        </main>
        <Sidebar />
      </div>

      {/* Mobile layout */}
      <div className="flex md:hidden flex-1 overflow-hidden">
        {mobileView === 'board' && (
          <main className="flex-1 overflow-hidden animate-fade-in">
            <KanbanBoard />
          </main>
        )}
        {mobileView === 'tasks' && (
          <div className="flex-1 overflow-hidden animate-fade-in">
            <Sidebar view="tasks" />
          </div>
        )}
        {mobileView === 'notes' && (
          <div className="flex-1 overflow-hidden animate-fade-in">
            <Sidebar view="notes" />
          </div>
        )}
      </div>

      <MobileNav activeView={mobileView} onViewChange={setMobileView} />
    </div>
  );
}
