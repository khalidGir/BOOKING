# Product Requirements Document (PRD)

## Booking — Multi-Tenant Booking System

---

## 1. Introduction

**Booking** is a multi-tenant SaaS platform that enables any service-based business to accept online bookings from customers. Businesses create an account, configure their services, staff, availability, and locations, then share a public booking page or embed a widget on their own website. Customers can browse services, view real-time availability on a calendar, and book appointments without creating an account.

The system is designed to be **industry-agnostic** — equally suited for hair salons, dental clinics, consulting firms, fitness studios, repair shops, and any other appointment-based business.

---

## 2. Objectives

- Provide businesses with a professional, shareable online booking presence
- Eliminate double-booking and manual appointment scheduling
- Reduce no-shows through automated reminders
- Offer maximum configurability (services, staff, locations, custom fields)
- Deliver a seamless, no-registration-required booking experience for customers
- Scale as a multi-tenant SaaS with isolated business data

---

## 3. Core Roles

| Role | Main Responsibilities |
|------|----------------------|
| **Super Admin** | Manage all businesses, system configuration, global settings, platform administration |
| **Business Admin** | Configure services, staff, availability, locations, view/ manage bookings, customize booking page |
| **Staff Member** | View their own schedule, manage their availability, update booking status |
| **Customer** | Browse services, view availability, book appointments (no account required) |

---

## 4. User Interfaces

### 4.1 Business-Facing Interfaces

| Interface | Intended User |
|-----------|---------------|
| **1. Super Admin Dashboard** | Super Admin |
| **2. Business Admin Dashboard** | Business Admin |
| **3. Staff Dashboard** | Staff Member |
| **4. Booking Settings** | Business Admin (configure services, staff, hours, etc.) |

### 4.2 Customer-Facing Interfaces

| Interface | Intended User |
|-----------|---------------|
| **1. Public Booking Page** | Customers (no auth) |
| **2. Embeddable Widget** | Customers (embedded on business website) |
| **3. Booking Confirmation** | Customers (post-booking) |
| **4. Manage Booking** | Customers (by link/ reference, no account) |

### 4.3 Shared Interfaces

- Login (Business Admin / Staff / Super Admin)
- Forgot Password / Reset Password
- Change Password
- User Profile

---

## 5. Functional Requirements

### 5.1 Business Onboarding & Management

#### FR-001: Business Registration

| Field | Value |
|-------|-------|
| **Actor** | Super Admin |
| **Description** | Super Admin creates a new business account on the platform |
| **Inputs** | Business name, domain/slug, email, phone, address, timezone, logo, plan type |
| **Validation** | Slug must be unique (used for public booking URL); email must be unique |
| **Output** | Business created; admin user account auto-created with login credentials |

#### FR-002: Business Self-Registration (Post-MVP)

| Field | Value |
|-------|-------|
| **Actor** | Prospective Business |
| **Description** | Businesses can sign up directly via a registration form |
| **Validation** | Email verification required; CAPTCHA to prevent spam |
| **Output** | Business created with status "Trial"; admin can log in immediately |

#### FR-003: Business Configuration

| Field | Value |
|-------|-------|
| **Actor** | Business Admin |
| **Description** | Configure business profile, branding, booking page customization, notification settings |
| **Inputs** | Logo, colors, custom domain (optional), booking page slug, email templates, reminder timing |
| **Output** | Business settings saved; public booking page updates in real time |

### 5.2 Service Management

#### FR-004: Create Service

| Field | Value |
|-------|-------|
| **Actor** | Business Admin |
| **Description** | Define a service that customers can book |
| **Inputs** | Service name, description, duration (minutes), price, category, color (calendar display), max bookings per slot |
| **Validation** | Duration must be positive; price can be zero (free service) |
| **Output** | Service created; available for booking |
| **Business Rule** | Services can be marked as "inactive" to hide from booking page without deleting |

#### FR-005: Service Categories

| Field | Value |
|-------|-------|
| **Actor** | Business Admin |
| **Description** | Group services into categories for easier customer browsing |
| **Inputs** | Category name, sort order, description |
| **Output** | Services displayed grouped by category on booking page |

#### FR-006: Custom Fields on Services

| Field | Value |
|-------|-------|
| **Actor** | Business Admin |
| **Description** | Add custom questions/fields to a service that customers must fill during booking |
| **Inputs** | Field label, type (text, textarea, select, checkbox, date), required/optional, options (for select) |
| **Validation** | Required fields must be filled before booking is confirmed |
| **Output** | Custom fields displayed during booking flow; answers stored with booking |

### 5.3 Staff Management

#### FR-007: Create Staff Member

| Field | Value |
|-------|-------|
| **Actor** | Business Admin |
| **Description** | Add staff members who can be assigned to bookings |
| **Inputs** | Name, email, phone, photo, color (calendar), services they can perform, bio |
| **Validation** | If email is provided, it must be unique within the business. Email is optional (nullable), but uniqueness is enforced via a **partial unique index** (`WHERE email IS NOT NULL`) on `(business_id, email)` to prevent two staff members in the same business from having the same email while allowing multiple NULLs |
| **Output** | Staff member created; can be assigned to bookings |
| **Business Rules** | Staff can log in to view their own schedule (limited role). **However**, a staff member without an email address cannot log in — their profile is purely a **resource placeholder** managed by the Business Admin. If dashboard access is needed later, an email must be supplied, which triggers the uniqueness validation |

#### FR-008: Staff Availability

| Field | Value |
|-------|-------|
| **Actor** | Business Admin, Staff Member |
| **Description** | Define weekly recurring availability for each staff member, with ability to add time-off / exceptions |
| **Inputs** | Day of week, start time, end time, break times; date-specific overrides (vacation, sick day) |
| **Validation** | End time must be after start time; overlaps flagged |
| **Output** | Availability computed; customers only see open slots |
| **Business Rule** | If no staff is selected for a service, the business's default availability is used |

### 5.4 Location Management

#### FR-009: Manage Locations

| Field | Value |
|-------|-------|
| **Actor** | Business Admin |
| **Description** | Add one or more physical or virtual locations for services |
| **Inputs** | Location name, address, phone, virtual meeting link (for online services), instructions |
| **Output** | Location created; customers see location details on booking confirmation |
| **Business Rule** | A service can be restricted to specific locations; a default location can be set |

### 5.5 Booking Flow (Customer-Facing)

#### FR-010: Public Booking Page

| Field | Value |
|-------|-------|
| **Actor** | Customer (no auth) |
| **Description** | Each business gets a public booking page at `[platform]/book/[business-slug]` |
| **Elements** | Business logo & name, service list with prices, calendar view, time slot selector, booking form |
| **Flow** | 1. Select service → 2. Select staff (optional) → 3. Pick date on calendar → 4. Select time slot → 5. Fill customer info + custom fields → 6. Confirm booking |
| **Output** | Booking confirmed; customer sees confirmation with details |

#### FR-011: Calendar Availability Display

| Field | Value |
|-------|-------|
| **Actor** | Customer |
| **Description** | Interactive calendar shows available dates (highlighted) and unavailable dates (greyed out) |
| **Business Rule** | Time slots are computed from: staff availability × business hours × service duration. A slot is only available if the entire duration fits within an open period |
| **Output** | Clicking a date shows available time slots below the calendar |
| **Buffer Time** | Configurable gap between bookings (per service or per staff) |

#### FR-012: Time Slot Selection

| Field | Value |
|-------|-------|
| **Actor** | Customer |
| **Description** | After selecting a date, available time slots are displayed as a list/grid |
| **Business Rule** | Slots are shown in business timezone; consumed slots are hidden; slots in the past are hidden |
| **Output** | Customer taps a slot → proceeds to booking form |

#### FR-013: Customer Info Form

| Field | Value |
|-------|-------|
| **Actor** | Customer |
| **Description** | Customer provides their information to complete the booking |
| **Inputs** | Name, email, phone (required), notes (optional), custom fields (defined per service) |
| **Validation** | Email and phone are required; email format validation |
| **Output** | Form validated; proceed to confirmation |

#### FR-014: Booking Confirmation

| Field | Value |
|-------|-------|
| **Actor** | Customer |
| **Description** | Booking summary with all details |
| **Elements** | Service name, date & time, duration, price (if applicable), staff name, location, customer info, booking reference number |
| **Output** | Booking reference displayed; confirmation email/SMS sent to customer; notification sent to business |

#### FR-015: Book Multiple Slots (Post-MVP)

| Field | Value |
|-------|-------|
| **Actor** | Customer |
| **Description** | Customer can book multiple consecutive slots for the same service (e.g., double appointment) |
| **Output** | Single booking record with extended duration |

### 5.6 No-Account Booking Management

#### FR-016: Manage Booking (Public Link)

| Field | Value |
|-------|-------|
| **Actor** | Customer |
| **Description** | Customer receives a unique link to view/manage their booking (no login required) |
| **Capabilities** | View booking details, reschedule (pick new slot), cancel |
| **Validation** | Link is secured by a unique 64-char crypto-random token embedded in the URL. Once clicked, the customer can optionally verify via **email OTP** (6-digit code sent to their booking email) for sensitive actions (cancellation, reschedule). If the customer mistyped their email, the booking reference is also displayed on the post-booking confirmation screen (before they close it) and the business can manually resend the management link from their dashboard |
| **Output** | Changes reflected in business calendar; notification sent |

#### FR-017: Cancellation Policy

| Field | Value |
|-------|-------|
| **Actor** | Business Admin |
| **Description** | Configure cancellation rules per business or per service |
| **Options** | No cancellation, free cancellation up to X hours before, late cancellation fee |
| **Validation** | If cancellation is past deadline, customer is notified that cancellation is not allowed |
| **Output** | Booking cancelled; slot released; notification sent |

### 5.7 Business Dashboard

#### FR-018: Dashboard Overview

| Field | Value |
|-------|-------|
| **Actor** | Business Admin |
| **Widgets** | Today's bookings (count + list), upcoming bookings (next 7 days), new bookings (last 24h), cancellation rate, popular services |
| **Output** | Real-time overview of business booking health |

#### FR-019: Calendar View

| Field | Value |
|-------|-------|
| **Actor** | Business Admin / Staff |
| **Description** | Full calendar showing all bookings with color-coding by service |
| **Views** | Day, Week, Month |
| **Actions** | View booking details, cancel booking, mark as completed, mark as no-show |
| **Output** | Interactive calendar; drag-to-reschedule (Post-MVP) |

#### FR-020: Booking List

| Field | Value |
|-------|-------|
| **Actor** | Business Admin |
| **Description** | Table view of all bookings with filters and search |
| **Filters** | Date range, service, staff, status, customer name |
| **Columns** | Customer, Service, Date, Time, Staff, Status, Price, Created at |
| **Actions** | View, cancel, confirm, mark no-show, reschedule |
| **Export** | CSV export of filtered results |

#### FR-021: Booking Status Lifecycle

```
                    ┌──────────┐
                    │ Pending  │
                    └────┬─────┘
                         │ Confirmed
                         ▼
                    ┌──────────┐
         ┌─────────│Confirmed │──────────┐
         │         └────┬─────┘          │
         │              │                │
         ▼              ▼                ▼
   ┌──────────┐   ┌──────────┐     ┌──────────┐
   │ Cancelled│   │Completed │     │ No-Show  │
   └──────────┘   └──────────┘     └──────────┘

   Cancellation reasons: Customer, Business, Both
   Rebooking: Cancelled bookings can be rebooked (slot freed)
```

### 5.8 Notifications

#### FR-022: Booking Confirmation

| Field | Value |
|-------|-------|
| **Actor** | System |
| **Trigger** | Customer completes booking |
| **Recipients** | Customer (email + optional SMS), Business (email) |
| **Content** | Booking reference, service, date, time, duration, staff, location, add-to-calendar links (.ics) |

#### FR-023: Reminder Notifications

| Field | Value |
|-------|-------|
| **Actor** | System |
| **Trigger** | Configurable time before booking (default: 24 hours, 1 hour) |
| **Recipients** | Customer (email + optional SMS) |
| **Content** | Upcoming appointment summary with link to manage/cancel |

#### FR-024: Cancellation / Reschedule Notification

| Field | Value |
|-------|-------|
| **Actor** | System |
| **Trigger** | Customer cancels or reschedules |
| **Recipients** | Business (email), Customer (email confirmation) |
| **Content** | Details of change; for reschedule: new date/time |

### 5.9 Embeddable Widget

#### FR-025: Embeddable Booking Widget

| Field | Value |
|-------|-------|
| **Actor** | Business Admin |
| **Description** | Business can embed a booking widget on their own website via an `<iframe>` or JavaScript snippet |
| **Customization** | Match business brand colors, compact or full-width layout |
| **Output** | Widget renders inline on business website; booking flow is identical to public page |
| **Validation** | CORS and CSRF protection; iframe allowed only from configured domains |

### 5.10 Platform Administration (Super Admin)

#### FR-026: Business Management

| Field | Value |
|-------|-------|
| **Actor** | Super Admin |
| **Description** | View, create, edit, suspend, delete businesses |
| **Table** | Business name, slug, email, plan, status, created date, booking count |
| **Actions** | View, Edit, Suspend, Delete (soft), Impersonate |

#### FR-027: Plan & Pricing Management

| Field | Value |
|-------|-------|
| **Actor** | Super Admin |
| **Description** | Define subscription plans (limits on services, staff, bookings/month) |
| **Inputs** | Plan name, price, max services, max staff, max bookings/month, features enabled |
| **Output** | Plans available at business registration / upgrade |

#### FR-028: Analytics & Reporting

| Field | Value |
|-------|-------|
| **Actor** | Super Admin |
| **Description** | Platform-wide metrics |
| **Metrics** | Total businesses, active businesses, total bookings (monthly), revenue, growth trends |
| **Output** | Dashboard with charts; CSV export |

---

## 6. User Stories

| ID | Role | Want To | So That |
|----|------|---------|---------|
| US-001 | Business Admin | Set up my business profile | Customers see my branding and info |
| US-002 | Business Admin | Add my services | Customers know what I offer and can book them |
| US-003 | Business Admin | Define staff and their availability | Customers can book with specific staff members |
| US-004 | Business Admin | Set my business hours | Customers only book when I'm available |
| US-005 | Business Admin | Add custom questions to services | I collect the info I need before a booking |
| US-006 | Business Admin | View my bookings on a calendar | I can see my schedule at a glance |
| US-007 | Business Admin | Get notified of new bookings | I don't miss appointments |
| US-008 | Business Admin | Cancel or reschedule bookings | I can manage changes |
| US-009 | Business Admin | Mark a booking as no-show | I can track attendance |
| US-010 | Business Admin | Embed booking on my website | Customers book without leaving my site |
| US-011 | Business Admin | Configure cancellation policy | I control how cancellations work |
| US-012 | Staff Member | View my own schedule | I know what I'm booked for |
| US-013 | Customer | Browse services and pricing | I know what's available |
| US-014 | Customer | See available time slots on a calendar | I can pick a time that works for me |
| US-015 | Customer | Book without creating an account | It's quick and frictionless |
| US-016 | Customer | Get a confirmation email | I have a record of my booking |
| US-017 | Customer | Cancel or reschedule online | I can manage my booking easily |
| US-018 | Customer | Get reminders | I don't forget my appointment |
| US-019 | Super Admin | View all businesses | I can monitor platform health |
| US-020 | Super Admin | Manage subscription plans | I can control what each plan includes |

---

## 7. Acceptance Criteria

### AC-001: Business Creates Service

```
Given I am logged in as a Business Admin
When I navigate to Services and click "Add Service"
And I fill in name, duration (60 min), price ($50), and select a category
And I click Save
Then a new service is created
And it appears on the public booking page
And it can be assigned to staff members
```

### AC-002: Customer Books Appointment

```
Given I am a customer on a business's public booking page
When I select a service
And I pick a date on the calendar
And I select an available time slot
And I enter my name, email, and phone
And I click Confirm Booking
Then I see a confirmation with booking reference
And I receive a confirmation email
And the business receives a notification
And the time slot is no longer available to other customers
```

### AC-003: Time Slot Unavailable for Past Time

```
Given a business has availability Monday-Friday 9AM-5PM
And the current time is Tuesday 3:30 PM
And a service duration is 60 minutes
When I view available slots on Tuesday
Then I do NOT see slots starting at 3:00 PM (already past — 3:00 PM < 3:30 PM)
And I do NOT see slots starting at 3:30 PM (already past — equal to current time)
But I DO see slots starting at 4:00 PM (4:00 PM ≥ current time, and 5:00 PM end ≤ closing)
And I do NOT see slots starting at 4:30 PM (would end at 5:30 PM — exceeds closing at 5:00 PM)
And I do NOT see slots before 9:00 AM (before opening)
```

### AC-004: Double-Booking Prevention

```
Given a staff member has a confirmed booking from 10:00 AM to 11:00 AM
When another customer attempts to book the same staff at 10:30 AM (same day)
Then the slot at 10:30 AM does NOT appear as available
And the slot at 11:00 AM DOES appear as available
```

### AC-005: Customer Cancels Booking

```
Given a customer has a confirmed booking for tomorrow at 2:00 PM
And the business allows cancellation up to 2 hours before
When the customer clicks the cancellation link in their email
And confirms cancellation
Then the booking status changes to "Cancelled"
And the time slot becomes available again
And the business receives a cancellation notification
And the customer receives a cancellation confirmation
```

### AC-006: Embeddable Widget Loads

```
Given a business has a website at example.com
And has configured the embed snippet
When a customer visits example.com
Then they see the booking widget inline
And they can complete a full booking without leaving the page
And the widget matches the business's brand colors
```

### AC-007: Staff Views Own Schedule

```
Given I am logged in as a Staff Member
When I navigate to My Schedule
Then I see only my own bookings
And I do NOT see other staff members' bookings
And I cannot modify bookings (view-only)
```

### AC-008: Business Custom Fields

```
Given a Business Admin has added a custom field "Vehicle Plate Number" (required) to the "Car Wash" service
When a customer books the Car Wash service
Then the booking form includes a "Vehicle Plate Number" field marked as required
And the booking cannot be completed without filling it
And the answer is visible in the business dashboard
```

---

## 8. Business Rules

| ID | Rule |
|----|------|
| BR-001 | Each business gets a unique slug used for their public booking page URL |
| BR-002 | Time slots are computed based on: business hours × staff availability × service duration, accounting for buffer times |
| BR-003 | Two bookings cannot overlap for the same staff member (or for the same business if no staff assigned) |
| BR-004 | Past time slots are never shown to customers |
| BR-005 | Customers book without creating an account; booking management uses a token-based secure link |
| BR-006 | Confirmation emails include .ics calendar attachment for easy add-to-calendar |
| BR-007 | Reminder notifications are sent at configurable intervals (default: 24h and 1h before) |
| BR-008 | Cancellation policies can be set per business or per service; early cancellation frees the slot |
| BR-009 | All booking status changes are logged with timestamps |
| BR-010 | Business data is fully isolated (multi-tenant); no cross-business data leakage |
| BR-011 | Free services ($0 price) can be booked without payment info |
| BR-012 | Buffer time between bookings is configurable per service (default: 0 minutes) |
| BR-013 | A service with no staff assigned pools all staff who can perform the service; customer sees the union of their slots |
| BR-014 | The embeddable widget can be restricted to specific domains (CORS whitelist) |
| BR-015 | All booking mutations (create, cancel, reschedule) must use `SELECT FOR UPDATE` within a serializable transaction to prevent double-booking race conditions |
| BR-016 | All timestamps are stored as `TIMESTAMPTZ` (UTC). Business timezone is applied at the display layer only |
| BR-017 | A `business_id` filter is injected via Prisma middleware on all tenant queries. Any query missing `business_id` in its WHERE clause is rejected in non-Super-Admin contexts |
| BR-018 | A 5-minute short-lived Redis reservation lock is placed on a slot when a customer begins the booking flow; the slot is released if the booking is not confirmed within the window |
| BR-019 | SlotCache is invalidated and rebuilt immediately (via event-driven background job) on any mutation to Business, StaffAvailability, StaffAvailabilityOverride, Service, or Booking for the affected date range |
| BR-020 | When a customer books a slot without specifying a staff member, auto-assignment uses load-balancing (fewest bookings that day) with round-robin tiebreaker |
| BR-021 | A staff member without an email address cannot access the Staff Dashboard; they exist solely as a resource placeholder managed by the Business Admin. Dashboard access requires supplying an email, which triggers the uniqueness validation |

---

## 9. Database Schema

### 9.1 Core Entities

#### Business

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(255) | NOT NULL |
| slug | VARCHAR(100) | UNIQUE, NOT NULL |
| email | VARCHAR(255) | NOT NULL |
| phone | VARCHAR(20) | |
| address | TEXT | |
| timezone | VARCHAR(50) | NOT NULL, DEFAULT 'UTC' |
| logo_url | TEXT | |
| brand_color | VARCHAR(7) | DEFAULT '#6c3aed' |
| plan_type | ENUM | Free, Basic, Premium |
| status | ENUM | Active, Suspended, Trial |
| default_availability | JSON | Weekly schedule (Mon-Sun, hours) |
| cancellation_hours | INT | DEFAULT 0 (0 = no cancellation) |
| reminder_timing | JSON | Array of minutes before (e.g. [1440, 60]) |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### User (Business Admin / Staff / Super Admin)

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| business_id | UUID | FK → Business (nullable for Super Admin) |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| first_name | VARCHAR(100) | NOT NULL |
| last_name | VARCHAR(100) | NOT NULL |
| phone | VARCHAR(20) | |
| role | ENUM | Super Admin, Business Admin, Staff |
| status | ENUM | Active, Inactive, Locked |
| staff_id | UUID | FK → Staff (nullable, links staff user to staff profile) |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### Service

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| business_id | UUID | FK → Business |
| category_id | UUID | FK → ServiceCategory (nullable) |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| duration | INT | NOT NULL (minutes) |
| price | DECIMAL(10,2) | DEFAULT 0 |
| color | VARCHAR(7) | DEFAULT '#6366f1' |
| buffer_before | INT | DEFAULT 0 (minutes) |
| buffer_after | INT | DEFAULT 0 (minutes) |
| max_per_slot | INT | DEFAULT 1 |
| is_active | BOOLEAN | DEFAULT true |
| sort_order | INT | DEFAULT 0 |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### ServiceCategory

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| business_id | UUID | FK → Business |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| sort_order | INT | DEFAULT 0 |
| created_at | TIMESTAMP | |

#### ServiceCustomField

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| service_id | UUID | FK → Service |
| label | VARCHAR(255) | NOT NULL |
| field_type | ENUM | Text, Textarea, Select, Checkbox, Date |
| is_required | BOOLEAN | DEFAULT false |
| options | JSON | (for Select type) |
| sort_order | INT | DEFAULT 0 |
| created_at | TIMESTAMP | |

#### Staff

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| business_id | UUID | FK → Business |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | (nullable; unique per business via partial unique index: `WHERE email IS NOT NULL`) |
| phone | VARCHAR(20) | |
| photo_url | TEXT | |
| color | VARCHAR(7) | DEFAULT '#6366f1' |
| bio | TEXT | |
| is_active | BOOLEAN | DEFAULT true |
| buffer_before | INT | DEFAULT 0 (minutes; per-staff buffer override) |
| buffer_after | INT | DEFAULT 0 (minutes; per-staff buffer override) |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### StaffService

| Column | Type | Constraints |
|--------|------|-------------|
| staff_id | UUID | FK → Staff |
| service_id | UUID | FK → Service |
| PRIMARY KEY | (staff_id, service_id) |

#### StaffAvailability

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| staff_id | UUID | FK → Staff |
| day_of_week | INT | NOT NULL (0=Sun, 1=Mon, ... 6=Sat) |
| start_time | TIME | NOT NULL |
| end_time | TIME | NOT NULL |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | |

#### StaffAvailabilityOverride

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| staff_id | UUID | FK → Staff |
| date | DATE | NOT NULL |
| start_time | TIME | (nullable; if null = full day off) |
| end_time | TIME | (nullable; if null = full day off) |
| reason | VARCHAR(255) | |
| created_at | TIMESTAMP | |

#### Location

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| business_id | UUID | FK → Business |
| name | VARCHAR(255) | NOT NULL |
| address | TEXT | |
| phone | VARCHAR(20) | |
| virtual_link | TEXT | (for online services) |
| instructions | TEXT | |
| is_default | BOOLEAN | DEFAULT false |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | |

#### LocationService

| Column | Type | Constraints |
|--------|------|-------------|
| location_id | UUID | FK → Location |
| service_id | UUID | FK → Service |
| PRIMARY KEY | (location_id, service_id) |

#### Booking

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| business_id | UUID | FK → Business |
| service_id | UUID | FK → Service |
| staff_id | UUID | FK → Staff (nullable) |
| location_id | UUID | FK → Location (nullable) |
| booking_ref | VARCHAR(20) | UNIQUE, NOT NULL |
| customer_name | VARCHAR(255) | NOT NULL |
| customer_email | VARCHAR(255) | NOT NULL |
| customer_phone | VARCHAR(20) | NOT NULL |
| notes | TEXT | |
| custom_field_answers | JSON | |
| start_time | TIMESTAMPTZ | NOT NULL (always stored as UTC; business timezone applied at display layer) |
| end_time | TIMESTAMPTZ | NOT NULL (always stored as UTC; business timezone applied at display layer) |
| duration | INT | NOT NULL (minutes) |
| price | DECIMAL(10,2) | DEFAULT 0 |
| status | ENUM | Pending, Confirmed, Completed, Cancelled, No-Show |
| cancellation_reason | TEXT | |
| cancelled_by | ENUM | Customer, Business (nullable) |
| manage_token | VARCHAR(64) | UNIQUE (token for customer to manage booking) |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### NotificationLog

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| business_id | UUID | FK → Business |
| booking_id | UUID | FK → Booking |
| type | ENUM | Confirmation, Reminder, Cancellation, Reschedule |
| channel | ENUM | Email, SMS |
| recipient | VARCHAR(255) | |
| sent_at | TIMESTAMP | |
| status | ENUM | Sent, Failed |

#### AuditLog

| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PK |
| business_id | UUID | FK → Business |
| user_id | UUID | FK → User |
| action | VARCHAR(100) | NOT NULL |
| entity_type | VARCHAR(50) | NOT NULL |
| entity_id | UUID | |
| old_values | JSONB | |
| new_values | JSONB | |
| ip_address | VARCHAR(45) | |
| created_at | TIMESTAMP | |

### 9.2 Timezone Handling

- All timestamp columns in the database use **`TIMESTAMPTZ`** (timestamp with time zone) — values are always normalized to UTC on write
- The `Business.timezone` field (e.g., `"America/New_York"`, `"Africa/Addis_Ababa"`) is used **only at the application layer** to:
  - Convert UTC times to the business's local time for display
  - Interpret business/staff availability hours (which are defined in local time)
  - Compute "current time" for past-slot filtering
- Slot generation converts all times to UTC before querying/comparing

### 9.3 Multi-Tenancy Data Isolation

| Layer | Mechanism |
|-------|-----------|
| **Schema** | Every tenant-scoped model includes `business_id` as a non-nullable foreign key |
| **Prisma middleware** | A global middleware hook injects `where: { business_id: <from JWT> }` on all tenant queries. Super Admin queries bypass this filter |
| **Application** | All service/repository functions accept `business_id` as a required parameter — never derived from request params alone. The JWT's `business_id` claim is always cross-referenced against URL/body params to prevent tenant-spoofing |
| **Testing** | A dedicated test suite verifies: (a) Tenant A cannot access Tenant B's data via direct ID manipulation, (b) Prisma middleware correctly filters all read/write operations, (c) Raw SQL queries (if any) include business_id in WHERE clauses |
| **Error budget** | Any data-leak incident (Tenant A sees Tenant B's data) is classified as **P0/SEV-1** with an automated rollback |
| **Staff email uniqueness** | Partial unique index: `CREATE UNIQUE INDEX idx_staff_email_per_business ON "Staff" (business_id, email) WHERE email IS NOT NULL;` — prevents two staff in the same business from sharing an email while allowing multiple NULLs |

### 9.4 Entity Relationships

```
Business 1──N User
Business 1──N Service
Business 1──N ServiceCategory
Business 1──N Staff
Business 1──N Location
Business 1──N Booking
Business 1──N NotificationLog

Service N──N Staff (StaffService)
Service N──N Location (LocationService)
Service 1──N ServiceCustomField
ServiceCategory 1──N Service

Staff 1──N StaffAvailability
Staff 1──N StaffAvailabilityOverride
Staff 1──N Booking

Location 1──N Booking
Booking 1──N NotificationLog
```

---

## 10. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js + Express (TypeScript) |
| **Frontend** | Next.js (TypeScript) |
| **ORM** | Prisma |
| **Database** | PostgreSQL (production), SQLite (development) |
| **Auth** | JWT + bcrypt |
| **API** | REST (Express routes) |
| **Email** | Nodemailer / Resend |
| **SMS** | Twilio (optional, Post-MVP) |
| **Cron** | node-cron (reminders, cleanup) |
| **Validation** | Zod |
| **Calendar** | Custom calendar component (no external calendar library) |

---

## 11. Calendar & Slot Computation Algorithm

### 11.1 Slot Caching Strategy

Pre-computing slots by looping 15-minute increments on every calendar render does not scale. Instead:

- **Pre-computed slot cache**: A daily cron job pre-computes and stores available slots for the next N days (configurable, default 60) in a `SlotCache` table
- **Event-driven cache invalidation**: Any mutation to the following tables triggers an **immediate asynchronous rebuild** of the SlotCache for that specific business + affected date range (not a full table rebuild):
  - `StaffAvailability` (staff hours changed)
  - `StaffAvailabilityOverride` (sick day, vacation added/removed)
  - `Business` (business hours changed)
  - `Booking` (booking created, cancelled, rescheduled — frees or occupies a slot)
  - `Service` (duration or buffer changed)
  
  The invalidation logic is:
  1. On mutation commit, enqueue a background job `rebuild_slot_cache(business_id, date_from, date_to)`
  2. The job deletes only the stale cache rows for that business + date range
  3. The job recomputes and inserts fresh slots for the same range
  4. If the background job fails, the fallback on-the-fly computation (with Redis lock) serves as a safety net
- **Fallback**: If cache is stale or empty for a given date, slots are computed on-the-fly (same algorithm, but with a 5-second Redis lock per date to prevent stampedes)

### 11.2 Core Slot Computation Logic

```
FUNCTION compute_slots(business, service, date, staff_ids?):
    // 1. Resolve staff
    if staff_ids is empty or null:
        // BR-013: No staff assigned = use business availability
        staff_list = [null]  // single virtual "business" slot pool
    else:
        staff_list = staff_ids

    // 2. Get business hours for the given day (in business timezone)
    biz_tz = business.timezone
    business_hours = business.availability[day_of_week_in_tz(date, biz_tz)]
    current_time_in_tz = now_in_tz(biz_tz)

    // 3. Collect all bookings for this date + service for conflict check
    all_bookings = get_bookings(business_id, service_id, date, biz_tz)

    // 4. For each staff member, compute their available slots
    all_slots = []

    for each staff in staff_list:
        if staff is null:
            working_hours = business_hours
            staff_bookings = filter(all_bookings, staff_id = null)
        else:
            staff_hours = staff.availability[day_of_week]
            working_hours = intersect(business_hours, staff_hours)
            staff_bookings = filter(all_bookings, staff_id = staff.id)

        // 4a. Check for date-specific override (vacation, sick day)
        override = get_override(staff.id, date)
        if override and override.is_full_day_off:
            continue  // this staff has no slots this day

        // 4b. Compute slots per working period
        staff_slots = []
        for each period in working_hours:
            // Apply buffer_before: effective start is period.start + service.buffer_before
            effective_start = max(period.start + service.buffer_before, current_time_in_tz)
            cursor = ceiling_to_nearest(effective_start, 15)  // round up to next 15-min tick

            while cursor + service.duration + service.buffer_after <= period.end:
                slot_end = cursor + service.duration

                // Check: does this slot conflict with any existing booking?
                // A conflict exists if [cursor - buffer_after_prev, slot_end + buffer_after]
                // overlaps with any booking's [start - buffer_before, end + buffer_after]
                if not has_overlap(cursor, slot_end, staff_bookings, service):
                    // Check override partial-day (if override has custom hours)
                    if override and not is_within(cursor, slot_end, override.hours):
                        cursor += 15
                        continue

                    staff_slots.append({
                        start: cursor,
                        end: slot_end,
                        staff_id: staff.id ?? null
                    })

                cursor += 15

        all_slots = merge_and_deduplicate(all_slots, staff_slots)

    return sort_by_start(all_slots)
```

### 11.3 Multi-Staff Aggregation

| Scenario | Strategy |
|----------|----------|
| **No staff assigned to service** | All staff who can perform this service are pooled. Customer sees **union** of all staff's available slots, labeled with staff name |
| **Staff filter applied (customer picks a staff)** | Customer sees only that staff member's slots |
| **Single staff assigned to service** | Only that staff's slots are shown |
| **Same start time, different staff** | Duplicate slots are deduplicated; customer can pick which staff |

### 11.3a Staff Auto-Assignment Algorithm

When a customer books a slot **without specifying a staff member** (i.e., they booked a time that multiple staff have available), the system must auto-assign the booking to a specific staff member. The following algorithm is used, in priority order:

```
FUNCTION auto_assign_staff(service_id, slot_start, slot_end, business_id):
    qualified_staff = get_staff_for_service(service_id, business_id)

    // Filter to staff who are actually available at this time
    available_staff = filter(qualified_staff, is_available(slot_start, slot_end))

    if available_staff is empty:
        throw NoAvailableStaffError  // should not happen since slot came from cache

    // Strategy: Load-Balancing — assign to staff with the fewest bookings that day
    for each staff in available_staff:
        staff.daily_load = count_bookings(staff.id, slot_start.date)

    return sort_by(staff.daily_load, ascending)[0]  // pick least loaded staff
```

**Fallback strategy:** If two or more staff have the exact same daily load, fall back to **round-robin** (tracked via a counter in Redis per business/service):

```
// Round-robin tiebreaker
last_assigned = redis.get(`rr:${business_id}:${service_id}`)
next_staff = circular_next(available_staff, last_assigned)
redis.set(`rr:${business_id}:${service_id}`, next_staff.id)
return next_staff
```

### 11.4 Conflict Detection

```
FUNCTION has_overlap(slot_start, slot_end, existing_bookings, service):
    // A booking occupies: [booking.start - buffer_before, booking.end + buffer_after]
    // A new slot occupies: [slot_start, slot_end]
    // Conflict if intervals overlap

    for each booking in existing_bookings:
        booking_occupied_start = booking.start - booking.buffer_before
        booking_occupied_end = booking.end + booking.buffer_after
        slot_occupied_start = slot_start
        slot_occupied_end = slot_end + service.buffer_after

        if slot_occupied_start < booking_occupied_end
           AND slot_occupied_end > booking_occupied_start:
            return true  // CONFLICT

    return false  // AVAILABLE
```

### 11.5 Rules

- Slots are generated in **15-minute increments** (configurable per business)
- A slot is only available if the **entire duration + buffer_after** fits within an open period
- **buffer_before** shifts the earliest possible slot start within a period (e.g., 15-min buffer means first slot starts at 9:15 AM not 9:00 AM)
- **buffer_after** on the new slot is checked against the **next booking's start** (prevents back-to-back overlap)
- **Past slots** (relative to business timezone) are excluded — cursor is clamped to `max(period.start, now_in_tz)`
- Staff **overrides** (vacation, sick day) take precedence over regular availability
- The conflict window of an existing booking is `[start - buffer_before, end + buffer_after]` — this prevents scheduling too close before or after an existing appointment

### 11.6 Race Condition & Double-Booking Prevention

| Layer | Mechanism |
|-------|-----------|
| **Database** | `SELECT ... FOR UPDATE` on the booking slot range within a serializable transaction. When a customer clicks "Confirm Booking", the backend acquires a row-level lock on the target time range before inserting |
| **Short-lived reservation** (Post-MVP) | When a customer selects a time slot, a 5-minute Redis key (`reservation:{date}:{start}:{staff_id}`) is created. Other customers see the slot as "temporarily unavailable" with a countdown. If the booking is not completed in 5 minutes, the reservation expires and the slot reappears |
| **Application** | Optimistic concurrency check: `INSERT ... WHERE NOT EXISTS (SELECT 1 FROM bookings WHERE ... overlapping)` — fail and retry if a conflicting row was inserted between page render and submission |
| **Queue** | For peak load, booking submissions are enqueued and processed sequentially per business |

### 11.7 `SlotCache` Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| business_id | UUID | FK → Business |
| service_id | UUID | FK → Service |
| staff_id | UUID | FK → Staff (nullable) |
| date | DATE | NOT NULL |
| start_time | TIMESTAMPTZ | NOT NULL |
| end_time | TIMESTAMPTZ | NOT NULL |
| computed_at | TIMESTAMP | NOT NULL |
| expires_at | TIMESTAMP | NOT NULL |

```
UNIQUE INDEX on (business_id, service_id, staff_id, date, start_time)
INDEX on (business_id, date, expires_at)  // for cache sweep
```

---

## 12. Future Considerations (Post-MVP)

| Feature | Description |
|---------|-------------|
| **Online Payments** | Stripe integration for deposits or full payment at booking |
| **Waitlist** | Customers can join a waitlist for fully booked slots |
| **Recurring Bookings** | Schedule recurring appointments (weekly, monthly) |
| **Group Bookings** | Book for multiple people in a single slot (e.g., group class) |
| **Mobile App** | React Native or Flutter app for business owners |
| **Calendar Sync** | Two-way sync with Google Calendar, Outlook, iCal |
| **Reviews & Ratings** | Customers can rate their appointment after completion |
| **Analytics for Business** | Booking trends, popular times, revenue reports |
| **Multi-Language** | i18n support for public booking pages |
| **Self-Service Signup** | Businesses sign up without Super Admin intervention |
| **Custom Domain** | Businesses use their own domain for booking page |
| **API for Partners** | REST API for third-party integrations |
