#!/bin/bash

# Setup cron job for automated blog posting
# This script configures a cron job to run the auto_blog_poster_with_approval.py script daily

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PYTHON_SCRIPT="$REPO_ROOT/src/scheduler/auto_blog_poster_with_approval.py"
PYTHON_PATH="/usr/bin/python3"

# Create cron job entry
CRON_JOB="0 0 * * * cd $SCRIPT_DIR && $PYTHON_PATH $PYTHON_SCRIPT >> /var/log/tenantguard_blog_scheduler.log 2>&1"

# Check if cron job already exists
(crontab -l 2>/dev/null | grep -F "$PYTHON_SCRIPT") && {
    echo "Cron job already exists. Updating..."
    # Remove old entry
    crontab -l 2>/dev/null | grep -v "$PYTHON_SCRIPT" | crontab -
}

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "Cron job installed successfully!"
echo "The automated blog posting scheduler will run daily at midnight (00:00)."
echo "Post cadence is controlled by the max_hours_between_posts setting in the blog schedule."
echo "Logs will be written to: /var/log/tenantguard_blog_scheduler.log"
echo ""
echo "To view current cron jobs, run: crontab -l"
echo "To remove the cron job, run: crontab -e and delete the line containing 'auto_blog_poster_with_approval.py'"
