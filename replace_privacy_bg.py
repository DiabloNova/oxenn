import os
import re

filepath = "src/app/[locale]/privacy/page.tsx"

if os.path.exists(filepath):
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

    # replace inline background elements
    content = re.sub(
        r'{/\* Decorative elements \*/}\n\s*<div className="absolute top-1/4 right-1/4.*?pointer-events-none -z-10" />\n\s*<div className="absolute inset-0.*?pointer-events-none -z-10" />',
        '{/* Decorative elements */}\n        <AmbientSpheres />\n        <div className="absolute inset-0 grid-backdrop opacity-[0.25] pointer-events-none -z-10" />',
        content,
        flags=re.DOTALL
    )

    with open(filepath, 'w') as f:
        f.write(content)
