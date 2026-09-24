# Getting Started - Bill Splitter App

## What You Got

A complete, **100% free** iOS bill splitter with:

✅ Receipt camera capture  
✅ Local ML Kit OCR (no cloud fees)  
✅ iOS Contact Book integration  
✅ Automatic bill split calculation  
✅ Supabase backend (5GB free storage)  
✅ WhatsApp deep linking  
✅ Payment status tracking  

**Total cost:** $0 (free tier only)

---

## Installation (5 minutes)

### 1. Install Node Dependencies
```bash
cd bill-splitter
npm install
```

### 2. Create Supabase Project
- Go to **https://supabase.com** (free tier)
- Click "New Project"
- Copy your **Project URL** and **Anon Key**

### 3. Create .env File
```bash
# Copy template
cp .env.example .env

# Edit .env with your Supabase credentials
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### 4. Create Database Tables
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy-paste this SQL:

```sql
-- Create splits table
CREATE TABLE splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_image_url TEXT,
  uploader_phone TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  split_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create split_status table
CREATE TABLE split_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id UUID NOT NULL REFERENCES splits(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  amount_owed DECIMAL(10, 2) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);
```

4. Click **Run** (green button)

### 5. Setup Storage Permissions
1. Supabase Dashboard → **Storage**
2. Click **receipts** bucket
3. Go to **Policies**
4. Click **New Policy** → **For full customization**
5. Paste:
```sql
CREATE POLICY "Public Read/Write" ON storage.objects
  FOR ALL USING (bucket_id = 'receipts')
  WITH CHECK (bucket_id = 'receipts');
```

### 6. Run the App
```bash
npm start
```

- A QR code appears in terminal
- Open **Expo Go** app on iPhone
- Scan the QR code
- App launches on your phone ✅

---

## File Structure (What Was Generated)

```
bill-splitter/
├── App.tsx                    ← Main navigation
├── screens/
│   ├── SplitScreen.tsx       ← Camera → OCR → Select friends → Send
│   ├── HistoryScreen.tsx     ← View past splits
│   └── StatusScreen.tsx      ← Track paid/pending
├── lib/
│   └── supabase.ts           ← Database connection
├── .env                       ← YOUR API KEYS (create this)
├── .env.example              ← Template
├── package.json              ← Dependencies
├── app.json                  ← Expo config
├── SETUP.md                  ← Detailed setup
├── README.md                 ← Features & docs
├── PROJECT_STRUCTURE.md      ← Full file guide
└── GETTING_STARTED.md        ← This file
```

---

## How to Use the App

### Tab 1: Split Bill
1. **📷 Take Photo** → Tap to open camera
2. **🔍 Extract Text** → ML Kit OCR reads receipt
3. **👥 Pick from Contacts** → Select friends to split with
4. **Enter Your Phone** → Type your number (+1234567890)
5. **✅ Create Split & Send** → Uploads to Supabase + opens WhatsApp

### Tab 2: History
- See all past bill splits
- View receipt images & breakdown
- Pull to refresh

### Tab 3: Status
- See **Pending** vs **Paid** payments
- Filter by your phone number
- Tap any row to toggle paid/pending

---

## Customization Ideas

### 1. Change App Icon
- Replace `icon.png` with your image (1024x1024)
- File location: create `assets/icon.png`

### 2. Change Color Theme
- Edit `App.tsx`, line 26:
  ```tsx
  tabBarActiveTintColor: '#007AFF',  // Change to your color
  ```

### 3. Add Your Logo
- Edit `app.json` splash image
- Create `assets/splash.png` (1242x2688)

### 4. Add User Authentication
- Use Supabase Auth (built-in)
- See README.md "Roadmap" section

### 5. Add Stripe for Payments
- Integrate Stripe payment widget
- Auto-mark as paid when payment received

---

## Troubleshooting

### "Module not found: react-native-ml-kit"
```bash
npm install react-native-ml-kit
npx expo prebuild --clean
```

### Camera won't open
- Ensure you granted camera permission
- On iOS: Settings → Bill Splitter → Camera → ON

### WhatsApp won't open
- Phone number format must include country code: `+1234567890`
- Ensure WhatsApp is installed on device

### Supabase connection fails
- Check `.env` has correct URL & key
- Verify Supabase project is active (not paused)
- Check network connection

### "Receipt image URL is empty"
- Ensure `receipts` bucket exists in Supabase Storage
- Check bucket permissions allow public upload

---

## Cost Analysis

| Component | Cost | Notes |
|-----------|------|-------|
| Expo | Free | Unlimited apps |
| React Native | Free | Open source |
| Supabase Database | Free | Unlimited rows |
| Supabase Storage | Free | 5GB/month |
| WhatsApp API | Free | URL scheme (no API calls) |
| **Total** | **$0** | Forever free tier |

> Costs increase only if you:
> - Add premium services (auth, realtime, edge functions)
> - Exceed 5GB storage/month
> - Upgrade to WhatsApp Business API

---

## Next Steps

1. ✅ Complete installation (above)
2. 🧪 Test on iPhone with Expo Go
3. 📝 Add your app icon & name
4. 🚀 Build for App Store (optional, requires $99/year Apple Developer account)

---

## Learning Resources

- **Expo Docs:** https://docs.expo.dev
- **React Native:** https://reactnative.dev
- **Supabase:** https://supabase.com/docs
- **OCR (ML Kit):** https://firebase.google.com/docs/ml-kit/recognize-text
- **WhatsApp Deep Linking:** https://faq.whatsapp.com/general/chats/how-to-use-click-to-chat/

---

## Questions?

- Check **README.md** for full docs
- See **SETUP.md** for detailed steps
- Read **PROJECT_STRUCTURE.md** for code guide

**Built with:** React Native + Expo + Supabase + ML Kit ✨
