# travelItinerary Planner

An intelligent travel planning web application that generates personalized trip itineraries based on user preferences such as destination, budget, number of travelers, and mode of transportation.

---

## 🚀 Features

- 🔐 User Authentication (Sign Up / Login)
- ✈️ Plan Custom Trips
- 📍 Choose Source & Destination
- 💰 Budget-Based Recommendations
- 👨‍👩‍👧‍👦 Supports Group Travel Planning
- 🚗 Multiple Transport Modes (Car, Train, Flight, etc.)
- 🌦️ Weather-Based Suggestions
- 👕 Clothing & Accessories Recommendations
- 📌 Popular Tourist Spots & Hotspots
- 🤖 AI-Powered Itinerary Generation

---

## 🧠 How It Works

1. User signs up / logs into the platform  
2. Chooses:
   - Pre-planned trip OR
   - Custom trip  
3. Inputs:
   - Name  
   - Number of people  
   - Source & destination  
   - Budget  
   - Mode of transport  
4. System processes:
   - Current weather data  
   - Travel preferences  
   - Budget constraints  
5. Generates:
   - Day-wise itinerary  
   - Travel plan  
   - Packing suggestions  
   - Must-visit places  

---

## 🏗️ Tech Stack

**Frontend:**
~ React.js
~ Tailwind CSS

**Backend:**
~ Node.js with Express.js

**APIs Used:**
~ Gemini API
~ Weather API
~ Maps API

**Database:**
~ MongoDB / Firebase

---

## 📂 Project Structure

```
travelItinerary/
│── client/
│── server/
│── public/
│── src/
│── .env
│── .gitignore
│── package.json
│── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```
git clone https://github.com/utkarshcs18/travelItinerary.git
cd travelItinerary
```

### 2️⃣ Install Dependencies

```
npm install
```

### 3️⃣ Setup Environment Variables

Create a `.env` file:

```
PORT=4000
MONGODB_URI=Your_MongoDB_Address
CLIENT_ORIGIN=http://localhost/5173,http://localhost/8000,...
JWT_ACCESS_SECRET=Your_JWT_ACCESS_SECRET_KEY
JWT_REFRESH_SECRET=Your_JWT_REFRESH_SECRET_KEY
GOOGLE_GEMINI_API_KEY=Your_Gemini_API
GEMINI_MODEL=gemini-flash-latest
LOG_LEVEL=info


```

### 4️⃣ Run the Project

```
npm start
```

App runs at: soon....

---

## 🧪 Future Enhancements

- 📱 Mobile App
- 🧾 Booking Integration
- 👨🏻 Guide Integration

---

## 🤝 Contributing

1. Fork the repo  
2. Create a branch  
3. Commit changes  
4. Open a PR  

---

## 💡 Inspiration

This project was inspired by the common struggle travelers face while planning trips — juggling between multiple apps for weather, bookings, maps, and recommendations. By integrating everything into one AI-powered platform, we aim to create a seamless and intelligent travel experience.
