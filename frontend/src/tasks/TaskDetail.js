import React from "react";

export default function TaskDetail({ task }) {
  return (
    <div className="task-detail">
      <h2 className="section-title">업무 상세</h2>
      <article>
        <h3>{task.title}</h3>
        <p className="description">{task.description}</p>

        <div className="detail-section">
          <h4>담당자</h4>
          <ul>
            {task.assignees?.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>

        <div className="detail-section">
          <h4>하위 업무</h4>
          {task.subtasks?.length ? (
            <ul>
              {task.subtasks.map((subtask) => (
                <li key={subtask.id}>
                  <div className="subtask-header">
                    <strong>{subtask.title}</strong>
                    <span>
                      {subtask.startDate} ~ {subtask.endDate}
                    </span>
                  </div>
                  {subtask.details?.length ? (
                    <ul className="detail-list">
                      {subtask.details.map((detail) => (
                        <li key={detail.id}>
                          <span>{detail.title}</span>
                          <span>
                            {detail.startDate} ~ {detail.endDate}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty">세부 업무가 없습니다.</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">등록된 하위 업무가 없습니다.</p>
          )}
        </div>
      </article>
    </div>
  );
}
