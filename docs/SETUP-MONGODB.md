# Set up the database (MongoDB Atlas, free)

The backend stores everything in MongoDB. For a deployed system use **MongoDB Atlas**, the managed MongoDB service. Its free tier (M0) is enough for the pilot. The apps never talk to the database directly: only the backend does (see [SETUP-RAILWAY.md](SETUP-RAILWAY.md)).

```
phone apps and websites  ->  backend (Railway)  ->  MongoDB Atlas
```

## 1. Create the cluster

1. Sign up at **mongodb.com/atlas** (no card needed for the free tier).
2. Create a project, then **Create a cluster**, choose **M0 Free**.
3. Pick a region close to Sri Lanka (Mumbai or Singapore) so the backend is quick to reach it.
4. Name it anything (for example `Cluster0`) and create it. It takes a minute or two.

## 2. Create a database user

1. **Database Access** (left menu) -> **Add new database user**.
2. Authentication: password. Choose a username and a password.
3. **Use letters and numbers only in the password.** Characters such as `@ : / #` must be URL-encoded inside the connection string and are the commonest reason for a failed connection.
4. Privileges: **Read and write to any database**.

## 3. Allow connections

**Network Access** -> **Add IP address** -> **Allow access from anywhere** (`0.0.0.0/0`).

Railway has no fixed address, so a single allowed address does not work. The database password is what protects it, so make it strong and never put it in the repository.

## 4. Get the connection string

1. **Database** -> your cluster -> **Connect** -> **Drivers**.
2. Copy the string. It looks like:

```
mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/
```

3. Put your real password in place of `<password>`, and **add the database name** `smartbus` after the host:

```
mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/smartbus?retryWrites=true&w=majority
```

This is the value of `MONGODB_URI`. Atlas also shows sample Node code next to the string. Ignore that code: the backend has its own connection code and only needs the string.

## 5. Load the Colombo routes

The database starts empty. From your own computer, run the seed once against Atlas. It loads the 25 Colombo routes with road lines and stops (Route 138, Pettah to Homagama, is the pilot route).

Windows PowerShell:

```bash
cd backend
$env:MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/smartbus"
npm run seed
```

macOS or Linux:

```bash
cd backend
MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/smartbus" npm run seed
```

It finishes with `Seeded 25 of 25 route(s).` To load only one route: `npm run seed -- 138`. It is safe to repeat; it updates the same routes.

Check it: open `<your backend address>/api/routes` in a browser. You should see a long list, not `[]`.

## 6. Look at the data

**Database -> Browse Collections** shows the collections: `routes`, `buses`, `drivers`, `admins`, `passengers`, `gpslogs`, `trips`, `etalogs`, `segmentlogs`. Descriptions are in [DATABASE.md](DATABASE.md).

## Backups (the free tier has none)

M0 does not back up. Export the collections before and after every pilot day:

```bash
mongoexport --uri "<your connection string>" --collection etalogs --type csv --fields routeId,tripId,busId,stopIndex,predictedAt,predictedArrival,actualArrival,horizonSec,errorSec,baselineArrival,baselineErrorSec --out eta-errors.csv
mongoexport --uri "<your connection string>" --collection gpslogs --out gpslogs.json
mongoexport --uri "<your connection string>" --collection trips --out trips.json
```

(`mongoexport` comes with the MongoDB Database Tools from mongodb.com/try/download/database-tools.)

## Limits and housekeeping

- **512 MB** of storage. GPS logs expire by themselves after 14 days, which keeps the database small.
- If you ever need to reset the admin login (the admin account is created only once, from `ADMIN_PASSWORD` at the first start): delete the single document in the `admins` collection, then restart the backend. It creates a new admin from the current variables.
- A paid tier (M10 and up) adds automatic backups. Move to it when the system is ready for real use; nothing in the code changes, only the connection string.

## If the backend says the database is not connected

| Cause | Fix |
|---|---|
| Network Access does not allow the backend | Add `0.0.0.0/0` (step 3) |
| Special character in the password | Use letters and numbers, or URL-encode it |
| No database name in the string | Add `/smartbus` after the host |
| Wrong user or password | Check Database Access; reset the password if unsure |
