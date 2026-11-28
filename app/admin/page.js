"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppHeader from "../components/AppHeader";
import Icon from "../components/Icon";
import PageLoader from "../components/PageLoader";
import { useAuth } from "../components/providers/AuthProvider";
import { useI18n } from "../components/providers/I18nProvider";
import { api } from "../lib/api";
import { formatDate, formatDateTime, formatDue, isOverdue } from "../lib/format";
import styles from "./Admin.module.css";

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

const taskRank = (task) => (task.completed ? 2 : isOverdue(task) ? 0 : 1);

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { t, lang } = useI18n();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [selected, setSelected] = useState(null);
  const [userTasks, setUserTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const requestRef = useRef(0);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const handleAuthError = useCallback(
    async (error) => {
      if (error.code !== "UNAUTHORIZED") return false;
      await logout().catch(() => {});
      router.replace("/login");
      return true;
    },
    [logout, router]
  );

  useEffect(() => {
    if (!user || user.role !== "admin") return undefined;

    let cancelled = false;

    const load = async () => {
      try {
        const data = await api("/admin/users");
        if (cancelled) return;
        setUsers(data.users);
        setLoadError(false);
        setForbidden(false);
      } catch (error) {
        if (cancelled) return;
        if (error.code === "UNAUTHORIZED") {
          await logout().catch(() => {});
          router.replace("/login");
          return;
        }
        if (error.code === "FORBIDDEN") setForbidden(true);
        else setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user, reloadKey, logout, router]);

  const retryUsers = () => {
    setLoading(true);
    setLoadError(false);
    setReloadKey((current) => current + 1);
  };

  const openUser = useCallback(
    async (account) => {
      const requestId = ++requestRef.current;
      setSelected(account);
      setUserTasks([]);
      setTasksError(false);
      setTasksLoading(true);
      try {
        const data = await api(`/admin/users/${account.id}/tasks`);
        if (requestRef.current !== requestId) return;
        setUserTasks(data.tasks);
      } catch (error) {
        if (requestRef.current !== requestId) return;
        if (await handleAuthError(error)) return;
        setTasksError(true);
      } finally {
        if (requestRef.current === requestId) setTasksLoading(false);
      }
    },
    [handleAuthError]
  );

  const closeUser = () => {
    requestRef.current += 1;
    setSelected(null);
    setUserTasks([]);
    setTasksLoading(false);
    setTasksError(false);
  };

  const totals = useMemo(
    () =>
      users.reduce(
        (acc, account) => ({
          tasks: acc.tasks + account.taskCount,
          completed: acc.completed + account.completedCount,
        }),
        { tasks: 0, completed: 0 }
      ),
    [users]
  );

  const rate = totals.tasks ? Math.round((totals.completed / totals.tasks) * 100) : 0;

  const sortedTasks = useMemo(
    () => [...userTasks].sort((a, b) => taskRank(a) - taskRank(b)),
    [userTasks]
  );

  const fmtDate = (value) => formatDate(value, lang);
  const fmtDateTime = (value) => formatDateTime(value, lang);
  const fmtDue = (date, time) => formatDue(date, time, lang);

  const stats = [
    {
      key: "users",
      icon: "users",
      tone: styles.tonePrimary,
      label: t("admin.totalUsers"),
      value: users.length,
    },
    {
      key: "tasks",
      icon: "fileText",
      tone: styles.toneNeutral,
      label: t("admin.totalTasks"),
      value: totals.tasks,
    },
    {
      key: "completed",
      icon: "checkCircle",
      tone: styles.toneSuccess,
      label: t("admin.statCompleted"),
      value: totals.completed,
    },
    {
      key: "rate",
      icon: "sparkles",
      tone: styles.toneWarm,
      label: t("admin.statRate"),
      value: `${rate}%`,
    },
  ];

  const renderTask = (task) => {
    const overdue = !task.completed && isOverdue(task);
    const variant = task.completed
      ? styles.taskDone
      : overdue
        ? styles.taskLate
        : styles.taskActive;
    const status = task.completed
      ? { cls: "chip-success", icon: "checkCircle", label: t("task.completed") }
      : overdue
        ? { cls: "chip-overdue", icon: "alertTriangle", label: t("task.overdue") }
        : { cls: "chip-danger", icon: "circleDot", label: t("task.pending") };
    const doneSubtasks = task.subtasks.filter((item) => item.completed).length;

    return (
      <li key={task.id} className={`${styles.taskItem} ${variant}`}>
        <span className={styles.taskIcon}>
          <Icon
            name={task.completed ? "checkCircle" : overdue ? "alertTriangle" : "circleDot"}
            size={16}
          />
        </span>
        <div className={styles.taskMain}>
          <p className={`${styles.taskTitle} ${task.completed ? styles.taskTitleDone : ""}`}>
            {task.title}
          </p>
          <div className={styles.taskMeta}>
            <span className={styles.metaItem}>
              <Icon name="clock" size={12} />
              {t("task.createdLabel", { date: fmtDateTime(task.createdAt) })}
            </span>
            {task.dueDate && (
              <span className={styles.metaItem}>
                <Icon name="calendar" size={12} />
                {fmtDue(task.dueDate, task.dueTime)}
              </span>
            )}
            {task.subtasks.length > 0 && (
              <span className={styles.metaItem}>
                <Icon name="listChecks" size={12} />
                {doneSubtasks}/{task.subtasks.length}
              </span>
            )}
          </div>
        </div>
        <span className={`chip chip-xs ${status.cls}`}>
          <Icon name={status.icon} size={11} />
          {status.label}
        </span>
      </li>
    );
  };

  let content;

  if (authLoading || !user) {
    content = <PageLoader />;
  } else if (!isAdmin || forbidden) {    content = (
      <div className={styles.centerCard}>
        <span className={styles.centerIcon}>
          <Icon name="lock" size={26} />
        </span>
        <h1 className={styles.centerTitle}>{t("admin.restricted")}</h1>
        <Link href="/" className="btn btn-ghost">
          <Icon name="arrowLeft" size={16} className={styles.flipRtl} />
          {t("admin.back")}
        </Link>
      </div>
    );
  } else if (loading) {
    content = <PageLoader label={t("admin.loading")} />;
  } else if (loadError) {
    content = (
      <div className={styles.centerCard}>
        <span className={`${styles.centerIcon} ${styles.centerIconDanger}`}>
          <Icon name="alertTriangle" size={26} />
        </span>
        <h1 className={styles.centerTitle}>{t("admin.loadFailed")}</h1>
        <button type="button" className="btn btn-ghost" onClick={retryUsers}>
          <Icon name="refresh" size={16} />
          {t("common.retry")}
        </button>
      </div>
    );
  } else {
    content = (
      <>
        <header className={`${styles.head} reveal`}>
          <div>
            <span className={styles.eyebrow}>
              <Icon name="shield" size={13} />
              {t("header.admin")}
            </span>
            <h1 className={styles.title}>{t("admin.title")}</h1>
            <p className={styles.subtitle}>{t("admin.subtitle")}</p>
          </div>
          <Link href="/" className="btn btn-ghost btn-sm">
            <Icon name="arrowLeft" size={16} className={styles.flipRtl} />
            {t("admin.back")}
          </Link>
        </header>

        <div className={styles.stats}>
          {stats.map((stat) => (
            <div key={stat.key} className={styles.stat}>
              <span className={`${styles.statIcon} ${stat.tone}`}>
                <Icon name={stat.icon} size={19} />
              </span>
              <div className={styles.statBody}>
                <span className={`${styles.statValue} nums`}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.layout}>
          <section className={styles.panel} aria-labelledby="users-heading">
            <header className={styles.panelHead}>
              <h2 id="users-heading">{t("admin.users")}</h2>
              <span className={styles.panelCount}>{users.length}</span>
            </header>

            {users.length === 0 ? (
              <div className={styles.panelEmpty}>
                <Icon name="users" size={22} />
                <p>{t("admin.noUsers")}</p>
              </div>
            ) : (
              <ul className={styles.userList}>
                {users.map((account) => {
                  const percent = account.taskCount
                    ? Math.round((account.completedCount / account.taskCount) * 100)
                    : 0;
                  const active = selected?.id === account.id;

                  return (
                    <li key={account.id}>
                      <button
                        type="button"
                        className={`${styles.userRow} ${active ? styles.userRowActive : ""}`}
                        onClick={() => openUser(account)}
                        aria-pressed={active}
                        aria-label={`${account.fullName} — ${t("admin.viewTasks")}`}
                      >
                        <span
                          className={`${styles.avatar} ${
                            account.role === "admin" ? styles.avatarAdmin : ""
                          }`}
                          aria-hidden="true"
                        >
                          {initialsOf(account.fullName)}
                        </span>
                        <span className={styles.identity}>
                          <span className={styles.nameLine}>
                            <span
                              className={`${styles.name} ${
                                account.role === "admin" ? "admin-name" : ""
                              }`}
                            >
                              {account.fullName}
                            </span>
                            {account.role === "admin" && (
                              <span className="chip chip-admin chip-xs">
                                <Icon name="shield" size={10} />
                                {t("role.admin")}
                              </span>
                            )}
                          </span>
                          <span className={styles.phone} dir="ltr">
                            {account.phone}
                          </span>
                        </span>
                        <span className={styles.userStats}>
                          <span className={styles.countText}>
                            {t("admin.tasksCount", { count: account.taskCount })}
                          </span>
                          <span className={styles.miniBar}>
                            <span style={{ width: `${percent}%` }} />
                          </span>
                        </span>
                        <Icon
                          name="arrowRight"
                          size={16}
                          className={`${styles.chevron} ${styles.flipRtl}`}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={`${styles.panel} ${styles.detailsPanel}`} aria-labelledby="details-heading">
            <header className={styles.panelHead}>
              <h2 id="details-heading">{t("admin.detailsTitle")}</h2>
              {selected && (
                <span className={styles.readOnly}>
                  <Icon name="lock" size={11} />
                  {t("admin.readOnly")}
                </span>
              )}
            </header>

            <div className={styles.detailsBody} aria-busy={tasksLoading}>
              {!selected ? (
                <div className={styles.placeholder}>
                  <span className={styles.placeholderIcon}>
                    <Icon name="inbox" size={24} />
                  </span>
                  <p>{t("admin.selectPrompt")}</p>
                </div>
              ) : (
                <>
                  <div className={styles.detailHead}>
                    <span
                      className={`${styles.avatar} ${styles.avatarLg} ${
                        selected.role === "admin" ? styles.avatarAdmin : ""
                      }`}
                      aria-hidden="true"
                    >
                      {initialsOf(selected.fullName)}
                    </span>
                    <div className={styles.detailIdentity}>
                      <span
                        className={`${styles.detailName} ${
                          selected.role === "admin" ? "admin-name" : ""
                        }`}
                      >
                        {selected.fullName}
                      </span>
                      <span className={styles.detailSub}>
                        <span dir="ltr">{selected.phone}</span>
                        <span aria-hidden="true">·</span>
                        <span>{t("admin.joined", { date: fmtDate(selected.createdAt) })}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={closeUser}
                      aria-label={t("common.close")}
                      title={t("common.close")}
                    >
                      <Icon name="x" size={17} />
                    </button>
                  </div>

                  <div className={styles.detailChips}>
                    <span className="chip chip-xs">
                      <Icon name="listChecks" size={11} />
                      {t("admin.tasksCount", { count: selected.taskCount })}
                    </span>
                    <span className="chip chip-xs chip-success">
                      <Icon name="checkCircle" size={11} />
                      {selected.completedCount} {t("task.completed")}
                    </span>
                  </div>

                  {tasksLoading ? (
                    <div className={styles.inlineState}>
                      <span className="spinner" />
                      {t("common.loading")}
                    </div>
                  ) : tasksError ? (
                    <div className={styles.inlineState}>
                      <p>{t("admin.loadFailed")}</p>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => openUser(selected)}
                      >
                        <Icon name="refresh" size={14} />
                        {t("common.retry")}
                      </button>
                    </div>
                  ) : sortedTasks.length === 0 ? (
                    <div className={styles.inlineState}>
                      <Icon name="inbox" size={20} />
                      <p>{t("admin.noTasks")}</p>
                    </div>
                  ) : (
                    <ul className={styles.tasks}>{sortedTasks.map(renderTask)}</ul>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main id="main" className={`container app-main ${styles.page}`}>
        {content}
      </main>
    </>
  );
}
