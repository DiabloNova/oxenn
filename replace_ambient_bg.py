import sys
import os

files_to_update = [
    "src/app/[locale]/pricing/page.tsx",
    "src/app/[locale]/login/page.tsx",
    "src/app/[locale]/register/page.tsx",
    "src/app/[locale]/forgot-password/page.tsx",
    "src/app/[locale]/verify-email/page.tsx",
    "src/app/[locale]/page.tsx",
]

for filepath in files_to_update:
    if not os.path.exists(filepath):
        continue

    with open(filepath, 'r') as f:
        content = f.read()

    # Add import if missing
    import_statement = 'import { AmbientSpheres } from "@/components/backgrounds/AmbientSpheres";\n'
    if 'import { AmbientSpheres }' not in content:
        # Find first import or first line to insert
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if line.startswith('import '):
                lines.insert(i, import_statement.strip())
                break
        else:
            lines.insert(0, import_statement.strip())
        content = '\n'.join(lines)

    # Simple replacement of specific background patterns
    # We will look for <div className="ambient-bg...</div>
    import re
    # We want to replace <div className="ambient-bg fixed inset-0 -z-10">\s*<div className="ambient-orb orb-1" />\s*<div className="ambient-orb orb-2" />\s*</div> with <AmbientSpheres />
    content = re.sub(
        r'<div className="ambient-bg[^>]*>\s*<div className="ambient-orb orb-1"[^>]*>.*?</div>\s*</div>',
        '<AmbientSpheres />',
        content,
        flags=re.DOTALL
    )
    content = re.sub(
        r'<div className="ambient-bg[^>]*>\s*<div className="ambient-orb orb-1"[^>]*/>\s*<div className="ambient-orb orb-2"[^>]*/>\s*</div>',
        '<AmbientSpheres />',
        content,
        flags=re.DOTALL
    )

    # Fix the sed I ran before if it messed up pricing
    content = content.replace('<AmbientSpheres />\n      <div className="hidden">\n        <div className="ambient-orb orb-1" />\n        <div className="ambient-orb orb-2" />\n      </div>', '<AmbientSpheres />')

    # Also handle some page.tsx hardcoded bg meshes:
    # e.g. <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">...</div>
    # we can do manual merge diffs for page.tsx later if too complex

    with open(filepath, 'w') as f:
        f.write(content)
