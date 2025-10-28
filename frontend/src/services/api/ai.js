// src/services/api/ai.js
import API from "./http";

export const fetchProjectSummary = async () => {
  const { data } = await API.get("/ai/summary/all");
  return data.summary;
};
