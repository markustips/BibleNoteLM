#!/bin/bash

# Firebase Setup Script for BibleNoteLM
# This script helps you set up and deploy to Firebase

set -e  # Exit on error

echo "========================================="
echo "BibleNoteLM Firebase Setup Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Firebase CLI is not installed!${NC}"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

echo -e "${GREEN}✓ Firebase CLI found${NC}"

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}You are not logged in to Firebase${NC}"
    echo "Logging in..."
    firebase login
fi

echo -e "${GREEN}✓ Logged in to Firebase${NC}"

# List available projects
echo ""
echo "Available Firebase Projects:"
firebase projects:list

# Ask for project ID
echo ""
read -p "Enter your Firebase Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Project ID cannot be empty${NC}"
    exit 1
fi

# Use the project
firebase use "$PROJECT_ID"

echo -e "${GREEN}✓ Using project: $PROJECT_ID${NC}"

# Check if .env file exists
if [ ! -f "functions/.env" ]; then
    echo ""
    echo -e "${YELLOW}Creating functions/.env file...${NC}"
    cat > functions/.env << EOF
# Stripe Configuration (for subscriptions)
# Get these from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_ID_BASIC=price_your_basic_price_id_here
STRIPE_PRICE_ID_PREMIUM=price_your_premium_price_id_here

# App Configuration
APP_NAME=BibleNoteLM
SUPPORT_EMAIL=support@biblenotelm.com
EOF
    echo -e "${GREEN}✓ Created functions/.env${NC}"
    echo -e "${YELLOW}⚠ Please update functions/.env with your actual Stripe keys${NC}"
else
    echo -e "${GREEN}✓ functions/.env already exists${NC}"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
cd functions
npm install
cd ..

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Build TypeScript
echo ""
echo "Building TypeScript functions..."
cd functions
npm run build
cd ..

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Ask if user wants to deploy
echo ""
read -p "Do you want to deploy to Firebase now? (y/n): " DEPLOY

if [ "$DEPLOY" = "y" ] || [ "$DEPLOY" = "Y" ]; then
    echo ""
    echo "Deploying to Firebase..."
    firebase deploy

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}=========================================${NC}"
        echo -e "${GREEN}✓ Deployment successful!${NC}"
        echo -e "${GREEN}=========================================${NC}"
        echo ""
        echo "Your Cloud Functions are now live at:"
        echo "https://us-central1-$PROJECT_ID.cloudfunctions.net/"
        echo ""
        echo "Next steps:"
        echo "1. Configure your mobile app with Firebase"
        echo "2. Update Stripe webhook URL in Stripe Dashboard"
        echo "3. Test your functions in the Firebase Console"
        echo ""
    else
        echo -e "${RED}✗ Deployment failed${NC}"
        exit 1
    fi
else
    echo ""
    echo "Deployment skipped."
    echo "You can deploy later with: firebase deploy"
fi

echo ""
echo -e "${GREEN}Setup complete!${NC}"
