# Bill Splitter App - Setup Guide

## Prerequisites
- Node.js 18+
- Xcode (for iOS testing)
- Expo Go app installed on iPhone

## Step 1: Initialize Expo Project
```bash
npx create-expo-app bill-splitter
cd bill-splitter
```

## Step 2: Install Dependencies
```bash
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install expo-camera expo-contacts expo-image-picker expo-linking expo-image
npm install react-native-ml-kit
npm install @supabase/supabase-js
npm install react-native-toast-toast
npm install --save-dev typescript @types/react-native
```

## Step 3: Setup Supabase
1. Create free project at [supabase.com](https://supabase.com)
2. Create table `splits`:
```sql
CREATE TABLE splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_image_url TEXT,
  uploader_phone TEXT,
  total_amount DECIMAL(10, 2),
  split_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

3. Create table `split_status`:
```sql
CREATE TABLE split_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id UUID REFERENCES splits(id),
  recipient_phone TEXT,
  amount_owed DECIMAL(10, 2),
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Step 4: Create .env File
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Step 5: Camera Permissions (app.json)
```json
{
  "expo": {
    "plugins": [
      ["expo-camera", { "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera" }],
      ["expo-contacts", { "contactsPermission": "Allow $(PRODUCT_NAME) to access your contacts" }]
    ]
  }
}
```

## Step 6: Run
```bash
npx expo start
# Scan QR with Expo Go (iOS)
```
