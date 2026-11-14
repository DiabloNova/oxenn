// Test-only key; production must configure EMAIL_OUTBOX_ENCRYPTION_KEY explicitly.
process.env.EMAIL_OUTBOX_ENCRYPTION_KEY ??= "a".repeat(64);
