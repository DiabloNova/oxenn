import os
import re

auth_files = [
    "src/app/[locale]/login/page.tsx",
    "src/app/[locale]/register/page.tsx",
    "src/app/[locale]/forgot-password/page.tsx",
    "src/app/[locale]/verify-email/page.tsx",
    "src/app/[locale]/page.tsx",
    "src/app/[locale]/not-found.tsx"
]

for filepath in auth_files:
    if not os.path.exists(filepath):
        continue

    with open(filepath, 'r') as f:
        content = f.read()

    # Add import
    import_statement = 'import { AmbientSpheres } from "@/components/backgrounds/AmbientSpheres";\n'
    if 'import { AmbientSpheres }' not in content:
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if line.startswith('import '):
                lines.insert(i, import_statement.strip())
                break
        else:
            lines.insert(0, import_statement.strip())
        content = '\n'.join(lines)

    # For auth files, replace inline gradient divs:
    # <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--sky-blue-500)]/10 rounded-full blur-[120px] pointer-events-none -z-10" />
    # <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--orange-500)]/10 rounded-full blur-[120px] pointer-events-none -z-10" />
    # OR similar

    # Simple strategy: Find the container opening, and replace the children until the Main Container
    content = re.sub(
        r'{/\* Decorative Signature Gradients \*/}.*?{/\* Main Container \*/}',
        '{/* Decorative Signature Gradients */}\n      <AmbientSpheres />\n      {/* Main Container */}',
        content,
        flags=re.DOTALL
    )

    with open(filepath, 'w') as f:
        f.write(content)
