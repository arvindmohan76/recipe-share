#!/bin/bash

# Recipe Hub - Quick Restore Script
# This script helps restore the application from backup

echo "🍳 Recipe Hub - Quick Restore Script"
echo "===================================="

# Check if backup exists
if [ ! -d "backups" ]; then
    echo "❌ No backups directory found!"
    exit 1
fi

# List available backups
echo "📁 Available backups:"
ls -la backups/

# Get latest backup
LATEST_BACKUP=$(ls -t backups/ | head -n 1)
echo "📦 Latest backup: $LATEST_BACKUP"

# Restore function
restore_from_backup() {
    local backup_dir=$1
    echo "🔄 Restoring from $backup_dir..."
    
    # Create restore point of current state
    if [ -d "src" ]; then
        echo "💾 Creating restore point of current state..."
        mkdir -p "restore_points"
        cp -r . "restore_points/pre-restore-$(date +%Y%m%d-%H%M%S)/"
    fi
    
    # Restore files (excluding node_modules and backups)
    echo "📋 Restoring application files..."
    rsync -av --exclude='node_modules' --exclude='backups' --exclude='restore_points' "$backup_dir/" ./
    
    echo "✅ Restore completed!"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Run: npm install"
    echo "2. Configure .env file with your credentials"
    echo "3. Set up Supabase project and run migrations"
    echo "4. Run: npm run dev"
    echo ""
    echo "📖 See RESTORE_INSTRUCTIONS.md for detailed setup"
}

# Interactive restore
read -p "🤔 Do you want to restore from the latest backup? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    restore_from_backup "backups/$LATEST_BACKUP"
else
    echo "📋 Available backups:"
    select backup in backups/*/; do
        if [ -n "$backup" ]; then
            restore_from_backup "$backup"
            break
        else
            echo "❌ Invalid selection"
        fi
    done
fi