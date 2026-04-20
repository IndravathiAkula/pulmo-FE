# PulmoPrep Architecture Documentation

## 1. System Overview
PulmoPrep is a sophisticated secure PDF distribution platform designed for medical professionals and researchers. The system implements a multi-layered Digital Rights Management (DRM) approach with advanced security features including fullscreen enforcement, watermarking, and comprehensive access control. The platform operates under a **Feature-First Architecture** with strict separation between client and server concerns.

## 2. Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Runtime**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 (PostCSS)
- **PDF Engine**: `react-pdf` (pdf.js)
- **State Management**: Zustand 5 + React Hooks
- **Icons**: Lucide React
- **API**: Next.js Route Handlers
- **Build Tools**: PostCSS 4, ESLint 9

## 3. Architecture Principles

### 3.1 Feature-First Organization
The project follows a **Feature-First** structure that groups related functionality together:
- **Features**: Business logic and UI components organized by domain (auth, books, reader)
- **Client**: Shared client-side utilities, state management, and UI components
- **Server**: Server-only logic with no browser leakage
- **Shared**: Cross-cutting utilities and generic components

### 3.2 Route Groups & Security Isolation
Next.js **Route Groups** provide security and layout isolation:
- **`(marketing)`**: Public pages (Home, Catalog, Departments, Doctors)
- **`(auth)`**: Authentication flows with minimal layout
- **`(reader)`**: Secure fullscreen environment with no navigation
- **`api/`**: Server-side API endpoints

### 3.3 Client Islands Pattern
Strategic use of Client Components within Server Components:
- **Server Components**: Static content, data fetching, SEO-critical elements
- **Client Islands**: Interactive elements (auth state, purchase buttons, security hooks)
- **Performance**: Minimizes client-side JavaScript while maintaining interactivity

## 4. Folder Structure

```text
ebook-hub-next/
├── app/                           # Next.js App Router pages
│   ├── (auth)/                    # Authentication routes
│   ├── (marketing)/               # Public marketing pages
│   ├── (reader)/                  # Secure reader environment
│   ├── api/                       # Server-side API endpoints
│   ├── books/                     # Book detail pages
│   ├── departments/               # Department browsing
│   ├── doctors/                   # Doctor profiles
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Global styles
├── features/                      # Feature-based organization
│   ├── auth/                      # Authentication & access control
│   │   ├── components/            # Login forms, auth nav
│   │   └── hooks/                 # Access control logic
│   ├── books/                     # Book catalog & management
│   │   ├── components/            # Book cards, grids, previews
│   │   ├── useBookById.ts         # Book lookup hook
│   │   └── index.ts               # Feature exports
│   └── reader/                    # Secure PDF reading
│       ├── components/            # Reader shell, secure reader
│       ├── hooks/                 # Fullscreen guard
│       └── security/              # Security hooks, watermarks
├── client/                        # Shared client-side utilities
│   ├── hooks/                     # Custom hooks
│   ├── state/                     # Zustand stores
│   ├── theme/                     # Theme configuration
│   └── ui/                        # Shared UI components
├── server/                        # Server-only logic
│   ├── auth/                      # Authentication validation
│   └── pdf/                       # PDF streaming & processing
├── lib/                           # Shared utilities
└── public/                        # Static assets
```

## 5. State Management Architecture

### 5.1 Zustand-Based State Management
Centralized state management using Zustand with persistence:

**Authentication State** (`client/state/authStore.ts`):
- User session management
- Login/logout functionality
- Persistent authentication state

**Payment & Ownership State** (`client/state/paymentStore.ts`):
- Purchase tracking
- Book ownership verification
- Persistent purchase history

**Recent Books State** (`client/state/useRecentBooksStore.ts`):
- Recently viewed books tracking
- Local storage persistence
- Automatic cleanup and deduplication

### 5.2 State Flow
```text
User Action → Zustand Store → Component Re-render → UI Update
     ↓              ↓              ↓              ↓
Login/Logout → Auth Store → Navigation → Conditional Rendering
Purchase → Payment Store → Book Cards → Ownership Badges
View Book → Recent Store → Homepage → Recently Viewed Section
```

## 6. Security Architecture

### 6.1 Multi-Layered DRM Approach
**Layer 1: Access Control**
- Server-side validation of authentication and purchases
- Route-based security isolation
- Centralized access control service

**Layer 2: Content Protection**
- PDF served as `application/octet-stream` (not PDF)
- Blob URL creation for tab-local access only
- Text layer disabled to prevent DOM scraping

**Layer 3: Interaction Prevention**
- Transparent pointer-shield over canvas
- Keyboard shortcut blocking (Ctrl+S, Ctrl+P, F12)
- Right-click context menu prevention

**Layer 4: Visual Deterrence**
- Dynamic SVG watermarks with user info
- Mix-blend-mode for visibility across content
- Fullscreen enforcement with security exit

### 6.2 Security Components

**Fullscreen Reader Shell** (`features/reader/components/FullscreenReaderShell.tsx`):
- Enforces browser fullscreen mode
- Provides security exit mechanism
- Handles ESC key and navigation prevention

**Secure Reader** (`features/reader/components/SecureReader.tsx`):
- PDF rendering with security overlays
- Page navigation and zoom controls
- Integration with security hooks

**Security Hooks** (`features/reader/security/useReaderSecurity.ts`):
- DevTools detection via dimension monitoring
- Screen sharing detection via API monkey-patching
- Focus loss detection with interlock timers
- Keyboard shortcut interception

**Watermark System** (`features/reader/security/Watermark.tsx`):
- Dynamic SVG watermark generation
- User-specific information embedding
- Cross-browser compatibility

## 7. Application Layers

### 7.1 Presentation Layer
- **Next.js App Router**: Server Components for SEO and performance
- **TailwindCSS**: Utility-first styling with custom theme
- **Component Architecture**: Reusable, accessible UI components
- **Responsive Design**: Mobile-first responsive layouts

### 7.2 Business Logic Layer
- **Feature Modules**: Domain-specific business logic
- **Hooks**: Custom hooks for data fetching and state management
- **Validation**: Client-side form validation and error handling
- **Navigation**: Programmatic navigation with state preservation

### 7.3 Data Access Layer
- **API Routes**: Server-side endpoints for data access
- **PDF Proxy**: Secure PDF streaming with authentication
- **Local Storage**: Client-side data persistence
- **State Management**: Global state with Zustand

### 7.4 Infrastructure Layer
- **Build System**: Next.js with TypeScript and PostCSS
- **Linting**: ESLint with Next.js configuration
- **Type Safety**: Full TypeScript coverage with strict mode
- **Performance**: Optimized bundle splitting and lazy loading

## 8. Data Flow Architecture

### 8.1 Book Discovery Flow
```text
User visits Homepage → Server Component renders → 
Data fetched from lib/data-utils.ts → 
UI renders with Client Islands → 
User interacts with filters → 
State updates via Zustand → 
UI re-renders with filtered results
```

### 8.2 Purchase Flow
```text
User clicks Purchase → Auth check → 
If not authenticated → Redirect to login → 
If authenticated → Zustand store update → 
UI reflects purchase status → 
Access granted to full content
```

### 8.3 Reading Flow
```text
User accesses book → Access control validation → 
If purchased → PDF proxy request → 
Blob URL creation → 
Secure reader initialization → 
Fullscreen enforcement → 
Protected PDF rendering
```

## 9. Component Architecture

### 9.1 Component Patterns
**Server Components**: Static content, data fetching, SEO
- Homepage with book discovery
- Department and doctor listings
- Book detail pages (metadata only)

**Client Islands**: Interactive functionality
- Authentication state management
- Purchase buttons and ownership badges
- Search and filtering
- Security hooks and watermarks

**Shared Components**: Reusable UI elements
- Cards, buttons, badges
- Layout components
- Navigation elements

### 9.2 Component Hierarchy
```text
Layout (Server)
├── Navigation (Client Island)
├── Main Content (Server)
│   ├── Hero Banner (Server)
│   ├── Discovery Sections (Server)
│   │   ├── Horizontal Scrollers (Server)
│   │   └── Cards (Server with Client Islands)
│   └── Feature Pages (Server)
└── Footer (Server)
```

## 10. Security Flow Documentation

### 10.1 Access Control Flow
1. **Route Protection**: Server Components validate access before rendering
2. **Client Validation**: Zustand stores provide real-time access status
3. **UI Adaptation**: Components adapt based on authentication and ownership
4. **Secure Reader**: Full security enforcement in isolated environment

### 10.2 PDF Security Flow
1. **Request Validation**: Server validates authentication and purchase
2. **Content Obfuscation**: PDF served as binary stream, not PDF
3. **Client Processing**: Blob URL created for tab-local access
4. **Secure Rendering**: Canvas-based rendering with disabled text layer
5. **Visual Protection**: Dynamic watermarks and interaction blocking
6. **Session Management**: Blob cleanup and security state management

## 11. Performance Optimization

### 11.1 Bundle Optimization
- **Code Splitting**: Automatic via Next.js dynamic imports
- **Lazy Loading**: Components loaded on demand
- **Tree Shaking**: Unused code eliminated in build
- **Image Optimization**: Next.js Image component for optimized assets

### 11.2 Runtime Performance
- **Memoization**: React.memo for expensive calculations
- **Debouncing**: Input handling with debounce for search
- **Virtualization**: Lazy rendering of long lists
- **Worker Offloading**: PDF processing in background threads

### 11.3 Security Performance
- **Minimal Client Code**: Security logic optimized for performance
- **Efficient Detection**: Lightweight DevTools and sharing detection
- **Resource Cleanup**: Proper cleanup of event listeners and timers

## 12. Recent Features & Enhancements

### 12.1 Enhanced Discovery
- **Recently Viewed Section**: Personalized book recommendations
- **Advanced Search**: Real-time filtering and search
- **Department Browsing**: Organized by medical specialties
- **Doctor Profiles**: Author information and book listings

### 12.2 Improved UX
- **Responsive Design**: Mobile-first responsive layouts
- **Accessibility**: ARIA labels and keyboard navigation
- **Loading States**: Skeleton screens and loading indicators
- **Error Handling**: Graceful error states and user feedback

### 12.3 Security Enhancements
- **Fullscreen Enforcement**: Robust fullscreen detection and enforcement
- **Watermark System**: Dynamic, user-specific watermarks
- **Interaction Blocking**: Comprehensive keyboard and mouse protection
- **Session Management**: Proper cleanup and security state management

## 13. Development Workflow

### 13.1 Code Organization
- **Feature-Based**: Related code grouped by feature
- **Type Safety**: Full TypeScript coverage
- **Linting**: Consistent code style with ESLint
- **Component Reusability**: Shared components in client/ui/

### 13.2 Testing Strategy
- **Component Testing**: Individual component testing
- **Integration Testing**: Feature interaction testing
- **Security Testing**: DRM effectiveness validation
- **Performance Testing**: Bundle size and runtime performance

## 14. Future Architecture Improvements

### 14.1 Security Enhancements
- **Signed URLs**: Short-lived signed URLs for PDF access
- **Fragmented Delivery**: Per-page encrypted chunks
- **Hardware DRM**: EME integration for hardware-level protection
- **Advanced Watermarking**: Cryptographic steganography

### 14.2 Performance Optimizations
- **Edge Caching**: CDN-based caching for static assets
- **Incremental Static Regeneration**: Dynamic content updates
- **Bundle Analysis**: Continuous bundle size monitoring
- **Performance Monitoring**: Real-user monitoring integration

### 14.3 Feature Expansion
- **Collaboration Tools**: Annotation and sharing features
- **Advanced Analytics**: Reading behavior analytics
- **Mobile App**: Native mobile application
- **AI Integration**: Content recommendations and search

## 15. Known Limitations & Constraints

### 15.1 Security Limitations
- **Hardware Capture**: Cannot prevent hardware-level screen capture
- **DevTools Bypass**: Sophisticated users can potentially bypass detection
- **Network Interception**: Cannot prevent network-level interception
- **Browser Vulnerabilities**: Dependent on browser security updates

### 15.2 Technical Constraints
- **Browser Compatibility**: Limited to modern browsers with fullscreen API
- **PDF Limitations**: Some PDF features may not render correctly
- **Performance Impact**: Security features add computational overhead
- **Storage Limits**: Local storage limitations for recent books

This architecture provides a robust, scalable foundation for PulmoPrep while maintaining high security standards and excellent user experience for medical professionals accessing protected content.