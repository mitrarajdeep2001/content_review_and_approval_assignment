import type { AuthUser, ContentItem } from '../types';

// ─── Demo Users ───────────────────────────────────────────────────────────────
export const DEMO_USERS: AuthUser[] = [
  {
    id: 'u1',
    name: 'Alex Morgan',
    email: 'alex@contentflow.io',
    role: 'CREATOR',
    avatar: 'https://ui-avatars.com/api/?name=Alex+Morgan&background=6d28d9&color=fff&size=64&bold=true',
  },
  {
    id: 'u2',
    name: 'Jordan Lee',
    email: 'jordan@contentflow.io',
    role: 'REVIEWER_L1',
    avatar: 'https://ui-avatars.com/api/?name=Jordan+Lee&background=0284c7&color=fff&size=64&bold=true',
  },
  {
    id: 'u3',
    name: 'Taylor Kim',
    email: 'taylor@contentflow.io',
    role: 'REVIEWER_L2',
    avatar: 'https://ui-avatars.com/api/?name=Taylor+Kim&background=0f766e&color=fff&size=64&bold=true',
  },
];

// ─── Mock Content Items ───────────────────────────────────────────────────────
export const INITIAL_CONTENT: ContentItem[] = [
  {
    id: 'c1',
    title: 'Getting Started with Cloud-Native Architecture',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
    description:
      'A comprehensive guide to designing resilient, scalable systems using cloud-native patterns and best practices.',
    body: `Cloud-native architecture represents a paradigm shift in how we build and deploy applications. By leveraging containerization, microservices, and declarative APIs, teams can achieve unprecedented levels of scalability and resilience.

## Key Principles

**1. Containerization**
Containers provide a consistent runtime environment, ensuring that applications behave the same way across development, staging, and production environments. Docker remains the industry standard, while Kubernetes orchestrates at scale.

**2. Microservices**
Decomposing monolithic applications into smaller, independently deployable services allows teams to iterate faster and scale components independently. Each service owns its data and exposes a well-defined API.

**3. DevOps & CI/CD**
Continuous integration and deployment pipelines reduce the time between writing code and delivering value. Automated testing, security scanning, and progressive delivery strategies like canary releases minimize risk.

## Getting Started

Begin with a thorough assessment of your existing architecture. Identify bounded contexts, define service contracts, and establish observability from day one. Distributed tracing, structured logging, and metrics dashboards are not optional — they are foundational.

The journey to cloud-native is incremental. Start with a strangler-fig pattern to gradually migrate critical components while maintaining operational stability.`,
    status: 'APPROVED',
    currentStage: 2,
    isLocked: true,
    createdBy: 'Alex Morgan',
    createdAt: '2024-10-01T08:00:00Z',
    updatedAt: '2024-10-05T14:30:00Z',
    history: [
      {
        id: 'h1a',
        action: 'CREATED',
        actor: 'Alex Morgan',
        role: 'CREATOR',
        timestamp: '2024-10-01T08:00:00Z',
        comment: 'Initial draft created',
      },
      {
        id: 'h1b',
        action: 'SUBMITTED',
        actor: 'Alex Morgan',
        role: 'CREATOR',
        timestamp: '2024-10-02T09:15:00Z',
      },
      {
        id: 'h1c',
        action: 'APPROVED_L1',
        actor: 'Jordan Lee',
        role: 'REVIEWER_L1',
        timestamp: '2024-10-03T11:00:00Z',
        comment: 'Well-structured introduction. Approved for L2 review.',
      },
      {
        id: 'h1d',
        action: 'APPROVED_L2',
        actor: 'Taylor Kim',
        role: 'REVIEWER_L2',
        timestamp: '2024-10-05T14:30:00Z',
        comment: 'Excellent content. Ready to publish.',
      },
    ],
  },
  {
    id: 'c2',
    title: 'Modern State Management in React 18',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
    description:
      'Explore React 18\'s concurrent features and compare Context API, Zustand, Jotai, and Redux Toolkit for state management.',
    body: `React 18 introduced a wave of powerful concurrent features that change how we think about state management. With transitions, Suspense boundaries, and startTransition, managing complex UI state has never been more nuanced.

## Context API in 2024

The humble Context API has been unfairly maligned. When used correctly — with proper memoization and context splitting — it performs remarkably well for most applications. The key is to avoid storing frequently-changing values in a single context.

## Zustand: Simplicity at Scale

Zustand's minimal API surface and outside-React accessibility make it ideal for medium-complexity applications. Its selector-based subscriptions prevent unnecessary re-renders without the boilerplate of Redux.

## When to Use Redux Toolkit

Large teams with complex data flows, time-travel debugging needs, or heavy middleware requirements still benefit from Redux Toolkit. The opinionated structure improves maintainability at scale.

## Recommendation

For most new projects: start with Context API, upgrade to Zustand when complexity demands it, and reach for Redux Toolkit only when team size and debugging requirements justify the overhead.`,
    status: 'IN_REVIEW',
    currentStage: 2,
    isLocked: true,
    createdBy: 'Alex Morgan',
    createdAt: '2024-10-10T10:00:00Z',
    updatedAt: '2024-10-12T16:00:00Z',
    history: [
      {
        id: 'h2a',
        action: 'CREATED',
        actor: 'Alex Morgan',
        role: 'CREATOR',
        timestamp: '2024-10-10T10:00:00Z',
      },
      {
        id: 'h2b',
        action: 'SUBMITTED',
        actor: 'Alex Morgan',
        role: 'CREATOR',
        timestamp: '2024-10-11T08:30:00Z',
      },
      {
        id: 'h2c',
        action: 'APPROVED_L1',
        actor: 'Jordan Lee',
        role: 'REVIEWER_L1',
        timestamp: '2024-10-12T16:00:00Z',
        comment: 'Good comparison. Moving to final review.',
      },
    ],
  },
  {
    id: 'c3',
    title: 'Building Accessible UI Components from Scratch',
    image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=60',
    description:
      'A deep dive into WAI-ARIA patterns, keyboard navigation, and screen reader compatibility for modern web components.',
    body: `Web accessibility is not an afterthought — it's a fundamental aspect of quality engineering. An estimated 1.3 billion people live with some form of disability, and accessible design benefits all users, not just those with disabilities.

## The ARIA Specification

WAI-ARIA (Web Accessibility Initiative – Accessible Rich Internet Applications) provides a set of roles, states, and properties that can be added to HTML elements to improve accessibility. Understanding the difference between landmark roles, widget roles, and document structure roles is essential.

## Keyboard Navigation

Every interactive element must be reachable via keyboard. Focus management becomes critical in single-page applications where route changes don't automatically move focus. Using roving tabindex patterns for compound widgets like radio groups, menus, and tabs creates a predictable, accessible experience.

## Screen Reader Testing

Test with at least two screen readers: NVDA (Windows) and VoiceOver (macOS/iOS). JAWS remains the enterprise standard. Automated testing tools like axe-core catch ~30–40% of accessibility issues; manual testing is irreplaceable.

## Practical Checklist

- Sufficient color contrast (4.5:1 for normal text, 3:1 for large text)
- Meaningful alt text for images
- Form labels associated with inputs
- Error messages programmatically linked to fields
- Skip navigation links for keyboard users`,
    status: 'IN_REVIEW',
    currentStage: 1,
    isLocked: true,
    createdBy: 'Alex Morgan',
    createdAt: '2024-10-14T09:00:00Z',
    updatedAt: '2024-10-14T09:00:00Z',
    history: [
      {
        id: 'h3a',
        action: 'CREATED',
        actor: 'Alex Morgan',
        role: 'CREATOR',
        timestamp: '2024-10-14T09:00:00Z',
      },
      {
        id: 'h3b',
        action: 'SUBMITTED',
        actor: 'Alex Morgan',
        role: 'CREATOR',
        timestamp: '2024-10-14T09:30:00Z',
      },
    ],
  },
  {
    id: 'c4',
    title: 'The Art of Code Review: Beyond Syntax',
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&auto=format&fit=crop&q=60',
    description:
      'Effective code review strategies that focus on architecture, maintainability, and team culture rather than just catching bugs.',
    body: `Code review is one of the highest-leverage activities in software engineering. Yet most teams treat it as a formality — a gate to be passed rather than an opportunity for learning and collective ownership.

## What Great Reviews Look Like

Exceptional code reviews focus on intent before implementation. Before suggesting an alternative approach, ask: "Does this solve the right problem?" Then examine maintainability, testability, and alignment with team conventions.

## The Psychology of Review

Receiving critical feedback on code you've spent hours writing is inherently uncomfortable. Frame comments as observations about the code, not judgments about the author. "This function has multiple responsibilities" is more constructive than "You wrote this poorly."

## Async vs. Synchronous Review

For non-trivial changes, consider a brief synchronous walkthrough before the formal async review. This surfaces misunderstandings early and makes the written review more focused on refinements rather than fundamental issues.

## Automation as Your First Reviewer

Linters, formatters, and static analysis tools should catch style issues before human reviewers ever see the code. Reserve human attention for higher-order concerns: design decisions, potential edge cases, and knowledge transfer.`,
    status: 'CHANGES_REQUESTED',
    currentStage: 1,
    isLocked: false,
    createdBy: 'Alex Morgan',
    createdAt: '2024-10-08T11:00:00Z',
    updatedAt: '2024-10-11T10:00:00Z',
    history: [
      {
        id: 'h4a',
        action: 'CREATED',
        actor: 'Alex Morgan',
        role: 'CREATOR',
        timestamp: '2024-10-08T11:00:00Z',
      },
      {
        id: 'h4b',
        action: 'SUBMITTED',
        actor: 'Alex Morgan',
        role: 'CREATOR',
        timestamp: '2024-10-09T08:00:00Z',
      },
      {
        id: 'h4c',
        action: 'REJECTED',
        actor: 'Jordan Lee',
        role: 'REVIEWER_L1',
        timestamp: '2024-10-11T10:00:00Z',
        comment:
          'Good concepts but the section on async reviews needs more concrete examples. Please add a real-world scenario.',
      },
    ],
  },
  {
    id: 'c5',
    title: 'TypeScript Advanced Patterns for Enterprise Applications',
    image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop&q=60',
    description:
      'Mapped types, conditional types, template literals, and advanced inference techniques for building type-safe enterprise systems.',
    body: `TypeScript's type system is Turing-complete — a fact that unlocks remarkable expressive power but also comes with the risk of creating unmaintainable type-level spaghetti. This guide covers patterns that remain readable while providing maximum safety.

## Mapped Types

Mapped types allow you to create new types by transforming the properties of existing ones. The built-in utility types like Partial, Required, Pick, and Omit are all implemented using mapped types.

## Conditional Types

Conditional types introduce branching logic into the type system. Combined with infer, they allow you to extract and manipulate type information in sophisticated ways.

## Template Literal Types

Introduced in TypeScript 4.1, template literal types allow string manipulation at the type level. This enables precise typing for event emitters, CSS property names, and API route definitions.

## The Principle of Least Astonishment

The most important principle in advanced TypeScript is the principle of least astonishment: your types should behave predictably. If a type is difficult to understand or reason about, it's a liability rather than an asset, regardless of its technical sophistication.`,
    status: 'DRAFT',
    currentStage: 1,
    isLocked: false,
    createdBy: 'Alex Morgan',
    createdAt: '2024-10-15T14:00:00Z',
    updatedAt: '2024-10-15T14:00:00Z',
    history: [
      {
        id: 'h5a',
        action: 'CREATED',
        actor: 'Alex Morgan',
        role: 'CREATOR',
        timestamp: '2024-10-15T14:00:00Z',
        comment: 'Initial draft saved',
      },
    ],
  },
  {
    id: 'c6',
    title: 'Observability-Driven Development: Logging, Metrics & Tracing',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
    description:
      'Implementing the three pillars of observability in distributed systems: structured logging, application metrics, and distributed tracing.',
    body: `In distributed systems, you cannot debug what you cannot observe. Observability-driven development flips the script: instead of adding instrumentation when something breaks, you build observability in from the start.

## The Three Pillars

**Logs** provide discrete records of events. Structured logging — using JSON instead of plain text — makes logs machine-parseable and enables powerful querying in platforms like Elasticsearch, Loki, or CloudWatch Insights.

**Metrics** are numeric measurements over time. Use the RED method (Rate, Errors, Duration) for services and the USE method (Utilization, Saturation, Errors) for resources. Prometheus + Grafana is the open-source standard.

**Traces** connect logs and metrics across service boundaries. Distributed tracing (OpenTelemetry is now the industry standard) reveals exactly which service in a chain of microservices is responsible for latency spikes.

## Instrumentation Strategy

Don't instrument everything — instrument what matters. Define SLIs (Service Level Indicators) and SLOs (Service Level Objectives) first, then instrument to measure them. Alert on symptoms, not causes.

## The Correlation ID Pattern

Every request entering your system should receive a unique correlation ID that propagates through all downstream calls. This single pattern makes debugging distributed issues dramatically faster.`,
    status: 'DRAFT',
    currentStage: 1,
    isLocked: false,
    createdBy: 'Alex Morgan',
    createdAt: '2024-10-16T08:00:00Z',
    updatedAt: '2024-10-16T08:00:00Z',
    history: [
      {
        id: 'h6a',
        action: 'CREATED',
        actor: 'Alex Morgan',
        role: 'CREATOR',
        timestamp: '2024-10-16T08:00:00Z',
      },
    ],
  },
];
