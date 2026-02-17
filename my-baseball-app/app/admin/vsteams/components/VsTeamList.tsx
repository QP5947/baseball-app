"use client";

import { Check, Edit2, Plus, Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import DeleteButton from "../../components/DeleteButton";
import { type ActionResult } from "../actions";
import toast from "react-hot-toast";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// 画像ファイル最大サイズ（5MB）
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
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

interface VsTeam {
  id: string;
  name: string;
  one_name: string;
  icon: string | null;
  show_flg: boolean;
  sort: number;
}

interface PreviewImages {
  [key: string]: string;
}

type SetPreviewImages = React.Dispatch<React.SetStateAction<PreviewImages>>;

export default function VsTeamList({
  masters,
  iconUrls,
  upsertaction,
  deleteAction,
  updateSortAction,
  onChanged,
}: {
  masters: VsTeam[];
  iconUrls: { [key: string]: string };
  upsertaction: (formData: FormData) => Promise<ActionResult>;
  deleteAction: (formData: FormData) => Promise<ActionResult>;
  updateSortAction: (ids: string[]) => Promise<ActionResult>;
  onChanged?: () => void | Promise<void>;
}) {
  const [items, setItems] = useState(masters);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<PreviewImages>({});
  const [deletedIcons, setDeletedIcons] = useState<Set<string>>(new Set());

  useEffect(() => {
    setItems(masters);
    // 既存のアイコンをプレビューに設定
    const initialPreviews: PreviewImages = {};
    masters.forEach((vsTeam) => {
      if (iconUrls[vsTeam.id]) {
        initialPreviews[vsTeam.id] = iconUrls[vsTeam.id];
      }
    });
    setPreviewImages(initialPreviews);
  }, [masters, iconUrls]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    vsTeamId: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          `ファイルサイズが大きすぎます。${MAX_FILE_SIZE / 1024 / 1024}MB以下のファイルをアップロードしてください。`,
        );
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages((prev) => ({
          ...prev,
          [vsTeamId]: reader.result as string,
        }));
        // ファイルが選択されたら、削除フラグから除外
        setDeletedIcons((prev) => {
          const newSet = new Set(prev);
          newSet.delete(vsTeamId);
          return newSet;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteIcon = (vsTeamId: string) => {
    setPreviewImages((prev) => {
      const newPreview = { ...prev };
      delete newPreview[vsTeamId];
      return newPreview;
    });
    setDeletedIcons((prev) => new Set([...prev, vsTeamId]));
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 5,
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
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-2 md:p-4 w-8 md:w-10 text-center"></th>
              <th className="p-2 md:p-4 font-semibold text-gray-600">
                アイコン
              </th>
              <th className="p-2 md:p-4 font-semibold text-gray-600 min-w-24">
                名前
              </th>
              <th className="p-2 md:p-4 font-semibold text-gray-600 w-20 text-center">
                1文字
              </th>
              <th className="p-2 md:p-4 font-semibold text-gray-600 w-12 md:w-16 text-center">
                表示
              </th>
              <th className="p-2 md:p-4 font-semibold text-gray-600 w-12 md:w-16 text-center">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            <NewVsTeamRow
              upsertaction={upsertaction}
              previewImages={previewImages}
              setPreviewImages={setPreviewImages}
              onChanged={onChanged}
            />

            <SortableContext
              items={items}
              strategy={verticalListSortingStrategy}
            >
              {items.map((vsTeam) => (
                <VsTeamRow
                  key={vsTeam.id}
                  vsTeam={vsTeam}
                  isEditing={editingId === vsTeam.id}
                  onEdit={() => setEditingId(vsTeam.id)}
                  onCancel={() => setEditingId(null)}
                  onDeleteSuccess={() => {
                    setItems((prev) =>
                      prev.filter((item) => item.id !== vsTeam.id),
                    );
                    setPreviewImages((prev) => {
                      const next = { ...prev };
                      delete next[vsTeam.id];
                      return next;
                    });
                    setDeletedIcons((prev) => {
                      const next = new Set(prev);
                      next.delete(vsTeam.id);
                      return next;
                    });
                  }}
                  upsertaction={upsertaction}
                  deleteAction={deleteAction}
                  previewImages={previewImages}
                  setPreviewImages={setPreviewImages}
                  handleFileChange={handleFileChange}
                  handleDeleteIcon={handleDeleteIcon}
                  deletedIcons={deletedIcons}
                  setDeletedIcons={setDeletedIcons}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </div>
    </DndContext>
  );
}

function VsTeamRow({
  vsTeam,
  isEditing,
  onEdit,
  onCancel,
  onDeleteSuccess,
  upsertaction,
  deleteAction,
  previewImages,
  setPreviewImages,
  handleFileChange,
  handleDeleteIcon,
  deletedIcons,
  setDeletedIcons,
}: {
  vsTeam: VsTeam;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onDeleteSuccess: () => void;
  upsertaction: (formData: FormData) => Promise<ActionResult>;
  deleteAction: (formData: FormData) => Promise<ActionResult>;
  previewImages: PreviewImages;
  setPreviewImages: SetPreviewImages;
  handleFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    vsTeamId: string,
  ) => void;
  handleDeleteIcon: (vsTeamId: string) => void;
  deletedIcons: Set<string>;
  setDeletedIcons: (icons: Set<string>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: vsTeam.id });

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
      <td
        className="p-2 md:p-4 text-gray-300 cursor-grab active:cursor-grabbing text-center text-sm md:text-base"
        {...attributes}
        {...listeners}
      >
        ⠿
      </td>

      {isEditing ? (
        /* --- 編集モードの表示 --- */
        <>
          <td className="p-2 md:p-4">
            <div>
              {previewImages[vsTeam.id] && (
                <div className="mb-2 relative inline-block group">
                  <img
                    src={previewImages[vsTeam.id]}
                    alt={`${vsTeam.name} アイコン`}
                    className="w-10 h-10 md:w-12 md:h-12 rounded object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteIcon(vsTeam.id)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <input
                form={`form-${vsTeam.id}`}
                type="file"
                name="icon"
                accept="image/*"
                onChange={(e) => handleFileChange(e, vsTeam.id)}
                className="block w-full text-xs text-gray-500 file:mr-1 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </td>
          <td className="p-2 md:p-4">
            <input
              form={`form-${vsTeam.id}`}
              name="name"
              defaultValue={vsTeam.name}
              className="border rounded px-2 py-1 w-full text-gray-800 bg-white"
              autoFocus
            />
          </td>
          <td className="p-2 md:p-4">
            <input
              form={`form-${vsTeam.id}`}
              name="one_name"
              defaultValue={vsTeam.one_name}
              maxLength={1}
              className="border rounded px-1 md:px-2 py-1 w-full text-center text-gray-800 bg-white font-bold"
              placeholder="1"
            />
          </td>
          <td className="p-2 md:p-4 text-center">
            <input
              form={`form-${vsTeam.id}`}
              name="show_flg"
              type="checkbox"
              defaultChecked={vsTeam.show_flg}
            />
          </td>
          <td className="p-2 md:p-4 text-center">
            <div className="flex justify-center gap-1 md:gap-2">
              <form
                id={`form-${vsTeam.id}`}
                action={async (formData) => {
                  // 削除フラグを追加
                  if (deletedIcons.has(vsTeam.id)) {
                    formData.append(`delete_icon_${vsTeam.id}`, "true");
                  }
                  const result = await upsertaction(formData);
                  if (result.success) {
                    toast.success(result.message);
                    onCancel();
                  } else {
                    toast.error(result.message);
                  }
                }}
              >
                <input type="hidden" name="id" value={vsTeam.id} />
                <input type="hidden" name="sort" value={vsTeam.sort} />
                <button
                  type="submit"
                  className="text-gray-400 hover:text-blue-600 p-1 cursor-pointer"
                >
                  <Save size={16} className="md:w-4.5 md:h-4.5" />
                </button>
              </form>
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X size={16} className="md:w-4.5 md:h-4.5" />
              </button>
            </div>
          </td>
        </>
      ) : (
        /* --- 通常モードの表示 --- */
        <>
          <td className="p-2 md:p-4">
            {previewImages[vsTeam.id] ? (
              <img
                src={previewImages[vsTeam.id]}
                alt={vsTeam.name}
                className="w-8 h-8 rounded object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500 font-bold">
                {vsTeam.one_name}
              </div>
            )}
          </td>
          <td className="p-2 md:p-4 font-bold text-gray-700">{vsTeam.name}</td>
          <td className="p-2 md:p-4 text-center font-bold text-sm md:text-lg">
            {vsTeam.one_name}
          </td>
          <td className="p-2 md:p-4 text-center">
            {vsTeam.show_flg ? (
              <Check className="inline-block text-gray-600" size={16} />
            ) : (
              ""
            )}
          </td>
          <td className="p-2 md:p-4 text-center">
            <div className="flex justify-center gap-2">
              <button
                onClick={onEdit}
                className="text-gray-400 hover:text-blue-600 p-1 cursor-pointer"
              >
                <Edit2 size={16} />
              </button>
              <DeleteButton
                id={vsTeam.id}
                deleteName={vsTeam.name}
                action={deleteAction}
                onSuccess={onDeleteSuccess}
              />
            </div>
          </td>
        </>
      )}
    </tr>
  );
}

function NewVsTeamRow({
  upsertaction,
  previewImages,
  setPreviewImages,
  onChanged,
}: {
  upsertaction: (formData: FormData) => Promise<ActionResult>;
  previewImages: PreviewImages;
  setPreviewImages: SetPreviewImages;
  onChanged?: () => void | Promise<void>;
}) {
  const newIconKey = "new-icon";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          `ファイルサイズが大きすぎます。${MAX_FILE_SIZE / 1024 / 1024}MB以下のファイルをアップロードしてください。`,
        );
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(
          (prev: PreviewImages): PreviewImages => ({
            ...prev,
            [newIconKey]: reader.result as string,
          }),
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAction = async (formData: FormData) => {
    const result = await upsertaction(formData);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    // DB再取得で画像も反映
    await onChanged?.();

    const form = document.getElementById("form-new") as HTMLFormElement;
    form?.reset();

    // プレビューをクリア
    setPreviewImages((prev) => {
      const newPreview = { ...prev };
      delete newPreview[newIconKey];
      return newPreview;
    });
  };

  return (
    <tr className="bg-blue-50/30 border-b-2 border-blue-100">
      <td className="p-2 md:p-4"></td>
      <td className="p-2 md:p-4">
        <div>
          {previewImages[newIconKey] && (
            <div className="mb-2">
              <img
                src={previewImages[newIconKey]}
                alt="プレビュー"
                className="w-10 h-10 md:w-12 md:h-12 rounded object-cover"
              />
            </div>
          )}
          <input
            form="form-new"
            type="file"
            name="icon"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-xs text-gray-500 file:mr-1 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      </td>
      <td className="p-2 md:p-4">
        <input
          form="form-new"
          name="name"
          placeholder="チーム名を入力..."
          className="border rounded px-2 py-1 w-full text-gray-800 bg-white"
          required
        />
      </td>
      <td className="p-2 md:p-4">
        <input
          form="form-new"
          name="one_name"
          maxLength={1}
          placeholder="1"
          className="border rounded px-1 md:px-2 py-1 w-full text-center text-gray-800 bg-white font-bold"
        />
      </td>
      <td className="p-2 md:p-4 text-center">
        <input form="form-new" type="checkbox" name="show_flg" defaultChecked />
      </td>
      <td className="p-2 md:p-4 text-center">
        <form id="form-new" action={handleAction}>
          <button
            type="submit"
            className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 mx-auto block cursor-pointer"
          >
            <Plus size={18} />
          </button>
        </form>
      </td>
    </tr>
  );
}
