# ทะเบียนคุมพัสดุ (Parcel / Disbursement Tracker)

Next.js 14 (App Router) + TypeScript + Tailwind + Supabase JS client
แอปเดียว ไม่มี backend แยก — เรียก Supabase ตรงจาก client และคุมสิทธิ์ด้วย Row Level Security

## โครงสร้างโปรเจกต์

```
parcel-tracker/
├── supabase/
│   └── schema.sql          # SQL สร้างตาราง + view + RLS policy
├── src/
│   ├── app/
│   │   ├── layout.tsx       # โครง layout + เมนู
│   │   ├── page.tsx         # หน้ารายการทั้งหมด
│   │   ├── new/page.tsx     # หน้าฟอร์มเพิ่มรายการ
│   │   └── globals.css
│   ├── components/
│   │   ├── AssetTable.tsx   # ตารางแสดงรายการ (SELECT จาก asset_view)
│   │   └── AssetForm.tsx    # ฟอร์มเพิ่มรายการ (INSERT ลง asset)
│   └── lib/
│       ├── database.types.ts
│       └── supabase/client.ts
└── .env.local.example
```

## ขั้นตอนติดตั้ง

### 1. สร้างโปรเจกต์ Supabase
ไปที่ https://supabase.com/dashboard สร้างโปรเจกต์ใหม่ (ฟรี tier พอสำหรับใช้งานภายใน)

### 2. รัน schema
เปิด **SQL Editor** ในโปรเจกต์ Supabase แล้ววางเนื้อหาไฟล์ `supabase/schema.sql` ทั้งหมด กด Run
จะได้ตาราง `asset`, `asset_type`, `company`, `payee` และ view `asset_view` พร้อม RLS

> ตาราง master (`asset_type`, `company`, `payee`) ต้อง insert ข้อมูลตั้งต้นเอง เช่น
> ```sql
> insert into company (company_name) values ('บริษัท เอ จำกัด'), ('บริษัท บี จำกัด');
> ```

### 3. เปิดใช้ Auth (แนะนำ)
เพราะ RLS policy ที่ตั้งไว้อนุญาตเฉพาะ `authenticated` user ให้เปิด Authentication > Providers
เลือกวิธี login ที่เหมาะกับทีม (Email/Password ง่ายสุดสำหรับใช้ภายใน) แล้วสร้าง user ให้คนในทีม
(ถ้าจะให้ทุกคนใช้แบบไม่ login ได้ ให้แก้ policy ใน schema.sql เป็น `using (true)` แทน — แต่ไม่แนะนำถ้าเป็นข้อมูลการเงิน)

### 4. ติดตั้งโปรเจกต์
```bash
cd parcel-tracker
npm install
cp .env.local.example .env.local
```
แก้ `.env.local` ใส่ค่า `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(หาได้จาก Supabase > Project Settings > API)

### 5. รันโปรเจกต์
```bash
npm run dev
```
เปิด http://localhost:3000

### 6. Deploy
Push ขึ้น GitHub แล้วเชื่อมกับ [Vercel](https://vercel.com) — ตั้งค่า Environment Variables
ตัวเดียวกับ `.env.local` ใน Vercel project settings ก็ deploy ได้ทันที

## สิ่งที่ยังไม่ได้ทำ (ทำต่อได้ตามต้องการ)
- **Auth UI**: ยังไม่มีหน้า login/logout — ต้องเพิ่มถ้าจะใช้ RLS แบบ authenticated จริง
- **แก้ไข/ลบรายการ**: ตอนนี้มีแค่ดูรายการ (`/`) กับเพิ่มรายการ (`/new`)
- **จัดการ master data**: หน้าเพิ่ม/แก้ ประเภทพัสดุ, บริษัท, ผู้รับเงิน (ตอนนี้ต้อง insert ผ่าน SQL Editor)
- **Filter/Search**: ค้นหาตามเลขพัสดุ, ช่วงวันที่, สถานะโอนเงิน
- **Export**: ออกรายงานเป็น Excel/PDF

ถ้าต้องการให้ทำส่วนไหนต่อ บอกได้เลย
