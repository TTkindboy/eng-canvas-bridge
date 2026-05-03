import './style.css';
import { useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DragDropProvider } from '@dnd-kit/react';
import { Modal } from '@instructure/ui-modal';
import calendarAddIcon from '@instructure/ui-icons/svg/Line/calendar-add.svg?raw';
import type { Eng10Schedule } from '@/lib/client/types.gen';
import { addAssignedScheduleToCanvas, handleAddToCalendar, type SectionAssignments } from './addToCalendar';
import Draggable from './Draggable';
import Droppable from './Droppable';

type DragLocation = 'unassigned' | 'odd-days' | 'even-days';
type ScheduleItem = {
  id: string;
  label: string;
  location: DragLocation;
};

const initialScheduleItems: ScheduleItem[] = [
  { id: 'section-a', label: 'Section A', location: 'unassigned' },
  { id: 'section-b', label: 'Section B', location: 'unassigned' },
  { id: 'section-c', label: 'Section C', location: 'unassigned' },
  { id: 'section-d', label: 'Section D', location: 'unassigned' },
];

function isDragLocation(id: unknown): id is DragLocation {
  return id === 'unassigned' || id === 'odd-days' || id === 'even-days';
}

type SectionAssignmentBoardProps = {
  disabled: boolean;
  items: ScheduleItem[];
  onChange: (items: ScheduleItem[]) => void;
};

function SectionAssignmentBoard({ disabled, items, onChange }: SectionAssignmentBoardProps) {
  function renderItems(location: DragLocation) {
    const zoneItems = items.filter((item) => item.location === location);

    if (zoneItems.length === 0) {
      return <span className="cb-dnd-placeholder">Drop here</span>;
    }

    return zoneItems.map((item) => <Draggable id={item.id} key={item.id} label={item.label} />);
  }

  function countItems(location: DragLocation) {
    return items.filter((item) => item.location === location).length;
  }

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (disabled || event.canceled) return;

        const { target } = event.operation;
        if (isDragLocation(target?.id)) {
          const targetLocation = target.id;
          onChange(
            items.map((item) =>
              item.id === event.operation.source?.id ? { ...item, location: targetLocation } : item,
            ),
          );
        }
      }}
    >
      <div className="cb-dnd-demo">
        <Droppable count={countItems('unassigned')} id="unassigned" title="Unassigned">
          {renderItems('unassigned')}
        </Droppable>
        <Droppable count={countItems('odd-days')} id="odd-days" title="Odd Days">
          {renderItems('odd-days')}
        </Droppable>
        <Droppable count={countItems('even-days')} id="even-days" title="Even Days">
          {renderItems('even-days')}
        </Droppable>
      </div>
    </DragDropProvider>
  );
}

function AddToCalendarButton() {
  const [assignments, setAssignments] = useState<ScheduleItem[]>(initialScheduleItems);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<Eng10Schedule | null>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'submitting' | 'submitted'>('idle');
  const [modalOpen, setModalOpen] = useState(false);

  async function handleClick() {
    setError(null);
    setStatus('parsing');

    try {
      const parsedSchedule = await handleAddToCalendar();
      setSchedule(parsedSchedule);
      setAssignments(initialScheduleItems);
      setModalOpen(true);
      setStatus('idle');
    } catch {
      setStatus('idle');
      setError('Failed to parse this Canvas schedule PDF.');
    }
  }

  async function handleSubmitAssignments() {
    if (!schedule) return;

    const assigned = assignments.filter((item) => item.location !== 'unassigned');
    const sectionAssignments: SectionAssignments = {};

    for (const item of assigned) {
      sectionAssignments[item.id] = item.location === 'odd-days' ? 'odd' : 'even';
    }

    setError(null);
    setStatus('submitting');

    try {
      await addAssignedScheduleToCanvas(schedule, sectionAssignments);
      setStatus('submitted');
    } catch {
      setStatus('idle');
      setError('Failed to add assigned schedule days to Canvas.');
    }
  }

  const unassignedCount = assignments.filter((item) => item.location === 'unassigned').length;
  const assignedCount = assignments.length - unassignedCount;
  const canSubmit = schedule !== null && unassignedCount === 0 && status !== 'submitting' && status !== 'submitted';
  const busy = status === 'parsing' || status === 'submitting';

  return (
    <span className="cb-root">
      <button className="cb-btn" type="button" disabled={busy} onClick={handleClick}>
        <span className="cb-btn__content">
          <span className="cb-btn__icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: calendarAddIcon }} />
          {status === 'parsing' ? 'Parsing...' : 'Add to Calendar'}
        </span>
      </button>
      {error && !modalOpen ? <span className="cb-inline-error">{error}</span> : null}
      <Modal open={modalOpen} onDismiss={() => setModalOpen(false)} size="medium" label="Assign sections to schedule days">
        <Modal.Header spacing="compact">
          <div className="cb-modal-heading">
            <span className="cb-modal-title">Assign sections</span>
            <span className="cb-modal-subtitle">Drag each section into the day rotation it follows.</span>
          </div>
        </Modal.Header>
        <Modal.Body padding="small">
          <SectionAssignmentBoard disabled={busy} items={assignments} onChange={setAssignments} />
          <div className="cb-submit-row">
            <span className="cb-submit-status">
              {status === 'submitted'
                ? 'Added to Canvas'
                : `${assignedCount} of ${assignments.length} sections assigned`}
            </span>
            <button className="cb-submit-btn" type="button" disabled={!canSubmit} onClick={handleSubmitAssignments}>
              {status === 'submitting' ? 'Adding...' : 'Submit to Canvas'}
            </button>
          </div>
          {error && modalOpen ? <p className="cb-modal-error">{error}</p> : null}
        </Modal.Body>
      </Modal>
    </span>
  );
}

export default defineContentScript({
  matches: ['*://friendsseminary.instructure.com/courses/*/files/*'],

  main(ctx) {
    const ui = createIntegratedUi<Root>(ctx, {
      position: 'inline',
      anchor: 'h2',
      append: 'last',
      onMount(container) {
        container.style.display = 'inline';
        const root = createRoot(container);
        root.render(<AddToCalendarButton />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });
    ui.autoMount();
  },
});
