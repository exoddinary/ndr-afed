# SEEK AI - Project Overview

## Project Purpose

SEEK AI is a comprehensive data management and analysis platform designed for geoscience professionals in the oil & gas industry. The platform facilitates the collection, validation, visualization, and analysis of well data, geochemistry data, and geological information across multiple disciplines.

## Target Users

### 1. **Administrators** (Admin/System Admin)
- Manage user accounts and roles
- Configure data quality rules and ingestion workflows
- Monitor system activity and user actions
- Manage data sources, disciplines, and shapefiles
- Review and approve data submissions

### 2. **Expert Contributors** (Geologists, Geophysicists, Sedimentologists, Petrophysicists)
- Upload well data files (CSV, Excel)
- Process and validate uploaded data
- Resolve data quarantine issues
- Handle data deduplication and conflicts
- Contribute domain-specific analysis

### 3. **Reviewers**
- Review pending data submissions
- Approve or reject data entries
- Provide feedback on data quality

### 4. **Viewers**
- Access and view approved data
- Generate reports and visualizations
- Export data for external analysis

## Core Features

### Data Management

#### **Data Link Workflow**
1. **Upload** (`/upload`)
   - Bulk upload of CSV/Excel files containing well data
   - Support for various data types: Pyrolysis, XRD, XRF, Maturity, Sedimentology, Petrography

2. **Ingestion History** (`/data-link/ingestion-history`)
   - Timeline view of file uploads and processing
   - Track file processing status (records processed, quarantined)
   - View deduplication actions (Overwrite, Delete)
   - Filter by action, user, and date range
   - Show expert disciplines performing actions

3. **Data Quarantine** (`/quarantine`)
   - Expandable data table for flagged records
   - Deduplication conflict resolution
   - Row-by-row actions: Overwrite, Delete, Keep Both
   - Bulk operations support
   - Property comparison views

### Catalog & Visualization

#### **Well Data** (`/catalog`)
- Browse well datasets with rich metadata
- Interactive map view with well locations
- Detailed well information pages
- Multiple data tabs:
  - **Details**: Overview, Reservoir Info, Location
  - **Geochemistry**: Pyrolysis, Maturity parameters
  - **Sedimentology**: Main sedimentology, XRF Oxide, XRF Elementals, XRD, Heavy Minerals, Petrography (Carbonate & Clastic)
  - **Geopressure**: Pressure analysis
  - **QA/QC**: Quality control data

#### **Map Data** (`/catalog?tab=map`)
- Interactive Mapbox/Leaflet integration
- Geospatial visualization of wells and blocks
- Full-screen map view option

### Admin Tools

#### **User Management** (`/admin/users`)
- User account creation and management
- Role assignment (System Admin, Admin, Geologist, Reviewer, Viewer)
- Discipline assignment for experts
- User status management (Active/Inactive)

#### **Role Management** (`/admin/roles`)
- Define and manage user roles
- Configure role permissions
- Role-based access control (RBAC)

#### **Activity Log** (`/admin/activity`)
- Comprehensive audit trail of admin actions
- Timeline view of user management activities
- Filter by action type, user, date range
- Shows role badges for administrators

#### **Data Management**
- **Data Quality** (`/admin/data-quality`): Configure validation rules
- **Ingestion Rules** (`/admin/ingestion`): Define data processing workflows
- **Source Data** (`/admin/tagging/source`): Manage data source tags
- **Discipline** (`/admin/tagging/discipline`): Manage discipline classifications
- **Shapefile** (`/admin/tagging/shapefiles`): Manage geospatial shapefiles

#### **Review System** (`/admin/review/pending`)
- Pending data review queue
- Approval/rejection workflow
- Review preview with detailed data view

### Advanced Features

#### **AI Geospatial Analysis** (`/ai-geospatial`)
- Interactive AI-powered geospatial queries
- Natural language processing for data analysis
- Map-based visualization of AI insights

#### **GEB (Geoscience Exploration Basins)** (`/geb/*`)
- Dedicated GEB analysis interface
- Custom header: "SEEK-GEB"
- Specialized sidebar navigation:
  - Overview
  - Map (with globe icon)
  - Ranking (expandable):
    - Combined Ranking
    - Subsurface
    - Above Ground
    - Resources Density
    - Frontier Basin
  - Basin

#### **Analytics Dashboard** (`/analytics/*`)
- Executive KPIs and data health metrics
- AI-powered insights and recommendations
- Interactive well distribution maps
- Specialized analysis tools:
  - Basin Deep Dive (`/analytics/basin/[id]`)
  - Play Fairway Analysis (`/analytics/play-fairway`)
  - Data Health Dashboard (`/analytics/data-health`)
  - Compare Wells Tool (`/analytics/compare`)

## Application Sitemap

```
SEEK AI
├── 🏠 HOME
│   └── / ................................ Dashboard/Landing page
│
├── 📊 ANALYTICS (Accessible from Home only)
│   ├── /analytics ....................... Main Analytics Dashboard
│   ├── /analytics/basin/[id] ............ Basin Deep Dive (Malay, Sumatra, Java)
│   ├── /analytics/play-fairway .......... Play Fairway Analysis
│   ├── /analytics/data-health ........... Data Health Dashboard
│   └── /analytics/compare ............... Comparative Analysis Tool
│
├── 🔗 DATA LINK
│   ├── /quarantine ...................... Data Quarantine & Conflict Resolution
│   ├── /upload .......................... File Upload Interface
│   └── /data-link/ingestion-history ..... Ingestion History Timeline
│
├── 📚 CATALOG
│   ├── /catalog ......................... Well Data Catalog (Table View)
│   ├── /catalog?tab=map ................. Map View
│   ├── /catalog/[id] .................... Well Detail Page
│   └── /catalog/map/metadata ............ Map Metadata View
│
├── 👥 USER MANAGEMENT (Admin/Reviewer)
│   ├── /profile ......................... User Profile
│   ├── /admin/users ..................... User Management (Admin)
│   ├── /admin/roles ..................... Role Management (Admin)
│   └── /admin/review/pending ............ Pending Reviews (Reviewer)
│
├── ⚙️ DATA MANAGEMENT (Admin)
│   ├── /admin/data-quality .............. Data Quality Rules
│   ├── /admin/ingestion ................. Ingestion Rules
│   ├── /admin/tagging/source ............ Source Data Tagging
│   ├── /admin/tagging/discipline ........ Discipline Management
│   └── /admin/tagging/shapefiles ........ Shapefile Management
│
├── 📋 MONITORING (Admin)
│   └── /admin/activity .................. Activity Log & Audit Trail
│
├── 🤖 ADVANCED FEATURES
│   └── /ai-geospatial ................... AI Geospatial Analysis
│
└── 🌍 GEB MODULE
    ├── /geb ............................. Overview
    ├── /geb/map ......................... GEB Map View
    ├── /geb/basin ....................... Basin Analysis
    └── /geb/ranking/
        ├── combined ..................... Combined Ranking
        ├── subsurface ................... Subsurface Ranking
        ├── above-ground ................. Above Ground Ranking
        ├── resources-density ............ Resources Density
        └── frontier-basin ............... Frontier Basin Ranking
```

### Route Access by Role

| Route | Admin | Reviewer | Geologist | Viewer |
|-------|-------|----------|-----------|--------|
| `/` (Home) | ✅ | ✅ | ✅ | ✅ |
| `/analytics/*` | ✅ | ✅ | ✅ | ✅ |
| `/catalog/*` | ✅ | ✅ | ✅ | ✅ |
| `/upload` | ✅ | ✅ | ✅ | ❌ |
| `/quarantine` | ✅ | ✅ | ✅ | ❌ |
| `/data-link/ingestion-history` | ✅ | ✅ | ✅ | ❌ |
| `/admin/users` | ✅ | ❌ | ❌ | ❌ |
| `/admin/roles` | ✅ | ❌ | ❌ | ❌ |
| `/admin/activity` | ✅ | ❌ | ❌ | ❌ |
| `/admin/data-quality` | ✅ | ❌ | ❌ | ❌ |
| `/admin/ingestion` | ✅ | ❌ | ❌ | ❌ |
| `/admin/tagging/*` | ✅ | ❌ | ❌ | ❌ |
| `/admin/review/pending` | ✅ | ✅ | ❌ | ❌ |
| `/profile` | ✅ | ✅ | ✅ | ✅ |
| `/ai-geospatial` | ✅ | ✅ | ✅ | ✅ |
| `/geb/*` | ✅ | ✅ | ✅ | ✅ |

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 15.5.2 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS 4.1.9
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Theme**: next-themes (dark/light mode)
- **Icons**: Lucide React, Bootstrap Icons
- **Charts**: ECharts, Recharts

### Map & Geospatial
- **Mapbox GL** for interactive maps
- **Leaflet** for alternative map rendering
- Dynamic map imports to prevent SSR issues

### Data Visualization
- Timeline components for activity logs
- Expandable data tables with filtering
- Card-based layouts for data organization
- Badge system for status indicators

### State Management
- React Context for theme, role, and drawer state
- Local state with useState/useMemo for filters
- Server-side mock data (ready for API integration)

## Design System

### Badge Tokens
- **Light Mode**: Filled badges with white text (500-tier colors) for readability
- **Dark Mode**: Translucent badges with colored text (600/15 opacity) for subtlety
- **Colors**:
  - Roles: Rose (System Admin), Cyan (Admin), Amber (Geologist), Violet (Reviewer), Slate (Viewer)
  - Disciplines: Amber (Geologist), Cyan (Geophysicist), Violet (Sedimentologist), Emerald (Petrophysicist), Slate (Data Manager)
  - Status: Emerald (Success), Rose (Failed), Amber (Warning)

### Layout
- Collapsible sidebar with role-based sections
- Responsive header with dynamic titles
- Breadcrumb navigation
- Right drawer for detail views (catalog)
- Edge-to-edge layouts for activity pages

### Theme
- Dark mode optimized
- Light mode with high contrast badges
- Consistent color palette across features

## Key Data Types

### Well Data
- **Geochemistry**: TOC, S1, S2, HI, OI, Tmax, Vitrinite reflectance
- **Sedimentology**: Depositional environment, facies, grain size
- **Mineralogy**: XRD (Quartz, Feldspar, Clay minerals), XRF (elemental analysis)
- **Petrography**: Carbonate/Clastic analysis, porosity, cement types
- **Maturity**: Thermal maturity indicators

### Metadata
- Data source (IHS Markit, Schlumberger, Field Survey, etc.)
- Discipline classification
- Confidentiality levels
- Reviewer/Approver assignments
- Tags and categorization

#### Date Format Standard (Global)
- All dates displayed in catalog metadata must use: `DD Mon YYYY`.
- Applies at minimum to:
  - Pyrolysis → Data Generation Date, Data Entry Date
  - Maturity → Data Generation Date, Data Entry Date
  - Main Sedimentology → Data Generation Date, Data Entry Date
- Example: `05 Oct 2025` (not `2025-10-05`, `05/10/2025`, or `Oct 5, 2025`).

## Workflow Overview

### Data Ingestion Flow
1. Expert uploads file → System processes → Records quarantined if conflicts
2. Expert reviews quarantine → Resolves conflicts (Overwrite/Delete)
3. Approved data → Catalog
4. Admin monitors via Activity Log & Ingestion History

### Review & Approval Flow
1. Data submitted → Pending review queue
2. Reviewer examines → Approves/Rejects
3. Approved → Published to catalog
4. Activity logged for audit

### User Management Flow
1. Admin creates user → Assigns role & discipline
2. User performs actions → Logged in Activity Log
3. Admin monitors → Adjusts permissions as needed

## Future Considerations

- API integration (currently using mock data)
- Real-time collaboration features
- Advanced AI analysis capabilities
- Enhanced geospatial analytics
- Export and reporting tools
- Integration with external data sources

## File Structure

```
app/
├── admin/              # Admin-only features
│   ├── activity/       # Activity Log
│   ├── users/          # User Management
│   ├── roles/          # Role Management
│   ├── review/         # Review System
│   ├── data-quality/   # Data Quality Rules
│   ├── ingestion/      # Ingestion Rules
│   └── tagging/        # Tag Management
├── catalog/            # Well Data Catalog
├── data-link/          # Data Link Features
│   └── ingestion-history/  # File Upload History
├── quarantine/         # Data Quarantine
├── upload/             # File Upload
├── geb/                # GEB Module
├── ai-geospatial/      # AI Analysis
└── profile/            # User Profile

components/
├── ui/                 # shadcn/ui components
├── map/                # Map components
├── sidebar.tsx         # Main navigation
├── header.tsx          # App header
└── layout-wrapper.tsx  # Layout controller
```

## Environment Variables

- `NEXT_PUBLIC_MAPBOX_TOKEN`: Mapbox API token for map rendering

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

---

**Last Updated**: October 2025  
**Version**: 0.1.0  
**Deployment**: Vercel (CI/CD enabled)
