<div align="center">

# NepalTravelAI

**An AI-augmented vehicle rental marketplace for Nepal tourism.**

A full-stack platform that connects tourists with NATTA-certified vehicle vendors, streamlines bidirectional price negotiation, and embeds a Retrieval-Augmented (RAG) travel assistant to help visitors plan their journey through the Himalayas.

[![Django](https://img.shields.io/badge/Django-6.0-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.16-A30000?logo=django)](https://www.django-rest-framework.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-Test_Mode-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)
[![License](https://img.shields.io/badge/license-Academic-lightgrey)](#-license)

</div>

---

## Table of Contents

1. [About the Project](#-about-the-project)
2. [Key Features](#-key-features)
3. [System Architecture](#-system-architecture)
4. [Tech Stack](#-tech-stack)
5. [Project Structure](#-project-structure)
6. [Getting Started](#-getting-started)
7. [Environment Variables](#-environment-variables)
8. [API Reference](#-api-reference)
9. [Design System](#-design-system)
10. [Testing](#-testing)
11. [Roadmap](#-roadmap)
12. [Academic Context](#-academic-context)
13. [License](#-license)

---

## About the Project

**NepalTravelAI** is a Final Year Project that re-imagines how international and domestic tourists rent vehicles in Nepal. Existing marketplaces are fragmented, pricing is opaque, and few offer any intelligent trip planning. This project addresses those gaps with a single, role-aware web platform covering discovery, negotiation, payment, community, and AI assistance.

The system supports three distinct user journeys — **tourist**, **vendor**, and **administrator** — each with its own dashboard, permissions, and UX patterns. An integrated **AI chatbot** (RAG over a ChromaDB knowledge base of Nepali travel content) answers destination questions in real time, while a **community forum** surfaces first-hand experiences from other travellers.

### Problem Statement

> *Tourists visiting Nepal lack a trusted, transparent, and intelligent channel to book vehicles from certified local vendors — and vendors lack a digital channel to compete on trust rather than on price alone.*

### Solution

A NATTA-certified vehicle booking platform that combines:

- **Verified vendor onboarding** — admin-gated approval ensures listings are legitimate
- **Bidirectional price negotiation** — tourists offer, vendors counter, tourists accept or reject
- **Integrated Stripe payments** — test-mode end-to-end payment simulation for booking settlement
- **Retrieval-Augmented AI chat** — contextual answers grounded in a curated Nepali tourism knowledge base
- **Community layer** — posts, comments, and likes moderated through the admin dashboard

---

## Key Features

### For Tourists
- Browse and filter a marketplace of vehicles (jeeps, SUVs, bikes, cars, buses)
- Submit booking requests with a custom offer price
- Accept or reject vendor counter-offers
- Complete secure payments via **Stripe** (test mode)
- Rate and review completed trips
- Chat with the AI travel assistant (`/chat`) for itinerary ideas and destination info
- Read and contribute to a community forum (posts, comments, likes)
- Manage profile, change password, recover password via email OTP

### For Vendors
- Apply for vendor account (pending admin approval flow)
- List, edit, and archive vehicle inventory with photos
- Receive and triage booking requests
- Send counter-offers or accept a tourist's offer outright
- Track earnings and completed trips
- View booking lifecycle at a glance (pending → confirmed → paid → completed)

### For Administrators
- Platform-wide analytics with Recharts visualisations
- Approve or reject pending vendor applications
- Approve, reject, or suspend vehicle listings
- Monitor every booking across the platform
- Moderate community posts and comments

### Cross-cutting
- JWT authentication with access + refresh token rotation
- Protected routes and role-based layout switching
- Responsive, accessible UI with a consistent "Himalayan" design language
- Automated data enrichment via Reddit and general-knowledge scrapers for the RAG index

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                            Client (Browser)                         │
│                          React 19 + Vite 7 SPA                      │
│   Tourist UI  │  Vendor Dashboard  │  Admin Dashboard  │  AI Chat   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ JWT (Bearer) over HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Django REST Framework API                     │
│  ┌──────────┬────────────┬─────────┬──────────┬───────────────────┐ │
│  │   auth   │ marketplace│  trips  │community │  dashboard (admin)│ │
│  └──────────┴─────┬──────┴─────────┴──────────┴───────────────────┘ │
│                   │                                                 │
│  ┌──────────────────────────────┐   ┌─────────────────────────────┐ │
│  │  Stripe PaymentIntent API    │   │  chatbot (RAG)              │ │
│  │  (test mode simulation)      │   │  sentence-transformers +    │ │
│  │                              │   │  ChromaDB + Ollama LLM      │ │
│  └──────────────────────────────┘   └─────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
      ┌──────────┐       ┌──────────┐      ┌──────────────┐
      │PostgreSQL│       │ ChromaDB │      │  Media /     │
      │(domain)  │       │(vectors) │      │  uploads FS  │
      └──────────┘       └──────────┘      └──────────────┘
```

### Booking Lifecycle

```
 pending ──▶ confirmed ──▶ paid ──▶ completed
    │           │
    └── rejected / cancelled
```

Each transition is permissioned (tourist, vendor, or admin only) and enforced at the serializer/view level.

---

## Tech Stack

### Backend
| Layer | Technology |
| --- | --- |
| Framework | Django 6.0, Django REST Framework 3.16 |
| Auth | `djangorestframework-simplejwt` (access + refresh, rotation + blacklist) |
| Database | PostgreSQL (via `psycopg2-binary`) |
| Payments | Stripe Python SDK (test mode) |
| AI / RAG | `sentence-transformers`, `chromadb`, `ollama` local LLM |
| Scraping | `requests`, `beautifulsoup4`, `lxml` |
| CORS | `django-cors-headers` |
| Email | SMTP (Gmail) or console backend for development |

### Frontend
| Layer | Technology |
| --- | --- |
| Framework | React 19.2 |
| Build Tool | Vite 7.2 |
| Routing | React Router DOM 7 |
| HTTP | Axios 1.13 |
| Icons | Lucide React |
| Charts | Recharts 3 |
| Payments UI | `@stripe/react-stripe-js`, `@stripe/stripe-js` |
| Linting | ESLint 9 + `eslint-plugin-react-hooks` |

---

## Project Structure

```
fyp-development/
├── backend/
│   ├── nepaltravelai/        # Django project (settings, urls, wsgi/asgi)
│   ├── authentication/       # Custom User model, JWT auth, OTP password reset
│   ├── marketplace/          # Vehicles, Bookings, CounterOffers, Ratings, Payments
│   ├── trips/                # Curated trip templates (slug-based detail pages)
│   ├── community/            # Posts, comments, likes
│   ├── chatbot/              # RAG retrieval + Ollama LLM integration
│   ├── dashboard/            # Admin analytics + moderation endpoints
│   ├── knowledge_base/       # Scraped Nepali tourism corpus
│   ├── scripts/              # Ingestion & scraper CLIs (Reddit + general web)
│   ├── chroma_db/            # Persisted vector store
│   ├── media/                # User-uploaded vehicle images
│   ├── requirements.txt
│   └── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── public/       # Home, Login, SignUp, Marketplace, Community, ...
│   │   │   ├── tourist/      # Dashboard, MyBookings, ChatPage, BookingModal
│   │   │   ├── vendor/       # Dashboard, Listings, AddVehicle, EditVehicle
│   │   │   └── admin/        # Dashboard, Users, Vehicles, Bookings, Community
│   │   ├── components/
│   │   │   ├── shared/       # Navigation, Footer, ProtectedRoute
│   │   │   ├── tourist/      # RatingModal, PaymentModal, RedditTrending
│   │   │   ├── vendor/       # VendorLayout, Stats, VehicleCard, BookingCard
│   │   │   └── admin/        # AdminLayout
│   │   ├── services/         # auth.js, marketplace.js, trips.js, community.js, admin.js
│   │   ├── context/          # AuthContext.jsx (useAuth)
│   │   ├── App.jsx           # Routing + role-based guards
│   │   ├── App.css           # Global design tokens (Himalayan palette)
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## Getting Started

### Prerequisites

| Requirement | Version |
| --- | --- |
| Python | 3.11+ |
| Node.js | 20 LTS+ |
| PostgreSQL | 14+ |
| Ollama (local LLM runtime) | latest |
| Git | any recent |

### 1. Clone the repository

```bash
git clone https://github.com/Santosh-87/nepaltravelai.git
cd nepaltravelai
```

### 2. Backend setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file (see Environment Variables below)
cp .env.example .env  # or create manually

# Apply migrations
python manage.py migrate

# Create a superuser for the admin dashboard
python manage.py createsuperuser

# (Optional) Seed the RAG knowledge base
python scripts/general_knowledge_scraper.py
python scripts/load_knowledge_base.py

# Run the development server
python manage.py runserver
```

Backend will be available at **http://localhost:8000**.

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend will be available at **http://localhost:5173**.

### 4. Start the local LLM (for AI chat)

```bash
# In a separate terminal
ollama serve
ollama pull llama3.2   # or the model referenced in chatbot/views.py
```

---

## Environment Variables

Create a `.env` file inside `backend/`. The following keys are required:

```env
# --- Django ---
SECRET_KEY=replace-with-a-long-random-string
DEBUG=True

# --- Database (PostgreSQL) ---
DATABASE_NAME=nepaltravelai
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# --- Stripe (test mode) ---
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx

# --- Email (optional — defaults to console backend) ---
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=NepalTravelAI <noreply@nepaltravelai.com>
```

The frontend reads the Stripe publishable key from its own configuration (see `frontend/src/components/tourist/PaymentModal.jsx`). Create a matching `frontend/.env` if you extract it:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
```

> **Test card:** `4242 4242 4242 4242` · any future expiry · any 3-digit CVC.

---

## API Reference

All endpoints are prefixed with `/api/` and require a `Bearer <access_token>` header except for public reads and auth routes.

| Module | Base path | Notable endpoints |
| --- | --- | --- |
| **Auth** | `/api/auth/` | `register/`, `login/`, `logout/`, `profile/`, `forgot-password/`, `reset-password/` |
| **Marketplace** | `/api/marketplace/` | `vehicles/` (CRUD), `bookings/` (CRUD), `bookings/{id}/confirm/`, `bookings/{id}/reject/`, `bookings/{id}/complete/`, `bookings/{id}/cancel/`, `bookings/{id}/counter-offer/`, `ratings/` |
| **Payments** | `/api/marketplace/payments/` | `create-intent/`, `confirm/` |
| **Trips** | `/api/trips/` | `templates/`, `templates/{slug}/` |
| **Community** | `/api/community/` | `posts/` (CRUD), `posts/{id}/toggle_like/`, `posts/{id}/comments/` |
| **Admin** | `/api/admin-panel/` | `stats/`, `users/`, `vehicles/`, `bookings/`, `community-posts/` (approve / reject / toggle) |
| **Chatbot** | `/api/chatbot/` | `query/` — RAG-backed travel assistant |

A Postman collection can be exported from Django's auto-generated routes at `python manage.py show_urls`.

---

## Design System

The platform adopts a **Himalayan** visual identity — inspired by Nepal's mountain landscapes, prayer flags, and stone architecture.

| Token | Value | Usage |
| --- | --- | --- |
| Primary | `#1a4d6f` | Calls-to-action, links, headings |
| Accent | `#d4734b` | Highlights, warm contrasts |
| Background | `#faf8f5` | Page canvas |
| Slate-900 | `#0f172a` | Dashboard sidebars |
| Slate-100 | `#f1f5f9` | Dashboard content surfaces |

| Typography | Usage |
| --- | --- |
| **Playfair Display** | Public page display headings |
| **Plus Jakarta Sans** | Public body copy |
| **Sora** | Dashboard display |
| **Inter** | Dashboard body |

CSS variables are namespaced per role — `--adp-*` (admin), `--vl-*` (vendor), `--td-*` (tourist) — to prevent leakage across dashboards.

---

## Testing

Manual end-to-end smoke checklist:

- [ ] Register a tourist and a vendor; approve the vendor from an admin account
- [ ] Vendor adds a vehicle; admin approves it
- [ ] Tourist submits a booking offer
- [ ] Vendor issues a counter-offer; tourist accepts
- [ ] Tourist pays with Stripe test card `4242 4242 4242 4242`
- [ ] Vendor marks booking as completed
- [ ] Tourist leaves a rating
- [ ] Tourist asks the AI chatbot a destination question
- [ ] Tourist creates a community post; admin moderates it

Unit and integration tests can be run with:

```bash
# Backend
cd backend && python manage.py test

# Frontend lint
cd frontend && npm run lint
```

---

## Roadmap

- [ ] Production deployment (Docker Compose + Nginx + Gunicorn)
- [ ] Real-currency Stripe integration (NPR → USD FX layer)
- [ ] Push notifications for booking state changes
- [ ] Vendor mobile companion app (React Native)
- [ ] Multi-language support (English / Nepali / Hindi)
- [ ] Fine-tuned domain LLM for the travel assistant
- [ ] CI pipeline with GitHub Actions (lint, test, migrate-check)

---

## Academic Context

This project is submitted as the **Final Year Project (Year 3)** for the BSc (Hons) Computing programme at **Islington College**, in partnership with **London Metropolitan University**.

**Author:** Santosh
**Supervisor:** *(to be confirmed)*
**Submission Year:** 2026

### Contributions of the project
- A role-aware multi-tenant SaaS pattern implemented end-to-end with JWT and DRF
- Bidirectional price-negotiation workflow modelled as a finite state machine
- A locally hosted RAG pipeline (ChromaDB + Ollama) with a curated Nepali tourism corpus
- A clean, component-driven React 19 frontend with explicit design-token governance

### Ethical considerations
- All Stripe transactions operate in **test mode**; no real funds are exchanged.
- The RAG knowledge base was scraped from publicly accessible sources with attribution preserved in `knowledge_base/`.
- User passwords are hashed with Django's PBKDF2; JWT secrets are loaded from environment variables and never committed.
- Personal data is minimised: only fields required for booking and communication are stored.

---

## License

This project is released for **academic and portfolio use only**. Commercial use, redistribution, or derivative works require written permission from the author.

---

<div align="center">

**Built with care in Kathmandu for travellers who want to see the real Nepal.**

</div>
