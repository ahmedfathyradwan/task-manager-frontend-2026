"use client";

import { useState } from "react";
import Icon from "./Icon";
import SubtaskSection from "./SubtaskSection";
import { isOverdue } from "@/app/lib/format";
import { useI18n } from "./providers/I18nProvider";
import styles from "./TaskCard.module.css";

export default function TaskCard({
  task,
  busy = false,
  busySubtaskIds,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onUpdateSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) {
  const { t, formatDue, formatDateTime } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const subtasks = task.subtasks ?? [];
  const total = subtasks.length;
  const done = subtasks.filter((subtask) => subtask.completed).length;
  const overdue = isOverdue(task);
  const description = task.description?.trim();

  const toggleExpanded = () => setExpanded((current) => !current);

  const cardClassName = [
    styles.card,
    task.completed ? styles.isCompleted : styles.isPending,
    overdue ? styles.isOverdue : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClassName}>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.check}
          onClick={() => onToggle(task)}
          disabled={busy}
          aria-pressed={task.completed}
          aria-label={task.completed ? t("task.markActive") : t("task.markDone")}
          title={task.completed ? t("task.markActive") : t("task.markDone")}
        >
          {busy ? (
            <span className={styles.checkSpinner} />
          ) : (
            task.completed && <Icon name="check" size={15} strokeWidth={3} />
          )}
        </button>

        <div className={styles.content}>
          <div className={styles.titleRow}>
            <h3 className={`${styles.title} ${task.completed ? styles.titleDone : ""}`}>
              {task.title}
            </h3>
            {overdue && (
              <span className="chip chip-overdue">
                <Icon name="alertTriangle" size={12} />
                {t("task.overdue")}
              </span>
            )}
          </div>

          {description && <p className={styles.description}>{description}</p>}

          <div className={styles.meta}>
            <span className={`chip ${task.completed ? "chip-success" : "chip-danger"}`}>
              <Icon name={task.completed ? "checkCircle" : "clock"} size={13} />
              {task.completed ? t("task.completed") : t("task.pending")}
            </span>

            {task.dueDate && (
              <span className={`chip ${overdue ? "chip-overdue" : ""}`}>
                <Icon name="calendar" size={13} />
                <span>{formatDue(task.dueDate, task.dueTime)}</span>
              </span>
            )}

            <span className={`chip ${styles.createdChip}`}>
              <Icon name="clock" size={13} />
              <span>{t("task.createdLabel", { date: formatDateTime(task.createdAt) })}</span>
            </span>

            <button
              type="button"
              className={`chip ${styles.subtaskChip} ${expanded ? styles.subtaskChipOpen : ""}`}
              onClick={toggleExpanded}
              aria-expanded={expanded}
              aria-label={expanded ? t("task.collapse") : t("task.expand")}
            >
              <Icon name="listChecks" size={13} />
              <span className="nums">
                {done}/{total}
              </span>
              <Icon
                name="chevronDown"
                size={12}
                className={`${styles.chevron} ${expanded ? styles.chevronOpen : ""}`}
              />
            </button>
          </div>
        </div>

        <div className={styles.side}>
          <div className={styles.actions}>
            <button
              type="button"
              className={`icon-btn ${styles.sideBtn}`}
              onClick={() => onEdit(task)}
              aria-label={t("task.edit")}
              title={t("task.edit")}
            >
              <Icon name="pencil" size={16} />
            </button>
            <button
              type="button"
              className={`icon-btn danger ${styles.sideBtn}`}
              onClick={() => onDelete(task)}
              aria-label={t("task.delete")}
              title={t("task.delete")}
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
          <button
            type="button"
            className={`icon-btn ${styles.sideBtn} ${styles.expandBtn}`}
            onClick={toggleExpanded}
            aria-expanded={expanded}
            aria-label={expanded ? t("task.collapse") : t("task.expand")}
            title={expanded ? t("task.collapse") : t("task.expand")}
          >
            <Icon
              name="chevronDown"
              size={18}
              className={`${styles.chevron} ${expanded ? styles.chevronOpen : ""}`}
            />
          </button>
        </div>
      </div>

      {expanded && (
        <SubtaskSection
          task={task}
          busyIds={busySubtaskIds}
          onAdd={onAddSubtask}
          onUpdate={onUpdateSubtask}
          onToggle={onToggleSubtask}
          onDelete={onDeleteSubtask}
        />
      )}
    </article>
  );
}
