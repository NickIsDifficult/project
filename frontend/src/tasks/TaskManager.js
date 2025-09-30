import React, { useState, useEffect } from "react";
import TaskList from "./TaskList";
import TaskDetail from "./TaskDetail";
import "./TaskDrawer.css";
import "./TaskForm.css";

export default function TaskManager() {
  const [selectedTask, setSelectedTask] = useState(null);
  const [open, setOpen] = useState(false);

  function TaskRegistration({ onClose }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignees, setAssignees] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [subtasks, setSubtasks] = useState([
      {
        title: "",
        startDate: "",
        endDate: "",
        details: [{ title: "", startDate: "", endDate: "" }],
      },
    ]);

    useEffect(() => {
      setEmployees([
        { emp_id: 1, name: "홍길동" },
        { emp_id: 2, name: "김철수" },
        { emp_id: 3, name: "이영희" },
      ]);
    }, []);

    const toggleAssignee = (id) => {
      setAssignees((prev) =>
        prev.includes(id) ? prev.filter((emp) => emp !== id) : [...prev, id]
      );
    };

    const handleSubtaskChange = (index, field, value) => {
      setSubtasks((prev) => {
        const next = [...prev];
        next[index][field] = value;
        return next;
      });
    };

    const handleDetailChange = (subIndex, detailIndex, field, value) => {
      setSubtasks((prev) => {
        const next = [...prev];
        next[subIndex].details[detailIndex][field] = value;
        return next;
      });
    };

    const handleAddSubtask = () => {
      setSubtasks((prev) => [
        ...prev,
        {
          title: "",
          startDate: "",
          endDate: "",
          details: [{ title: "", startDate: "", endDate: "" }],
        },
      ]);
    };

    const handleAddSubDetail = (subIndex) => {
      setSubtasks((prev) => {
        const next = [...prev];
        next[subIndex].details.push({
          title: "",
          startDate: "",
          endDate: "",
        });
        return next;
      });
    };

    const handleSubmit = () => {
      console.log("상위 업무:", title);
      console.log("내용:", description);
      console.log("담당자:", assignees);
      console.log("하위업무:", subtasks);
      alert("프론트 테스트 완료!");
      onClose();
    };

    return (
      <div className="drawer__body task-form">
        <h2>📌 업무 등록</h2>

        <label>업무 제목</label>
        <input
          placeholder="업무 제목 입력"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
        />

        <label>업무 내용</label>
        <textarea
          placeholder="업무 내용 입력"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          className="textarea"
        />

        <label>담당자 지정</label>
        <div className="assignee-list">
          {employees.map((emp) => (
            <label key={emp.emp_id} className="assignee-item">
              <input
                type="checkbox"
                checked={assignees.includes(emp.emp_id)}
                onChange={() => toggleAssignee(emp.emp_id)}
              />
              {emp.name}
            </label>
          ))}
        </div>

        {subtasks.map((sub, subIndex) => (
          <div key={subIndex} className="subtask-box">
            <input
              placeholder="하위 업무 제목"
              value={sub.title}
              onChange={(e) =>
                handleSubtaskChange(subIndex, "title", e.target.value)
              }
              className="input"
            />
            <div className="date-range">
              <input
                type="date"
                value={sub.startDate}
                onChange={(e) =>
                  handleSubtaskChange(subIndex, "startDate", e.target.value)
                }
              />
              <span>~</span>
              <input
                type="date"
                value={sub.endDate}
                onChange={(e) =>
                  handleSubtaskChange(subIndex, "endDate", e.target.value)
                }
              />
            </div>

            {sub.details.map((d, detailIndex) => (
              <div key={detailIndex} className="detail-box">
                <input
                  placeholder="세부 업무 제목"
                  value={d.title}
                  onChange={(e) =>
                    handleDetailChange(
                      subIndex,
                      detailIndex,
                      "title",
                      e.target.value
                    )
                  }
                  className="input"
                />
                <div className="date-range">
                  <input
                    type="date"
                    value={d.startDate}
                    onChange={(e) =>
                      handleDetailChange(
                        subIndex,
                        detailIndex,
                        "startDate",
                        e.target.value
                      )
                    }
                  />
                  <span>~</span>
                  <input
                    type="date"
                    value={d.endDate}
                    onChange={(e) =>
                      handleDetailChange(
                        subIndex,
                        detailIndex,
                        "endDate",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() => handleAddSubDetail(subIndex)}
              className="btn secondary"
              type="button"
            >
              ➕ 세부 업무 추가
            </button>
          </div>
        ))}

        <button onClick={handleAddSubtask} className="btn secondary" type="button">
          ➕ 하위 업무 추가
        </button>

        <div className="drawer__footer">
          <button onClick={handleSubmit} className="btn primary" type="button">
            저장
          </button>
          <button onClick={onClose} className="btn secondary" type="button">
            취소
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="task-manager">
      <h1 className="page-title">프로젝트 대시보드</h1>

      <button className="btn primary" onClick={() => setOpen(true)} type="button">
        업무 등록
      </button>

      <TaskList onSelectTask={setSelectedTask} />
      {selectedTask && <TaskDetail task={selectedTask} />}

      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <aside className={`drawer ${open ? "open" : ""}`}>
        <div className="drawer__header">
          <h2>업무 등록</h2>
          <button className="close" onClick={() => setOpen(false)} type="button">
            ✕
          </button>
        </div>
        <TaskRegistration onClose={() => setOpen(false)} />
      </aside>
    </div>
  );
}
