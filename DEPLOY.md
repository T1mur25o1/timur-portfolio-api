# Deploying (free)

The app now stores its content in MongoDB instead of a local file, so it has
no persistent-disk requirement — it can run on Render's free web service.
Free tier trade-off: the service spins down after ~15 minutes of no traffic
and takes 30-50 seconds to wake up on the next visit. Fine for a portfolio
site that isn't getting constant traffic.

## 1. Create a free MongoDB Atlas cluster

1. Sign up at https://www.mongodb.com/cloud/atlas/register (free, no card
   required for the M0 tier).
2. Create a new project, then **Build a Database → M0 Free**.
3. When prompted, create a database user (username + password — save these).
4. Under **Network Access**, add IP address `0.0.0.0/0` (allow from
   anywhere) — Render's IPs aren't static, so this is the simplest option
   for a small project.
5. Go to **Database → Connect → Drivers**, copy the connection string. It
   looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
   ```
   Replace `<username>`/`<password>` with the database user you created.

## 2. Push the project to GitHub

```powershell
cd D:\claude\ClaudeFiles\Projects\FullStack\timur-portfolio-api
git init
git add .
git commit -m "Initial commit"
```

Create a new empty repo at https://github.com/new (don't initialize it with
a README), then:

```powershell
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

## 3. Create the Render web service

1. Go to https://render.com and sign in with GitHub.
2. **New → Web Service** → connect your repo.
3. Settings:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. Add environment variables (Render's **Environment** tab):

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | the connection string from step 1 |
   | `MONGODB_DB` | `portfolio` |
   | `JWT_SECRET` | any long random string |
   | `ADMIN_PASSWORD_HASH` | run `node scripts/hash-password.js "your-password"` locally and paste the output |

   (Render sets `PORT` automatically — the app already reads
   `process.env.PORT`, so leave it unset.)

5. Click **Create Web Service**. Render builds and deploys automatically,
   and redeploys on every push to `main`.

## 4. Check it

Render gives you a URL like `https://your-app.onrender.com`. Visit `/` for
the public site and `/admin.html` to sign in and confirm edits save and
show up.

## Custom domain (optional)

Render's **Settings → Custom Domains** lets you add your own domain and
shows you the DNS record to add.

## If free cold-starts bother you

The only way to remove the ~30-50s wake-up delay on Render's free tier is a
paid instance (~$7/mo) — or move to a host with an always-on free tier if
one exists at the time you're reading this (these change often, worth a
quick check). Everything else about this app (MongoDB storage, env vars)
stays the same either way.
