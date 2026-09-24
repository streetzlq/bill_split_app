# Bill Splitter App

Free iOS bill splitter using React Native + Expo + Supabase. OCR-powered receipt scanning, iOS contact integration, and WhatsApp deep linking.

## Features

- 📸 **Capture Receipt** – Photo capture via Expo Camera
- 🔍 **Extract Amount** – Local ML Kit OCR (no cloud costs)
- 👥 **Select Friends** – iOS Contact Book integration
- 💰 **Auto Split** – Calculate per-person amount
- 📊 **Payment Tracking** – See paid vs. pending amounts
- 📤 **WhatsApp Share** – Deep link messages to each friend
- 💾 **Supabase Storage** – Free tier (5GB)

## Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Frontend | React Native + Expo | 100% free, iOS/Android |
| OCR | react-native-ml-kit | Local on-device, no API costs |
| Backend | Supabase | 500MB storage, auth optional |
| Storage | Supabase Storage | 5GB free tier |
| Navigation | React Navigation | Standard, lightweight |

## Quick Start

### 1. Clone & Install

```bash
cd bill-splitter
npm install
```

### 2. Setup Supabase

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy `Project URL` and `Anon Key`
3. Create `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxxxx
```

### 3. Create Database Tables

In Supabase SQL Editor, run:

```sql
-- Splits table
CREATE TABLE splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_image_url TEXT,
  uploader_phone TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  split_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment status tracking
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

### 4. Enable Storage Public Access

Supabase Dashboard → Storage → Policies → Add policy:
- **Target roles:** anon
- **Permissions:** SELECT, INSERT
- **Match:** `auth.uid() IS NOT NULL` (or leave empty for public uploads)

### 5. Run App

```bash
npm start
# Scan QR with Expo Go on iPhone
```

## Folder Structure

```
bill-splitter/
├── App.tsx                 # Navigation root
├── screens/
│   ├── SplitScreen.tsx    # Capture → OCR → Select → Split
│   ├── HistoryScreen.tsx  # View all past splits
│   └── StatusScreen.tsx   # Payment status dashboard
├── lib/
│   └── supabase.ts        # Supabase client
├── app.json               # Expo config + permissions
├── .env                   # API keys (in .gitignore)
└── SETUP.md              # Detailed setup guide
```

## How It Works

### 1. Capture Receipt
- Tap "Take Photo" → Camera opens → Capture image
- Image stored in state (not uploaded yet)

### 2. Extract Amount
- ML Kit OCR scans image locally (no API calls)
- Regex finds `$X.XX` or decimal patterns
- User confirms/edits total amount

### 3. Select Friends
- Loads iOS contacts (with phone numbers)
- User picks 1+ friends
- Amount auto-splits: `total / (friends + you)`

### 4. Confirm Split
- Shows breakdown: name + amount for each
- User enters their phone number
- Uploads receipt image to Supabase Storage
- Creates `splits` record with metadata
- Creates `split_status` rows (one per friend)

### 5. Send Messages
- Opens WhatsApp via deep link: `https://wa.me/PHONE?text=MESSAGE`
- Message includes amount + receipt image link
- Each friend gets custom message

### 6. Track Payments
- **Status Screen** shows:
  - Pending vs. Paid count
  - Total amounts
  - List of all requests
- Tap row to toggle paid/pending
- Filter by your phone number

## Permissions

App requests (on first use):
- **Camera** – Capture receipt photos
- **Contacts** – Load phone numbers for friends
- **Storage** – Save receipt image

## Cost Breakdown

| Service | Tier | Cost |
|---------|------|------|
| Expo | Hobby | Free |
| Supabase | Free | Free (500MB/month) |
| ML Kit | On-device | Free |
| WhatsApp | API (optional) | ~$0.08/msg (not used here) |
| **Total** | | **Free** |

> Default uses WhatsApp URL scheme (free). For WhatsApp Business API, upgrade to Supabase paid + WhatsApp Business API ($10+/month).

## Limitations & Future

### Current
- ✅ Local OCR (no cloud fees)
- ✅ Free Supabase storage
- ✅ WhatsApp URL scheme (free, unlimited messages)
- ❌ No user auth (anyone can upload)
- ❌ Manual paid/pending toggle (no payment gateway)

### Roadmap
- [ ] Supabase Row Level Security (RLS) for user auth
- [ ] Stripe webhook to auto-mark paid
- [ ] Receipt image compression
- [ ] Expense categories
- [ ] Recurring splits
- [ ] PDF export

## Troubleshooting

### OCR returns empty
- Ensure image is well-lit, receipt text is clear
- Try a different angle or zoom

### WhatsApp doesn't open
- Check phone number format (must include country code: +1234567890)
- Confirm WhatsApp is installed on device

### Supabase upload fails
- Verify API keys in `.env`
- Check Storage bucket exists and is public
- See browser console for error details

### Expo Go won't run
- Clear cache: `expo prebuild --clean`
- Update Expo: `npm install -g expo-cli@latest`

## Environment Variables

```bash
# Required
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxxxxx

# Optional (for future Stripe integration)
# STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## References

- [Expo Camera Docs](https://docs.expo.dev/cameras/camera-v2/)
- [Expo Contacts](https://docs.expo.dev/versions/latest/sdk/contacts/)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [WhatsApp URL Scheme](https://faq.whatsapp.com/general/chats/how-to-use-click-to-chat/?lang=en)
- [React Navigation](https://reactnavigation.org/)

## License

MIT
