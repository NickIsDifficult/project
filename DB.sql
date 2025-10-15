```sql
-- 1) 부모 테이블 (의존성 없음)
CREATE TABLE `department` (
  `dept_id` int NOT NULL AUTO_INCREMENT,
  `dept_name` varchar(50) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`dept_id`),
  UNIQUE KEY `dept_name` (`dept_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `role` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2) department/role을 참조
CREATE TABLE `employee` (
  `emp_id` int NOT NULL AUTO_INCREMENT,
  `emp_no` varchar(20) NOT NULL,
  `dept_id` int NOT NULL,
  `role_id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mobile` varchar(20) NOT NULL,
  `hire_date` date DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`emp_id`),
  UNIQUE KEY `emp_no` (`emp_no`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `mobile` (`mobile`),
  KEY `dept_id` (`dept_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`dept_id`) REFERENCES `department` (`dept_id`),
  CONSTRAINT `employee_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `external_person` (
  `ext_id` int NOT NULL AUTO_INCREMENT,
  `ext_no` varchar(20) NOT NULL,
  `dept_id` int NOT NULL,
  `role_id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mobile` varchar(20) NOT NULL,
  `company` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ext_id`),
  UNIQUE KEY `ext_no` (`ext_no`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `mobile` (`mobile`),
  KEY `dept_id` (`dept_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `external_person_ibfk_1` FOREIGN KEY (`dept_id`) REFERENCES `department` (`dept_id`),
  CONSTRAINT `external_person_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3) employee를 참조
CREATE TABLE `project` (
  `project_id` int NOT NULL AUTO_INCREMENT,
  `project_name` varchar(200) NOT NULL,
  `description` text,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('PLANNED','IN_PROGRESS','ON_HOLD','COMPLETED') DEFAULT 'PLANNED',
  `owner_emp_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`project_id`),
  KEY `owner_emp_id` (`owner_emp_id`),
  CONSTRAINT `project_ibfk_1` FOREIGN KEY (`owner_emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4) project/employee를 참조 (self FK 포함)
CREATE TABLE `task` (
  `task_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `title` varchar(300) NOT NULL,
  `description` text,
  `assignee_emp_id` int DEFAULT NULL,
  `priority` enum('LOW','MEDIUM','HIGH','URGENT') DEFAULT 'MEDIUM',
  `status` enum('TODO','IN_PROGRESS','REVIEW','DONE') DEFAULT 'TODO',
  `parent_task_id` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `estimate_hours` decimal(6,2) DEFAULT '0.00',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`task_id`),
  KEY `project_id` (`project_id`),
  KEY `assignee_emp_id` (`assignee_emp_id`),
  KEY `parent_task_id` (`parent_task_id`),
  CONSTRAINT `task_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`project_id`),
  CONSTRAINT `task_ibfk_2` FOREIGN KEY (`assignee_emp_id`) REFERENCES `employee` (`emp_id`),
  CONSTRAINT `task_ibfk_3` FOREIGN KEY (`parent_task_id`) REFERENCES `task` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE task ADD COLUMN progress INT DEFAULT 0; -- 0~100%

-- 5) project를 참조
CREATE TABLE `milestone` (
  `milestone_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `due_date` date DEFAULT NULL,
  `status` enum('PLANNED','ACHIEVED','MISSED') DEFAULT 'PLANNED',
  PRIMARY KEY (`milestone_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `milestone_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 6) department/role을 참조
CREATE TABLE `department_permission` (
  `dept_id` int NOT NULL,
  `role_id` int NOT NULL,
  `permission` enum('READ','WRITE','APPROVE') NOT NULL,
  PRIMARY KEY (`dept_id`,`role_id`,`permission`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `department_permission_ibfk_1` FOREIGN KEY (`dept_id`) REFERENCES `department` (`dept_id`),
  CONSTRAINT `department_permission_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 7) department 참조
CREATE TABLE `notice` (
  `notice_id` int NOT NULL AUTO_INCREMENT,
  `dept_id` int NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `content` text,
  `reg_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `read_count` int DEFAULT '0',
  PRIMARY KEY (`notice_id`),
  KEY `dept_id` (`dept_id`),
  CONSTRAINT `notice_ibfk_1` FOREIGN KEY (`dept_id`) REFERENCES `department` (`dept_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 8) employee/department 참조
CREATE TABLE `attendance` (
  `att_id` int NOT NULL AUTO_INCREMENT,
  `emp_id` int NOT NULL,
  `dept_id` int NOT NULL,
  `work_date` date NOT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `att_type` enum('WORK','VACATION','HOLIDAY') DEFAULT 'WORK',
  `late` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`att_id`),
  KEY `emp_id` (`emp_id`),
  KEY `dept_id` (`dept_id`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`),
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`dept_id`) REFERENCES `department` (`dept_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 9) employee/department 참조
CREATE TABLE `schedule` (
  `schedule_id` int NOT NULL AUTO_INCREMENT,
  `emp_id` int NOT NULL,
  `dept_id` int NOT NULL,
  `type` enum('MEETING','TASK','REMINDER') NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `content` text,
  `memo` text,
  `checked` tinyint(1) DEFAULT '0',
  `start_datetime` datetime DEFAULT NULL,
  `end_datetime` datetime DEFAULT NULL,
  PRIMARY KEY (`schedule_id`),
  KEY `emp_id` (`emp_id`),
  KEY `dept_id` (`dept_id`),
  CONSTRAINT `schedule_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`),
  CONSTRAINT `schedule_ibfk_2` FOREIGN KEY (`dept_id`) REFERENCES `department` (`dept_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 10) project/employee 참조
CREATE TABLE `project_member` (
  `project_id` int NOT NULL,
  `emp_id` int NOT NULL,
  `role` enum('OWNER','MANAGER','MEMBER','VIEWER') DEFAULT 'MEMBER',
  PRIMARY KEY (`project_id`,`emp_id`),
  KEY `emp_id` (`emp_id`),
  CONSTRAINT `project_member_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`project_id`),
  CONSTRAINT `project_member_ibfk_2` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 11) department/employee 참조
CREATE TABLE `approval_document` (
  `app_doc_id` int NOT NULL AUTO_INCREMENT,
  `dept_id` int NOT NULL,
  `emp_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `doc_type` varchar(50) DEFAULT NULL,
  `doc_pass` varchar(50) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `close_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`app_doc_id`),
  KEY `dept_id` (`dept_id`),
  KEY `emp_id` (`emp_id`),
  CONSTRAINT `approval_document_ibfk_1` FOREIGN KEY (`dept_id`) REFERENCES `department` (`dept_id`),
  CONSTRAINT `approval_document_ibfk_2` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `app_file` (
  `file_id` int NOT NULL AUTO_INCREMENT,
  `app_doc_id` int NOT NULL,
  `file_name` varchar(200) DEFAULT NULL,
  `file_path` varchar(1024) DEFAULT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `file_uid` varchar(50) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`file_id`),
  KEY `app_doc_id` (`app_doc_id`),
  CONSTRAINT `app_file_ibfk_1` FOREIGN KEY (`app_doc_id`) REFERENCES `approval_document` (`app_doc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `app_processing` (
  `processing_id` int NOT NULL AUTO_INCREMENT,
  `app_doc_id` int NOT NULL,
  `emp_id` int NOT NULL,
  `role_type` enum('MANAGER','TEAM_LEAD','CEO') NOT NULL,
  `status` enum('APPROVED','REJECTED','PENDING') DEFAULT 'PENDING',
  `process_type` enum('NORMAL','URGENT') DEFAULT 'NORMAL',
  `comment_text` text,
  `process_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `process_order` int DEFAULT NULL,
  PRIMARY KEY (`processing_id`),
  KEY `app_doc_id` (`app_doc_id`),
  KEY `emp_id` (`emp_id`),
  CONSTRAINT `app_processing_ibfk_1` FOREIGN KEY (`app_doc_id`) REFERENCES `approval_document` (`app_doc_id`),
  CONSTRAINT `app_processing_ibfk_2` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 12) project/task/employee 참조
CREATE TABLE `attachment` (
  `attachment_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int DEFAULT NULL,
  `task_id` int DEFAULT NULL,
  `uploaded_by` int DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(1024) NOT NULL,
  `file_size` bigint DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`attachment_id`),
  KEY `fk_attachment_project` (`project_id`),
  KEY `fk_attachment_task` (`task_id`),
  KEY `fk_attachment_employee` (`uploaded_by`),
  CONSTRAINT `fk_attachment_employee` FOREIGN KEY (`uploaded_by`) REFERENCES `employee` (`emp_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attachment_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attachment_task` FOREIGN KEY (`task_id`) REFERENCES `task` (`task_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 13) task/employee/project 참조
CREATE TABLE `task_comment` (
  `comment_id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `emp_id` int NOT NULL,
  `parent_comment_id` int DEFAULT NULL,
  `content` text NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  PRIMARY KEY (`comment_id`),
  KEY `emp_id` (`emp_id`),
  KEY `idx_task_comment_task` (`task_id`),
  KEY `idx_task_comment_parent` (`parent_comment_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `task_comment_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `task` (`task_id`),
  CONSTRAINT `task_comment_ibfk_2` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`),
  CONSTRAINT `task_comment_ibfk_3` FOREIGN KEY (`project_id`) REFERENCES `project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 14) task/employee 참조
CREATE TABLE `task_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `old_status` enum('TODO','IN_PROGRESS','REVIEW','DONE') DEFAULT NULL,
  `new_status` enum('TODO','IN_PROGRESS','REVIEW','DONE') DEFAULT NULL,
  `changed_by` int DEFAULT NULL,
  `changed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`history_id`),
  KEY `task_id` (`task_id`),
  KEY `changed_by` (`changed_by`),
  KEY `ix_task_history_history_id` (`history_id`),
  CONSTRAINT `task_history_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `task` (`task_id`),
  CONSTRAINT `task_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 15) employee/project/task 참조
CREATE TABLE `activity_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `emp_id` int NOT NULL,
  `project_id` int DEFAULT NULL,
  `task_id` int DEFAULT NULL,
  `action` enum('commented','comment_edited','comment_deleted','status_changed','task_created','task_deleted','task_updated','unknown') NOT NULL,
  `detail` text,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_activity_emp` (`emp_id`),
  KEY `idx_activity_project` (`project_id`),
  KEY `idx_activity_task` (`task_id`),
  KEY `idx_activity_action` (`action`),
  CONSTRAINT `fk_activity_emp` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_activity_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`project_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_activity_task` FOREIGN KEY (`task_id`) REFERENCES `task` (`task_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 16) (FK 미정의 — 인덱스만) *참조 대상과의 순서상 제약 없음*
CREATE TABLE `notification` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `recipient_emp_id` int NOT NULL,
  `actor_emp_id` int NOT NULL,
  `project_id` int DEFAULT NULL,
  `task_id` int DEFAULT NULL,
  `type` enum('comment','mention','status_change','assignment') NOT NULL,
  `payload` json DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_notification_recipient` (`recipient_emp_id`),
  KEY `idx_notification_task` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 17) employee/external_person 참조
CREATE TABLE `member` (
  `member_id` int NOT NULL AUTO_INCREMENT,
  `login_id` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `emp_id` int DEFAULT NULL,
  `ext_id` int DEFAULT NULL,
  `user_type` enum('EMPLOYEE','EXTERNAL') NOT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `failed_attempts` int DEFAULT '0',
  `locked_until` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`member_id`),
  UNIQUE KEY `login_id` (`login_id`),
  KEY `emp_id` (`emp_id`),
  KEY `ext_id` (`ext_id`),
  CONSTRAINT `member_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`),
  CONSTRAINT `member_ibfk_2` FOREIGN KEY (`ext_id`) REFERENCES `external_person` (`ext_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

```
