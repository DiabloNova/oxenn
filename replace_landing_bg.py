import os
import re

filepath = "src/app/[locale]/page.tsx"

if os.path.exists(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find the hero gradients and replace
    content = re.sub(
        r'{/\* Sky Blue / Orange Signature Gradients \*/}.*?<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">',
        '{/* Sky Blue / Orange Signature Gradients */}\n        <AmbientSpheres />\n        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">',
        content,
        flags=re.DOTALL
    )

    with open(filepath, 'w') as f:
        f.write(content)
