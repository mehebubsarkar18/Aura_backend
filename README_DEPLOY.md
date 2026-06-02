# Deployment Guide for AuraFit

This project is prepared for deployment using **Docker**. This allows you to run the application on any platform that supports containers (DigitalOcean, AWS, Render, Railway, etc.).

## 1. Local Production Test (Single Deployment)
To test the combined build locally:
1. Make sure you have Docker installed.
2. Create a `.env` file in the root directory and add your `MONGO_URI` and `JWT_SECRET`.
3. Run:
   ```bash
   docker build -t aurafit -f Dockerfile.combined .
   docker run -p 5000:5000 --env-file .env aurafit
   ```
4. Access the entire app at `http://localhost:5000`.

## 2. Deploying to Cloud Platforms (e.g., Render, Railway)
1. Create a new **Web Service**.
2. Point it to your GitHub repo.
3. Set the **Dockerfile Path** to `Dockerfile.combined`.
4. Add your Environment Variables:
   - `MONGO_URI`: Your MongoDB Atlas string.
   - `JWT_SECRET`: Your secret key.
   - `NODE_ENV`: `production`
5. The platform will build both the frontend and backend together and serve them on a single URL.

### Option B: DigitalOcean / VPS
1. SSH into your server.
2. Install Docker and Docker Compose.
3. Clone the repo.
4. Run `docker-compose up -d`.

## 3. Database
For production, do not use a local MongoDB. Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free Tier available).
- Update your `MONGO_URI` to the connection string provided by Atlas.

## 4. Environment Variables Checklist
Ensure these are set in your production environment:
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: A long, random string for security.
- `VITE_API_BASE_URL`: The full URL of your deployed backend (e.g., `https://aurafit-api.onrender.com/api`).
