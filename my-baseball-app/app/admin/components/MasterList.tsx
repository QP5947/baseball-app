"use client";

import { Check, Edit2, Plus, Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import DeleteButton from "../components/DeleteButton";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface Master {
  id: string;
  name: string;
  show_flg: boolean;
  sort: number;
}

export default function MasterList({
  masters,
  upsertaction,
  deleteAction,
  updateSortAction,
}: {
  masters: Master[];
  upsertaction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  updateSortAction: (ids: string[]) => Promise<void>;
}) {
  // DBのデータ(masters)が変わったら内部状態(items)も更新する
  const [items, setItems] = useState(masters);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setItems(masters);
  }, [masters]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10, // 10px動くまでドラッグを開始しない（遊びを作る）
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 5, // 指が少し震えてもキャンセルしない
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);

      const newOrder = arrayMove(items, oldIndex, newIndex);
      setItems(newOrder);

      const ids = newOrder.map((item) => item.id);
      const result = await updateSortAction(ids);

      /* 
      if (!result?.success) {
        // 失敗した場合は元の順序に戻す、などの処理を入れるとより親切です
        alert("並び替えの保存に失敗しました");
        setItems(items);
      }
      */
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed ">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 w-10 text-center"></th>
              <th className="p-4 font-semibold text-gray-600">名前</th>
              <th className="p-4 font-semibold text-gray-600 w-18 text-center">
                表示
              </th>
              <th className="p-4 font-semibold text-gray-600 w-18 text-center">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            <NewMasterRow upsertaction={upsertaction} />

            <SortableContext
              items={items}
              strategy={verticalListSortingStrategy}
            >
              {items.map((master) => (
                <MasterRow
                  key={master.id}
                  master={master}
                  isEditing={editingId === master.id}
                  onEdit={() => setEditingId(master.id)}
                  onCancel={() => setEditingId(null)}
                  upsertaction={upsertaction}
                  deleteAction={deleteAction}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </div>
    </DndContext>
  );
}

function MasterRow({
  master,
  isEditing,
  onEdit,
  onCancel,
  upsertaction,
  deleteAction,
}: {
  master: Master;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  upsertaction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: master.id });

  // 座標移動のスタイル定義
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    position: "relative" as const,
    backgroundColor: isDragging ? "#f9fafb" : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b hover:bg-gray-50 group"
    >
      {/* ドラッグハンドル */}
      <td
        className="p-4 text-gray-300 cursor-grab active:cursor-grabbing text-center"
        {...attributes}
        {...listeners}
      >
        ⠿
      </td>

      {isEditing ? (
        /* --- 編集モードの表示 --- */
        <>
          <td className="p-4">
            <input
              form={`form-${master.id}`}
              name="name"
              defaultValue={master.name}
              className="border rounded px-2 py-1 w-full text-gray-800 bg-white"
              autoFocus
            />
          </td>
          <td className="p-4 text-center">
            <input
              form={`form-${master.id}`}
              name="show_flg"
              type="checkbox"
              defaultChecked={master.show_flg}
            />
          </td>
          <td className="p-4 text-center">
            <div className="flex justify-center gap-2">
              <form
                id={`form-${master.id}`}
                action={async (formData) => {
                  await upsertaction(formData);
                  onCancel();
                }}
              >
                <input type="hidden" name="id" value={master.id} />
                <input type="hidden" name="sort" value={master.sort} />
                <button
                  type="submit"
                  className="text-gray-400 hover:text-blue-600 p-1 cursor-pointer"
                >
                  <Save size={18} />
                </button>
              </form>
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </td>
        </>
      ) : (
        /* --- 通常モードの表示 --- */
        <>
          <td className="p-4 font-bold text-gray-700">{master.name}</td>
          <td className="p-4 text-center">
            {master.show_flg ? (
              <Check className="inline-block text-gray-600" size={18} />
            ) : (
              ""
            )}
          </td>
          <td className="p-4 text-center">
            <div className="flex justify-center gap-3">
              <button
                onClick={onEdit}
                className="text-gray-400 hover:text-blue-600 p-1 cursor-pointer"
              >
                <Edit2 size={18} />
              </button>
              <DeleteButton
                id={master.id}
                deleteName={master.name}
                action={deleteAction}
              />
            </div>
          </td>
        </>
      )}
    </tr>
  );
}

function NewMasterRow({
  upsertaction,
}: {
  upsertaction: (formData: FormData) => Promise<void>;
}) {
  const handleAction = async (formData: FormData) => {
    // データ登録
    await upsertaction(formData);

    // 保存後にフォームをリセットする
    const form = document.getElementById("form-new") as HTMLFormElement;
    form?.reset();
  };

  return (
    <tr className="bg-blue-50/30 border-b-2 border-blue-100">
      <td className="p-4"></td>
      <td className="p-4">
        <input
          form="form-new"
          name="name"
          placeholder="新しい名前を入力..."
          className="border rounded px-2 py-1 w-full text-sm text-gray-800 bg-white"
          required
        />
      </td>
      <td className="p-4 text-center">
        <input form="form-new" type="checkbox" name="show_flg" defaultChecked />
      </td>
      <td className="p-4 text-center">
        <form id="form-new" action={handleAction}>
          <button
            type="submit"
            className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 mx-auto block"
          >
            <Plus size={18} />
          </button>
        </form>
      </td>
    </tr>
  );
}
