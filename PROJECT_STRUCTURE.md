# Project Structure & Generated Files

## Complete File Layout

```
bill-splitter/
│
├── App.tsx                           # Main navigation root with bottom tabs
│
├── screens/
│   ├── SplitScreen.tsx              # 4-step bill split flow (camera → OCR → contacts → finalize)
│   ├── HistoryScreen.tsx            # View all past bill splits
│   └── StatusScreen.tsx             # Payment status dashboard (paid vs. pending)
│
├── lib/
│   └── supabase.ts                  # Supabase client initialization
│
├── assets/                           # Placeholder for icons & splash (create manually)
│   ├── icon.png                     # App icon (1024x1024)
│   ├── splash.png                   # Splash screen
│   └── favicon.png                  # Web favicon
│
├── app.json                          # Expo config with camera/contacts plugins
├── package.json                      # Dependencies + scripts
├── tsconfig.json                     # TypeScript config
├── metro.config.js                   # React Native bundler config
│
├── .env                              # API keys (CREATE THIS - add to .gitignore)
├── .env.example                      # Template for .env
├── .gitignore                        # Git ignore rules
│
├── SETUP.md                          # Step-by-step setup guide
├── README.md                         # Feature overview & troubleshooting
└── PROJECT_STRUCTURE.md              # This file
```

## What Each File Does

### Core App (App.tsx)
- Sets up React Navigation with 3 bottom tabs
- Tab 1: Split (capture → OCR → select friends → send)
- Tab 2: History (view all past splits)
- Tab 3: Status (track paid/pending payments)

### Screens

**SplitScreen.tsx** (Main flow)
1. Camera permission → capture photo
2. ML Kit OCR → extract text + amount
3. Load iOS Contacts → select friends
4. Calculate split: `total / (friends + you)`
5. Enter your phone
6. Upload receipt to Supabase Storage
7. Create split + status records
8. Open WhatsApp for each friend

**HistoryScreen.tsx** (View past splits)
- Fetch all splits from `splits` table
- Show receipt image, amount, breakdown
- Pull-to-refresh
- Copy split details

**StatusScreen.tsx** (Track payments)
- Fetch all `split_status` records
- Filter by your phone number
- Show pending vs. paid stats
- Tap to toggle paid/pending
- Refresh from database

### Configuration

**app.json**
- Expo plugins for Camera & Contacts
- iOS bundle ID & info.plist permissions
- Splash screen & icon config
- WhatsApp scheme in LSApplicationQueriesSchemes

**package.json**
- Expo 50+
- React Native 0.73+
- All free dependencies:
  - expo-camera
  - expo-contacts
  - react-native-ml-kit (OCR)
  - @supabase/supabase-js
  - @react-navigation/native
  - @react-navigation/bottom-tabs

**tsconfig.json**
- Extends Expo's config
- Strict mode enabled
- JSX set to react-native

**metro.config.js**
- Uses Expo's default bundler config
- No custom transforms needed

### Environment

**.env** (Create after Supabase setup)
```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxxxxx
```

**.gitignore**
- Protects .env file
- Ignores node_modules, .expo, dist
- Ignores IDE files (.vscode, .idea)

### Docs

**SETUP.md**
- Prerequisites
- 6-step initialization
- Supabase SQL setup
- Permission config

**README.md**
- Features overview
- Tech stack table
- Quick start (5 min)
- Architecture walkthrough
- Cost analysis
- Troubleshooting guide

## Next Steps After File Generation

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Supabase Project
- Go to supabase.com
- New Project
- Copy URL & Anon Key

### 3. Create .env File
```bash
cp .env.example .env
# Edit .env with Supabase credentials
```

### 4. Create Database Tables
- Open Supabase SQL Editor
- Copy-paste SQL from SETUP.md

### 5. Create Assets Folder
```bash
mkdir assets
# Add icon.png (1024x1024) & splash.png (1242x2688)
```

### 6. Run App
```bash
npm start
# Scan QR with Expo Go on iPhone
```

## Database Schema

### splits table
```
id: UUID (primary key)
receipt_image_url: TEXT (Supabase Storage URL)
uploader_phone: TEXT (e.g., "+1234567890")
total_amount: DECIMAL(10, 2) (e.g., 45.50)
split_data: JSONB (array of {name, phone, amount})
created_at: TIMESTAMP (auto)
```

### split_status table
```
id: UUID (primary key)
split_id: UUID (foreign key → splits.id)
recipient_phone: TEXT (who owes)
amount_owed: DECIMAL(10, 2)
is_paid: BOOLEAN (default: false)
created_at: TIMESTAMP (auto)
```

## Free Tier Limits (Supabase)

| Resource | Limit | Renewal |
|----------|-------|---------|
| Database | Unlimited rows | N/A |
| Storage | 5 GB | Monthly |
| API Calls | Unlimited | N/A |
| Realtime | Limited | N/A |
| Auth | 100 free users | Monthly |

> For 100+ splits/month with ~10KB average receipt images, you'll use ~1GB/month (well under 5GB).

## Customization

### Change App Name
- Edit `app.json` → `name`
- Edit `app.json` → `slug`
- Rename `package.json` → `name`

### Change Icon Colors
- Edit `App.tsx` → `tabBarActiveTintColor` (currently `#007AFF` Apple blue)

### Add Firebase Crashlytics
```bash
npm install @react-native-firebase/app @react-native-firebase/crashlytics
# Update app.json with Firebase plugin
```

### Switch to Real Auth (RLS)
- Enable RLS in Supabase
- Add Supabase Auth signup/login screens
- Verify JWT in Supabase policies

## Deployment to App Store

1. **Generate EAS credentials:**
   ```bash
   npm install -g eas-cli
   eas login
   eas build --platform ios
   ```

2. **Submit to App Store:**
   ```bash
   eas submit --platform ios
   ```

3. **Requirements:**
   - Apple Developer Account ($99/year)
   - Privacy Policy URL (required)
   - Screenshots (5 per orientation)

## Support

- **Expo Docs:** https://docs.expo.dev
- **Supabase:** https://supabase.com/docs
- **React Navigation:** https://reactnavigation.org
- **WhatsApp URL:** https://faq.whatsapp.com/general/chats/how-to-use-click-to-chat/
