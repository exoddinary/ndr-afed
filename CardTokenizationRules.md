# CardTokenizationRules

This document defines the design-token rules to apply across cards, forms, and headings for consistent light/dark rendering.

## Typography tokens
- Headings (h1–h4 inside cards/sections)
  - Use: `text-foreground`
  - Example: `<h3 className="text-lg font-semibold text-foreground">Title</h3>`
- Field labels (form labels before inputs/selects/checkboxes)
  - Use: `text-foreground text-sm` (optionally `font-medium`)
  - Example: `<Label className="text-foreground text-sm font-medium">Reviewer*</Label>`
- Helper/secondary text (units, small captions, optional hints)
  - Use: `text-muted-foreground` (size can be `text-xs` or `text-sm`)
  - Example: `<span className="text-muted-foreground text-xs">(optional)</span>`

## Form fields (“hole” effect)
- Inputs
  - Light: `bg-background text-foreground border-border`
  - Dark: `dark:bg-slate-900/60 dark:border-slate-600 dark:placeholder:text-slate-400`
  - Focus: `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- Textareas
  - Same rules as Inputs (see `components/ui/textarea.tsx`)
- TokenInput (chips)
  - Container: match Inputs (same bg/border/focus); inner input uses
    `placeholder:text-muted-foreground` (light) and `dark:placeholder:text-slate-400` (dark)

## Cards
- Container
  - Use: `bg-card border border-border rounded-xl shadow-sm text-card-foreground`
- Dividers inside cards
  - Use: `border-border`
- Nested cards/containers (cards within cards)
  - Light mode: Same background as parent card with lighter border: `bg-card border border-border/50`
  - Dark mode: Darker background with darker border: `dark:bg-slate-800/40 dark:border-slate-700`
  - Combined: `bg-card border border-border/50 dark:bg-slate-800/40 dark:border-slate-700`

## Do not use (avoid hard-coded color classes)
- `text-white`, `text-black`, `text-slate-*` for labels and headings
- `bg-slate-*` for form fields in light mode

## Checkboxes & inline labels
- Inline labels next to `Checkbox` should use `text-foreground text-sm`
- Secondary notes next to labels should use `text-muted-foreground`

## Tabs
- TabsList (tab navigation)
  - Use: `bg-muted text-foreground` for consistent light/dark mode styling
  - Avoid: `bg-slate-900/40 text-slate-300` (hard-coded dark colors)
- TabsTrigger (individual tabs)
  - Inactive: `text-muted-foreground` with `hover:text-foreground`
  - Active: `text-primary` (brand color) in light mode, `dark:text-white` in dark mode

## Navigation (side navigation)
- Section headers: `text-muted-foreground` for subtle grouping labels
- Navigation items:
  - Inactive: `text-foreground` with `hover:bg-accent/50` for subtle hover
  - Active: `text-primary bg-primary/10 border border-primary/20` for brand highlight

## Badges and counters
- Neutral badge text: `text-muted-foreground`
- Borders: `border-border`
- Use minimal sizes for subtle badges, e.g., `text-xs px-2 py-1`

## Map & metric units in compact rows
- Row label: `text-muted-foreground text-xs`
- Value: neutral/mono text is acceptable (e.g., `font-mono`)

## Example pattern
```tsx
<div className="bg-card border border-border rounded-xl shadow-sm p-6 text-card-foreground">
  <h3 className="text-lg font-semibold text-foreground mb-4">Submission Form</h3>
  <Label className="text-foreground text-sm font-medium">Title*</Label>
  <Input className="mt-2 h-9" placeholder="Enter Title" />
  <div className="border-t border-border my-6" />
  <h4 className="text-foreground font-medium mb-3">Properties</h4>
  <Label className="text-foreground text-sm">Data Source*</Label>
  <Select>
    <SelectTrigger className="mt-2 h-9"><SelectValue placeholder="Select Data Source" /></SelectTrigger>
  </Select>
  <Label className="text-muted-foreground text-xs mt-2">(optional)</Label>
</div>
```
