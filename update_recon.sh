#!/bin/bash
cat verification/fe/FE-000-recon.md > temp_recon.md

sed -i '/## 7. State Surfaces Matrix/,$d' temp_recon.md

echo "## 7. State Surfaces Matrix" >> temp_recon.md
echo "Matrix mapping across Skeleton, Empty, and Error states." >> temp_recon.md
echo "" >> temp_recon.md
bash get_routes.sh >> temp_recon.md

echo "" >> temp_recon.md
echo "## 8. A11y Baseline" >> temp_recon.md
echo "- **Focus Styles**: Usage of \`focus:\` (39 hits) is low compared to surface area, and \`focus-visible:\` only appears 2 times (\`components/ui/button.tsx\`)." >> temp_recon.md
echo "- **ARIA**: Moderate ARIA usage (\`aria-\` 46 hits), but limited form labelling. \`login/page.tsx\` uses \`label={strings.emailLabel}\` implying internal component labeling, but missing standard HTML accessibility wrapping." >> temp_recon.md
echo "- **Contrast**: \`var(--text-muted)\` (\`#94a3b8\`) on \`var(--background)\` (\`#0f172a\`) falls to 4.54:1 which is AA but near boundaries; \`light\` theme contrast requires strict auditing." >> temp_recon.md
echo "" >> temp_recon.md

echo "## 9. Freeze-list snapshot" >> temp_recon.md
echo "- **globals.css**: Heavy custom utility styling, \`@custom-variant dark\`, extensive \`@theme\` overrides, complex custom gradients." >> temp_recon.md
echo "- **Dashboard layout.tsx**: Contains root modular sidebar/topbar structures, heavily tied to \`ThemeProvider\`, with complex \`helpOpen\` overlay state logic." >> temp_recon.md
echo "- **AuthProvider.tsx**: Fully handles local storage \`auth_session_user\` mapping to a pseudo server session validation logic. Fail closed implementation clears local storage if server fails." >> temp_recon.md
echo "- **ProtectedRoute.tsx**: Strictly enforces user navigation based on role check in \`useAuth\`." >> temp_recon.md
echo "- **Auth Routes**: \`[locale]/login/page.tsx\`, etc., all mock API fetching but trigger \`loginAction(email)\` explicitly from \`src/app/actions/auth.ts\` hitting postgres database directly." >> temp_recon.md
echo "" >> temp_recon.md
bash get_signatures.sh >> temp_recon.md
echo "" >> temp_recon.md

echo "## 10. Doc-vs-code delta" >> temp_recon.md
echo "- **CircleCI**: \`README.md\` explicitly claims \`.circleci/config.yml\` provides quality gates. Neither the folder nor the file exists." >> temp_recon.md
echo "- **Argon2id**: \`SPEC.md\` claims \"For password-based authentication, Argon2id is the intended password hashing mechanism.\" However, \`src/app/actions/auth.ts\` simply matches plaintext passwords or assumes SSO without any hashing mechanics implemented for local login yet." >> temp_recon.md
echo "" >> temp_recon.md

echo "## Report: Collision List vs Freeze Files" >> temp_recon.md
echo "### Collisions" >> temp_recon.md
echo "- **Tailwind Configuration**: Embedded tailwind arbitrary classes heavily collide with the \`@theme\` configuration in \`globals.css\`." >> temp_recon.md
echo "- **UI Components**: \`FloatingSidebar.tsx\` vs \`DashboardSidebar.tsx\` represent overlapping navigation solutions." >> temp_recon.md
echo "- **Authentication**: Mock \`fetch\` calls inside components collide with direct database manipulation in \`auth.ts\`." >> temp_recon.md
echo "" >> temp_recon.md

echo "## Recommendations & Insights" >> temp_recon.md
echo "- **Top 10 Drift**: Missing CI setup; fragmented component folders; excessive physical spacing over logical spacing; missing skeleton components; missing error boundaries; inline CSS variables overriding tailwind; plaintext auth logic; redundant navigation components; lack of focus-visible styles; FOUC in theme hydration." >> temp_recon.md
echo "- **Top 10 Reuse**: Consolidate \`FloatingSidebar.tsx\` and \`DashboardSidebar.tsx\`; extract \`ui/button.tsx\` to \`src/\`; unify skeleton structures; migrate arbitrary \`bg-[var]\` to Tailwind V4 theme extensions; move \`AlertCircle\` empty/error blocks to reusable wrappers; standardize form fields; abstract \`matchMedia\` for reduced motion to a custom hook; consolidate SVGs into a single asset folder; simplify gradient rings in globals.css to tailwind arbitrary variants." >> temp_recon.md
echo "- **Architecture**: Move away from \`bg-[var(--key)]\` towards proper Tailwind 4 \`@theme\` mappings (e.g. \`colors: { background: \"var(--background)\" }\`). Ensure logical spacing utilities are implemented globally." >> temp_recon.md

mv temp_recon.md verification/fe/FE-000-recon.md
