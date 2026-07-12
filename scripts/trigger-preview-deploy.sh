#!/bin/sh -e

# Trigger a preview deploy for the PR tied to the current branch.
# Requires the GitHub CLI (`gh`) to be installed and authenticated.

PR_NUMBER="$(gh pr view --json number --jq .number 2>/dev/null || true)"
if [ -z "$PR_NUMBER" ]; then
  echo "No open pull request found for the current branch." >&2
  echo "Open a PR against main, or run the Preview deploy workflow from Actions." >&2
  exit 1
fi

gh workflow run preview-deploy.yml --ref main -f "pr_number=$PR_NUMBER"

echo "Triggered preview deploy for PR #$PR_NUMBER."
echo "Preview URL (once finished): https://mr-$PR_NUMBER.suro.clotet.dev"
echo "Track progress: gh run watch --workflow preview-deploy.yml"
