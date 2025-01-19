#!/bin/bash

# Create .drop directory if it doesn't exist
mkdir -p .drop

# Development tool configurations
mv .husky .drop/ 2>/dev/null
mv __mocks__ .drop/ 2>/dev/null
mv tests .drop/ 2>/dev/null
mv .commitlintrc.js .drop/ 2>/dev/null
mv .eslintrc.js .drop/ 2>/dev/null
mv .eslintignore .drop/ 2>/dev/null
mv .prettierrc.js .drop/ 2>/dev/null
mv .prettierignore .drop/ 2>/dev/null
mv .stylelintrc.js .drop/ 2>/dev/null
mv .editorconfig .drop/ 2>/dev/null
mv codecov.yml .drop/ 2>/dev/null
mv vitest.config.ts .drop/ 2>/dev/null
mv vitest.server.config.ts .drop/ 2>/dev/null
mv .releaserc.js .drop/ 2>/dev/null
mv .remarkrc.js .drop/ 2>/dev/null
mv .remarkrc.mdx.js .drop/ 2>/dev/null
mv .bunfig.toml .drop/ 2>/dev/null
mv renovate.json .drop/ 2>/dev/null
mv .i18nrc.js .drop/ 2>/dev/null
mv .seorc.cjs .drop/ 2>/dev/null
mv .changelogrc.js .drop/ 2>/dev/null

# CI/CD and deployment configurations
mv netlify.toml .drop/ 2>/dev/null
mv vercel.json .drop/ 2>/dev/null
mv docker-compose .drop/ 2>/dev/null
mv Dockerfile .drop/ 2>/dev/null
mv Dockerfile.database .drop/ 2>/dev/null
mv .dockerignore .drop/ 2>/dev/null

# Contribution related
mv contributing .drop/ 2>/dev/null
mv changelog .drop/ 2>/dev/null
mv CONTRIBUTING.md .drop/ 2>/dev/null
mv CODE_OF_CONDUCT.md .drop/ 2>/dev/null

# Move development scripts (except essential ones)
mkdir -p .drop/scripts
for file in scripts/*; do
  # Skip the current script and essential build scripts
  if [[ "$file" != "scripts/move-to-drop.sh" && "$file" != "scripts/build"* ]]; then
    mv "$file" .drop/scripts/ 2>/dev/null
  fi
done

echo "Files have been moved to .drop directory"
echo "Note: Some moves might show errors if files don't exist, this is normal"
