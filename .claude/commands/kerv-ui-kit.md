# Kerv UI Kit — Reference for Claude

This project uses the Kerv Design System (`js/ui-kit.js`), loaded as the global object `UI`.
**Always use `UI.*` helpers instead of writing raw HTML strings for any of the components below.**

---

## Navigation

### Underline tab nav — accent bottom border (page-level sections)
```js
UI.tabNav([
  { id: 'content', label: 'Content Analysis' },
  { id: 'brand',   label: 'Brand Safety Analysis' },
  { id: 'test',    label: 'Test an Ad' }
], activeId, 'mySetTabFn')
// Renders .ul-tabnav + .ul-tabitem + .act
// Active tab: bold text + 2px accent underline; container has border-bottom divider
// Use for top-level page navigation (e.g. Media Planner, Moments Search)
// Wrap in a stable-id div and re-render innerHTML on tab switch
```

### Pill tab nav (secondary / compact)
```js
UI.pills([
  { id: 'content', label: 'Content Analysis' },
  { id: 'brand',   label: 'Brand Safety Analysis' },
  { id: 'test',    label: 'Test an Ad' }
], activeId, 'mySetTabFn')
// Renders .tabnav + .tabitem + .act — rounded pill style with surface background
```

### Pill tabs (secondary / drawer)
```js
UI.drawerNav(tabs, activeId, 'myFn')
```

### Chip pills — large (accent-filled active)
```js
UI.chipsNavLg(chips, activeId, 'myFn', 'myAddFn', '+ Add')
```

### Chip pills — small (compact, border style)
```js
UI.chipsNavSm(chips, activeId, 'myFn')
```

### Page nav bar (pills + optional chips in one block)
```js
UI.pageNavBar({ tabs, activeTab, onTabFn, chips, activeChip, onChipFn })
```

---

## Buttons

| Helper | Style |
|---|---|
| `UI.btnPrimary(label, onclick, id?)` | Accent filled |
| `UI.btnSecondary(label, onclick, id?)` | Ghost border, muted→accent on hover |
| `UI.btnCancel(label, onclick)` | Ghost border |
| `UI.btnDanger(label, onclick)` | Red outline |
| `UI.btnIcon(onclick, title, svgHtml)` | 28×28 borderless icon |
| `UI.btnIconBordered(onclick, title, svgHtml, size?)` | Bordered icon (default 34px) |
| `UI.btnSlim(label, onclick, id?)` | Small, surface bg |
| `UI.btnText(label, onclick, color?)` | No border, no bg |

---

## Form fields

```js
UI.field('Label', UI.input('my-id', 'text', 'Placeholder', value))
UI.field('Label', UI.select('my-id', [{val:'a', label:'Option A'}], selectedVal))
UI.field('Label', UI.textarea('my-id', 'Placeholder', value, rows))
UI.field('Label', UI.customSelect('my-id', options, selectedVal, 'onChangeFn'))
```

### Cell inputs (ghost style — for table rows)
```js
UI.cellInput(id, value, placeholder, onBlurFn)
UI.cellCustomSelect(id, options, selectedVal, onChangeFn)
UI.cellOutlinedInput(id, value, placeholder, onBlurFn, helperLabel?)
UI.cellOutlinedSelect(id, options, selectedVal, onChangeFn)
UI.cellReadOnly(contentHtml)
```

---

## Overlays

### Drawer (right slide-in, full height)
```js
UI.openDrawer({
  id: 'my-drawer', width: '520px',
  title: 'Edit Item', subtitle: 'Optional subtitle',
  closeFn: 'closeMyDrawer',
  bodyHtml: '...',
  footerLeft: UI.btnDanger('Delete', 'deleteItem()'),
  footerRight: UI.btnCancel('Cancel', 'closeMyDrawer()') + UI.btnPrimary('Save', 'saveItem()')
})
UI.closeDrawer('my-drawer')
```

### Modal (centered dialog, scale animation)
```js
UI.openModal({
  id: 'my-modal', width: '480px',
  title: 'Confirm', subtitle: 'Optional',
  closeFn: 'closeMyModal',
  bodyHtml: '...',
  footerRight: UI.btnCancel('Cancel', 'closeMyModal()') + UI.btnPrimary('OK', 'confirm()')
})
UI.closeModal('my-modal')
```

---

## Data display

### Table
```js
UI.table(
  [{ label: 'Name', width: '200px' }, { label: 'Status', align: 'center' }],
  rows.map(r => UI.tr([UI.avatarCell(r.name), UI.badge(r.status)], { onclick: 'select(...)' })),
  'tbody-id'
)
// Scrollable with frozen columns:
UI.tableScroll(cols, rowsHtml, tbodyId, frozenCols)
```

### Badges & chips
```js
UI.badge('Active', '#2EAD4B', '#E6F5EA')   // label, color, bg
UI.counterBadge(count, bg?, color?)
UI.statusChip('on-track')  // 'not-started'|'on-track'|'at-risk'|'delayed'|'on-hold'|'delivered'
UI.driverChip('Revenue Generating')
UI.deptChip('Product')
```

### Avatars
```js
UI.avatar(name, subtitle?, { size, imgSrc, gap })
UI.avatarCell(name, subtitle?)   // compact — for table cells
UI.avatarChip(name, chipHtml?, subtitle?)
UI.userTile(name, dept?, subtitle?)
```

### Cards
```js
UI.card({ bodyHtml, padding?, style? })
UI.cardStat({ value, label, badge?, bar?, stats? })
```

### Progress bars
```js
UI.progressBarStatus(pct, label?)    // colour driven by %
UI.progressBarFlat(pct, color, label?)
UI.progressBarCapacity(pct, label?)
```

### Accordion
```js
UI.accordion(items, { toggleFn: 'myToggle' })
// items: [{ id, title, meta?, right?, body?, open? }]
```

---

## Other utilities

```js
UI.section('Section Title', rightHtml?)      // bordered section divider in forms
UI.sectionLabel('LABEL TEXT', mb?)          // uppercase muted label
UI.breadcrumb([{ label, onclick? }, ...])
UI.pageHeader({ breadcrumb?, title, subtitle?, titleRight?, mb? })
UI.tooltip(triggerHtml, 'Tooltip text', { pos: 'top' })
UI.yearNav(year, availableYears, 'changeFn')
UI.stepperH(steps)   // steps: [{ label, sublabel?, status: 'done'|'active'|'pending' }]
UI.stepperV(steps)
UI.ddPanel(id, items)   // dropdown panel (.tb-admin-dd style)
UI.ddToggle(ddId, btnId?)
UI.searchCheckboxPanel({ id, placeholder, items, onChangeFn })
```

---

## Design tokens (CSS variables)

| Token | Usage |
|---|---|
| `var(--accent)` | Primary brand color (#ED005E) |
| `var(--text)` | Main text |
| `var(--muted)` | Secondary text |
| `var(--faint)` | Disabled / placeholder |
| `var(--surface)` | Card / white background |
| `var(--bg)` | Page background |
| `var(--subtle)` | Hover states, light fill |
| `var(--border)` | Default border |
| `var(--border-md)` | Medium border (inputs) |

---

## Rules

1. **Never write raw button HTML** — always use a `UI.btn*` helper.
2. **Never write raw tab/pill HTML** — always use `UI.tabNav()` (underline style), `UI.pills()` (pill style), `UI.drawerNav()`, or `UI.chipsNav*()`.
3. **Never write raw input/select HTML** — always use `UI.field()` + `UI.input()` / `UI.select()`.
4. **For overlays** always use `UI.openDrawer()` or `UI.openModal()`, not custom modals.
5. **For tables** always use `UI.table()` / `UI.tableScroll()` + `UI.tr()`.
6. When in doubt, check what component already exists in `js/ui-kit.js` before writing new HTML.
