# UI Review Checklist

- Touch targets: interactive controls should be at least 44px tall or wide on mobile, including icon buttons and sticky CTAs.
- Primitives first: use components from `src/components/ui` for shared buttons, inputs, selects, textareas, cards, modals, tabs, field errors, and toasts before adding raw Tailwind strings.
- Spacing scale: prefer the existing 4, 8, 12, 16, 20, 24, and 32px rhythm so cards, forms, and stacked actions align across pages.
- Typography: keep display copy in the serif heading scale and body copy in the default body scale; use muted text for secondary metadata only.
- Focus treatment: every interactive control must have a visible focus ring and maintain contrast on both light cards and tinted surfaces.
- Disabled states: disabled buttons and fields should remain legible, clearly non-interactive, and should not shift layout.
- Error presentation: inline validation should use `FieldError` plus invalid field styling; page-level problems should use the shared notification pattern instead of `alert(...)`.
- Cards and modals: use the shared border radius, border color, and shadow treatments from the UI primitives instead of page-specific panel styles unless the surface is intentionally custom.
