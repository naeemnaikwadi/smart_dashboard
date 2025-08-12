import React, { useState, useEffect } from "react";
import { CheckCircle, Circle, Clock, AlertCircle, Plus, X } from "lucide-react";

const WhatToDoList = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Complete Module 3 of Data Structures", due: "Today", priority: "high", completed: false },
    { id: 2, title: "Attend AI Live Session", due: "Tomorrow", priority: "medium", completed: false },
    { id: 3, title: "Download Web Dev Certificate", due: "This Week", priority: "low", completed: false },
    { id: 4, title: "Take Quiz: Machine Learning", due: "Friday", priority: "high", completed: false },
    { id: 5, title: "Review Python Fundamentals", due: "Next Week", priority: "medium", completed: false },
  ]);
  const [newTask, setNewTask] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState("all"); // all, pending, completed

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "text-red-600 dark:text-red-400";
      case "medium": return "text-yellow-600 dark:text-yellow-400";
      case "low": return "text-green-600 dark:text-green-400";
      default: return "text-gray-600 dark:text-gray-400";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high": return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case "medium": return <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case "low": return <Circle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      default: return <Circle className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = () => {
    if (newTask.trim()) {
      const task = {
        id: Date.now(),
        title: newTask.trim(),
        due: "This Week",
        priority: "medium",
        completed: false
      };
      setTasks([...tasks, task]);
      setNewTask("");
      setShowAddForm(false);
    }
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === "completed") return task.completed;
    if (filter === "pending") return !task.completed;
    return true;
  });

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">What to Do</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completedCount}/{totalCount}
          </span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            filter === "all" 
              ? "bg-blue-600 text-white" 
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            filter === "pending" 
              ? "bg-blue-600 text-white" 
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            filter === "completed" 
              ? "bg-blue-600 text-white" 
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          }`}
        >
          Completed
        </button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add new task..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
            />
            <button
              onClick={addTask}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <ul className="space-y-3 max-h-48 overflow-y-auto">
        {filteredTasks.map((task) => (
          <li 
            key={task.id} 
            className={`p-3 rounded-lg flex items-center gap-3 transition-all ${
              task.completed 
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" 
                : "bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
            }`}
          >
            <button
              onClick={() => toggleTask(task.id)}
              className="flex-shrink-0"
            >
              {task.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${
                task.completed 
                  ? "text-green-800 dark:text-green-200 line-through" 
                  : "text-gray-800 dark:text-gray-200"
              }`}>
                {task.title}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                  {task.due}
                </span>
                {getPriorityIcon(task.priority)}
              </div>
            </div>

            <button
              onClick={() => deleteTask(task.id)}
              className="flex-shrink-0 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </li>
        ))}
      </ul>

      {filteredTasks.length === 0 && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
          {filter === "all" ? "No tasks yet" : 
           filter === "completed" ? "No completed tasks" : "No pending tasks"}
        </div>
      )}
    </div>
  );
};

export default WhatToDoList;
