#!/bin/bash
echo "## 9. Freeze-list snapshot Server Action Signatures"
echo ""
echo '```typescript'
grep -A 2 -r "export async function" src/app/actions/auth.ts
echo '```'
