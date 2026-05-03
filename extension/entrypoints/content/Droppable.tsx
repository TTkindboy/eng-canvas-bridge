import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/react';

type DroppableProps = {
  children?: ReactNode;
  count: number;
  id: string;
  title: string;
};

export default function Droppable({ children, count, id, title }: DroppableProps) {
  const { isDropTarget, ref } = useDroppable({
    id,
  });

  return (
    <div ref={ref} className={isDropTarget ? 'cb-dnd-dropzone cb-dnd-dropzone--target' : 'cb-dnd-dropzone'}>
      <div className="cb-dnd-dropzone__header">
        <span className="cb-dnd-dropzone__title">{title}</span>
        <span className="cb-dnd-dropzone__count">{count}</span>
      </div>
      <div className="cb-dnd-dropzone__body">{children}</div>
    </div>
  );
}
