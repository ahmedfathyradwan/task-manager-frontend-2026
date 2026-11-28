"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "./components/AppHeader";
import ConfirmDialog from "./components/ConfirmDialog";
import Icon from "./components/Icon";
import PageLoader from "./components/PageLoader";
import TaskCard from "./components/TaskCard";
import TaskModal from "./components/TaskModal";
import { useAuth } from "./components/providers/AuthProvider";
import { useI18n } from "./components/providers/I18nProvider";
import { useToast } from "./components/providers/ToastProvider";
import { api } from "./lib/api";
import { getErrorMessage } from "./lib/errors";
import { dueTimestamp, isOverdue } from "./lib/format";
import styles from "./Dashboard.module.css";

const sortActive = (a, b) => {
  const aOverdue = isOverdue(a) ? 0 : 1;
  const bOverdue = isOverdue(b) ? 0 : 1;
  if (aOverdue !== bOverdue) return aOverdue - bOverdue;

  const aDue = a.dueDate ? dueTimestamp(a.dueDate, a.dueTime) ?? Infinity : Infinity;
  const bDue = b.dueDate ? dueTimestamp(b.dueDate, b.dueTime) ?? Infinity : Infinity;
  if (aDue !== bDue) return aDue - bDue;

  return new Date(b.createdAt) - new Date(a.createdAt);
};

const sortCompleted = (a, b) => {
  const aDone = new Date(a.completedAt ?? a.updatedAt ?? a.createdAt).getTime();
  const bDone = new Date(b.completedAt ?? b.updatedAt ?? b.createdAt).getTime();
  return bDone - aDone;
};

const busyWith = (set, id, active) => {
  const next = new Set(set);
  if (active) next.add(id);
  else next.delete(id);
  return next;
};

function ProgressRing({ percent, label }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <div className={styles.ring} role="img" aria-label={label}>
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} className={styles.ringTrack} />
        <circle
          cx="50"
          cy="50"
          r={radius}
          className={styles.ringFill}
          stroke="var(--primary-fill)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.ringText}>
        <span className={styles.ringValue}>{percent}%</span>
        <span className={styles.ringLabel}>{label}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { t, formatWeekdayDate } = useI18n();
  const toast = useToast();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState("all");
  const [busyTaskIds, setBusyTaskIds] = useState(() => new Set());
  const [busySubtaskIds, setBusySubtaskIds] = useState(() => new Set());
  const [editor, setEditor] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return undefined;

    let cancelled = false;

    const load = async () => {
      try {
        const data = await api("/tasks");
        if (cancelled) return;
        setTasks(data.tasks);
        setLoadError(false);
      } catch (error) {
        if (cancelled) return;
        if (error.code === "UNAUTHORIZED") {
          await logout().catch(() => {});
          router.replace("/login");
          return;
        }
        setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user, reloadKey, logout, router]);

  const retryTasks = () => {
    setLoading(true);
    setLoadError(false);
    setReloadKey((current) => current + 1);
  };

  const isAdmin = user?.role === "admin";

  const { activeTasks, completedTasks, overdueCount, percent } = useMemo(() => {
    const active = tasks.filter((task) => !task.completed).sort(sortActive);
    const completed = tasks.filter((task) => task.completed).sort(sortCompleted);
    return {
      activeTasks: active,
      completedTasks: completed,
      overdueCount: active.filter((task) => isOverdue(task)).length,
      percent: tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0,
    };
  }, [tasks]);

  const replaceTask = useCallback(
    (updated) =>
      setTasks((current) =>
        current.map((task) => (task.id === updated.id ? updated : task))
      ),
    []
  );

  const handleTaskSubmit = useCallback(
    async (payload) => {
      if (!editor) return;

      if (editor.task) {
        const { task: updated } = await api(`/tasks/${editor.task.id}`, {
          method: "PATCH",
          body: payload,
        });
        replaceTask(updated);
        toast.success(t("toast.taskUpdated"));
      } else {
        const { task: created } = await api("/tasks", {
          method: "POST",
          body: payload,
        });
        setTasks((current) => [created, ...current]);
        toast.success(t("toast.taskCreated"));
      }

      setEditor(null);
    },
    [editor, t, toast, replaceTask]
  );

  const handleToggleTask = useCallback(
    async (task) => {
      setBusyTaskIds((current) => busyWith(current, task.id, true));
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id
            ? {
                ...item,
                completed: !item.completed,
                completedAt: item.completed ? null : new Date().toISOString(),
              }
            : item
        )
      );

      try {
        const { task: updated } = await api(`/tasks/${task.id}`, {
          method: "PATCH",
          body: { completed: !task.completed },
        });
        replaceTask(updated);
        toast.success(updated.completed ? t("toast.taskCompleted") : t("toast.taskReopened"));
      } catch (error) {
        setTasks((current) => current.map((item) => (item.id === task.id ? task : item)));
        toast.error(getErrorMessage(error, t));
      } finally {
        setBusyTaskIds((current) => busyWith(current, task.id, false));
      }
    },
    [t, toast, replaceTask]
  );

  const handleToggleSubtask = useCallback(
    async (task, subtask) => {
      setBusySubtaskIds((current) => busyWith(current, subtask.id, true));
      try {
        const { task: updated } = await api(
          `/tasks/${task.id}/subtasks/${subtask.id}`,
          {
            method: "PATCH",
            body: { completed: !subtask.completed },
          }
        );
        replaceTask(updated);
        toast.success(
          subtask.completed ? t("toast.subtaskReopened") : t("toast.subtaskCompleted")
        );
      } catch (error) {
        toast.error(getErrorMessage(error, t));
      } finally {
        setBusySubtaskIds((current) => busyWith(current, subtask.id, false));
      }
    },
    [t, toast, replaceTask]
  );

  const handleAddSubtask = async (task, payload) => {
    const { task: updated } = await api(`/tasks/${task.id}/subtasks`, {
      method: "POST",
      body: payload,
    });
    replaceTask(updated);
    toast.success(t("toast.subtaskCreated"));
    return updated;
  };

  const handleUpdateSubtask = async (task, subtaskId, payload) => {
    const { task: updated } = await api(
      `/tasks/${task.id}/subtasks/${subtaskId}`,
      { method: "PATCH", body: payload }
    );
    replaceTask(updated);
    toast.success(t("toast.subtaskUpdated"));
    return updated;
  };

  const handleConfirmDelete = async () => {
    if (!confirm || confirmPending) return;
    setConfirmPending(true);

    try {
      if (confirm.kind === "task") {
        await api(`/tasks/${confirm.task.id}`, { method: "DELETE" });
        setTasks((current) => current.filter((task) => task.id !== confirm.task.id));
        toast.success(t("toast.taskDeleted"));
      } else {
        const { task: updated } = await api(
          `/tasks/${confirm.task.id}/subtasks/${confirm.subtask.id}`,
          { method: "DELETE" }
        );
        replaceTask(updated);
        toast.success(t("toast.subtaskDeleted"));
      }
      setConfirm(null);
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setConfirmPending(false);
    }
  };

  const filters = [
    { key: "all", label: t("dash.filterAll"), count: tasks.length },
    { key: "active", label: t("dash.filterActive"), count: activeTasks.length },
    { key: "done", label: t("dash.filterDone"), count: completedTasks.length },
  ];

  const showActive = filter !== "done";
  const showCompleted = filter !== "active";
  const visibleCount =
    (showActive ? activeTasks.length : 0) + (showCompleted ? completedTasks.length : 0);

  const confirmTitle = confirm
    ? confirm.kind === "task"
      ? t("confirm.deleteTaskTitle")
      : t("confirm.deleteSubtaskTitle")
    : "";
  const confirmMessage = confirm
    ? confirm.kind === "task"
      ? t("confirm.deleteTaskBody", { title: confirm.task.title })
      : t("confirm.deleteSubtaskBody", { title: confirm.subtask.title })
    : "";

  const renderTask = (task) => (
    <TaskCard
      key={task.id}
      task={task}
      busy={busyTaskIds.has(task.id)}
      busySubtaskIds={busySubtaskIds}
      onToggle={handleToggleTask}
      onEdit={(item) => setEditor({ task: item })}
      onDelete={(item) => setConfirm({ kind: "task", task: item })}
      onAddSubtask={handleAddSubtask}
      onUpdateSubtask={handleUpdateSubtask}
      onToggleSubtask={handleToggleSubtask}
      onDeleteSubtask={(item, subtask) =>
        setConfirm({ kind: "subtask", task: item, subtask })
      }
    />
  );

  let content;

  if (authLoading || !user || (loading && !loadError)) {
    content = <PageLoader label={t("dash.loading")} />;
  } else if (loadError) {
    content = (
      <div className={styles.empty}>
        <span className={`${styles.emptyIcon} ${styles.errorIcon}`}>
          <Icon name="alertTriangle" size={26} />
        </span>
        <h2 className={styles.emptyTitle}>{t("dash.loadFailed")}</h2>
        <button type="button" className="btn btn-ghost" onClick={retryTasks}>
          <Icon name="refresh" size={16} />
          {t("common.retry")}
        </button>
      </div>
    );
  } else {
    content = (
      <>
        <section className={`${styles.hero} reveal`}>
          <div className={styles.heroTop}>
            <div className={styles.heroText}>
              <span className={styles.heroDate}>
                <Icon name="calendar" size={13} />
                {formatWeekdayDate(new Date())}
              </span>
              <h1 className={styles.greeting}>
                {t("dash.greetingPrefix")}
                <span className={isAdmin ? "admin-name" : undefined}>{user.fullName}</span>
              </h1>
              <p className={styles.heroSub}>{t("dash.subtitle")}</p>

              <div className={styles.mobileProgress}>
                <div className={styles.bar}>
                  <span style={{ width: `${percent}%` }} />
                </div>
                <span className={styles.barText}>
                  {t("dash.progressDetail", {
                    done: completedTasks.length,
                    total: tasks.length,
                  })}
                </span>
              </div>
            </div>

            <ProgressRing percent={percent} label={t("dash.progressLabel")} />
          </div>

          <div className={styles.stats}>
            <div className={`${styles.stat} ${styles.statActive}`}>
              <span className={styles.statIcon}>
                <Icon name="clock" size={18} />
              </span>
              <div className={styles.statBody}>
                <span className={styles.statValue}>{activeTasks.length}</span>
                <span className={styles.statLabel}>{t("dash.statActive")}</span>
              </div>
            </div>
            <div className={`${styles.stat} ${styles.statDone}`}>
              <span className={styles.statIcon}>
                <Icon name="checkCircle" size={18} />
              </span>
              <div className={styles.statBody}>
                <span className={styles.statValue}>{completedTasks.length}</span>
                <span className={styles.statLabel}>{t("dash.statDone")}</span>
              </div>
            </div>
            <div className={`${styles.stat} ${styles.statOverdue}`}>
              <span className={styles.statIcon}>
                <Icon name="alertTriangle" size={18} />
              </span>
              <div className={styles.statBody}>
                <span className={styles.statValue}>{overdueCount}</span>
                <span className={styles.statLabel}>{t("dash.statOverdue")}</span>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.toolbar}>
          <div className={styles.filters} role="group" aria-label={t("dash.filterLabel")}>
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.filter} ${filter === item.key ? styles.filterActive : ""}`}
                onClick={() => setFilter(item.key)}
                aria-pressed={filter === item.key}
              >
                {item.label}
                <span className={styles.filterCount}>{item.count}</span>
              </button>
            ))}
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>
              <Icon name="inbox" size={28} />
            </span>
            <h2 className={styles.emptyTitle}>{t("dash.emptyTitle")}</h2>
            <p className={styles.emptyBody}>{t("dash.emptyBody")}</p>
            <button
              type="button"
              className={`btn btn-primary ${styles.emptyCta}`}
              onClick={() => setEditor({ task: null })}
            >
              <Icon name="plus" size={17} />
              {t("dash.emptyCta")}
            </button>
          </div>
        ) : visibleCount === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>
              <Icon name="listChecks" size={26} />
            </span>
            <h2 className={styles.emptyTitle}>{t("dash.emptyFilterTitle")}</h2>
            <p className={styles.emptyBody}>{t("dash.emptyFilterBody")}</p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setFilter("all")}
            >
              {t("dash.filterAll")}
            </button>
          </div>
        ) : (
          <div className={styles.sections}>
            {showActive && activeTasks.length > 0 && (
              <section className={styles.section} aria-label={t("dash.sectionActive")}>
                {filter === "all" && (
                  <div className={styles.sectionHead}>
                    <span className={styles.sectionDot} />
                    <span className={styles.sectionTitle}>{t("dash.sectionActive")}</span>
                    <span className={styles.sectionCount}>{activeTasks.length}</span>
                  </div>
                )}
                <div className={styles.list}>{activeTasks.map(renderTask)}</div>
              </section>
            )}

            {showCompleted && completedTasks.length > 0 && (
              <section className={styles.section} aria-label={t("dash.sectionDone")}>
                {filter === "all" && (
                  <div className={styles.sectionHead}>
                    <span className={`${styles.sectionDot} ${styles.sectionDotDone}`} />
                    <span className={styles.sectionTitle}>{t("dash.sectionDone")}</span>
                    <span className={styles.sectionCount}>{completedTasks.length}</span>
                  </div>
                )}
                <div className={styles.list}>{completedTasks.map(renderTask)}</div>
              </section>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main id="main" className={`container app-main ${styles.page}`}>
        {content}
      </main>

      {!authLoading && user && !loading && !loadError && (
        <button
          type="button"
          className={styles.fab}
          onClick={() => setEditor({ task: null })}
          aria-label={t("dash.fab")}
          title={t("dash.fab")}
        >
          <Icon name="plus" size={26} strokeWidth={2.2} />
        </button>
      )}

      <TaskModal
        open={Boolean(editor)}
        initialTask={editor?.task ?? null}
        onClose={() => setEditor(null)}
        onSubmit={handleTaskSubmit}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirmTitle}
        message={confirmMessage}
        pending={confirmPending}
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
