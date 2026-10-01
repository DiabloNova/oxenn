async function run() {
   const crypto = require('crypto');

   // Redefining simplified version of hash function to run in js without ts compiler
   const N = 32768; const r = 8; const p = 1; const KEY_LEN = 64; const SALT_LEN = 16;
   const salt = crypto.randomBytes(SALT_LEN).toString("base64");
   crypto.scrypt("Password123", salt, KEY_LEN, { N, r, p, maxmem: 128 * 1024 * 1024 }, (err, derivedKey) => {
       const hashStr = `${salt}:${derivedKey.toString("base64")}`;
       console.log(hashStr);
   });
}
run();
