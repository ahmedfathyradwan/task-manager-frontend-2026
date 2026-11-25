"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import AddTask from "./components/AddTask";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TASKS_ENDPOINT = `${API_URL}/api/tasks`;

const apiRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

export default function Home() {
  const [showAddTask, setShowAddTask] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await apiRequest(TASKS_ENDPOINT);
        setTasks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleAddTask = async (title) => {
    try {
      setError("");

      const newTask = await apiRequest(TASKS_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({ title }),
      });

      setTasks((prevTasks) => [newTask, ...prevTasks]);
      setShowAddTask(false);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const handleToggleTask = async (id) => {
    try {
      setError("");

      const updatedTask = await apiRequest(`${TASKS_ENDPOINT}/${id}`, {
        method: "PATCH",
      });

      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === id ? updatedTask : task))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      setError("");

      await apiRequest(`${TASKS_ENDPOINT}/${id}`, { method: "DELETE" });

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Task Manager</h1>

      <button
        className={styles.button}
        onClick={() => setShowAddTask(!showAddTask)}
      >
        Add New Task
      </button>

      {showAddTask && (
        <AddTask onAddTask={handleAddTask} />
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.taskList}>
        {loading && <p className={styles.info}>Loading tasks...</p>}

        {!loading && tasks.length === 0 && (
          <p className={styles.info}>No tasks yet. Add your first task.</p>
        )}

        {tasks.map((task) => (
          <div key={task.id} className={styles.taskItem}>
            <div>
              <h3
                className={
                  task.status === "completed" ? styles.completed : undefined
                }
              >
                {task.title}
              </h3>
              <p className={styles.taskMeta}>Status: {task.status}</p>
              <p className={styles.taskMeta}>
                Date: {new Date(task.date).toLocaleDateString("en-GB")}
              </p>
            </div>

            <div className={styles.taskActions}>
              <button
                className={styles.actionButton}
                onClick={() => handleToggleTask(task.id)}
              >
                {task.status === "completed"
                  ? "Mark as Pending"
                  : "Mark as Completed"}
              </button>

              <button
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={() => handleDeleteTask(task.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
