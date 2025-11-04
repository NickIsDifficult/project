import api from "./http";

/* -------------------------------------------
 * 🧩 공용 요청 래퍼 + 유틸 함수
 * ------------------------------------------- */
const request = async (fn, context = "요청") => {
  try {
    const res = await fn();
    return res.data;
  } catch (error) {
    console.error(`❌ [${context}] API 요청 실패:`, error);
    throw new Error(`${context} 중 오류 발생: ${error.message}`);
  }
};

// ✅ 숫자형 ID 보장
const ensureInt = (value, name = "ID") => {
  // 객체 형태로 들어오는 경우 내부에서 실제 ID 추출
  if (typeof value === "object" && value !== null) {
    const extracted =
      value.task_id || value.id || value.value || value.taskId || value[name];
    if (extracted !== undefined) {
      value = extracted;
    }
  }

  const num = Number(value);
  if (isNaN(num)) {
    console.error(`🚨 잘못된 ${name} 값:`, value);
    throw new Error(`${name}는 숫자여야 합니다 (현재: ${typeof value})`);
  }
  return num;
};

// ✅ 태스크 Payload 정규화 (422 방지용)
const normalizeTaskPayload = (data = {}) => {
  const safe = { ...data };

  // ✅ 단일 담당자 → 다중 담당자 구조 반영
  // 기존 assignee_emp_id 제거됨
  // assignee_ids는 배열 형태 유지
  if (!Array.isArray(safe.assignee_ids)) {
    safe.assignee_ids = safe.assignee_ids ? [safe.assignee_ids] : [];
  }

  // 숫자형 필드 캐스팅
  const intFields = ["parent_task_id", "progress"];
  const floatFields = ["estimate_hours"];

  for (const key of intFields) {
    if (key in safe) {
      const v = safe[key];
      safe[key] = v === "" || v == null ? null : Number(v);
    }
  }

  for (const key of floatFields) {
    if (key in safe) {
      const v = safe[key];
      safe[key] = v === "" || v == null ? null : parseFloat(v);
    }
  }

  // 날짜 빈문자 → null
  if ("start_date" in safe && safe.start_date === "") safe.start_date = null;
  if ("due_date" in safe && safe.due_date === "") safe.due_date = null;

  return safe;
};

/* -------------------------------------------
 * 📋 TASKS (업무)
 * ------------------------------------------- */

// ✅ 프로젝트별 평면 태스크 목록
export const getTasks = projectId =>
  request(() => api.get(`/projects/${ensureInt(projectId, "projectId")}/tasks`), "태스크 목록");

// ✅ 트리형 태스크 목록
export const getTaskTree = projectId =>
  request(
    () => api.get(`/projects/${ensureInt(projectId, "projectId")}/tasks/tree`),
    "트리형 태스크 목록",
  );

// ✅ 개별 태스크 상세
export const getTask = (projectId, taskId) =>
  request(
    () =>
      api.get(
        `/projects/${ensureInt(projectId, "projectId")}/tasks/${ensureInt(taskId, "taskId")}`,
      ),
    "태스크 상세",
  );

// ✅ 새 태스크 등록
export const createTask = (projectId, taskData) =>
  request(
    () =>
      api.post(
        `/projects/${ensureInt(projectId, "projectId")}/tasks`,
        normalizeTaskPayload(taskData),
      ),
    "태스크 생성",
  );

// ✅ 태스크 수정
export const updateTask = (projectId, taskId, taskData) =>
  request(
    () =>
      api.put(
        `/projects/${ensureInt(projectId, "projectId")}/tasks/${ensureInt(taskId, "taskId")}`,
        normalizeTaskPayload(taskData),
      ),
    "태스크 수정",
  );

// ✅ 태스크 삭제
export const deleteTask = (projectId, taskId) =>
  request(
    () =>
      api.delete(
        `/projects/${ensureInt(projectId, "projectId")}/tasks/${ensureInt(taskId, "taskId")}`,
      ),
    "태스크 삭제",
  );

// ✅ 상태 변경
export const updateTaskStatus = (projectId, taskId, newStatus) =>
  request(
    () =>
      api.patch(
        `/projects/${ensureInt(projectId, "projectId")}/tasks/${ensureInt(taskId, "taskId")}/status`,
        { status: newStatus },
      ),
    "태스크 상태 변경",
  );

// ✅ 진행률 변경
export const updateTaskProgress = (projectId, taskId, progress) =>
  request(
    () =>
      api.patch(
        `/projects/${ensureInt(projectId, "projectId")}/tasks/${ensureInt(taskId, "taskId")}/progress`,
        { progress: Number(progress) },
      ),
    "태스크 진행률 변경",
  );

/* -------------------------------------------
 * 💬 COMMENTS (댓글)
 * ------------------------------------------- */

export const getComments = (projectId, taskId) =>
  request(
    () =>
      api.get(
        `/projects/${ensureInt(projectId, "projectId")}/tasks/${ensureInt(taskId, "taskId")}/comments`,
      ),
    "댓글 목록",
  );

export const createComment = (projectId, taskId, body) =>
  request(
    () =>
      api.post(
        `/projects/${ensureInt(projectId, "projectId")}/tasks/${ensureInt(taskId, "taskId")}/comments`,
        body,
      ),
    "댓글 작성",
  );

export const updateComment = (projectId, taskId, commentId, body) =>
  request(
    () =>
      api.put(
        `/projects/${ensureInt(projectId, "projectId")}/tasks/${ensureInt(taskId, "taskId")}/comments/${ensureInt(commentId, "commentId")}`,
        body,
      ),
    "댓글 수정",
  );

export const deleteComment = (projectId, taskId, commentId) =>
  request(
    () =>
      api.delete(
        `/projects/${ensureInt(projectId, "projectId")}/tasks/${ensureInt(taskId, "taskId")}/comments/${ensureInt(commentId, "commentId")}`,
      ),
    "댓글 삭제",
  );

/* -------------------------------------------
 * 📎 ATTACHMENTS (첨부파일)
 * ------------------------------------------- */

export const getAttachments = (projectId, taskId) =>
  request(
    () =>
      api.get(
        `/projects/${ensureInt(projectId, "projectId")}/tasks/${ensureInt(taskId, "taskId")}/attachments`,
      ),
    "첨부파일 목록",
  );

export const uploadAttachment = (projectId, taskId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return request(
    () =>
      api.post(
        `/projects/${ensureInt(projectId, "projectId")}/tasks/${ensureInt(taskId, "taskId")}/attachments`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      ),
    "첨부파일 업로드",
  );
};

export const deleteAttachment = (projectId, taskId, attachmentId) =>
  request(
    () =>
      api.delete(
        `/projects/${ensureInt(projectId, "projectId")}/tasks/${ensureInt(taskId, "taskId")}/attachments/${ensureInt(attachmentId, "attachmentId")}`,
      ),
    "첨부파일 삭제",
  );
