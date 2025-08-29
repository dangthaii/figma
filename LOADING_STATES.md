# Loading States Implementation

This document outlines all the loading states implemented throughout the Figma application to provide a smooth user experience.

## Overview

The application now includes comprehensive loading states for:

- Authentication and user data
- Project and chat data fetching
- Message streaming and AI processing
- Form submissions and mutations
- Error handling and recovery

## Components Created

### 1. Loading UI Components (`components/ui/loading.tsx`)

#### Basic Loading Elements

- **Spinner**: Animated circular loading indicator with configurable sizes
- **LoadingDots**: Three bouncing dots animation
- **TypingIndicator**: Shows "AI đang xử lý" with animated dots
- **Skeleton**: Generic skeleton loading placeholder

#### Specialized Skeletons

- **ChatMessageSkeleton**: Skeleton for chat messages
- **SidebarItemSkeleton**: Skeleton for sidebar items
- **ProjectSelectorSkeleton**: Skeleton for project selector

#### Loading Wrappers

- **ButtonLoading**: Button with loading state
- **PageLoading**: Full-screen loading overlay
- **ContentLoading**: Wrapper for conditional loading states

### 2. Loading Context (`lib/loading.tsx`)

- **LoadingProvider**: Global loading state management
- **useLoading**: Hook to control global loading states

### 3. Error Handling (`components/ErrorBoundary.tsx`)

- **ErrorBoundary**: Catches and displays errors gracefully
- Provides retry and reload functionality
- Shows error details in development mode

### 4. Authentication Guard (`components/AuthGuard.tsx`)

- **AuthGuard**: Protects routes and shows authentication loading
- Redirects unauthenticated users
- Displays loading while checking authentication

## Loading States by Feature

### Authentication

- **Header**: Shows spinner while loading user data
- **Login/Register**: Button loading states during form submission
- **Password Change**: Loading state during password update
- **AuthGuard**: Full-page loading while checking authentication

### Projects

- **Project List**: Skeleton loading while fetching projects
- **Project Selector**: Placeholder while loading project data
- **Create Project**: Button loading during project creation

### Chats

- **Chat List**: Skeleton loading for chat items
- **Chat Messages**: Loading state while fetching chat data
- **New Chat**: Loading during chat creation

### AI Processing

- **Message Input**: Button loading during message sending
- **Chat Area**: Typing indicator while AI is processing
- **Streaming**: Real-time loading dots during message streaming

### Web Demo Features

- **WebDemoPanel**: Loading states for demo generation
- **WebDemoNotification**: Loading during demo checks

## Implementation Details

### React Query Integration

All data fetching hooks now include loading states:

```typescript
const { data, isLoading, error } = useQuery({...});
```

### Conditional Rendering

Components show appropriate loading states based on data availability:

```typescript
{
  isLoading ? <Skeleton /> : <ActualContent />;
}
```

### Loading Hierarchy

1. **Global Loading**: Page-level operations
2. **Section Loading**: Component-level data fetching
3. **Action Loading**: Button/form submission states

## Usage Examples

### Basic Loading State

```typescript
import { Spinner } from "@/components/ui/loading";

{
  isLoading && <Spinner size="lg" />;
}
```

### Skeleton Loading

```typescript
import { SidebarItemSkeleton } from "@/components/ui/loading";

{chatsLoading ? (
  <div className="space-y-1">
    {Array.from({ length: 3 }).map((_, i) => (
      <SidebarItemSkeleton key={i} />
    ))}
  </div>
) : (
  // Actual content
)}
```

### Content Loading Wrapper

```typescript
import { ContentLoading } from "@/components/ui/loading";

<ContentLoading loading={isLoading} skeleton={<ChatMessageSkeleton />}>
  {children}
</ContentLoading>;
```

## Best Practices

### 1. Loading State Hierarchy

- Show most specific loading state first
- Fall back to generic loading if needed
- Avoid multiple loading indicators simultaneously

### 2. Skeleton Loading

- Use skeletons for content that takes time to load
- Match skeleton dimensions to actual content
- Provide visual feedback that content is coming

### 3. Button States

- Disable buttons during loading
- Show loading text/spinner in buttons
- Prevent multiple submissions

### 4. Error Handling

- Always provide fallback states
- Show user-friendly error messages
- Include retry mechanisms where appropriate

## Accessibility

- Loading states include proper ARIA labels
- Screen readers announce loading status
- Keyboard navigation is maintained during loading
- Loading indicators have sufficient contrast

## Performance Considerations

- Loading states don't block the main thread
- Skeletons render immediately for perceived performance
- Loading animations use CSS transforms for smooth rendering
- Global loading states are used sparingly

## Future Enhancements

- Progressive loading for large datasets
- Skeleton animations for better visual appeal
- Loading state persistence across page refreshes
- Custom loading themes and animations
