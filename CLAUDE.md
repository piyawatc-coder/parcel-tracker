# CLAUDE.md

บริบทโปรเจกต์นี้สำหรับ Claude Code — อ่านไฟล์นี้ก่อนเริ่มทำงานทุกครั้ง

## ภาพรวมโปรเจกต์

**ทะเบียนคุมพัสดุ (Parcel / Disbursement Tracker)** — ระบบจดเลขพัสดุและติดตามการเบิกจ่ายเงินภายในองค์กร
Next.js 14 (App Router) + TypeScript + Tailwind + Supabase JS client
แอปเดียว ไม่มี backend แยก — เรียก Supabase ตรงจาก client (`"use client"` components ทั้งหมด) และคุมสิทธิ์ด้วย Row Level Security

UI เป็นภาษาไทยทั้งหมด (label, ปุ่ม, ข้อความ error) — เขียนต่อให้เป็นภาษาไทยตามเดิม

## Stack

- Next.js 14 App Router, React 18, TypeScript (strict mode)
- Tailwind CSS — สี/ฟอนต์ custom อยู่ใน `tailwind.config.ts` (ink, paper, line, brand, brandSoft, warn / IBM Plex Sans Thai, IBM Plex Mono)
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`) — ใช้ `createClient()` จาก `src/lib/supabase/client.ts` เท่านั้น (browser client, ไม่มี server-side auth flow)

## โครงสร้างไฟล์

```
src/
├── app/
│   ├── layout.tsx        # โครง layout + nav (รายการทั้งหมด / จดรายการใหม่ / จัดการข้อมูลหลัก)
│   ├── page.tsx           # หน้ารายการทั้งหมด → <AssetTable />
│   ├── new/page.tsx        # หน้าเพิ่มรายการ → <AssetForm />
│   ├── edit/[id]/page.tsx  # หน้าแก้ไขรายการ → <AssetForm assetId={params.id} />
│   ├── master/page.tsx     # หน้าจัดการ master data แบบ tab (4 ตาราง)
│   └── globals.css
├── components/
│   ├── AssetTable.tsx        # ตาราง SELECT จาก asset_view
│   ├── AssetForm.tsx         # ฟอร์ม insert/update ตาราง asset (ใช้ทั้งหน้า new และ edit)
│   └── MasterDataManager.tsx # component กลาง CRUD ใช้ซ้ำกับ 4 master table
└── lib/
    ├── database.types.ts   # TS types มือเขียน (ไม่ได้ generate จาก Supabase CLI)
    └── supabase/client.ts
supabase/
└── schema.sql   # source of truth ของ schema — ต้องอัปเดตไฟล์นี้ทุกครั้งที่แก้ DB
```

## Database schema (สถานะล่าสุด)

ตาราง master (โครงสร้างเหมือนกันหมด: `<x>_id` uuid PK, `<x>_name`, `description`, `create_date`, `edit_date`, `is_active`, `is_delete`):
- `asset_type` — ประเภทพัสดุ
- `company` — บริษัททำเบิกจ่าย
- `payee` — เบิกเงินให้ใคร
- `return_status` — สถานะการคืนเงิน (ค่าตั้งต้น: "เข้ากองกลาง", "จ่ายบริษัท")

ตารางหลัก `asset`: asset_no, supreme_court_no, activity_name, description, asset_type_id (FK), total_amount, company_id (FK), payee_id (FK), return_status_id (FK), disbursement_date, transferred_date, create_date, edit_date

View `asset_view` = `asset` join ชื่อจาก master ทั้ง 4 ตัว (asset_type_name, company_name, payee_name, return_status_name) — frontend SELECT จาก view นี้เสมอ ไม่ query ตาราง asset ตรงๆ

**RLS: เปิด public เต็ม (`using (true) with check (true)`) ทุกตาราง โดยตั้งใจ** — โปรเจกต์นี้ยังไม่มีระบบ login ใช้งานภายในทีมที่ไว้ใจกันเท่านั้น **อย่าเปลี่ยนกลับเป็น `auth.role() = 'authenticated'` เอง** ถ้าจะเพิ่ม auth ต้องคุยกับ user ก่อนเพราะกระทบทั้งแอป

**Soft delete convention**: ตาราง master ไม่ hard delete — ใช้ `is_delete = true` (ซ่อนจากลิสต์) และ `is_active` (toggle เปิด/ปิดใช้งาน, กรองใน dropdown ตอนเพิ่ม/แก้ไข asset ด้วย `.eq("is_active", true)`) เหตุผล: กัน foreign key เพี้ยนถ้ามี asset เก่าอ้างอิง id อยู่

## Gotcha ที่เจอมาแล้ว (สำคัญ กันเสียเวลาซ้ำ)

1. **แก้ view ที่มีอยู่แล้วให้เพิ่มคอลัมน์กลาง/ท้าย**: ห้ามใช้ `create or replace view` ถ้า column order เปลี่ยน (Postgres error 42P16 "cannot change name of view column") — ต้อง `drop view if exists ...;` ก่อนแล้วค่อย `create view ...` ใหม่เสมอ
2. **Migration SQL ต้อง idempotent เสมอ**: ใช้ `if not exists` ทุกจุดที่ทำได้ (`create table if not exists`, `add column if not exists`) ส่วน `create trigger` และ `create policy` ไม่รองรับ `if not exists` โดยตรง — ต้องครอบด้วย `do $$ begin if not exists (...) then ... end if; end $$;` เพื่อกัน error ตอนรันซ้ำ
3. Supabase SQL Editor รันทั้ง script เป็น transaction เดียว — ถ้า statement ไหน error กลางทาง ทุก statement ก่อนหน้าจะ rollback หมดด้วย (แม้จะดูเหมือนรันผ่านไปแล้วจาก log บางส่วน) ให้ระวังเวลาเขียน migration ยาวๆ
4. **อัปเดต `supabase/schema.sql` ทุกครั้งที่แก้ schema** ให้ตรงกับสถานะจริงบน Supabase เพราะเป็นไฟล์ที่คนติดตั้งใหม่ในอนาคตจะรัน — schema.sql ควรสร้าง DB จากศูนย์แล้วได้ผลลัพธ์เดียวกับที่ production เป็นอยู่ตอนนี้เป๊ะๆ

## Convention การเขียนโค้ด

- ทุก component ที่ใช้ hooks/event handler ต้องมี `"use client"` บรรทัดแรก
- Tailwind class ซ้ำๆ ให้ประกาศเป็น const ในไฟล์ (ดู `inputClass`, `labelClass` ใน AssetForm.tsx / MasterDataManager.tsx) แทนพิมพ์ซ้ำ
- ปุ่ม/action ที่ทำลายข้อมูล (ลบ) ต้อง `window.confirm(...)` ก่อนเสมอ
- Error จาก Supabase ให้ setError แล้วโชว์ในกล่อง `border-warn/30 bg-warn/5 text-warn` ใต้ฟอร์ม — อย่าใช้ `alert()`
- ตั้งชื่อ label/ข้อความ UI เป็นภาษาไทยล้วน สั้น กระชับ ตรงกับ field ใน schema

## สิ่งที่ทำเสร็จแล้ว

- ✅ ดูรายการ (`/`), เพิ่มรายการ (`/new`), แก้ไข/ลบรายการ (`/edit/[id]`)
- ✅ RLS เปิด public (ไม่ต้อง login)
- ✅ ตาราง `return_status` + คอลัมน์ `description` ทุกตาราง
- ✅ หน้าจัดการ master data (`/master`) — CRUD ครบ 4 ตาราง พร้อม soft delete

## สิ่งที่ยังไม่ได้ทำ (ทำต่อได้เลย)

- ⬜ **Filter/Search** — ค้นหารายการตามเลขพัสดุ, ช่วงวันที่, สถานะโอนเงิน/สถานะคืนเงิน
- ⬜ **Export Excel/PDF** — ออกรายงานรายการเบิกจ่าย
- ⬜ **หน้า Login** — เผื่ออนาคตอยากเปิดกว้างขึ้นแล้วต้องการความปลอดภัยเพิ่ม (ตอนนี้ตั้งใจไม่มี ดู RLS convention ด้านบน)
