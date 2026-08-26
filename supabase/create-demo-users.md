# Creating demo users

`auth.users` rows must be created through Supabase Auth (not a plain SQL
insert) so passwords are hashed correctly. Once created, the
`handle_new_user()` trigger automatically creates a matching `profiles`
row with the role and mine_id you pass in.

## Option A — Supabase Dashboard (fastest for a handful of users)

Go to **Authentication → Users → Add user** for each of these, and set
**User metadata** (raw_user_meta_data) as JSON:

| Email | Password | Metadata JSON |
|---|---|---|
| admin@coalgov.in | password | `{"name": "Admin Kumar", "role": "ADMIN"}` |
| corporate@coalgov.in | password | `{"name": "Priya Sharma", "role": "CORPORATE_MANAGEMENT"}` |
| manager@coalgov.in | password | `{"name": "Rajesh Verma", "role": "MINE_MANAGER", "mine_id": "<Mine A's uuid>"}` |
| inspector@coalgov.in | password | `{"name": "Arun Singh", "role": "INSPECTOR"}` |
| authority@coalgov.in | password | `{"name": "Meera Patel", "role": "REGULATORY_AUTHORITY"}` |

Get Mine A's uuid by running `select id, name from mines;` in the SQL editor
after running the seed script.

## Option B — Script it with the Admin API

Run this once with your service role key (never expose this key to the browser):

```js
// scripts/create-demo-users.mjs
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data: mines } = await supabase.from("mines").select("id, name");
const mineA = mines.find((m) => m.name === "Mine A")?.id;

const demoUsers = [
  { email: "admin@coalgov.in", name: "Admin Kumar", role: "ADMIN" },
  { email: "corporate@coalgov.in", name: "Priya Sharma", role: "CORPORATE_MANAGEMENT" },
  { email: "manager@coalgov.in", name: "Rajesh Verma", role: "MINE_MANAGER", mine_id: mineA },
  { email: "inspector@coalgov.in", name: "Arun Singh", role: "INSPECTOR" },
  { email: "authority@coalgov.in", name: "Meera Patel", role: "REGULATORY_AUTHORITY" },
];

for (const u of demoUsers) {
  const { error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: "password",
    email_confirm: true,
    user_metadata: { name: u.name, role: u.role, mine_id: u.mine_id },
  });
  if (error) console.error(u.email, error.message);
  else console.log("created", u.email);
}
```

Run with: `node scripts/create-demo-users.mjs`
