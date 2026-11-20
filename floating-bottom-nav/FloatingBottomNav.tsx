"use client";

import { useState, type FormEvent } from "react";
import { CheckSquare, Folder, Home, MessageCircle, Plus, X } from "lucide-react";
import styles from "./floating-bottom-nav.module.css";

type Destination = "home" | "tasks" | "projects" | "messages";
type FloatingBottomNavProps = {
  initialActive?: Destination;
  onNavigate?: (destination: Destination) => void;
  onCreateTask?: (title: string) => void;
};

const destinations: { id: Destination; label: string; Icon: typeof Home }[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "tasks", label: "Tasks", Icon: CheckSquare },
  { id: "projects", label: "Projects", Icon: Folder },
  { id: "messages", label: "Messages", Icon: MessageCircle },
];

export default function FloatingBottomNav({
  initialActive = "home",
  onNavigate,
  onCreateTask,
}: FloatingBottomNavProps) {
  const [active, setActive] = useState<Destination>(initialActive);
  const [createOpen, setCreateOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");

  function navigate(destination: Destination) {
    setActive(destination);
    onNavigate?.(destination);
  }

  function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title) return;
    onCreateTask?.(title);
    setTaskTitle("");
    setCreateOpen(false);
  }

  return (
    <>
      <nav className={styles.dock} aria-label="Primary navigation">
        <div className={styles.pill}>
          {destinations.map(({ id, label, Icon }) => {
            const selected = active === id;
            return (
              <button
                key={id}
                type="button"
                className={`${styles.navItem} ${selected ? styles.active : ""}`}
                aria-current={selected ? "page" : undefined}
                aria-label={label}
                onClick={() => navigate(id)}
              >
                <Icon className={styles.navIcon} size={29} strokeWidth={selected ? 1.9 : 1.65} />
                <span className={styles.navLabel}>{label}</span>
                <span className={styles.tooltip} aria-hidden="true">{label}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className={styles.createButton}
          aria-label="Create a task"
          aria-haspopup="dialog"
          aria-expanded={createOpen}
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={40} strokeWidth={1.55} />
        </button>
      </nav>

      {createOpen && (
        <div className={styles.modalBackdrop} onMouseDown={(event) => {
          if (event.target === event.currentTarget) setCreateOpen(false);
        }}>
          <section className={styles.taskDialog} role="dialog" aria-modal="true" aria-labelledby="task-dialog-title">
            <button className={styles.closeButton} type="button" onClick={() => setCreateOpen(false)} aria-label="Close task form">
              <X size={18} />
            </button>
            <span className={styles.dialogEyebrow}>QUICK CAPTURE</span>
            <h2 id="task-dialog-title">Make it happen.</h2>
            <p>Get that next thing out of your head and onto your list.</p>
            <form onSubmit={createTask}>
              <label htmlFor="quick-task-title">Task name</label>
              <input id="quick-task-title" autoFocus value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="e.g. Send the project update" maxLength={120} required />
              <button className={styles.submitButton} type="submit"><Plus size={17} /> Create task</button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
