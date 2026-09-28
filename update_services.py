import os

filepath = "src/services/intelligence/index.ts"
if os.path.exists(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # The sentence is: "Latest GPT-4o benchmarks show a +12% increase in brand recommendation density for logistics services."
    # Let's replace it with a more generic product highlight.
    content = content.replace(
        "Latest GPT-4o benchmarks show a +12% increase in brand recommendation density for logistics services.",
        "System alerts detect shifts in brand recommendation density across specific service queries."
    )

    with open(filepath, 'w') as f:
        f.write(content)

    with open('verification/fe/FE-007-secondary.md', 'a') as f:
        f.write("- Removed fabricated metric (+12% increase) from src/services/intelligence/index.ts.\n")
