# ResuMentor Rule: Skeletons & Premium Loading Interfaces

## 1. Core Principle: Zero Blank Screens & Zero Layout Shift

- **Never render a blank screen** during network requests, route transitions, or authentication checks.
- **Never rely on unstyled single spinners** for primary page loads or major content blocks.
- **Skeleton Mirroring**: Skeletons must spatially mirror the exact layout, aspect ratios, borders, and rounded corners (`rounded-2xl`, `rounded-3xl`) of the final rendered content to eliminate Cumulative Layout Shift (CLS).

---

## 2. When to Use Skeletons vs. Premium Transition Loaders

| Scenario | UX Pattern to Use | Component |
| :--- | :--- | :--- |
| **Route Transition (Next.js)** | Full page skeleton or luxury branded loader | `loading.tsx` / `SkeletonDashboard` |
| **First-launch / Auth Evaluation** | Luxury branded splash with smooth pulse | `PremiumTransitionLoader` |
| **In-page Data Fetching (Jobs / Mentors)** | Content-specific skeleton cards & chips | `SkeletonJobs` / `SkeletonCard` |
| **AI Generation / Resume Processing** | Step-aware luxury loader with progress shimmer | `SkeletonResume` / Step indicator |
| **Small Component / Button Action** | Inline spinner or button loading state | Inline `<Loader2 className="animate-spin" />` |

---

## 3. Aesthetic & Luxury Visual Standard

All skeletons and loading screens must adhere to ResuMentor's premium design language:

1. **Shimmer Animation**:

   - Multi-stop gradient shimmer:

     ```css
     background: linear-gradient(
       90deg,
       rgba(241, 245, 249, 0.9) 0%,
       rgba(226, 232, 240, 0.45) 25%,
       rgba(255, 255, 255, 0.95) 50%,
       rgba(226, 232, 240, 0.45) 75%,
       rgba(241, 245, 249, 0.9) 100%
     );
     background-size: 200% 100%;
     ```

   - Smooth 2-second wave duration with `cubic-bezier(0.4, 0, 0.2, 1)`.

2. **Luxury Glassmorphic Cards**:

   - Fullscreen loading screens must feature subtle ambient radial background glows (`indigo-200/30`, `teal-200/20`), frosted glass cards (`backdrop-blur-xl bg-white/80 border border-white/60 shadow-2xl`), and branded icon glowing halos.

3. **Color Tokens**:

   - Base neutral: `bg-slate-100` / `bg-slate-200/70`
   - Primary pulse: `bg-indigo-600/10` with `text-indigo-600`
   - Dark elements: `bg-slate-200`

---

## 4. Mobile & Safe Area Standards

1. **Safe Area Insets**:

   - Any full-screen loader or top-level skeleton must include `.pt-safe` and `.pb-safe` (or `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`).

2. **Touch Targets**:

   - Skeletons of interactive buttons must retain a minimum height of `48px` (`min-h-[48px]`) to maintain layout stability once data arrives.

3. **Accessibility**:

   - All skeleton wrappers must include `aria-busy="true"` and `aria-live="polite"`.
   - Respect `prefers-reduced-motion` by reducing animation speed or using subtle pulse instead of high-frequency shimmer.

---

## 5. Reusable Shared Components

All skeleton and loading implementations should import from `@/shared/ui`:

- `Skeleton`: Versatile single element primitive.
- `SkeletonCard`: Rich card skeleton (avatar, tags, text lines, button).
- `SkeletonDashboard`: Full-page dashboard layout skeleton.
- `SkeletonJobs`: Job search bar + job opportunity cards skeleton.
- `SkeletonResume`: ATS score circle + section cards skeleton.
- `PremiumTransitionLoader`: Branded luxury transition screen for route changes and splash screens.
