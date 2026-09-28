import os
import re

filepath = "src/app/[locale]/docs/[slug]/page.tsx"

if os.path.exists(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Update line-heights dynamically based on `isFa` for Persian
    # The current code uses hardcoded classes like `leading-relaxed`
    content = content.replace('className="list-none flex items-start gap-2.5 text-[13px] text-slate-300 leading-relaxed my-2.5 ps-2"',
                              'className={`list-none flex items-start gap-2.5 text-[13px] text-slate-300 my-2.5 ps-2 ${isFa ? "leading-[1.9]" : "leading-relaxed"}`}')

    content = content.replace('className="text-[13px] sm:text-sm text-slate-300 leading-relaxed my-3.5 text-justify"',
                              'className={`text-[13px] sm:text-sm text-slate-300 my-3.5 text-justify ${isFa ? "leading-[1.9]" : "leading-relaxed"}`}')

    with open(filepath, 'w') as f:
        f.write(content)
