# CRUD audit and test report

Date: 12 Nov 2026. Scope: every record the system creates, reads, updates or deletes, through the REST API, the admin dashboard and the passenger app.

The fixes live on two branches that are not merged into `dev` yet: `database` (backend, tests, API doc, CI) and `ui` (admin dashboard and passenger app).

## 1. Result in one table

| Record | Create | Read | Update | Delete | Before | Now |
|---|---|---|---|---|---|---|
| Driver | yes | list + one | yes | yes | CRUD worked, with gaps below | complete |
| Bus | yes | list + one | yes | yes | CRUD worked, with gaps below | complete |
| Route | yes | list + one | yes | yes | CRUD worked, with gaps below | complete |
| Passenger | register | own profile; admin list | own name and phone, own password | own account; admin delete | register and login only | complete |
| Administrator | admin adds | list + one | name, role, password reset, own password | yes, with guards | none (one account from `.env`) | complete |
| Trip, GPS log, ETA log, segment log | system | summaries via analytics | n/a | not provided | unchanged | see section 5 |

## 2. What was wrong, and the fix

| # | Problem found in the audit | Fix |
|---|---|---|
| 1 | Updates saved the whole request body, so a caller could rewrite `driverId`, `busId`, `routeId` or `_id` | Updates accept only a list of editable fields |
| 2 | A duplicate licence, registration or username returned a raw MongoDB `E11000` message with status 400 | Returns 409 with a readable message, for example "That license number (L-1) is already in use." |
| 3 | Deleting a driver left buses pointing at them | The buses' `assignedDriver` is cleared. The response reports `unassignedBuses` |
| 4 | Deleting a bus left routes pointing at it | The routes' `assignedBus` is cleared. The response reports `unassignedRoutes` |
| 5 | Renaming a bus registration orphaned its route (the route stores `NB-4712 (BUS-002)` as text) | The route text is rewritten to the new registration |
| 6 | A bus could be assigned a driver that does not exist, and a route a bus that does not exist | Both are rejected with 400 |
| 7 | `capacity` or `mileage` of 0 was silently ignored on update (`if (data.capacity)`) | Zero is validated like any other value (capacity must be at least 1) |
| 8 | No way to read one driver, bus or route | `GET /:id` added for each |
| 9 | Passengers could not edit, change the password of or delete their account. Admins could not see or remove them | `/api/passengers/me` (GET, PUT, DELETE), `/me/password`, and admin `GET /api/passengers`, `DELETE /api/passengers/:id`. Deleting your own account asks for the password again |
| 10 | No admin account management | `/api/admins` (list, create, read, update, delete) and `/api/admins/me/password`. An admin cannot delete themself and the last admin cannot be deleted |
| 11 | **Admin UI bug:** editing a driver or route always sent `status: "Active"`, so "On Leave" or "Inactive" was lost on every edit | The status is kept, and the driver form now has a status field |
| 12 | Driver login looked up the route with a regex built from the registration and a substring match, so bus `NB-1` was given the route of `NB-12`, and regex characters in a registration were not escaped | Matches the bracketed bus id or the exact registration, with escaping |
| 13 | The admin and passenger apps had no screens for items 9 and 10 | Admin: Passengers page and Administrators page. Passenger app: edit details, change password, delete account on the Profile tab |

## 3. Tests

### Automated

| Suite | Tests | Result |
|---|---|---|
| `backend/test/crud.test.js` (new). Starts the real server on a throwaway MongoDB database and calls the API | 8 | 8 pass |
| `backend/test/engine.test.js` (existing, ETA engine and auth helpers) | 15 | 15 pass |
| `apps/admin-dashboard` Jest | 1 | 1 pass |
| Admin production build with `CI=true` (lint warnings count as errors) | – | passes |
| Passenger app web export (compile check) | – | passes |

The 8 CRUD tests cover, for each record: create, read one, list, update (including a body that tries to change the id), delete, delete again (404), invalid input (400), duplicate (409), and the access rules (no token is 401, wrong role is 403). Extra tests cover the relations (items 3 to 6) and the route lookup (item 12).

To check the tests detect the gaps, they were run against the old route files: 0 of 7 passed. On the new code all pass. The 8th test (item 12) was added afterwards and not run against the old code.

The tests skip, rather than fail, when MongoDB is unreachable. CI now starts a MongoDB service so they run there. Locally: `cd backend && npm test`.

### Manual, in the browser, against a throwaway backend and database (now removed)

| Flow | Result |
|---|---|
| Admin: add a driver with status On Leave | saved, status shown |
| Admin: edit only the phone | phone changed, status stayed On Leave (item 11) |
| Admin: add an administrator with a 5-character password | error shown in the dialog, the input kept |
| Admin: add with a valid password, then delete | added and listed, then removed after the confirm dialog |
| Admin: own row | Delete button disabled, labelled "You cannot delete the account you are signed in with" |
| Admin: Passengers page | lists the passenger with the edited name and phone |
| Passenger app: edit name and phone | saved and shown on the profile at once |
| Passenger app: change password, mismatched confirmation | blocked with "The new passwords do not match." |
| Passenger app: change password, valid | "Password changed." |
| Passenger app: delete account, wrong password | "Password is incorrect." and the account stays |
| Passenger app: delete account, correct password | account removed and the app returned to the login screen |
| Reload after sign-in | the remembered session was restored |

### Not tested

- Driver and passenger apps on a real phone, and the driver app screens (only the sign-in screen was viewed).
- Creating, editing and deleting buses and routes through the dashboard forms. These use the same code path as drivers and were covered by the API tests, but the forms were not clicked through.
- The route map editor.
- Concurrent edits.

## 4. API summary

The full list is in [API.md](API.md). New or changed:

| Method and path | Who | Purpose |
|---|---|---|
| `GET /api/drivers/:id`, `/api/buses/:id`, `/api/routes/:id` | admin (routes: public) | Read one |
| `GET`, `PUT`, `DELETE /api/passengers/me` | passenger | Own account |
| `PUT /api/passengers/me/password` | passenger | Change password |
| `GET /api/passengers`, `DELETE /api/passengers/:id` | admin | List and remove |
| `GET`, `POST /api/admins`, `GET`, `PUT`, `DELETE /api/admins/:id` | admin | Manage administrators |
| `PUT /api/admins/me/password` | admin | Change own password |

## 5. Known limits (not changed)

| Limit | Why it matters | Suggested next step |
|---|---|---|
| No "forgot password" for passengers | The passenger login screen shows the link. Without email or SMS there is nothing to send a reset to | Decide the channel (email or SMS), or have the admin reset passwords |
| A deleted admin's token stays valid until it expires (12 h). A deleted passenger's token is refused by `/me` but still passes other checks (30 days) | The admin guard only checks the token, not the database | Look the account up on each admin request |
| Deleting a route or bus keeps the trip, GPS, segment and ETA logs | Keeps your evaluation data safe, but logs refer to ids that no longer exist | Leave as is until the evaluation is done. Add an export before any cleanup |
| A route stores its bus as text (`NB-4712 (BUS-002)`) rather than an id | Needed the rename and delete handling above. A bus can be assigned to several routes | Move to a real `busId` field later |
| A bus that is on duty keeps streaming after it is deleted or its route changes | Its token still works until the driver signs out | Disconnect the socket on delete |
| Lists are not paginated or searchable | Fine for a pilot fleet, slow for thousands of records | Add paging if the fleet grows |
| Admin list shows the "Admin" role as free text and has no permission levels | Every admin can do everything | Add roles only if the project needs them |
| The error text in the Add Administrator dialog is plain, not red | Cosmetic | Style with the existing alert colours |

## 6. Decisions to review

The passenger and admin account management goes beyond the approved proposal scope, so please check it fits. It was added because you asked for all CRUD to exist. It is easy to drop: it lives in `backend/routes/admins.js`, the account endpoints of `backend/routes/passengers.js`, the two admin pages and `AccountActions.js`.
