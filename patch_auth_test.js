const fs = require('fs');
let file = fs.readFileSync('tests/unit/authorization-lifecycle.test.ts', 'utf8');

// The incorrect dummy hash value that broke the test
const incorrectHash = 'uXyW15jCUKG2P/G1T8vM9g==:tB8W3D93G8/w5bJ13jXq2R+D25J+0N5zJ3V6P1K6F8tZ4F1N2T3Q7V8W4R5B2M9X/A6C4Z1P7N0X+R3E2B8M9g==';
const correctHash = '5X942op26r/rCdLWgb3HfA==:6nwvtKsXerwaU9lugHy4cE6FoYTBrqg0BWn/tg9aiRXradK2OPsdpRNRtMbQV1qFeL+ZEIcm/ZsoKeazAD2EvA==';

file = file.replace(incorrectHash, correctHash);
fs.writeFileSync('tests/unit/authorization-lifecycle.test.ts', file);
