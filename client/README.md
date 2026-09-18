# Client app

This directory contains the React + Vite frontend for the Simatei Motorworld project.

## Stack

- React 19
- Vite
- Typescript

## Purpose

The client provides the public marketplace experience and authenticated user flows for:

- browsing vehicles
- viewing vehicle details
- creating and managing enquiries
- booking test drives
- saving favourite cars
- managing seller inventory
- admin analytics and user management

## Local development

From this folder:

```bash
npm install
cp .env.example .env
npm run dev
```

If no `.env.example` file exists, create a `.env` file with:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

The app expects the backend to run on `http://localhost:5000`.

## Production build

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Important API contract notes

- The frontend does not upload files; the API expects image URLs in JSON.
- Authentication requests use Bearer JWTs in the `Authorization` header.
- The JWT is returned as `token` from the backend, not `access_token`.
- Protected endpoints require the user token to be stored and restored on page reload.

## Project layout

```text
client/
├── public/
├── src/
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
└── README.md
```

For the backend setup and full-stack startup instructions, see the root README and the server README.

Supported query parameters:

- make
- model
- year_min
- year_max
- price_min
- price_max
- fuel_type
- transmission
- condition
- location
- is_available=true|false
- q
- sort_by=price|year|created_at|views
- sort_order=asc|desc
- page
- limit

Default page is 1.
Default limit is 20.
The backend caps inventory limit at 100.

Response:

{
"total": 1,
"page": 1,
"pages": 1,
"cars": [
{
"id": 1,
"make": "Toyota",
"model": "Land Cruiser Prado",
"year": 2020,
"price": 6500000,
"currency": "KES",
"mileage": 45000,
"condition": "Used",
"fuel_type": "Petrol",
"transmission": "Automatic",
"color": "White",
"description": "Vehicle description",
"location": "Nairobi",
"is_negotiable": false,
"is_available": true,
"is_sold": false,
"views": 12,
"seller_id": 2,
"created_at": "ISO_TIMESTAMP",
"images": [
{
"id": 1,
"url": "https://example.com/car.jpg",
"is_primary": true
}
]
}
]
}

Build:

- Public vehicle listing page.
- Search input using q.
- Filter controls for make, model, year range, price range, fuel type, transmission, condition, and location.
- Availability filter.
- Sort controls.
- Pagination.
- Empty state.
- Loading skeletons.
- Error state.
- Responsive vehicle cards.
- Favourite action on each card.
- Clear filter action.
- URL query-string synchronization so searches and filters can be shared/bookmarked.

Do not assume that the backend supports full-text search semantics beyond the q parameter. Send the current filter values as query parameters.

GET /cars/filters

Response:

{
"makes": [],
"models": [],
"years": [],
"locations": []
}

Use this endpoint to populate filter controls. Fuel type, transmission, and condition can use the fixed backend values below.

Allowed condition values:

- New
- Used
- Certified Pre-Owned

Allowed fuel_type values:

- Petrol
- Diesel
- Electric
- Hybrid

Allowed transmission values:

- Manual
- Automatic
- CVT

================================================== 5. VEHICLE DETAILS
==================================================

GET /cars/<car_id>

This endpoint is public.

Response:

{
"car": {
"id": 1,
"make": "Toyota",
"model": "Land Cruiser Prado",
"year": 2020,
"price": 6500000,
"currency": "KES",
"mileage": 45000,
"condition": "Used",
"fuel_type": "Petrol",
"transmission": "Automatic",
"color": "White",
"description": "Vehicle description",
"location": "Nairobi",
"is_negotiable": false,
"is_available": true,
"is_sold": false,
"views": 12,
"seller_id": 2,
"created_at": "ISO_TIMESTAMP",
"images": []
}
}

The backend increments the vehicle view count every time this endpoint is called.

Build a vehicle detail page with:

- Image gallery.
- Primary image handling using is_primary.
- Vehicle specifications.
- Price and currency formatting.
- Availability and sold states.
- Description.
- Location.
- Mileage.
- Favourite toggle.
- Enquiry form.
- Test-drive booking action for authenticated users.
- Login redirect when an unauthenticated user attempts a protected action.
- Not-found state.
- Broken-image fallback.
- Loading state.

Use image URLs directly. The backend does not support file uploads.

================================================== 6. SELLER VEHICLE MANAGEMENT
==================================================

POST /cars

Requires authentication.

Request:

{
"make": "Toyota",
"model": "Land Cruiser Prado",
"year": 2020,
"price": 6500000,
"currency": "KES",
"mileage": 45000,
"condition": "Used",
"fuel_type": "Petrol",
"transmission": "Automatic",
"color": "White",
"description": "Vehicle description",
"location": "Nairobi",
"is_negotiable": false,
"images": [
"https://example.com/image-1.jpg",
"https://example.com/image-2.jpg"
]
}

The images array is required and must contain 1 to 10 URL strings.

The backend assigns seller_id, is_available, is_sold, views, and created_at. Do not send those fields when creating a vehicle.

Response status: 201

{
"car": { ... }
}

PUT /cars/<car_id>

Requires authentication. The authenticated user must own the vehicle or be an admin.

All vehicle fields are optional for updates. If images is included, it replaces the entire existing image set.

DELETE /cars/<car_id>

Requires authentication. The authenticated user must own the vehicle or be an admin.

Response:

{
"message": "Car deleted"
}

PATCH /cars/<car_id>/status

Requires authentication. The authenticated user must own the vehicle or be an admin.

Request:

{
"is_sold": true,
"is_available": false
}

Both fields are optional, but the UI must prevent selecting an invalid state where both is_sold and is_available are true.

Build seller/admin vehicle management features:

- Add vehicle form.
- Edit vehicle form.
- URL-based image entry with preview.
- Reordering or selecting a primary image on the client where possible.
- Vehicle status controls.
- Delete confirmation dialog.
- Ownership and permission errors.
- Save and delete loading states.
- Validation for all backend constraints.
- Seller inventory dashboard.
- Empty inventory state.

Never implement multipart upload or File objects as the API does not accept them.

================================================== 7. ENQUIRIES
==================================================

POST /enquiries

This endpoint is public. Authentication is optional.

Request:

{
"name": "Jane Doe",
"email": "jane@example.com",
"phone": "+254712345678",
"message": "I would like more information.",
"enquiry_type": "Buy",
"car_id": 1
}

Required fields:

- name
- email
- message
- enquiry_type

Optional fields:

- phone
- car_id

Allowed enquiry_type values:

- Buy
- Sell
- Test Drive
- General

Response status: 201

{
"enquiry": {
"id": 1,
"name": "Jane Doe",
"email": "jane@example.com",
"phone": "+254712345678",
"message": "I would like more information.",
"enquiry_type": "Buy",
"status": "Pending",
"car_id": 1,
"user_id": 2,
"created_at": "ISO_TIMESTAMP"
}
}

For unauthenticated enquiries, user_id may be null.

GET /enquiries

Requires authentication.

Returns the authenticated user's enquiries only.

Query parameters:

- page
- limit

Response:

{
"total": 1,
"page": 1,
"pages": 1,
"enquiries": []
}

GET /enquiries/<enquiry_id>

Requires authentication.

A regular user may only view their own enquiry. Admins may view any enquiry.

Response:

{
"enquiry": { ... }
}

PUT /enquiries/<enquiry_id>/status

Requires admin role.

Request:

{
"status": "Replied"
}

Allowed statuses:

- Pending
- Replied
- Closed

Response:

{
"enquiry": { ... }
}

POST /enquiries/<enquiry_id>/whatsapp

Requires authentication.

Response:

{
"whatsapp_url": "https://wa.me/..."
}

Open whatsapp_url in a new browser tab or use a clear WhatsApp contact action.

Important limitation: there is no dedicated backend endpoint for administrators to list all enquiries. Do not invent GET /admin/enquiries. Build the user enquiry history using GET /enquiries. Admin status controls can be implemented only where an enquiry record is already available.

================================================== 8. TEST-DRIVE BOOKINGS
==================================================

POST /test-drives

Requires authentication.

Request:

{
"car_id": 1,
"preferred_date": "2026-09-20",
"preferred_time": "10:30"
}

The backend expects ISO date and time values.

Business-hour validation currently accepts times from 08:00 through 17:59.

The selected date cannot be before today.

Response status: 201

{
"test_drive": {
"id": 1,
"preferred_date": "2026-09-20",
"preferred_time": "10:30",
"status": "Requested",
"user_id": 2,
"car_id": 1,
"created_at": "ISO_TIMESTAMP"
}
}

GET /test-drives

Requires authentication.

Returns the authenticated user's bookings.

Query parameters:

- page
- limit

Response:

{
"total": 1,
"page": 1,
"pages": 1,
"test_drives": []
}

GET /test-drives/car/<car_id>

Requires authentication.

Only the vehicle owner or an admin may use this endpoint.

Query parameters:

- page
- limit

PUT /test-drives/<test_drive_id>/status

Requires admin role.

Request:

{
"status": "Confirmed"
}

Allowed statuses:

- Requested
- Confirmed
- Completed
- Cancelled

Build:

- Test-drive booking modal or page.
- Date picker that blocks past dates.
- Time selector limited to 08:00-17:59.
- Booking confirmation.
- User booking history.
- Booking status badges.
- Admin status update controls where bookings are available.
- Conflict and validation error handling.
- Empty, loading, and error states.

================================================== 9. FAVOURITES
==================================================

POST /favourites

Requires authentication.

Request:

{
"car_id": 1
}

Response status: 201

{
"favourite": {
"id": 1,
"user_id": 2,
"car_id": 1,
"created_at": "ISO_TIMESTAMP"
}
}

DELETE /favourites/<car_id>

Requires authentication.

Response:

{
"message": "Removed from favourites"
}

GET /favourites

Requires authentication.

Response:

{
"favourites": [
{
"id": 1,
"user_id": 2,
"car_id": 1,
"created_at": "ISO_TIMESTAMP",
"car": {
"id": 1,
"make": "Toyota",
"model": "Land Cruiser Prado",
"images": []
}
}
]
}

Build:

- Favourite toggle on vehicle cards and detail pages.
- Auth-required behavior.
- Optimistic UI only when rollback is correctly implemented.
- Favourites page.
- Duplicate favourite handling.
- Removed-favourite handling.
- Empty state.

================================================== 10. ADMIN FEATURES
==================================================

Admin authorization is based on the authenticated user's role.

Admin role value:

"admin"

Regular role value:

"user"

GET /admin/analytics

Requires admin role.

Response:

{
"total_cars": 10,
"available_cars": 8,
"sold_cars": 2,
"total_enquiries": 20,
"pending_enquiries": 7
}

Build an admin analytics dashboard with:

- Total cars.
- Available cars.
- Sold cars.
- Total enquiries.
- Pending enquiries.
- Clear loading and error states.
- Simple charts only when the returned data supports them.

GET /admin/cars/popular

Requires admin role.

Response:

{
"most_viewed": [],
"most_favourited": []
}

Build popular-vehicle sections using the same vehicle card component.

GET /admin/users?page=1&limit=20

Requires admin role.

Response:

{
"total": 10,
"page": 1,
"pages": 1,
"users": [
{
"id": 1,
"name": "Jane Doe",
"email": "jane@example.com",
"phone": null,
"role": "user",
"is_blocked": false,
"created_at": "ISO_TIMESTAMP"
}
]
}

PUT /admin/users/<user_id>/role

Requires admin role.

Request:

{
"role": "admin"
}

Allowed role values:

- user
- admin

Response:

{
"user": { ... }
}

Build:

- Admin-only route protection.
- Admin dashboard.
- User management table.
- Pagination.
- Role update control.
- Confirmation before promoting a user to admin.
- Permission-denied state.
- Do not add a frontend block/unblock action because the backend has no endpoint for it.
- Do not assume the admin list contains password fields.

================================================== 11. ERROR HANDLING
==================================================

The backend may return these formats:

Validation error:

{
"error": "Validation failed",
"details": {
"field": ["Validation message"]
}
}

API error:

{
"error": "Error message"
}

Database error:

{
"error": "Database integrity error",
"details": "Database message"
}

Not found:

{
"error": "Resource not found"
}

Some JWT errors may use Flask-JWT-Extended's default response format.

Implement a shared error-normalization utility that:

- Shows field-level validation under the relevant form fields.
- Shows a global toast or alert for general errors.
- Handles 401 by offering login or clearing invalid auth state.
- Handles 403 with a permission message.
- Handles 404 with a resource-not-found state.
- Handles 409 as a conflict, duplicate action, or booking conflict.
- Never displays raw stack traces.
- Does not silently swallow failed mutations.

================================================== 12. FRONTEND ARCHITECTURE
==================================================

Use reusable components and a centralized API layer.

Recommended structure:

- api/client
- api/auth
- api/cars
- api/enquiries
- api/testDrives
- api/favourites
- api/admin
- auth store/provider
- route guards
- shared error handling
- shared pagination
- shared vehicle cards
- shared status badges
- shared form controls
- shared loading states

Use the backend response keys exactly:

- cars
- users
- enquiries
- test_drives
- favourites
- test_drive
- enquiry
- favourite
- car
- user
- token

Do not rename these fields in the API layer. Adapt them only in view models if necessary.

Use ISO timestamps from the backend and format them for display in the user's locale.

Prices are returned as numeric values and use KES by default. Format prices clearly, for example:

KES 6,500,000

Do not assume every vehicle has mileage, color, description, phone, or a non-null relationship field.

================================================== 13. UX AND VISUAL DESIGN
==================================================

Create a confident, premium automotive marketplace interface rather than a generic dashboard.

Use:

- Strong vehicle photography.
- Clear hierarchy around vehicle make, model, year, and price.
- High-quality responsive image galleries.
- A restrained, professional color system.
- Clear availability and sold badges.
- Accessible contrast.
- Keyboard-accessible dialogs, menus, forms, and buttons.
- Responsive layouts for mobile users.
- Loading skeletons instead of blank screens.
- Toasts for completed mutations.
- Confirmation dialogs for destructive actions.
- Clear empty states with a useful next action.
- Breadcrumbs or back navigation on detail pages.
- Sticky or easy-to-find enquiry and test-drive actions on vehicle details.

Do not create screens for unsupported backend capabilities such as:

- File uploads.
- Functional password reset.
- Refresh-token management.
- User blocking.
- Dedicated admin enquiry listing.
- Payment processing.
- Chat or messaging APIs.
- Seller payout workflows.

================================================== 14. REQUIRED ROUTES
==================================================

Implement these frontend routes:

Public:

- /
- /cars
- /cars/:carId
- /login
- /register

Authenticated users:

- /account
- /account/enquiries
- /account/test-drives
- /account/favourites
- /sell
- /sell/cars
- /sell/cars/new
- /sell/cars/:carId/edit

Admins:

- /admin
- /admin/users
- /admin/cars
- /admin/enquiries
- /admin/test-drives

Because the backend does not provide a dedicated admin enquiry-list endpoint, the admin enquiries route must clearly handle the unavailable listing capability instead of making unsupported requests. It may show enquiry details only when reached through a known enquiry record, or communicate that the backend endpoint is not currently available.

================================================== 15. ACCEPTANCE CRITERIA
==================================================

The frontend is complete when:

- A user can register and is automatically signed in.
- A user can log in and log out.
- A user can browse, search, filter, sort, and paginate vehicles.
- A user can open a vehicle detail page.
- A user can submit a public enquiry.
- An authenticated user can submit an enquiry tied to their account.
- An authenticated user can add and remove favourites.
- An authenticated user can book a test drive.
- An authenticated user can view their enquiries and test drives.
- An authenticated user can edit their profile.
- An authenticated user can create, edit, update status, and delete their own vehicles.
- An admin can view analytics.
- An admin can view popular vehicles.
- An admin can manage user roles.
- An admin can update enquiry and test-drive statuses where records are available.
- Protected routes correctly redirect unauthenticated users.
- Non-admin users cannot access admin screens.
- All API loading, empty, error, validation, unauthorized, forbidden, and conflict states are handled.
- The app works with the exact Flask API contract above without requiring backend changes.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/39b4ad03-c0de-411a-a7ca-068d8d50027a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
