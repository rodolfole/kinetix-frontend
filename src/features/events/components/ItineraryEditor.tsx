import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import IconPicker, { ITINERARY_ICON_CATALOG } from './IconPicker';
import type { ItineraryItem } from '../types/event.type';

interface ItineraryEditorProps {
  initialItems?: ItineraryItem[];
}

type ItemWithId = ItineraryItem & { id: string };

function DragHandle() {
  return (
    <button
      type="button"
      className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
      aria-label="Arrastrar para reordenar"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="5" cy="3" r="1.5" fill="currentColor" />
        <circle cx="11" cy="3" r="1.5" fill="currentColor" />
        <circle cx="5" cy="8" r="1.5" fill="currentColor" />
        <circle cx="11" cy="8" r="1.5" fill="currentColor" />
        <circle cx="5" cy="13" r="1.5" fill="currentColor" />
        <circle cx="11" cy="13" r="1.5" fill="currentColor" />
      </svg>
    </button>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y1="12" />
    </svg>
  );
}

function SortableItem({
  item,
  onRemove,
  onChange,
  onIconChange,
}: {
  item: ItemWithId;
  onRemove: (e: React.MouseEvent) => void;
  onChange: (field: string, value: string) => void;
  onIconChange: (value: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="card border rounded-lg p-4 bg-white shadow-sm"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span {...attributes} {...listeners}>
            <DragHandle />
          </span>
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded">
            ITINERARIO
          </span>
        </div>
        <button
          type="button"
          className="text-red-500 hover:text-red-700 transition-colors"
          onClick={onRemove}
          aria-label="Eliminar punto"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[10px] uppercase text-muted-foreground">Nombre del Punto</label>
          <input
            type="text"
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={item.key}
            onChange={(e) => onChange('key', e.target.value)}
            placeholder="Ej. Largada, Km 5, Meta"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase text-muted-foreground">Hora</label>
          <input
            type="time"
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={item.time}
            onChange={(e) => onChange('time', e.target.value)}
            required
          />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <label className="text-[10px] uppercase text-muted-foreground block">Icono</label>
        <input type="hidden" data-name={`itinerary_icon_${item.id}`} value={item.icon} />
        <IconPicker
          catalog={ITINERARY_ICON_CATALOG}
          value={item.icon}
          ariaLabel="Icono del punto de itinerario"
          onChange={onIconChange}
        />
      </div>
    </div>
  );
}

export default function ItineraryEditor({ initialItems = [] }: ItineraryEditorProps) {
  const [items, setItems] = useState<ItemWithId[]>(() =>
    initialItems.map((item) => ({ ...item, id: crypto.randomUUID().split('-')[0] }))
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const newItems = [...prev];
      const [moved] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, moved);
      return newItems;
    });
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID().split('-')[0], key: '', time: '', icon: '' },
    ]);
  }, []);

  const removeItem = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateField = useCallback((id: string, field: string, value: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  }, []);

  const itineraryData = items.map(({ id: _id, ...rest }) => rest);

  return (
    <div className="space-y-4" data-react-island="itinerary">
      <input type="hidden" name="itinerary_json" value={JSON.stringify(itineraryData)} />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              onRemove={(e) => removeItem(e, item.id)}
              onChange={(field, value) => updateField(item.id, field, value)}
              onIconChange={(value) => updateField(item.id, 'icon', value)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay puntos de itinerario. Agrega al menos uno.
        </p>
      )}

      <button
        type="button"
        id="add-itinerary-btn"
        onClick={addItem}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
      >
        <PlusIcon />
        Añadir Punto
      </button>
    </div>
  );
}
