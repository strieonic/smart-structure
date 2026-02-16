# Smart Structure – Load & Disaster Analysis System

This project is a backend system built to analyze structural safety of buildings based on land conditions, wind data, seismic zone, and basic Vastu principles.

The goal of this project is to simulate how civil engineering load calculations and disaster risk evaluation can be integrated into a structured API system using Node.js and TypeScript.

---

## 🚀 What This Project Does

The system allows a user to:

1. Register and log in (JWT-based authentication)
2. Create a land survey (soil, slope, seismic zone, etc.)
3. Add building specifications
4. Add wind data
5. Run disaster analysis (earthquake, flood, cyclone logic)
6. Perform Vastu analysis
7. Generate a final combined report

All results are returned as structured JSON responses.

---

## 🛠 Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Zod Validation

---

## 🏗 Architecture Overview

The project follows a layered architecture:

- Controllers → handle HTTP requests
- Services → contain engineering logic
- Middleware → authentication, validation, error handling
- Prisma → database interaction

This separation helped me understand clean backend structuring.

---

## 📁 Folder Structure

src/
├── controllers/
├── services/
├── routes/
├── middleware/
├── validators/
├── config/
└── server.ts


---

## 📊 Engineering Logic Implemented

Some of the implemented calculations include:

- Dead Load & Live Load estimation
- Basic wind load logic (inspired by IS 875 concepts)
- Earthquake base shear formula structure
- Flood risk and plinth height suggestion
- Structural recommendation summaries
- Basic Vastu compliance checks

Note: This is a conceptual simulation system and not a replacement for real structural design software.

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

git clone <repo-url>
cd smart-structure


### 2. Install Dependencies

npm install


### 3. Configure Environment Variables

Create a `.env` file based on `.env.example` and set:

DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=


### 4. Setup Database

npm run prisma:generate
npm run prisma:migrate


### 5. Run Development Server

npm run dev


Server runs at:

http://localhost:5000


---

## 📌 API Base URL

http://localhost:5000/api/v1


Authentication is required for protected routes using:

Authorization: Bearer <token>


---

## 🎯 Why I Built This

I built this project to:

- Practice backend architecture design
- Understand how engineering logic can be structured programmatically
- Learn Prisma ORM and PostgreSQL integration
- Implement authentication and middleware properly

This project helped me improve my understanding of real-world backend systems.

---

## 🔮 Future Improvements

- Add real structural formula validation
- Improve wind modeling
- Add frontend dashboard
- Add PDF report generation
- Deploy full production version

---

## 📄 License

MIT
