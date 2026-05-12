<script setup lang="ts">
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

const today = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
}).format(new Date())
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar panel">
      <div class="sidebar-brand">
        <p class="eyebrow">Sharkhal Bari Finance</p>
        <h1>Household finance dashboard</h1>
        <p class="muted">Manage members, income, and expense in one place.</p>
      </div>

      <div class="sidebar-section">
        <p class="sidebar-label">Menu</p>
        <nav class="nav sidebar-nav">
          <NuxtLink to="/" active-class="active">Dashboard</NuxtLink>
          <NuxtLink to="/members" active-class="active">Members</NuxtLink>
          <NuxtLink to="/income" active-class="active">Income</NuxtLink>
          <NuxtLink to="/expense" active-class="active">Expense</NuxtLink>
        </nav>
      </div>

      <div class="sidebar-section sidebar-footer">
        <p class="sidebar-label">Quick note</p>
        <p class="muted sidebar-note">
          Use the forms on each page to add or edit records from the side drawer.
        </p>
      </div>
    </aside>

    <main class="page-content">
      <header class="page-header panel">
        <div>
          <p class="page-kicker">Current section</p>
          <h2>{{ pageMeta.title }}</h2>
          <p class="muted page-subtitle">{{ pageMeta.subtitle }}</p>
        </div>

        <div class="page-header-meta">
          <span class="pill">Frontend only</span>
          <span class="page-date">{{ today }}</span>
        </div>
      </header>

      <slot />
    </main>
  </div>
</template>
