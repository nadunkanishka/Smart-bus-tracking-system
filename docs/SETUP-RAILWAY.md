# Set up the backend (Railway)

Railway runs the backend (the Node server in `backend/`) so the apps and websites can reach it from anywhere. You need the database first: [SETUP-MONGODB.md](SETUP-MONGODB.md).

```
phone apps and websites  ->  backend (Railway)  ->  MongoDB Atlas
```

## About cost

Railway's free plan is a **30-day trial with $5 of credit** (no card needed), then about $1 a month. A mostly idle backend uses roughly $1.50 to $3 a month of credit, so the trial covers about the first month, always on, with no sleeping. After that the backend stops when the credit runs out. Staying on needs the **Hobby plan ($5 a month, needs a card)**. The trial clock starts when you create the project, so create it when you are ready to test properly. Check **Usage** in Railway every few days.

## Before you start

You need:
- your Atlas connection string with the real password and `/smartbus` (see SETUP-MONGODB.md);
- a long random string for `JWT_SECRET` (about 40 letters and numbers; make it up; do not reuse a password);
- a strong password for the admin dashboard (`ADMIN_PASSWORD`);
- the repository on GitHub with the latest code on the `dev` branch.

## 1. Create the project

1. Go to **railway.com** and sign in with GitHub. Allow access to the repository.
2. **New Project -> Deploy from GitHub repo** -> pick `Smart-bus-tracking-system`.
3. On the project canvas, click the service box. Do not deploy yet if it shows a **Deploy** button or a staged-changes bar: the first build would use the wrong folder.

## 2. Point it at the backend folder

Click the service -> **Settings** -> **Source**:

- **Root Directory:** `/backend` (Railway then uses `backend/Dockerfile`)
- **Branch:** `dev` (the latest code is on `dev`, not `main`)

If Railway shows a **Staged changes** bar, click **Deploy** there to apply them.

## 3. Add the variables

Service -> **Variables** -> **New Variable** (or **Raw Editor** to paste several):

| Name | Value |
|---|---|
| `MONGODB_URI` | Your Atlas string |
| `JWT_SECRET` | Your long random string. **Keep it: the replay test needs the same value.** |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | A strong password you will remember |
| `CORS_ORIGIN` | Add this after the websites exist (step 6) |
| `REDIS_URL` | Optional (step 7) |
| `GPS_SMOOTHING` | Optional: `off` switches the GPS smoother off for comparison |

Do **not** add `PORT`: Railway sets it. Applying the variables redeploys the service.

**Set `ADMIN_PASSWORD` before the first start.** The admin account is created only once, the first time the backend starts with an empty database, from whatever `ADMIN_PASSWORD` is at that moment. Changing the variable later does not change an existing account. If the account was created with the wrong password, delete the document in Atlas's `admins` collection and redeploy (see SETUP-MONGODB.md).

## 4. Get the public address

Service -> **Settings** -> **Networking** -> **Generate Domain** (port `5000` if it asks). You get an address like:

```
https://smart-bus-tracking-system-production.up.railway.app
```

Write it down: it goes into the apps (SETUP-APKS.md) and the Netlify sites.

## 5. Check it works

Wait until **Deployments** shows the latest deployment as Active, then open `<address>/api/health`:

```
{"status":"ok","message":"Smart Bus Tracking API is running","mongo":"connected","cache":"memory", ...}
```

`mongo` must say `connected`. If it does not, open the deployment's logs and see the table at the end of SETUP-MONGODB.md. Then load the routes (SETUP-MONGODB.md, step 5) and check `<address>/api/routes`.

## 6. Connect the websites (Netlify) and lock down CORS

The admin dashboard and the passenger web app are static sites on Netlify (steps in [DEPLOYMENT.md](DEPLOYMENT.md), section 4). Each is built with the backend address:

- admin site: environment variable `REACT_APP_API_URL`
- passenger site: environment variable `EXPO_PUBLIC_API_URL`

A variable is baked into the build, so after changing it use **Deploys -> Trigger deploy -> Clear cache and deploy site**. Netlify must build the `dev` branch (Site configuration -> Build & deploy -> Branches).

Then in Railway add `CORS_ORIGIN` with both site addresses, comma separated, no spaces and no trailing slashes:

```
https://smartbusadmin.netlify.app,https://smartbuspassenger.netlify.app
```

Only those two websites may call the backend from a browser. The phone apps are not affected by CORS. A quick check from a terminal (replace the origin with an unknown one and the line should be missing):

```bash
curl -s -D - -o /dev/null -H "Origin: https://smartbusadmin.netlify.app" <address>/api/routes | grep -i access-control-allow-origin
```

## 7. Redis (optional)

Without `REDIS_URL` the backend keeps the latest position of each bus in memory. That is fine for one instance and the pilot, but the "Redis cache" claim in the report is then untested. To use real Redis: in the Railway project click **New -> Database -> Redis**, copy its connection URL, add it to the backend's variables as `REDIS_URL`, and redeploy. `/api/health` then says `"cache":"redis"`. Redis uses a little of the credit.

## 8. Test with a simulated bus

The replay simulator drives buses along a route and prints what a passenger receives. It signs driver tokens with the backend's secret, so it needs the same `JWT_SECRET` as Railway. Run it from your computer (the value stays in your own terminal):

Windows PowerShell:

```bash
cd backend
$env:JWT_SECRET="<the same JWT_SECRET as Railway>"
npm run replay -- --url <address> --route <route id> --buses 2 --duration 60
```

Find the route id in `<address>/api/routes` (the `routeId` of Route 138; it is not always `RT-001`). The summary should say `drivers: 2` and show a latency figure. Add `--noise 15` to add GPS error and see the smoother work. Details: [EVALUATION.md](EVALUATION.md).

## Day to day

- **Logs:** service -> **Deployments** -> a deployment -> logs.
- **Redeploy:** the three-dot menu on a deployment -> **Redeploy**. A push to `dev` redeploys on its own.
- **Change a setting:** edit the variable; Railway redeploys.
- **Back up the data** before and after each pilot day (SETUP-MONGODB.md).

## If something goes wrong

| Problem | Likely cause and fix |
|---|---|
| Build fails or the service crashes | Open the deployment logs. Check Root Directory is `/backend` and Branch is `dev`. |
| `/api/health` says `mongo` not connected | Atlas Network Access, password characters or the missing `/smartbus` (SETUP-MONGODB.md). |
| Cannot sign in to the admin dashboard | The admin was created with another password: delete the `admins` document in Atlas and redeploy. |
| The websites show no data or CORS errors | `CORS_ORIGIN` is missing or has a trailing slash or space; or the site was not rebuilt after setting the API address. |
| Live activity chart says "Waiting for the backend" | Railway has not redeployed the latest `dev`; redeploy. |
| It stopped working after about a month | The trial credit ran out. Check Usage; upgrade to Hobby or export your data. |
