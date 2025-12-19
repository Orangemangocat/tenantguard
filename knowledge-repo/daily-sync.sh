#!/bin/bash

# Daily Knowledge Sync Script for TenantGuard
# This script automates the git commit and push process for daily knowledge syncs

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}TenantGuard Daily Knowledge Sync${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    echo "Please run this script from the knowledge-repo directory"
    exit 1
fi

# Check for uncommitted changes
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}No changes to commit${NC}"
    echo "The knowledge repository is already up to date"
    exit 0
fi

# Show status
echo -e "${BLUE}Current status:${NC}"
git status --short
echo ""

# Ask for confirmation
echo -e "${YELLOW}Do you want to commit these changes? (y/n)${NC}"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${RED}Sync cancelled${NC}"
    exit 0
fi

# Get current date
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_TIME=$(date +%H:%M:%S)

# Default commit message
DEFAULT_MESSAGE="Daily Manus knowledge sync - $CURRENT_DATE"

# Ask for custom commit message
echo ""
echo -e "${YELLOW}Enter custom commit message (or press Enter for default):${NC}"
echo -e "${BLUE}Default: $DEFAULT_MESSAGE${NC}"
read -r custom_message

if [ -z "$custom_message" ]; then
    COMMIT_MESSAGE="$DEFAULT_MESSAGE"
else
    COMMIT_MESSAGE="$custom_message"
fi

echo ""
echo -e "${BLUE}Staging changes...${NC}"
git add .

echo -e "${BLUE}Committing changes...${NC}"
git commit -m "$COMMIT_MESSAGE"

echo ""
echo -e "${BLUE}Pushing to GitHub...${NC}"
if git push origin main; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ Sync completed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}Commit:${NC} $COMMIT_MESSAGE"
    echo -e "${BLUE}Date:${NC} $CURRENT_DATE at $CURRENT_TIME"
    echo ""
    echo -e "${BLUE}Latest commits:${NC}"
    git log --oneline -3
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}❌ Push failed${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Possible solutions:${NC}"
    echo "1. Check your internet connection"
    echo "2. Pull latest changes: git pull origin main"
    echo "3. Resolve any merge conflicts"
    echo "4. Try pushing again: git push origin main"
    exit 1
fi

# Check if checkpoint was created today
CHECKPOINT_FILE="knowledge/CHECKPOINTS/CHECKPOINT_$CURRENT_DATE.md"
if [ -f "$CHECKPOINT_FILE" ]; then
    echo -e "${GREEN}✅ Today's checkpoint exists: $CHECKPOINT_FILE${NC}"
else
    echo -e "${YELLOW}⚠️  No checkpoint found for today${NC}"
    echo "Consider creating: $CHECKPOINT_FILE"
fi

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Verify changes on GitHub: https://github.com/Orangemangocat/tenantguard"
echo "2. Review the checkpoint file if created"
echo "3. Notify team of any important updates"
echo ""
