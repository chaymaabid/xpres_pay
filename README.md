# XpresPay — Trusted Marketplace for Farmers & Retailers

XpresPay is a **B2B agricultural marketplace platform** designed to connect **farmers and retailers** in a trusted and secure digital environment.

The platform addresses one of the main challenges in agricultural marketplaces: **trust between buyers and sellers**.

XpresPay combines **KYC identity verification, role-based access control, secure payments, escrow mechanisms, Proof of Delivery (PoD), transaction traceability, and AI-powered verification** to provide a safer marketplace experience.

---

## 🎥 Demo

[▶️ Watch the Complete XpresPay Demo](https://drive.google.com/file/d/1gwlkGl5LxIWWYqI0nSG2KDFzMg4jfHkf/view?usp=sharing)

The demo presents the main workflows of the platform, including:

* User registration and authentication
* KYC verification
* Farmer product management
* Retailer product discovery
* Shopping cart and checkout
* Stripe payment
* Order management
* Escrow workflow
* Proof of Delivery upload
* Transaction tracking
* Role-based access

---

## 🎯 Project Objective

Traditional agricultural transactions can involve several trust issues:

* Difficulty verifying the identity of users
* Lack of transparency between buyers and sellers
* Payment risks
* Unclear order and delivery status
* Limited transaction traceability
* Difficulty managing transactions across multiple actors

XpresPay aims to solve these problems by introducing a **trusted digital marketplace with secure transaction workflows**.

The platform follows a **trust-by-design approach**, where important actions are verified and recorded throughout the transaction lifecycle.

---

# 🚀 Main Features

## 👤 Authentication & Role-Based Access Control

The platform supports three main roles:

* **Farmer**
* **Retailer**
* **Administrator**

Access to platform features is controlled using **Role-Based Access Control (RBAC)**.

Authentication and identity management are handled through **Keycloak** using modern authentication protocols.

---

## 🪪 KYC & Identity Verification

XpresPay integrates an AI-powered KYC workflow to verify user identity.

The system uses:

* **EasyOCR** for extracting information from identity documents
* **DeepFace** for facial verification
* **ArcFace** for face recognition
* **MinIO** for secure document storage

A `KYCSession` mechanism is used to coordinate the verification process between the desktop web application and mobile device.

---

# 🏗️ System Architecture

XpresPay follows a layered, service-oriented architecture designed to
separate the presentation layer, business logic, identity management,
data persistence, AI-based verification, object storage, and payment
processing.

The complete application architecture is illustrated below:

<p align="center">
  <img src="./docs/architecture.jfif" alt="XpresPay Application Architecture" width="1000"/>
</p>

## Frontend — Next.js

The frontend is the presentation layer of XpresPay and provides the
web interface used by farmers, retailers, and administrators.

It is responsible for:

- Providing responsive user interfaces
- Managing pages and reusable components
- Displaying role-specific features
- Managing client-side state
- Communicating with the backend through REST APIs
- Handling authenticated requests using JWT tokens

The frontend does not directly communicate with the database or
external services. Business operations are handled by the backend.


## Backend — NestJS

The NestJS application is the core business layer of the platform.
It centralizes the application's business logic and acts as the main
communication point between the frontend and the external services.

Its main responsibilities include:

- User management
- KYC management
- Product management
- Order management
- Escrow management
- Credit management
- Trust and score management
- Transaction ledger and audit management
- Administrative operations
- Payment processing
- Communication with the AI verification service

The backend exposes REST APIs consumed by the Next.js frontend.


## Identity Provider — Keycloak

Keycloak is responsible for authentication and authorization.

It provides:

- User authentication
- Login and logout
- Role management
- JWT token issuance
- Token validation
- Account management
- Role-Based Access Control (RBAC)

The backend validates authenticated requests and uses the user's roles
to control access to protected resources.


## Database — PostgreSQL

PostgreSQL is the main relational database of the application.

It stores the platform's structured data, including:

- Users and roles
- KYC information
- Trust profiles
- Products
- Orders and order items
- Credits and transactions
- Escrow information
- Transaction ledger and audit data
- Device fingerprints

The backend accesses the database through Prisma ORM.


## Object Storage — MinIO

MinIO provides S3-compatible object storage for files that should not
be stored directly in the relational database.

It is used to store:

- Identity document images
- Proof of Delivery documents
- Verification images
- Other uploaded files

The NestJS backend communicates with MinIO through its S3-compatible API.


## AI & Document Verification Service — FastAPI

The AI service is implemented as a separate Python/FastAPI microservice.

It handles computationally intensive document and face verification
operations independently from the main backend.

Its main responsibilities include:

- Identity document OCR
- Extracting information from identity documents
- Face verification between the identity document and selfie

The service uses OCR and face-recognition technologies to support the
KYC workflow.

The NestJS backend communicates with this service through HTTPS REST APIs.


## Payment Gateway — Stripe

Stripe is used to handle payment-related operations.

The integration supports:

- Stripe Connect onboarding for farmers
- Payment Intents
- Payment processing
- Escrow-related fund management
- Fund release
- Webhook-based payment events

Stripe communicates with the backend through secure APIs and webhooks.
The backend processes these events and updates the corresponding
orders, transactions, and escrow states.


## Docker Environment

The different application components are organized within a Docker
environment.

Docker provides an isolated and reproducible environment for the
application services and their communication through the
`xprespay_net` network.

This simplifies local development, service configuration, and
deployment.
---

# 🧰 Technologies

## Frontend

* Next.js
* TypeScript

## Backend

* NestJS
* Prisma ORM
* PostgreSQL

## Authentication

* Keycloak
* JWT
* OIDC
* RBAC

## AI / Computer Vision

* Python
* FastAPI
* EasyOCR
* DeepFace
* ArcFace

## Storage

* MinIO

## Payments

* Stripe
* PaymentIntents
* Stripe Webhooks

## Infrastructure

* Docker

---
## 📁 Project Structure

XpresPay is organized into several components, each responsible for a
specific part of the platform:

```text
xprespay/
│
├── backend/                    # NestJS backend application
│   ├── prisma/                 # Prisma configuration and database schema
│   └── src/
│       ├── auth/               # Authentication & authorization
│       ├── common/             # Shared backend utilities
│       ├── credits/            # Credit management
│       ├── kyc/                # KYC workflow
│       ├── loan/               # Loan management
│       ├── notification/       # Notifications
│       ├── order-items/        # Order item management
│       ├── orders/             # Order management
│       ├── products/           # Product management
│       ├── storage/            # File/object storage
│       ├── stripe/             # Stripe integration
│       ├── transaction-ledger/ # Transaction ledger & audit trail
│       ├── transactions/       # Transaction management
│       └── users/              # User management
│
├── frontend/                   # Next.js frontend application
│   └── src/
│       ├── app/
│       │   ├── admin/          # Admin interface
│       │   ├── api/            # Frontend API routes
│       │   ├── auth/           # Authentication pages
│       │   ├── components/     # Reusable UI components
│       │   ├── farmer/         # Farmer interface
│       │   ├── retailer/       # Retailer interface
│       │   └── verify/         # Verification interface
│       ├── context/            # Application contexts
│       ├── hooks/              # Custom React hooks
│       ├── lib/                # Shared utilities
│       ├── services/           # API/service communication
│       └── types/              # TypeScript types
│
├── keycloak/                   # Keycloak configuration
│   └── realm/
│       └── xprespay-realm.json # XpresPay Keycloak realm configuration
│
├── kyc-vision/                 # AI/document verification microservice
│   ├── app/
│   │   ├── models/             # AI/data models
│   │   ├── routers/            # FastAPI API routes
│   │   └── services/           # OCR & face verification services
│   └── requirements.txt        # Python dependencies
│
├── scripts/                    # Project utility/setup scripts
│
├── docker-compose.yml          # Docker services configuration
├── .gitignore
└── README.md
---

# ⚙️ Getting Started

## Prerequisites

Make sure you have installed:

* Node.js
* npm
* Docker
* Docker Compose
* PostgreSQL or Dockerized PostgreSQL
* Git

You will also need accounts/configuration for:

* Keycloak
* Stripe
* MinIO

---

## Installation

Clone the repository:

```bash
git clone https://github.com/chaymaabid/xpres_pay
cd XpresPay
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Install backend dependencies:

```bash
cd ../backend
npm install
```

Install AI service dependencies according to the provided Python requirements.

---

## Environment Variables

Create the required `.env` files for the frontend, backend, and AI service.

Example backend configuration:

```env
DATABASE_URL=your_database_url

KEYCLOAK_URL=your_keycloak_url
KEYCLOAK_REALM=your_realm
KEYCLOAK_CLIENT_ID=your_client_id
KEYCLOAK_CLIENT_SECRET=your_client_secret

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

MINIO_ENDPOINT=your_minio_endpoint
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
```

# 📊 Project Highlights

### 🔐 Zero-Trust Approach

Users are not simply trusted based on registration. Identity and important operations are verified.

### 💳 Escrow-Based Payments

Payments are controlled through a transaction lifecycle instead of being immediately released.

### 📒 Transaction Traceability

Important financial operations are recorded for auditing and transparency.

### 🤖 AI-Powered KYC

OCR and facial verification automate parts of the identity verification process.

### 🏗️ Modern Architecture

The project separates the frontend, backend, AI services, storage, authentication, and payment infrastructure.

### 🐳 Containerization

Docker allows the different services to be deployed in a consistent environment.

---

# 🎓 Project Context

XpresPay was developed as a software engineering / final-year project with the objective of designing and implementing a **secure agricultural marketplace that improves trust between farmers and retailers**.

The project combines web development, distributed services, authentication, AI-powered identity verification, payment processing, and transaction management into a single platform.

