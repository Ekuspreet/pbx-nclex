# Implement the Questionnaire Frontend

## Objective

Implement the frontend questionnaire experience inside `client/`.

The reference implementation is the monorepo located at:

`planning/questionnaire/`

Use it to understand the intended:

* Page structure
* User flows
* Questionnaire behavior
* Information hierarchy
* Landing-page content and visual direction
* Authentication screens
* Reusable component patterns

Recreate the relevant frontend experience in the current repository without copying unnecessary architecture or complexity.

The resulting code must be simple, readable, modular, and easy to modify.

---

## Required Preliminary Review

Before changing code:

1. Inspect the current `client/` application.
2. Inspect `planning/questionnaire/` and identify the frontend pages, flows, and components relevant to this implementation.
3. Inspect the existing routing, state management, Tailwind configuration, DaisyUI configuration, and project conventions in `client/`.
4. Review these specification files:

   * `planning/daisyui_v5_component_theme_specsheet.xlsx`
   * `planning/motion_minimal_specsheet.xlsx`
5. Reuse the current repository's libraries and conventions where practical.
6. Do not introduce a new frontend framework, state-management library, animation library, form library, or CSS system unless the existing project cannot reasonably support the required functionality.

Do not start by redesigning the architecture. Make the smallest coherent set of changes needed to complete the frontend.

---

## Implementation Scope

Implement the following inside `client/`:

### 1. Landing Page

Update the existing landing page so that it follows the content structure and visual direction of the reference questionnaire repository.

The page should:

* Clearly communicate the questionnaire or testing product
* Include a clear primary call to action
* Include the important supporting sections found in the reference implementation
* Use the current application's Tailwind and DaisyUI theme
* Be responsive across mobile, tablet, and desktop layouts
* Use subtle motion according to the motion specification

Do not reproduce irrelevant sections from the reference repository.

### 2. Authentication Pages

Add:

* Login page
* Signup page

Requirements:

* Use DaisyUI form, input, button, alert, card, divider, checkbox, and link patterns wherever suitable
* Include clear validation and error states
* Include loading and disabled states
* Provide navigation between login and signup
* Keep authentication integration isolated so it can be connected to the backend later
* Do not invent backend endpoints or authentication behavior
* Use the project's existing authentication integration when one already exists

### 3. Questionnaire Pages

Implement the frontend pages required to conduct the questionnaire or test flow represented in `planning/questionnaire/`.

Include the relevant states, such as:

* Questionnaire introduction or instructions
* Starting or resuming a questionnaire
* Question display
* Answer selection or entry
* Previous and next navigation, when supported by the reference flow
* Progress indication
* Completion or submission confirmation
* Empty, loading, and error states
* Results or summary page only when present in the reference frontend or already supported by the current application

Do not invent domain rules, scoring logic, API response shapes, or question data.

Use existing application data and APIs when available. Where backend integration is not available, isolate temporary frontend data behind a small, clearly named mock or adapter module so it can be replaced easily.

### 4. Shared Layout and Navigation

Implement or update shared elements needed by these pages, including:

* Header or navbar
* Footer, when appropriate
* Responsive navigation
* Main page container
* Authentication layout
* Questionnaire layout
* Reusable feedback states

Avoid unnecessary abstraction. Create a shared component only when it is reused or when separating it materially improves readability.

---

## Styling Rules

### Tailwind

Use Tailwind utility classes for all local component styling.

Local visual styling must remain directly visible in the component through Tailwind classes.

Some utility-class repetition is acceptable when it keeps components easier to understand and edit.

Do not create abstractions solely to remove repeated class strings.

### DaisyUI

Use DaisyUI components wherever they appropriately cover the required interface.

Follow the DaisyUI v5 component and theme guidance in:

`planning/daisyui_v5_component_theme_specsheet.xlsx`

Prefer DaisyUI patterns such as:

* `navbar`
* `hero`
* `card`
* `btn`
* `input`
* `textarea`
* `select`
* `checkbox`
* `radio`
* `progress`
* `steps`
* `alert`
* `badge`
* `modal`
* `drawer`
* `dropdown`
* `loading`

Use semantic DaisyUI theme classes such as:

* `bg-base-100`
* `bg-base-200`
* `text-base-content`
* `btn-primary`
* `btn-secondary`
* `text-primary`
* `border-base-300`

Do not hard-code a separate design-token system when a DaisyUI theme value is suitable.

### CSS Restrictions

Do not add component-specific CSS files.

Do not use CSS Modules, styled-components, CSS-in-JS, Sass, or a parallel styling system.

Do not introduce custom CSS variables.

Custom CSS is allowed only when it is genuinely required for global application behavior that Tailwind or DaisyUI cannot reasonably provide.

Any required global CSS must:

* Be minimal
* Be placed in the existing global stylesheet
* Include a brief comment explaining why Tailwind or DaisyUI was insufficient

### Visual Consistency

Use the existing application theme as the source of truth.

The reference repository should guide structure and direction, but it must not override the current project's established theme configuration.

Do not hard-code colors that conflict with the active DaisyUI theme.

---

## Motion Rules

Use the motion guidance in:

`planning/motion_minimal_specsheet.xlsx`

Motion is required on:

* Landing pages
* Login and signup pages
* Non-test supporting pages
* Navigation and lightweight interactive elements where appropriate

Motion must be:

* Subtle
* Soft
* Short
* Non-blocking
* Consistent
* Respectful of reduced-motion preferences

Suitable examples include:

* Small opacity transitions
* Minor vertical entrance movement
* Soft hover and focus transitions
* Lightweight card or section reveals
* Menu and modal transitions

Do not add decorative or distracting animation.

### Test Page Exception

Do not add entrance, looping, decorative, or attention-seeking animations to pages where the user is actively answering test questions.

On test pages, only use essential interaction feedback such as:

* Focus states
* Hover states
* Selected-answer states
* Button press feedback
* Loading indicators
* Necessary page-state transitions

The test experience must remain calm and distraction-free.

---

## Code Quality Rules

Keep the implementation straightforward.

Requirements:

* Use clear component and variable names
* Keep components focused
* Keep page-specific logic close to the page
* Avoid premature generic abstractions
* Avoid deeply nested component hierarchies
* Avoid large configuration-driven UI systems
* Avoid duplicating business logic
* Preserve the current project's linting, formatting, and TypeScript conventions
* Use TypeScript types when the client is TypeScript-based
* Remove dead imports and unused code
* Do not leave commented-out implementations
* Do not rewrite unrelated files

Prefer simple composition over complex patterns.

Do not copy the reference repository's dependencies, state architecture, build setup, or folder structure unless they are necessary and compatible with the current client.

---

## Functional Requirements

All implemented pages must:

* Be reachable through the application's router
* Work on mobile and desktop layouts
* Have visible keyboard focus states
* Use semantic HTML where practical
* Have labels associated with form controls
* Support keyboard interaction
* Use meaningful button text
* Provide loading, disabled, empty, and error states where relevant
* Avoid broken links and placeholder navigation
* Avoid console errors and warnings

Do not use non-functional controls merely for visual completeness.

---

## Data and Backend Boundaries

Do not modify backend code unless a frontend build or existing integration requires a very small compatibility correction.

Do not invent:

* API endpoints
* Authentication tokens
* User records
* Questionnaire results
* Scoring rules
* Question content
* Product claims
* Statistics
* Testimonials

When the frontend requires unavailable data:

1. Check whether equivalent data already exists in the current repository.
2. Check how the reference repository models the state.
3. Add the smallest replaceable local adapter or mock necessary to render and test the UI.
4. Clearly separate temporary data from production integration code.

---

## Execution Order

Work in this order:

1. Inspect both repositories and the specification spreadsheets.
2. Identify the required routes and user flow.
3. Confirm the existing Tailwind and DaisyUI setup.
4. Build or update shared layout components.
5. Implement the landing page.
6. Implement login and signup.
7. Implement the questionnaire flow.
8. Add allowed motion to non-test pages.
9. Verify responsive behavior and accessibility.
10. Run the available formatter, linter, type checker, tests, and production build.
11. Fix issues caused by the implementation.

Do not stop after creating static page shells. Complete the relevant frontend interactions and states.

---

## Modularity Requirements

Organize the frontend by feature rather than placing all pages, components, types, and logic in shared global folders.

Use a structure similar to the existing project conventions. Where no clear convention exists, prefer:

```text
client/src/
  components/
    layout/
    ui/
  features/
    auth/
      components/
      pages/
      types.ts
    questionnaire/
      components/
      pages/
      hooks/
      services/
      types.ts
  pages/
  routes/
```

Rules:

* Keep route-level components separate from reusable UI components.
* Keep authentication code inside the authentication feature.
* Keep questionnaire-specific code inside the questionnaire feature.
* Keep API or mock-data access separate from rendering components.
* Keep shared components domain-neutral.
* Do not place questionnaire-specific logic in generic shared components.
* Do not create a shared abstraction for code used only once.
* Extract components when they are reused, contain meaningful isolated behavior, or make a large page easier to understand.
* Avoid page components larger than approximately 250 lines. Split them by responsibility when they grow beyond that size.
* Avoid components with excessive props. Prefer feature-local composition over highly configurable universal components.
* Keep types close to the feature that owns them.
* Keep test-session state separate from presentation components.
* Do not create barrel export files unless the existing project already uses them.
* Do not add a generic component library on top of DaisyUI.
* Preserve the existing project structure when it already satisfies these requirements.



## Acceptance Criteria

The work is complete only when:

* The landing page reflects the questionnaire reference while using the current project's theme
* Login and signup routes exist and are usable
* The questionnaire frontend flow is implemented
* Test pages remain free of distracting animation
* Non-test pages use subtle motion from the supplied specification
* DaisyUI components are used wherever appropriate
* Local styling uses Tailwind utility classes
* No unnecessary custom CSS or CSS variables are introduced
* The layout is responsive
* Forms and controls are accessible
* Existing backend behavior is not fabricated
* Unrelated code is not rewritten
* The client passes the available lint, type-check, test, and build commands

---

## Final Response

After implementation, provide:

1. A concise summary of what was implemented.
2. A list of added or changed routes.
3. A list of major files changed.
4. Any temporary mock or adapter that still needs backend integration.
5. The validation commands run and their results.
6. Any remaining limitation supported by a concrete reason.

Do not claim that a command passed unless it was actually executed successfully.



