import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

export async function createTask(title, description, assignees = []) {
  const res = await axios.post(`${BASE_URL}/tasks`, {
    title,
    description,
    assignees,
  });
  return res.data;
}

export async function createSubtask(taskId, title, startDate, endDate) {
  const res = await axios.post(`${BASE_URL}/tasks/${taskId}/subtasks`, {
    title,
    start_date: startDate,
    end_date: endDate,
  });
  return res.data;
}

export async function createSubDetail(subtaskId, title, startDate, endDate) {
  const res = await axios.post(`${BASE_URL}/subtasks/${subtaskId}/details`, {
    title,
    start_date: startDate,
    end_date: endDate,
  });
  return res.data;
}

export async function getTasks() {
  const res = await axios.get(`${BASE_URL}/tasks`);
  return res.data;
}

export async function getTaskDetail(taskId) {
  const res = await axios.get(`${BASE_URL}/tasks/${taskId}`);
  return res.data;
}

export async function deleteDetail(detailId) {
  const res = await axios.delete(`${BASE_URL}/details/${detailId}`);
  return res.data;
}
