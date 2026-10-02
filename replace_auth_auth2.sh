cat << 'INNER_EOF' > /tmp/auth_auth2.diff
<<<<<<< SEARCH
  const rlError = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
      const c = TenantContextManager.getDbClient();
      if (!c) throw new Error("Failed to get DB client in system context");
      try {
          await enforceRateLimit(c, 'login', `login:${email.toLowerCase().trim()}`, 10, 15 * 60 * 1000);
          return null;
      } catch (err: any) {
          if (err.message === "TooManyRequests") return "TooManyRequests";
          throw err;
      }
  });
=======
  const normalizedEmail = email.toLowerCase().trim();

  const rlError = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
      const c = TenantContextManager.getDbClient();
      if (!c) throw new Error("Failed to get DB client in system context");
      try {
          await enforceRateLimit(c, 'login', `login:${normalizedEmail}`, 10, 15 * 60 * 1000);
          return null;
      } catch (err: any) {
          if (err.message === "TooManyRequests") return "TooManyRequests";
          throw err;
      }
  });
>>>>>>> REPLACE
<<<<<<< SEARCH
    const { rows: userRows } = await client.query("SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL", [email]);
=======
    const { rows: userRows } = await client.query("SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL", [normalizedEmail]);
>>>>>>> REPLACE
INNER_EOF
