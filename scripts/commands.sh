wrangler secrets-store secret create "acefd69d51d8446f9873c88efc6a47f3" --name TWILIO_ACCOUNT_SID --scopes workers
wrangler secrets-store secret create "acefd69d51d8446f9873c88efc6a47f3" --name TWILIO_AUTH_TOKEN --scopes workers
wrangler secrets-store secret create "acefd69d51d8446f9873c88efc6a47f3" --name SENDGRID_API_KEY --scopes workers
wrangler secrets-store secret create "acefd69d51d8446f9873c88efc6a47f3" --name JWT_GATEWAY_SECRET --scopes workers
wrangler secrets-store secret create "acefd69d51d8446f9873c88efc6a47f3" --name JWT_AUTH_SECRET --scopes workers

wrangler d1 execute 'pos-db-global' --file='./migrations/001_users_schema.sql'
wrangler d1 execute 'pos-db-global' --file='./migrations/002_seed_users_data.sql'
