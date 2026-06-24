# 🐄 Smart Farm Management System

A comprehensive livestock management system designed for Pakistani dairy farms, featuring real-time animal monitoring, health record tracking, and multi-role farm management capabilities.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [User Roles](#user-roles)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Key Features by Role](#key-features-by-role)
- [Installation](#installation)
- [Usage](#usage)
- [Development](#development)
- [Contributing](#contributing)

## ✨ Features

- **Multi-Role Access Control**: Super Admin, Farm Owner, and Executive Manager roles
- **Real-time Animal Monitoring**: Track animal health, temperature, activity levels, and estrus cycles
- **Health Record Management**: Comprehensive veterinary records with collar ID tracking
- **Farm Management**: Manage multiple farms with detailed statistics
- **Employee Management**: Assign and manage executive managers for each farm
- **User Management**: Complete owner and user administration
- **Responsive Design**: Modern glassmorphic UI with dark/light theme support
- **Pakistani Localization**: CNIC validation, Pakistani phone numbers, and local addresses

## 🚀 Tech Stack

- **Framework**: Next.js 16.0.7 (React 19.2.0)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4.1.9
- **UI Components**: Radix UI + Shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts
- **Form Handling**: React Hook Form + Zod validation
- **Date Utilities**: date-fns
- **Theming**: next-themes

## 👥 User Roles

### 1. Super Admin
- View all farms and owners across the system
- Manage farm owners (add, update, remove)
- Manage all farms in the system
- View system-wide statistics
- Access user management dashboard

### 2. Farm Owner
- Manage multiple farms
- View and manage animals across owned farms
- Track health records for all animals
- Manage employees (executive managers)
- View farm-specific dashboards and statistics
- Add/update/remove animals and health records

### 3. Executive Manager
- Manage assigned farm
- View and manage animals in assigned farm
- Track and update health records
- Monitor animal health status and estrus cycles
- Access farm-specific dashboard

## 🏁 Getting Started

### Prerequisites

- Node.js 18+ installed
- pnpm (recommended) or npm
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd app
```

2. **Install dependencies**
```bash
pnpm install
# or
npm install
```

3. **Run the development server**
```bash
pnpm dev
# or
npm run dev
```

4. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

### Default Login Credentials

**Super Admin:**
- Email: `admin@farm.com`
- Password: Not required (demo mode)

**Farm Owner:**
- Email: `waleed@farm.com`
- Password: Not required (demo mode)
- Farm: Al-Baraka Dairy Farm (Lahore)

**Executive Manager:**
- Email: `shayan@farm.com`
- Password: Not required (demo mode)
- Name: Shayan Ali
- Assigned Farm: Al-Baraka Dairy Farm

**Additional Owners (for testing):**
- `tasmiah@farm.com` - Tasmiah Noor (Madina Livestock Farm, Karachi)
- `nouman@farm.com` - Nouman Hassan (Rehmat Cattle Farm, Islamabad)

## 📁 Project Structure

```
app/
├── app/                          # Next.js app directory
│   ├── dashboard/               # Main dashboard page
│   ├── farms/                   # Farms management page
│   ├── animals-owner/           # Animals page for owners
│   ├── animals-manager/         # Animals page for managers
│   ├── health-records-owner/    # Health records for owners
│   ├── health-records-manager/  # Health records for managers
│   ├── manage-employees/        # Employee management (owners)
│   ├── employees/               # User management (super admin)
│   └── login/                   # Login page
├── components/
│   ├── dashboards/              # Role-specific dashboards
│   │   ├── superadmin-dashboard.tsx
│   │   ├── owner-dashboard.tsx
│   │   └── manager-dashboard.tsx
│   ├── layout/                  # Layout components
│   │   ├── app-layout.tsx
│   │   ├── sidebar.tsx
│   │   └── topbar.tsx
│   ├── modals/                  # Popup components
│   │   ├── add-farm-modal.tsx
│   │   ├── add-animal-modal.tsx
│   │   ├── add-health-record-modal.tsx
│   │   └── add-employee-modal.tsx
│   ├── tables/                  # Data table components
│   │   ├── farms-management-table.tsx
│   │   ├── animals-management-table.tsx
│   │   └── health-records-management-table.tsx
│   └── ui/                      # Reusable UI components
├── lib/
│   ├── types.ts                 # TypeScript interfaces
│   ├── mock-data.ts             # Sample data
│   └── auth-context.tsx         # Authentication context
└── public/                      # Static assets
```

## 🎯 Key Features by Role

### Super Admin Dashboard
- Total farms, owners, and animals statistics
- Users/Owners table with status tracking
- Farms overview with owner information
- User management system
- System-wide analytics

### Owner Dashboard
- Farm selection dropdown (for multiple farms)
- Animal statistics (healthy, sick, estrus cycle)
- Quick actions for health records and employee management
- Farm-specific animal and health record management
- Employee management (assign managers to farms)

### Executive Manager Dashboard
- Assigned farm overview
- Animal health monitoring
- Estrus cycle tracking
- Health record management
- Real-time animal statistics

## 🔧 Development

### Build for Production

```bash
pnpm build
pnpm start
```

### Linting

```bash
pnpm lint
```

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## 🌟 Key Functionalities

### Animal Management
- Track collar ID, age, breed, temperature
- Monitor activity levels (Low, Normal, High)
- Estrus cycle detection
- Health status monitoring (Healthy/Unhealthy)

### Health Records
- Veterinary notes and treatments
- Collar ID-based tracking
- Date-stamped records
- Veterinarian information

### Farm Management
- Total cows tracking
- Active/inactive collar monitoring
- Location-based organization
- Owner assignment

### Validation Features
- Pakistani CNIC format (XXXXX-XXXXXXX-X)
- 11-digit Pakistani phone numbers
- Name validation (no numbers allowed)
- Numeric field validation (no negative numbers)
- Manager assignment validation (one manager per farm)

## 📱 Responsive Design

The application is fully responsive and works seamlessly across:
- Desktop (1920px and above)
- Laptop (1366px - 1919px)
- Tablet (768px - 1365px)
- Mobile (320px - 767px)

## 🎨 UI Features

- **Glassmorphic Design**: Modern frosted glass effect
- **Dark/Light Mode**: System-aware theme switching
- **Smooth Animations**: Tailwind CSS animations
- **Modal Popups**: All CRUD operations via modals
- **Data Tables**: Filterable and sortable tables
- **Status Badges**: Color-coded status indicators

## 📊 Sample Data

The application includes realistic Pakistani sample data:
- **Farms**: Al-Baraka Dairy Farm (Lahore), Madina Livestock Farm (Karachi), Rehmat Cattle Farm (Islamabad)
- **Breeds**: Sahiwal, Holstein Friesian, Cholistani, Red Sindhi
- **Locations**: Lahore, Karachi, Islamabad

## 🔐 Security Features

- Role-based access control (RBAC)
- Protected routes for each user role
- Input validation and sanitization
- CNIC and phone number format validation

## 🚧 Future Enhancements

- Real-time collar data integration
- Push notifications for health alerts
- Advanced analytics and reporting
- Multi-language support (Urdu)
- Mobile app version
- API integration for IoT collars
- PDF report generation

## 📄 License

This project is a smart farm management system for livestock management in Pakistan.

---

**Made with ❤️ for Pakistani Dairy Farmers** 🇵🇰
