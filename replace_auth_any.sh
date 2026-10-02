cat << 'INNER_EOF' > /tmp/auth_any.diff
<<<<<<< SEARCH
async function enforceRateLimit(client: any, endpoint: string, bucketKey: string, maxAttempts: number, windowMs: number): Promise<void> {
=======
import { PoolClient } from "pg";

async function enforceRateLimit(client: PoolClient, endpoint: string, bucketKey: string, maxAttempts: number, windowMs: number): Promise<void> {
>>>>>>> REPLACE
INNER_EOF
