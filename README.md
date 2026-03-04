# CountryLab LMS - Frontend

A modern, responsive Laboratory Management System (LMS) frontend built with React, TypeScript, and Tailwind CSS. This application provides an intuitive interface for managing all aspects of laboratory operations including sample tracking, results management, inventory control, procurement, and financial operations.

## 🚀 Features

### Core Laboratory Operations

#### Sample Management

- **Sample Registration**: Easy-to-use form for registering new samples
- **Sample List View**: Searchable and filterable sample list with status indicators
- **Sample Details**: Comprehensive view of sample information and history
- **Status Tracking**: Visual status indicators (received, in_progress, completed, rejected)
- **Client Association**: Link samples to clients with autocomplete
- **Batch Operations**: Perform actions on multiple samples
- **Sample Timeline**: Visual timeline of sample activities

#### Results & Certificates of Analysis (CoA)

- **Results Entry**: Intuitive form for entering test results
- **Multi-parameter Support**: Add multiple test parameters per result
- **Approval Workflow**: Submit results for MD approval
- **Certificate Preview**: Preview CoA before generation
- **PDF Generation**: Download professional Certificates of Analysis
- **QR Code Display**: View and download QR codes for verification
- **Result History**: Track all changes and approvals
- **Approval Queue**: Dedicated queue for MDs to review pending results

#### Sample Requests (Public Portal)

- **Public Request Form**: Clean, accessible form for clients to submit requests
- **Request Tracking**: Track request status from submission to completion
- **Request Management**: Admin interface for processing requests
- **Status Updates**: Real-time status indicators
- **Invoice Generation**: Create invoices directly from requests

### Inventory Management

#### Stock & Consumables

- **Inventory Dashboard**: Overview of all reagents and consumables
- **Stock Level Indicators**: Visual indicators for low stock items
- **Expiry Alerts**: Highlighted items approaching expiry
- **Quick Actions**: Fast stock adjustments and reordering
- **Search & Filter**: Find items quickly by name, category, or status
- **Stock History**: View complete stock movement history
- **Reorder Management**: Track items needing reorder

#### Assets & Equipment

- **Asset Registry**: Complete list of laboratory equipment
- **Calibration Tracking**: Visual indicators for calibration due dates
- **Maintenance Logs**: Record and view maintenance activities
- **Asset Status**: Color-coded status indicators
- **Quick Log Entry**: Fast logging of calibration and maintenance
- **Asset Details**: Comprehensive asset information view
- **Location Tracking**: Track asset locations within facility

### Procurement System

#### Requisitions

- **Requisition Creation**: Multi-step form for creating requisitions
- **Item Management**: Add/remove multiple items per requisition
- **Department Selection**: Assign requisitions to departments
- **Urgency Levels**: Set priority (normal, urgent, emergency)
- **Approval Workflow**: Visual workflow status
- **Print Requisitions**: Generate printable requisition documents
- **Requisition History**: Complete audit trail

#### Purchase Orders

- **PO Generation**: Create POs from approved requisitions
- **PO Tracking**: Monitor PO status and fulfillment
- **Supplier Linking**: Associate POs with suppliers
- **PO Details**: Comprehensive PO information view

#### Suppliers

- **Supplier Directory**: Searchable supplier database
- **Supplier Details**: Complete supplier information
- **Purchase History**: View all purchases from each supplier
- **Contact Management**: Store and manage supplier contacts
- **Quick Actions**: Edit, view, or delete suppliers

### Financial Management

#### Invoicing

- **Invoice Creation**: Professional invoice generation
- **Line Item Management**: Add multiple line items with calculations
- **Tax Calculation**: Automatic VAT/tax calculation
- **Client Selection**: Link invoices to clients
- **Sample Linking**: Associate invoices with samples
- **Invoice Preview**: Preview before finalizing
- **Payment Tracking**: Mark invoices as paid/unpaid
- **Invoice PDF**: Generate and download invoice PDFs
- **Invoice History**: Complete invoice listing and search

#### Revenue Dashboard

- **Monthly Revenue**: Visual revenue metrics
- **Payment Status**: Overview of paid/unpaid invoices
- **Financial Charts**: Revenue trends and analytics

### Client Management

- **Client Directory**: Searchable client database
- **Client Details**: Comprehensive client information
- **Client History**: View samples, requests, and invoices per client
- **Quick Actions**: Edit or view client details
- **Contact Management**: Store multiple contact methods
- **Notes**: Add and view client notes

### User & Access Management

#### Dashboard

- **Role-based Dashboard**: Customized view based on user role
- **Quick Stats**: Key metrics at a glance
- **Recent Activity**: Latest system activities
- **Alerts & Notifications**: Important alerts and reminders
- **Quick Actions**: Fast access to common tasks

#### Team Management

- **User Directory**: List all team members
- **Role Assignment**: Assign and manage user roles
- **User Creation**: Add new team members
- **Status Management**: Activate/deactivate users
- **Department Assignment**: Assign users to departments

#### Role-Based Access Control

- **Super Admin**: Full system access
- **MD**: Executive dashboard and approval queue
- **Quality Manager**: Quality control and team management
- **Lab Analyst**: Sample and results management (read-only clients/suppliers)
- **Procurement Officer**: Procurement and supplier management
- **Inventory Manager**: Inventory and asset management
- **Finance**: Financial operations and invoicing
- **Business Development**: Client and invoice management

### Settings & Configuration

#### Organization Settings

- **Company Information**: Edit organization details
- **Logo Upload**: Upload and manage company logo
- **Contact Details**: Manage organization contact information
- **Preferences**: Configure system preferences

#### User Profile

- **Profile Management**: Update personal information
- **Password Change**: Secure password update
- **Notification Preferences**: Configure notification settings

### Public Features

#### Landing Page

- **Professional Design**: Modern, responsive landing page
- **Service Overview**: Showcase laboratory services
- **Request Form Access**: Easy access to sample request form
- **Contact Information**: Display contact details

#### Certificate Verification

- **QR Code Scanning**: Verify certificates via QR code
- **Public Verification**: No login required for verification
- **Certificate Display**: View verified certificate details
- **Authenticity Check**: Confirm certificate authenticity

### UI/UX Features

#### Design System

- **Modern Interface**: Clean, professional design
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Dark Mode Ready**: Prepared for dark mode implementation
- **Consistent Components**: Reusable UI components
- **Loading States**: Skeleton loaders and spinners
- **Empty States**: Helpful empty state messages
- **Error Handling**: User-friendly error messages

#### Navigation

- **Collapsible Sidebar**: Space-saving navigation
- **Breadcrumbs**: Easy navigation tracking
- **Quick Search**: Fast search across modules
- **Keyboard Shortcuts**: Productivity shortcuts

#### Data Display

- **Data Tables**: Sortable, filterable tables
- **Pagination**: Efficient data pagination
- **Status Badges**: Color-coded status indicators
- **Charts & Graphs**: Visual data representation
- **Export Options**: Export data to various formats

#### Forms

- **Form Validation**: Real-time validation with helpful messages
- **Auto-save**: Prevent data loss with auto-save
- **Multi-step Forms**: Complex forms broken into steps
- **File Upload**: Drag-and-drop file upload
- **Date Pickers**: User-friendly date selection

#### Notifications

- **Toast Notifications**: Non-intrusive success/error messages
- **In-app Notifications**: Notification center with badge
- **Real-time Updates**: Live notification updates
- **Notification History**: View past notifications

## 🛠 Technology Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **Validation**: Zod
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Date Handling**: date-fns
- **Notifications**: React Hot Toast
- **PDF Viewing**: Browser native

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running (see backend README)

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/Tradely-LTD/countrylab_frontend.git
cd countrylab_frontend

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api/v1

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# App Configuration
VITE_APP_NAME=CountryLab LMS
VITE_APP_VERSION=1.0.0
```

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:5174`

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Sidebar, Header, etc.)
│   └── ui/             # Base UI components (Button, Input, etc.)
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard page
│   ├── samples/        # Sample management pages
│   ├── results/        # Results management pages
│   ├── requests/       # Sample requests pages
│   ├── inventory/      # Inventory pages
│   ├── admin/          # Admin pages (Assets, Procurement, etc.)
│   ├── invoices/       # Invoice pages
│   ├── settings/       # Settings pages
│   ├── verify/         # Certificate verification
│   └── public/         # Public pages (Landing, Request Form)
├── lib/                # Utility libraries
│   ├── api.ts          # API client configuration
│   └── auth.tsx        # Authentication context and hooks
├── App.tsx             # Main app component with routing
├── main.tsx            # Application entry point
└── index.css           # Global styles and Tailwind imports
```

## 🎨 Styling

The application uses Tailwind CSS with a custom design system:

### Color Palette

- **Primary**: Blue tones for main actions and branding
- **Lab Colors**: Custom color scheme for laboratory context
- **Status Colors**: Green (success), Red (error), Yellow (warning), Blue (info)

### Typography

- **Font Family**: Inter (sans-serif)
- **Display Font**: Custom display font for headings

### Components

All UI components follow a consistent design system with:

- Standardized spacing
- Consistent border radius
- Unified shadow system
- Accessible color contrasts

## 🔐 Authentication

The application uses Supabase for authentication with the following features:

- Email/password login
- Password reset flow
- Secure token storage
- Automatic token refresh
- Protected routes
- Role-based access control

### Auth Context

```typescript
const { user, loading, login, logout, isRole } = useAuth();

// Check if user has specific role
if (isRole("super_admin", "md")) {
  // Show admin features
}
```

## 📡 API Integration

### API Client

The application uses Axios with interceptors for:

- Automatic token injection
- Error handling
- Request/response logging (dev mode)

### React Query

Data fetching and caching with React Query:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["samples"],
  queryFn: () => api.get("/samples").then((r) => r.data.data),
});
```

### Mutations

```typescript
const mutation = useMutation({
  mutationFn: (data) => api.post("/samples", data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["samples"] });
    toast.success("Sample created");
  },
});
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📱 Responsive Design

The application is fully responsive with breakpoints:

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## ♿ Accessibility

- WCAG 2.1 Level AA compliant
- Keyboard navigation support
- Screen reader friendly
- Proper ARIA labels
- Focus management
- Color contrast compliance

## 🚀 Performance

- Code splitting with React.lazy
- Image optimization
- Lazy loading for routes
- React Query caching
- Optimized bundle size
- Tree shaking

## 🔒 Security

- XSS protection
- CSRF protection
- Secure token storage
- Input sanitization
- Role-based access control
- Secure API communication (HTTPS in production)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software owned by Tradely LTD.

## 👥 Support

For support, email support@countrylab.com or contact the development team.

## 🔄 Version History

- **v1.0.0** - Initial release with core LMS features
- **v1.1.0** - Added role-based access control for clients and suppliers

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- TanStack Query for data synchronization
- All open-source contributors
