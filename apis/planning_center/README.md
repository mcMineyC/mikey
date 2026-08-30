# Planning Center API client

This folder contains a minimal Planning Center API client that supports Personal Access Tokens (PAT) via HTTP Basic Auth.

Environment variables supported:
- `PLANNING_CENTER_PAT` — single string in the form `client_id:secret` (recommended when using Docker secrets)
- `PLANNING_CENTER_CLIENT_ID` and `PLANNING_CENTER_CLIENT_SECRET` — alternative separate env vars
- `PLANNING_CENTER_USER_AGENT` — optional User-Agent header value

Quick usage:

```js
import { createClientFromEnv } from './planning_center/planning_center.js'
const client = createClientFromEnv();
const people = await client.get('/people/v2/people');
console.log(people);
```

Docker Compose (example using a secret file):

```yaml
services:
  app:
    build: .
    environment:
      - PLANNING_CENTER_PAT=/run/secrets/PLANNING_CENTER_PAT
    secrets:
      - PLANNING_CENTER_PAT

secrets:
  PLANNING_CENTER_PAT:
    file: ./secrets/planning_center_pat.txt
```

Put the literal `client_id:secret` text into `./secrets/planning_center_pat.txt` (ensure file permissions are restricted) and Docker Compose will mount it into `/run/secrets/PLANNING_CENTER_PAT` inside the container. The client will detect and use it automatically.

PAT creation and security
-------------------------

1. Visit your developer account at https://api.planningcenteronline.com/personal_access_tokens and create a new Personal Access Token. The site will provide you with a `client_id` and `secret` pair. Treat these like a password.
2. Combine them into a single string in the format `client_id:secret` and save that exact text into `./secrets/planning_center_pat.txt` on the host (this file should contain only the single line with the token pair).
3. Ensure the secrets file has restricted permissions so it is not readable by other users on the host (for example: `chmod 600 ./secrets/planning_center_pat.txt`).
4. Do NOT commit the secrets file to source control. Add `./secrets` or `./secrets/planning_center_pat.txt` to `.gitignore` if needed.
5. When running via Docker Compose the secret will be available inside the container at `/run/secrets/PLANNING_CENTER_PAT`. The `app` service in `docker-compose.yml` will load that value into the `PLANNING_CENTER_PAT` environment variable automatically on start.

If you prefer not to use Docker secrets you can set the `PLANNING_CENTER_CLIENT_ID` and `PLANNING_CENTER_CLIENT_SECRET` environment variables individually instead.

Example script
---------------

There's a small example that demonstrates fetching past (through yesterday) and upcoming service dates:

Run it locally (Node 18+):

```bash
node planning_center/examples/fetch_services.js
```

Or run inside the container after ensuring the PAT secret is available via Docker Compose.
