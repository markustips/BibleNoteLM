# Dashboard Theme Guide - Modern UI Design

This guide provides the design system and theming for the BibleNoteLM church dashboard, inspired by modern church management platforms.

## 🎨 Color Palette

### Primary Colors
```css
/* Main Brand Colors */
--primary-purple: #6366F1;      /* Primary purple for buttons, active states */
--primary-purple-light: #818CF8; /* Light purple for hover states */
--primary-purple-dark: #4F46E5;  /* Dark purple for active elements */
--primary-purple-bg: #EEF2FF;    /* Very light purple for backgrounds */

/* Secondary Colors */
--secondary-pink: #FCA5A5;       /* Sermons card accent */
--secondary-pink-bg: #FECDD3;    /* Light pink background */
--secondary-blue: #7DD3FC;       /* Prayer requests card */
--secondary-blue-bg: #BAE6FD;    /* Light blue background */

/* Neutral Colors */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;

/* Status Colors */
--success-green: #10B981;
--success-green-light: #D1FAE5;
--warning-orange: #F59E0B;
--warning-orange-light: #FEF3C7;
--error-red: #EF4444;
--error-red-light: #FEE2E2;
--info-blue: #3B82F6;
```

### Gradients
```css
--gradient-purple: linear-gradient(135deg, #6366F1 0%, #818CF8 100%);
--gradient-pink: linear-gradient(135deg, #FCA5A5 0%, #FECDD3 100%);
--gradient-blue: linear-gradient(135deg, #7DD3FC 0%, #BAE6FD 100%);
--gradient-card: linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,1));
```

---

## 📐 Layout Structure

### Sidebar Navigation
```css
.sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid var(--gray-200);
  padding: 24px 16px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 32px;
}

.sidebar-logo-icon {
  width: 32px;
  height: 32px;
  background: var(--gradient-purple);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.church-info {
  padding: 12px;
  background: var(--gray-50);
  border-radius: 12px;
  margin-bottom: 24px;
}

.church-avatar {
  width: 40px;
  height: 40px;
  background: var(--primary-purple);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
}
```

### Navigation Items
```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--gray-600);
  font-weight: 500;
}

.nav-item:hover {
  background: var(--gray-100);
  color: var(--gray-900);
}

.nav-item.active {
  background: var(--primary-purple);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.nav-icon {
  width: 20px;
  height: 20px;
  opacity: 0.7;
}

.nav-item.active .nav-icon {
  opacity: 1;
}
```

---

## 📊 Dashboard Cards

### Stats Card (Active Members)
```css
.stats-card {
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--gray-700);
}

.refresh-icon {
  width: 20px;
  height: 20px;
  color: var(--gray-400);
  cursor: pointer;
}

/* Circular Progress */
.circular-progress {
  position: relative;
  width: 160px;
  height: 160px;
  margin: 0 auto 20px;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-circle {
  stroke: var(--gray-200);
  stroke-width: 12;
  fill: none;
}

.progress-ring-fill {
  stroke: var(--primary-purple);
  stroke-width: 12;
  fill: none;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.progress-percentage {
  font-size: 42px;
  font-weight: 700;
  color: var(--gray-900);
  line-height: 1;
}

.progress-label {
  font-size: 13px;
  color: var(--gray-500);
  margin-top: 4px;
}

.progress-icon {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  background: var(--primary-purple);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stats-count {
  font-size: 28px;
  font-weight: 700;
  color: var(--gray-900);
  text-align: center;
  margin-bottom: 4px;
}

.stats-subtitle {
  font-size: 14px;
  color: var(--gray-500);
  text-align: center;
}

.stats-growth {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
  font-size: 13px;
  color: var(--success-green);
}
```

### Metric Cards (Sermons, Prayer Requests)
```css
.metric-card {
  border-radius: 24px;
  padding: 32px;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.metric-card.sermons {
  background: linear-gradient(135deg, #FCA5A5 0%, #FDE68A 100%);
}

.metric-card.prayers {
  background: linear-gradient(135deg, #7DD3FC 0%, #A5B4FC 100%);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.metric-title {
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.7);
}

.metric-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.metric-value {
  font-size: 72px;
  font-weight: 800;
  color: rgba(0, 0, 0, 0.9);
  line-height: 1;
  margin: 20px 0;
}

.metric-subtitle {
  font-size: 15px;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 500;
}

.metric-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
}

/* Floating elements */
.metric-decoration {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.decoration-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
}

.decoration-badge {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.8);
}
```

---

## 📅 Upcoming Events Card

```css
.events-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.events-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.events-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--gray-900);
  display: flex;
  align-items: center;
  gap: 8px;
}

.events-icon {
  width: 24px;
  height: 24px;
  color: var(--primary-purple);
}

.event-item {
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.event-item:hover {
  background: var(--gray-50);
  border-color: var(--gray-200);
  transform: translateX(4px);
}

.event-date {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 8px;
}

.event-day {
  font-size: 12px;
  color: var(--gray-500);
  font-weight: 500;
}

.event-time {
  font-size: 14px;
  font-weight: 700;
  color: var(--gray-900);
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--gray-900);
}

.event-location {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--gray-600);
}

.event-color-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.event-color-indicator.main-sanctuary {
  background: var(--primary-purple);
}

.event-color-indicator.community-hall {
  background: var(--success-green);
}

.event-color-indicator.city-park {
  background: var(--warning-orange);
}

.see-all-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px;
  color: var(--gray-500);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
}

.see-all-link:hover {
  color: var(--primary-purple);
}
```

---

## 👥 Member Management Table

```css
.member-table-card {
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.table-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--gray-900);
}

.add-member-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--primary-purple);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.add-member-btn:hover {
  background: var(--primary-purple-dark);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.table-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 10px 16px 10px 40px;
  border: 1px solid var(--gray-300);
  border-radius: 10px;
  font-size: 14px;
  background: white;
  background-image: url("data:image/svg+xml,..."); /* Search icon */
  background-repeat: no-repeat;
  background-position: 12px center;
  background-size: 18px;
}

.filter-dropdown {
  padding: 10px 16px;
  border: 1px solid var(--gray-300);
  border-radius: 10px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  min-width: 140px;
}

.member-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.member-table thead {
  background: var(--gray-50);
}

.member-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-600);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.member-table td {
  padding: 16px;
  border-bottom: 1px solid var(--gray-100);
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-purple);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.member-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-900);
}

.member-email {
  font-size: 13px;
  color: var(--gray-500);
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.role-badge.worship-leader {
  background: var(--primary-purple-bg);
  color: var(--primary-purple);
}

.role-badge.member {
  background: var(--warning-orange-light);
  color: var(--warning-orange);
}

.group-tag {
  display: inline-block;
  padding: 4px 10px;
  background: var(--gray-100);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--gray-700);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.active {
  background: var(--success-green);
}

.activity-bar {
  width: 100%;
  height: 4px;
  background: var(--gray-200);
  border-radius: 2px;
  margin-bottom: 4px;
}

.activity-fill {
  height: 100%;
  background: var(--primary-purple);
  border-radius: 2px;
}

.activity-text {
  font-size: 11px;
  color: var(--gray-500);
}
```

---

## 📈 Ministry Goals Progress

```css
.goals-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.goals-header {
  font-size: 18px;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 16px;
}

.goals-subtitle {
  font-size: 13px;
  color: var(--gray-500);
  margin-bottom: 24px;
}

.goal-item {
  margin-bottom: 24px;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.goal-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-900);
}

.goal-percentage {
  font-size: 14px;
  font-weight: 700;
  color: var(--gray-700);
  display: flex;
  align-items: center;
  gap: 4px;
}

.trend-icon {
  width: 14px;
  height: 14px;
  color: var(--success-green);
}

.goal-progress-bar {
  width: 100%;
  height: 8px;
  background: var(--gray-200);
  border-radius: 10px;
  overflow: hidden;
}

.goal-progress-fill {
  height: 100%;
  background: var(--gradient-purple);
  border-radius: 10px;
  transition: width 0.5s ease;
}

.goal-progress-fill.donations {
  background: linear-gradient(90deg, #6366F1, #818CF8);
}

.goal-progress-fill.volunteering {
  background: linear-gradient(90deg, #10B981, #34D399);
}

.goal-progress-fill.attendance {
  background: linear-gradient(90deg, #F59E0B, #FBBF24);
}

.goal-progress-fill.small-groups {
  background: linear-gradient(90deg, #3B82F6, #60A5FA);
}
```

---

## 🎯 Quick Actions

```css
.quick-actions {
  display: flex;
  gap: 12px;
  padding: 20px 0;
}

.action-btn {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.action-btn.announce {
  background: linear-gradient(135deg, #6366F1, #818CF8);
  color: white;
}

.action-btn.event {
  background: linear-gradient(135deg, #3B82F6, #60A5FA);
  color: white;
}

.action-btn.prayer {
  background: linear-gradient(135deg, #A855F7, #C084FC);
  color: white;
}

.action-btn.more {
  background: white;
  color: var(--gray-600);
  border: 1px solid var(--gray-300);
}

.action-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}
```

---

## 🌐 Responsive Design

```css
/* Mobile (< 768px) */
@media (max-width: 767px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .metric-card {
    min-height: 220px;
    padding: 24px;
  }

  .metric-value {
    font-size: 56px;
  }
}

/* Tablet (768px - 1024px) */
@media (min-width: 768px) and (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop (> 1024px) */
@media (min-width: 1025px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}
```

---

## 🎭 Animations

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.card {
  animation: fadeIn 0.5s ease;
}

.nav-item {
  animation: slideIn 0.3s ease;
}

.loading-indicator {
  animation: pulse 1.5s ease-in-out infinite;
}
```

---

## 📦 Component Library

### Button Variants
```css
.btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: var(--primary-purple);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-secondary {
  background: white;
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
}

.btn-success {
  background: var(--success-green);
  color: white;
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--primary-purple);
  color: var(--primary-purple);
}
```

This theme guide provides a complete design system for a modern church dashboard. Let me know if you'd like me to create the actual implementation files (CSS, React components, etc.)!
