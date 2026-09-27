#!/bin/bash
echo "## 7. State surfaces matrix"
echo ""
echo "| Route | Skeleton | Empty | Error | File Refs |"
echo "|---|---|---|---|---|"
for file in $(find src/app/\[locale\]/ -name "page.tsx" | grep -v "api"); do
    route=$(dirname "$file" | sed 's|src/app/\[locale\]/||')
    if [ "$route" == "." ]; then route="/"; fi

    skeleton="No"
    empty="No"
    error="No"

    # check if the file or its direct component has these states
    if grep -iq "skeleton" "$file"; then skeleton="Yes"; fi
    if grep -iq "empty" "$file" || grep -iq "inbox" "$file" || grep -iq "no matches" "$file"; then empty="Partial"; fi
    if grep -iq "error" "$file" || grep -iq "alertcircle" "$file"; then error="Yes"; fi

    echo "| $route | $skeleton | $empty | $error | \`$file\` |"
done
