# Preact Components

This file describes the properties of a well designed components

## Component Declaration Style

Let's work towards having all Preact components declared as arrow functions.

```tsx
export const Button = (props: ButtonProps) => {
    return <button />;
};
```

## Purpose

This project uses a component-first architecture.

All UI components must be designed to be:

- Reusable
- Predictable
- Composable
- Accessible
- Easy to understand
- Easy to maintain

Favor simplicity over flexibility. Favor composition over configuration.

---

# Rules

## 1. Model Reusable Concepts

Components can represent reusable UI concepts, some represent screens or pages. ( Page components are made up by other smaller components)

### Good

```tsx
<Button />
<Dialog />
<TextField />
<Card />
<DataTable />
```

### Avoid

```tsx
<UserDashboardHeader />
<CustomerPageLayout />
```

Application-specific UI should be composed from reusable components.

---

## 2. Prefer Composition Over Configuration

Build complex interfaces by composing smaller components.

### Preferred

```tsx
<Card>
    <Card.Header />
    <Card.Body />
    <Card.Footer />
</Card>
```

### Avoid

```tsx
<Card title="..." footerText="..." showBorder shadow compact />
```

When adding props, ask:

> Could this be solved more cleanly through composition?

---

## 3. Keep APIs Consistent

The same concept should use the same API across the entire codebase.

### Good

```tsx
<Button size="sm" />
<Input size="sm" />
<Select size="sm" />
```

### Avoid

```tsx
<Button small />
<Input size="small" />
<Select compact />
```

Use existing naming patterns whenever possible.

---

## 4. Provide Sensible Defaults

The most common use case should require minimal configuration.

### Good

```tsx
<Button>Save</Button>
```

Avoid forcing consumers to specify unnecessary props.

---

## 5. Encapsulate Complexity

Components should hide implementation details.

Consumers should not need to know about:

- Focus management
- Keyboard handling
- Accessibility implementation
- Internal state management
- DOM structure

Expose a clean public API.

---

## 6. Accessibility Is Mandatory

Interactive components must support:

- Keyboard navigation
- Visible focus states
- Screen readers
- Proper labels
- Appropriate ARIA attributes

Accessibility is not optional.

---

## 7. Keep Props Small

Every prop increases complexity.

Before adding a prop ask:

- Is this required?
- Can composition solve this instead?
- Is this a rare edge case?

Prefer fewer props and more composition.

---

## 8. Provide Escape Hatches

Consumers must be able to extend components.

Examples:

```tsx
<Button className="custom-style" />
```

```tsx
<Button asChild>
    <a href="/pricing">Pricing</a>
</Button>
```

Never lock consumers into rigid APIs.

---

## 9. Respect Component Layers

### Primitive Components

Low-level building blocks.

```tsx
<Box />
<Flex />
<Stack />
<Text />
```

Responsibilities:

- Layout
- Spacing
- Typography
- Structure

---

### UI Components

Reusable interface elements.

```tsx
<Button />
<Input />
<Select />
<Card />
<Dialog />
```

Responsibilities:

- User interaction
- Common UI behavior

---

### Domain Components

Business-specific compositions.

```tsx
<UserAvatar />
<OrderTable />
<ProductCard />
```

Responsibilities:

- Application-specific functionality
- Business concepts

---

Do not mix layers.

Domain components may use UI components.

UI components may use primitives.

Primitives should not depend on domain components.

---

## 10. Optimize For Discoverability

Developers should be able to use a component correctly without extensive documentation.

A component should be understandable from:

- Its name
- Its props
- Its examples

Avoid surprising behavior.

---

# Anti-Patterns

Avoid:

- Giant components
- Components with dozens of props
- Deep inheritance hierarchies
- Duplicate functionality
- Application-specific logic in shared components
- Premature abstraction
- Hidden side effects

---

# Before Creating A New Component

Ask:

1. Is a similar component already available?
2. Can existing components be composed instead?
3. Is this a reusable concept?
4. Does it belong in the correct layer?
5. Is the API consistent with existing components?
6. Is accessibility handled?
7. Is the component easy to understand?

Only create a new component if there is a clear benefit.

---

# Definition Of Done

A component is considered complete when:

- It solves a single responsibility.
- Its API is small and consistent.
- It is composable.
- It has sensible defaults.
- It is accessible.
- It is reusable.
- Shared UI components contain no application-specific assumptions; domain components keep those assumptions explicit and local.
- Another developer could use it without reading implementation details.

When in doubt:

> Make the component smaller, simpler, and more composable.
