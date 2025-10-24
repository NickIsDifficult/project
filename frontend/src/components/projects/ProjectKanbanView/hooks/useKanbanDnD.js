// src/components/projects/ProjectKanbanView/hooks/useKanbanDnD.js
import { useCallback } from "react";
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../../../context/ProjectGlobalContext";
import { useAuth } from "../../../../hooks/useAuth";
import { updateProject } from "../../../../services/api/project";
import { updateTaskStatus } from "../../../../services/api/task";

export function useKanbanDnD() {
  const { projects, tasksByProject, updateProjectLocal, updateTaskLocal } = useProjectGlobal();
  const { currentUser } = useAuth();

  const handleDragEnd = useCallback(
    async ({ destination, source, draggableId }) => {
      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index)
        return;

      const newStatus = destination.droppableId.toUpperCase();
      const [dragType, rawId] = String(draggableId).split("-");
      const id = Number(rawId);

      let draggedItem = null;
      let parentProjectId = null;

      try {
        // 1️⃣ 드래그된 아이템 탐색
        if (dragType === "project") {
          draggedItem = projects.find(p => Number(p.project_id) === id);
          if (!draggedItem) throw new Error("프로젝트를 찾을 수 없습니다.");
          parentProjectId = draggedItem.project_id;
        } else if (dragType === "task") {
          draggedItem = Object.values(tasksByProject || {})
            .flat()
            .flatMap(t => flattenTasks(t))
            .find(t => Number(t.task_id) === id);

          if (!draggedItem) throw new Error("업무(Task)를 찾을 수 없습니다.");
          parentProjectId = draggedItem.project_id ?? null;
        }

        // 2️⃣ 권한 체크
        const userId = Number(currentUser?.emp_id);
        if (!userId || Number.isNaN(userId)) {
          // 프론트에서 막지 않고 서버로 요청을 보냄
          if (dragType === "project") {
            updateProjectLocal(id, { status: newStatus });
            try {
              await updateProject(id, { status: newStatus });
              toast.success("상태 변경 완료 ✅");
            } catch (err) {
              console.error("서버 검증 실패:", err);
              toast.error("상태 변경 실패 (권한 거부)");
            }
          } else {
            if (!draggedItem?.project_id) return;
            updateTaskLocal(id, { status: newStatus });
            try {
              await updateTaskStatus(draggedItem.project_id, id, newStatus);
              toast.success("상태 변경 완료 ✅");
            } catch (err) {
              console.error("서버 검증 실패:", err);
              toast.error("상태 변경 실패 (권한 거부)");
            }
          }
          return;
        }
        const projectRec =
          dragType === "project"
            ? draggedItem
            : projects.find(p => Number(p.project_id) === Number(parentProjectId));

        const isOwner = Number(projectRec?.owner_emp_id) === userId;

        // ✅ 다양한 member 필드명 대응
        const members =
          projectRec?.projectmember || projectRec?.project_members || projectRec?.members || [];

        const isManagerOrMember = Array.isArray(members)
          ? members.some(m => {
              const mid = Number(m.emp_id) || Number(m.employee_id) || Number(m.id);
              const role = String(m.role || m.role_name || m.member_role || "").toUpperCase();
              return (
                mid === userId &&
                (role.includes("OWNER") || role.includes("MANAGER") || role.includes("MEMBER"))
              );
            })
          : false;

        const isAssignee =
          dragType === "task" &&
          Array.isArray(draggedItem?.assignees) &&
          draggedItem.assignees.some(a => {
            const aid =
              Number(a.emp_id) || Number(a.employee_id) || Number(a.empId) || Number(a.id);
            return aid === userId;
          });

        // ✅ ADMIN 역할 추가 허용
        const isAdmin = ["ADMIN", "SUPERADMIN", "SUPER_ADMIN"].includes(
          String(currentUser?.role || currentUser?.role_name || "").toUpperCase(),
        );

        const canMove = isOwner || isManagerOrMember || isAssignee || isAdmin;

        if (!canMove) {
          console.warn("⚠️ 권한 없음:", { userId, draggedItem, projectRec });
          toast.error("이 항목을 이동할 권한이 없습니다 ❌");
          return;
        }

        // 3️⃣ 낙관적 UI 업데이트 + 서버 반영
        if (dragType === "project") {
          updateProjectLocal(id, { status: newStatus });
          await updateProject(id, { status: newStatus });
        } else {
          if (!parentProjectId) {
            toast.error("🚨 프로젝트 ID를 찾을 수 없습니다.");
            return;
          }
          updateTaskLocal(id, { status: newStatus });
          await updateTaskStatus(parentProjectId, id, newStatus);
        }

        toast.success("상태 변경 완료 ✅");
      } catch (err) {
        console.error("❌ 상태 변경 실패:", err);
        toast.error("상태 변경 중 오류가 발생했습니다.");
      }
    },
    [projects, tasksByProject, updateProjectLocal, updateTaskLocal, currentUser],
  );

  return handleDragEnd;
}

/* 하위업무 평탄화 유틸 */
function flattenTasks(node) {
  if (!node) return [];
  const stack = Array.isArray(node) ? [...node] : [node];
  const out = [];
  while (stack.length) {
    const t = stack.shift();
    if (!t) continue;
    out.push(t);
    if (Array.isArray(t.subtasks) && t.subtasks.length) {
      stack.push(...t.subtasks);
    }
  }
  return out;
}
