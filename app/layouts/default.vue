<script setup lang="ts">
import { formatDisplayDate } from '~/utils/formatDate'

const route = useRoute()

const titleMap: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Dashboard',
    subtitle: 'Overview of members, income, and expense'
  },
  '/members': {
    title: 'Members',
    subtitle: 'Track residents and dues'
  },
  '/income': {
    title: 'Income',
    subtitle: 'Record collections and subscription payments'
  },
  '/expense': {
    title: 'Expense',
    subtitle: 'Record household spending and bills'
  }
}

const pageMeta = computed(() => titleMap[route.path] ?? {
  title: 'Sharkhal Bari Finance',
  subtitle: 'Manage your records from one place'
})

const today = formatDisplayDate(new Date())

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: 'dashboard'
  },
  {
    to: '/members',
    label: 'Members',
    icon: 'users'
  },
  {
    to: '/income',
    label: 'Income',
    icon: 'income'
  },
  {
    to: '/expense',
    label: 'Expense',
    icon: 'expense'
  }
]
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar panel">
      <div class="sidebar-brand">
        <div class="brand-row">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
              <path d="M5 18.5C5 11.5 8.2 8 15.4 5.2c1.5-.6 2.9-1.1 3.6-1.1-3 1.5-4.9 4.5-6.2 8-1.6 4.3-3.3 6.7-7.8 7.5z" />
              <path d="M4.5 19.5C8.9 18.6 11 16.3 12.9 11c1.4-3.8 3.8-6.5 7-7.8" />
            </svg>
          </span>
          <p class="brand-wordmark">Sharkhal Bari Finance</p>
        </div>

        <div class="sidebar-intro">
          <h1>Household finance dashboard</h1>
          <p>Manage members, income, and expense in one place.</p>
        </div>
      </div>

      <nav class="sidebar-nav nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          active-class="active"
          class="sidebar-link"
        >
          <span class="nav-icon" aria-hidden="true">
            <svg v-if="item.icon === 'dashboard'" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="4" width="6" height="6" rx="1.5" />
              <rect x="14" y="4" width="6" height="6" rx="1.5" />
              <rect x="4" y="14" width="6" height="6" rx="1.5" />
              <rect x="14" y="14" width="6" height="6" rx="1.5" />
            </svg>
            <svg v-else-if="item.icon === 'users'" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M16 19c0-2.2-2-4-4.5-4S7 16.8 7 19" />
              <circle cx="11.5" cy="8.5" r="3.5" />
              <path d="M19 18.2c0-1.8-1.2-3.3-2.9-3.9" />
              <path d="M14.5 5.7c1.5.5 2.5 1.9 2.5 3.6s-1 3.1-2.5 3.6" />
            </svg>
            <svg v-else-if="item.icon === 'income'" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 17l6-6 4 4 4-7" />
              <path d="M14 8h5v5" />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 4h9l3 3v13H6z" />
              <path d="M15 4v4h4" />
              <path d="M8 13h8" />
              <path d="M8 16h8" />
            </svg>
          </span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-note-card">
        <span class="note-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 3.5h9l3.5 3.5V20a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V5A1.5 1.5 0 0 1 6 3.5Z" />
            <path d="M15 3.5V8h4.5" />
            <path d="M8 12h8" />
            <path d="M8 15.5h8" />
          </svg>
        </span>
        <div>
          <p class="sidebar-note-title">Quick note</p>
          <p class="sidebar-note">
            Use the forms on each page to add or edit records from the side drawer.
          </p>
        </div>
      </div>

      <div class="sidebar-profile">
        <div class="profile-mark">SB</div>
        <div class="sidebar-profile-copy">
          <strong>Sharkhal Bari</strong>
          <span>Finance Manager</span>
        </div>
        <span class="profile-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m8 10 4 4 4-4" />
          </svg>
        </span>
      </div>
    </aside>

    <main class="page-content">
      <header class="page-header panel">
        <div>
          <p class="page-kicker">Overview</p>
          <h2>{{ pageMeta.title }}</h2>
          <p class="muted page-subtitle">{{ pageMeta.subtitle }}</p>
        </div>

        <div class="page-header-meta">
          <span class="status-chip">
            <span class="status-dot" />
            Frontend only
          </span>
          <span class="date-chip">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 3v3M17 3v3M4.5 9h15" />
              <rect x="4.5" y="5.5" width="15" height="15" rx="2.5" />
            </svg>
            {{ today }}
          </span>
          <button class="ghost-icon-btn" type="button" aria-label="Appearance preview">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2.5v2.5M12 19v2.5M4.8 4.8l1.8 1.8M17.4 17.4l1.8 1.8M2.5 12H5M19 12h2.5M4.8 19.2l1.8-1.8M17.4 6.6l1.8-1.8" />
            </svg>
          </button>
        </div>
      </header>

      <slot />
    </main>
  </div>
</template>
