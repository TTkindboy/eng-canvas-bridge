import { useDraggable } from '@dnd-kit/react';

type DraggableProps = {
  id: string;
  label: string;
};

export default function Draggable({ id, label }: DraggableProps) {
  const { isDragging, ref } = useDraggable({
    id,
  });

  return (
    <button
      ref={ref}
      className="cb-dnd-draggable"
      type="button"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <span className="cb-dnd-draggable__handle" aria-hidden="true">
        ::
      </span>
      <span>{label}</span>
    </button>
  );
}
