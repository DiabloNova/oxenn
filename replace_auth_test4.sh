cat << 'INNER_EOF' > /tmp/test4.diff
<<<<<<< SEARCH
    // 10 successes
    for (let i = 0; i < 10; i++) {
        const res = await loginAction("trip@example.com", "Password123");
        expect((res as any).error).toBeUndefined();
    }
    // 11th should fail
    const res = await loginAction("trip@example.com", "Password123") as any;
    expect(res.error).toBe("TooManyRequests");
  });
=======
    // 10 successes
    for (let i = 0; i < 10; i++) {
        const res = await loginAction("trip@example.com", "Password123");
        expect((res as any).error).toBeUndefined();
    }
    // 11th should fail
    await expect(loginAction("trip@example.com", "Password123")).rejects.toThrow("TooManyRequests");
  });
>>>>>>> REPLACE
INNER_EOF
