"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type MasterRow = {
  [key: string]: string | boolean | null | undefined;
  description: string | null;
  is_active: boolean;
  is_delete: boolean;
  create_date: string;
};

const inputClass =
  "w-full border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand";
const labelClass = "mb-1 block font-mono text-xs uppercase tracking-wide text-ink/60";

type Props = {
  tableName: "asset_type" | "company" | "payee" | "return_status";
  idField: string;
  nameField: string;
  nameLabel: string;
};

export default function MasterDataManager({ tableName, idField, nameField, nameLabel }: Props) {
  const supabase = createClient();

  const [rows, setRows] = useState<MasterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  async function loadRows() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("is_delete", false)
      .order("create_date", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setRows((data as MasterRow[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError(null);

    const { error } = await supabase.from(tableName).insert({
      [nameField]: newName.trim(),
      description: newDescription.trim() || null,
    });

    setAdding(false);

    if (error) {
      setError(error.message);
      return;
    }
    setNewName("");
    setNewDescription("");
    loadRows();
  }

  function startEdit(row: MasterRow) {
    setEditingId(row[idField] as string);
    setEditName((row[nameField] as string) ?? "");
    setEditDescription(row.description ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    setSavingEdit(true);
    setError(null);

    const { error } = await supabase
      .from(tableName)
      .update({
        [nameField]: editName.trim(),
        description: editDescription.trim() || null,
      })
      .eq(idField, id);

    setSavingEdit(false);

    if (error) {
      setError(error.message);
      return;
    }
    cancelEdit();
    loadRows();
  }

  async function toggleActive(row: MasterRow) {
    setError(null);
    const { error } = await supabase
      .from(tableName)
      .update({ is_active: !row.is_active })
      .eq(idField, row[idField] as string);

    if (error) {
      setError(error.message);
      return;
    }
    loadRows();
  }

  async function softDelete(row: MasterRow) {
    if (
      !window.confirm(
        `ยืนยันลบ "${row[nameField]}" ใช่หรือไม่? รายการที่เคยอ้างอิงอยู่แล้วจะไม่ถูกกระทบ แต่จะไม่แสดงในลิสต์นี้อีก`
      )
    ) {
      return;
    }
    setError(null);
    const { error } = await supabase
      .from(tableName)
      .update({ is_delete: true })
      .eq(idField, row[idField] as string);

    if (error) {
      setError(error.message);
      return;
    }
    loadRows();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-6 flex flex-wrap items-end gap-3 border border-line bg-white p-4">
        <div className="flex-1 min-w-[180px]">
          <label className={labelClass}>{nameLabel} *</label>
          <input
            required
            className={inputClass}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className={labelClass}>คำอธิบาย</label>
          <input
            className={inputClass}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={adding}
          className="bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50"
        >
          {adding ? "กำลังเพิ่ม..." : "+ เพิ่ม"}
        </button>
      </form>

      {error && (
        <p className="mb-4 border border-warn/30 bg-warn/5 px-3 py-2 font-mono text-xs text-warn">
          เกิดข้อผิดพลาด: {error}
        </p>
      )}

      {loading ? (
        <p className="font-mono text-sm text-ink/50">กำลังโหลด...</p>
      ) : rows.length === 0 ? (
        <p className="border border-dashed border-line p-8 text-center text-ink/50">ยังไม่มีข้อมูล</p>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-brandSoft/60 text-left font-mono text-xs uppercase tracking-wide text-ink/60">
                <th className="px-4 py-3">{nameLabel}</th>
                <th className="px-4 py-3">คำอธิบาย</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const id = row[idField] as string;
                const isEditing = editingId === id;
                return (
                  <tr key={id} className="border-b border-line/60 last:border-0 hover:bg-brandSoft/30">
                    {isEditing ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            className={inputClass}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            className={inputClass}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2 text-ink/50">
                          {row.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-3 font-mono text-xs">
                            <button
                              onClick={() => saveEdit(id)}
                              disabled={savingEdit}
                              className="text-brand hover:underline disabled:opacity-50"
                            >
                              บันทึก
                            </button>
                            <button onClick={cancelEdit} className="text-ink/60 hover:text-ink">
                              ยกเลิก
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">{row[nameField] as string}</td>
                        <td className="px-4 py-3 text-ink/70">{row.description || "—"}</td>
                        <td className="px-4 py-3">
                          {row.is_active ? (
                            <span className="text-brand">ใช้งาน</span>
                          ) : (
                            <span className="text-ink/40">ปิดใช้งาน</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3 font-mono text-xs">
                            <button onClick={() => startEdit(row)} className="text-brand hover:underline">
                              แก้ไข
                            </button>
                            <button onClick={() => toggleActive(row)} className="text-ink/60 hover:text-ink">
                              {row.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                            </button>
                            <button onClick={() => softDelete(row)} className="text-warn hover:underline">
                              ลบ
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
