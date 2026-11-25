
"use client";

import { useState } from "react";
import styles from "./AddTask.module.css";

export default function AddTask({ onAddTask }) {
  const [title, setTitle] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) return;

    const wasAdded = await onAddTask(title.trim());

    if (wasAdded !== false) setTitle("");
  };

  return (
    <form className={styles.addTaskForm} onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter a new task..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <button type="submit">Add Task</button>
    </form>
  );
}
