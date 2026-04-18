# GoParcel — Backend API Server

> RESTful API server powering the GoParcel Smart Parcel Delivery Management platform. Built with Node.js, Express.js, and MongoDB Atlas.

---

## Table of Contents

- [About](#about)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Authentication & RBAC](#authentication--rbac)
- [Team](#team)

---

## About

GoParcel is a centralized parcel delivery management system that connects **Customers**, **Delivery Riders**, and **Administrators** through a role-based web platform. This repository contains the backend Express.js server that handles all business logic, database operations, and third-party service integrations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | Firebase Admin SDK |
| Payment Gateway | Stripe |
| Environment | dotenv |
| Dev Server | Nodemon |

---

## Features

- **RESTful API** with 16 endpoints across 5 modules
- **Firebase Token Verification** on all protected routes
- **Role-Based Access Control** — Admin, Rider, and Customer middleware guards
- **Stripe Payment Integration** — Checkout session creation and payment verification
- **Parcel Tracking Event Logging** — Immutable timestamped status log for every parcel
- **Unique Tracking ID Generation** — Format: `PRCL-YYYYMMDD-xxxxxx`
- **Rider Availability Detection** — Filter by district and work status

---

## Project Structure

```
goParcel-s/
├── index.js                          # Main server entry point — all routes and middleware
├── go-parcel-firebase-adminsdk.json  # Firebase Admin SDK credentials (not committed)
├── .env                              # Environment variables (not committed)
├── package.json
└── package-lock.json
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18.0 or higher
- [npm](https://www.npmjs.com/) (included with Node.js)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account
- [Firebase](https://firebase.google.com/) project with Admin SDK credentials
- [Stripe](https://stripe.com/) account with a secret key

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Alif-Hossen/goParcel-s.git
cd goParcel-s
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then fill in your credentials. See [Environment Variables](#environment-variables) below.

**4. Add Firebase Admin SDK credentials**

Download your Firebase Admin SDK service account JSON file from the Firebase Console and place it in the root directory:

```
go-parcel-firebase-adminsdk.json
```

> ⚠️ Never commit this file to your repository. It is listed in `.gitignore`.

**5. Start the development server**

```bash
nodemon index.js
```

The server will start at **http://localhost:3000**

**Expected terminal output:**

```
Example app listening on port 3000
Pinged your deployment. You successfully connected to MongoDB!
```

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
PORT=3000
DB_USER=your_mongodb_username
DB_PASSWORD=your_mongodb_password
STRIPE_SECRET=sk_test_your_stripe_secret_key
SITE_DOMAIN=http://localhost:5173
```

| Variable | Description | Required |
|---|---|---|
| `PORT` | Port the server runs on. Defaults to `3000` | Optional |
| `DB_USER` | MongoDB Atlas database username | ✅ Required |
| `DB_PASSWORD` | MongoDB Atlas database password | ✅ Required |
| `STRIPE_SECRET` | Stripe secret key for payment processing | ✅ Required |
| `SITE_DOMAIN` | Frontend URL for Stripe redirect (e.g. `http://localhost:5173`) | ✅ Required |

---

## API Endpoints

### Users

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/users` | Get all users (supports `?searchText=`) | 🔐 Token |
| `GET` | `/users/:email/role` | Get user role by email | Public |
| `POST` | `/users` | Register new user | Public |
| `PATCH` | `/users/:id/role` | Update user role | 🔐 Admin |

### Parcels

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/parcels` | Get parcels (supports `?email=` & `?deliveryStatus=`) | Public |
| `GET` | `/parcels/rider` | Get rider-specific parcels | Public |
| `GET` | `/parcels/:id` | Get single parcel by ID | Public |
| `POST` | `/parcels` | Create new parcel booking | Public |
| `PATCH` | `/parcels/:id` | Assign rider to parcel | Public |
| `PATCH` | `/parcels/:id/status` | Update parcel delivery status | Public |
| `DELETE` | `/parcels/:id` | Delete a parcel | Public |

### Payments

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/payment-checkout-session` | Create Stripe checkout session | Public |
| `PATCH` | `/payment-success` | Verify and record successful payment | Public |
| `GET` | `/payments` | Get payment history by email | 🔐 Token |

### Riders

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/riders` | Get riders (supports `?status=`, `?district=`, `?workStatus=`) | Public |
| `POST` | `/riders` | Submit rider application | Public |
| `PATCH` | `/riders/:id` | Approve or reject rider application | 🔐 Admin |

### Tracking

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/trackings/:trackingId/logs` | Get full tracking event log for a parcel | Public |

---

## Authentication & RBAC

GoParcel uses **Firebase Authentication** for identity verification and a custom **Role-Based Access Control (RBAC)** system on the backend.

### Middleware Chain

```
Request → verifyFBToken → verifyAdmin / verifyRider → Route Handler
```

| Middleware | Purpose |
|---|---|
| `verifyFBToken` | Verifies the Firebase ID token from the `Authorization: Bearer <token>` header |
| `verifyAdmin` | Checks that the authenticated user has `role: 'admin'` in the database |
| `verifyRider` | Checks that the authenticated user has `role: 'rider'` in the database |

### User Roles

| Role | Access Level |
|---|---|
| `user` | Customer — book parcels, track deliveries, manage payments |
| `rider` | Delivery Rider — accept deliveries, update parcel status |
| `admin` | Administrator — full system access and management |

---

## Team

| Name | Responsibility |
|---|---|
| Md. Alif Hossain  | Authentication & Delivery Operations |
| Hasan Mahmud  | Access Control & System Administration |
| Md. Rahidul Islam |  Parcel Management & Rider Operations |
| Fuadur Rahman Sojib | Payment & Tracking Systems |

---

> GoParcel — Smart Parcel Delivery Management Web Application
> Developed as a Backend-Focused Capstone Project
