import re

with open('tests/unit/app/actions/account.test.ts', 'r') as f:
    content = f.read()

content = content.replace("expect(queryMock.mock.calls.some(call => typeof call[0] === 'string' && call[0].includes('UPDATE users SET deleted_at = NOW()'))).toBe(true);",
                          "expect(queryMock.mock.calls.some(call => typeof call[0] === 'string' && call[0].includes('UPDATE users SET deleted_at = NOW()'))).toBe(true);\n    expect(queryMock.mock.calls.some(call => typeof call[0] === 'string' && call[0].includes('INSERT INTO audit_records'))).toBe(true);")

with open('tests/unit/app/actions/account.test.ts', 'w') as f:
    f.write(content)
