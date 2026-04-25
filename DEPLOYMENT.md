# Deploying CureConnect to Vercel (Step-by-Step)

To run this project on Vercel, we will use a **Unified Deployment** strategy. This means both your React frontend and Node.js backend will run on the same Vercel URL, making it easier to manage and avoiding CORS issues.

## 1. Project Configuration (Already Prepared)
I have already set up the following for you:
- **`api/index.js`**: Created at the root to bridge Vercel Serverless Functions to your Express server.
- **`vercel.json`**: Updated to handle the build process for the frontend and routing for the backend.
- **`AuthContext.jsx`**: Optimized to automatically use correctly mapped API paths in production.

## 2. Deploying via GitHub (Recommended)

### Step A: Push changes to GitHub
Ensure you have committed and pushed the latest changes (including the new `api/` folder and updated `vercel.json`).

### Step B: Connect to Vercel
1. Go to [Vercel](https://vercel.com/new).
2. Import your GitHub repository.
3. **Project Settings**:
   - **Framework Preset**: Other (it will detect Vite automatically via the build command).
   - **Root Directory**: `./` (leave as default).
   - **Build Command**: `cd client && npm install && npm run build` (This is already in `vercel.json`).
   - **Output Directory**: `client/dist` (This is already in `vercel.json`).

### Step C: Environment Variables ⚠️
You **must** add these in the Vercel Dashboard (**Settings > Environment Variables**):

| Key | Value | Description |
| :--- | :--- | :--- |
| `MONGO_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `your_secret_key` | Any long random string for auth |
| `NODE_ENV` | `production` | Ensures the app runs in production mode |

## 3. Manual Deployment (Using Vercel CLI)
If you prefer the command line:

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` from the root directory.
3. Follow the prompts (use default settings).
4. Run `vercel --prod` for the final deployment.

## 4. Verification
Once deployed, your project will be live!
- **Frontend**: `https://your-project.vercel.app`
- **Backend API**: `https://your-project.vercel.app/api/health`

> [!TIP]
> Since we are using a unified deployment, you don't need to set `VITE_API_URL` unless you want to host the backend elsewhere. The app will automatically use the same domain for API calls.
