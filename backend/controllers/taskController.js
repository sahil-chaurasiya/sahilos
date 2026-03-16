const asyncHandler = require("../middleware/asyncHandler");
const Task = require("../models/Task");
const { logActivity } = require("../utils/activityLogger");
const { getPagination } = require("../utils/pagination");
const { invalidateDashboardCache } = require("./dashboardController");
const { evaluateAchievements } = require("../utils/achievementEngine");

/**
 * @desc    Get all tasks (paginated, filterable)
 * @route   GET /api/tasks
 * @query   page, limit, status, priority, projectId, tag, search
 * @access  Private
 */
const getTasks = asyncHandler(async (req, res) => {
  const { skip, limit, getPaginationMeta } = getPagination(req.query);
  const { status, priority, projectId, tag, search } = req.query;

  const filter = { userId: req.user._id, isDeleted: false };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (projectId) filter.projectId = projectId;
  if (tag) filter.tags = { $in: [tag] };
  if (search) filter.title = { $regex: search, $options: "i" };

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate("projectId", "title color")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Task.countDocuments(filter),
  ]);

  res.json({
    success: true,
    pagination: getPaginationMeta(total),
    data: tasks,
  });
});

/**
 * @desc    Get single task
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isDeleted: false,
  }).populate("projectId", "title color");

  if (!task) {
    res.statusCode = 404;
    throw new Error("Task not found");
  }

  res.json({ success: true, data: task });
});

/**
 * @desc    Create task
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = asyncHandler(async (req, res) => {
  const { title, description, priority, status, dueDate, tags, projectId, subtasks } =
    req.body;

  if (!title) {
    res.statusCode = 400;
    throw new Error("Task title is required");
  }

  const task = await Task.create({
    userId: req.user._id,
    title,
    description,
    priority,
    status,
    dueDate,
    tags,
    projectId: projectId || null,
    subtasks,
  });

  logActivity(req.user._id, "task_created", task._id, task.title);
  invalidateDashboardCache(req.user._id);
  res.status(201).json({ success: true, data: task });
});

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isDeleted: false,
  });

  if (!task) {
    res.statusCode = 404;
    throw new Error("Task not found");
  }

  const allowedFields = [
    "title", "description", "priority", "status",
    "dueDate", "tags", "projectId", "subtasks",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });

  await task.save();

  // Log completion specifically
  if (req.body.status === "done") {
    logActivity(req.user._id, "task_completed", task._id, task.title);
  }
  invalidateDashboardCache(req.user._id);
  res.json({ success: true, data: task });
});

/**
 * @desc    Patch task status only (kanban drag-drop)
 * @route   PATCH /api/tasks/:id/status
 * @access  Private
 */
const patchStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["todo", "in-progress", "review", "done"];

  if (!status || !validStatuses.includes(status)) {
    res.statusCode = 400;
    throw new Error(`Status must be one of: ${validStatuses.join(", ")}`);
  }

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, isDeleted: false },
    { status },
    { new: true }
  );

  if (!task) {
    res.statusCode = 404;
    throw new Error("Task not found");
  }

  if (status === "done") {
    logActivity(req.user._id, "task_completed", task._id, task.title);
    evaluateAchievements(req.user._id);
  }
  invalidateDashboardCache(req.user._id);
  res.json({ success: true, data: task });
});

/**
 * @desc    Toggle a subtask's done state
 * @route   PATCH /api/tasks/:id/subtasks/:subtaskId
 * @access  Private
 */
const toggleSubtask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    userId: req.user._id,
    isDeleted: false,
  });

  if (!task) {
    res.statusCode = 404;
    throw new Error("Task not found");
  }

  const subtask = task.subtasks.id(req.params.subtaskId);
  if (!subtask) {
    res.statusCode = 404;
    throw new Error("Subtask not found");
  }

  subtask.done = !subtask.done;
  await task.save();

  res.json({ success: true, data: task });
});

/**
 * @desc    Soft delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );

  if (!task) {
    res.statusCode = 404;
    throw new Error("Task not found");
  }
  invalidateDashboardCache(req.user._id);
  res.json({ success: true, message: "Task deleted" });
});

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  patchStatus,
  toggleSubtask,
  deleteTask,
};
