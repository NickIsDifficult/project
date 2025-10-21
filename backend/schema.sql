-- Table: activity_log

CREATE TABLE activity_log (
	log_id INTEGER NOT NULL AUTO_INCREMENT, 
	emp_id INTEGER NOT NULL, 
	project_id INTEGER, 
	task_id INTEGER, 
	action VARCHAR(18) NOT NULL, 
	detail TEXT, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (log_id), 
	FOREIGN KEY(emp_id) REFERENCES employee (emp_id) ON DELETE CASCADE, 
	FOREIGN KEY(project_id) REFERENCES project (project_id) ON DELETE SET NULL, 
	FOREIGN KEY(task_id) REFERENCES task (task_id) ON DELETE SET NULL
)

;
--------------------------------------------------------------------------------

-- Table: attachment

CREATE TABLE attachment (
	attachment_id INTEGER NOT NULL AUTO_INCREMENT, 
	project_id INTEGER, 
	task_id INTEGER, 
	uploaded_by INTEGER, 
	file_name VARCHAR(255) NOT NULL, 
	file_path VARCHAR(1024) NOT NULL, 
	file_size BIGINT, 
	file_type VARCHAR(100), 
	is_deleted BOOL, 
	uploaded_at DATETIME DEFAULT now(), 
	PRIMARY KEY (attachment_id), 
	FOREIGN KEY(project_id) REFERENCES project (project_id) ON DELETE CASCADE, 
	FOREIGN KEY(task_id) REFERENCES task (task_id) ON DELETE CASCADE, 
	FOREIGN KEY(uploaded_by) REFERENCES employee (emp_id) ON DELETE SET NULL
)

;
--------------------------------------------------------------------------------

-- Table: department

CREATE TABLE department (
	dept_id INTEGER NOT NULL AUTO_INCREMENT, 
	dept_name VARCHAR(50) NOT NULL, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (dept_id), 
	UNIQUE (dept_name)
)

;
--------------------------------------------------------------------------------

-- Table: department_permission

CREATE TABLE department_permission (
	dept_id INTEGER NOT NULL, 
	role_id INTEGER NOT NULL, 
	permission VARCHAR(20) NOT NULL, 
	PRIMARY KEY (dept_id, role_id, permission), 
	FOREIGN KEY(dept_id) REFERENCES department (dept_id), 
	FOREIGN KEY(role_id) REFERENCES `role` (role_id)
)

;
--------------------------------------------------------------------------------

-- Table: employee

CREATE TABLE employee (
	emp_id INTEGER NOT NULL AUTO_INCREMENT, 
	emp_no VARCHAR(20) NOT NULL, 
	dept_id INTEGER NOT NULL, 
	role_id INTEGER NOT NULL, 
	name VARCHAR(50) NOT NULL, 
	email VARCHAR(100) NOT NULL, 
	mobile VARCHAR(20) NOT NULL, 
	hire_date DATE, 
	birthday DATE, 
	created_at DATETIME DEFAULT now(), 
	updated_at DATETIME DEFAULT now(), 
	PRIMARY KEY (emp_id), 
	UNIQUE (emp_no), 
	FOREIGN KEY(dept_id) REFERENCES department (dept_id), 
	FOREIGN KEY(role_id) REFERENCES `role` (role_id)
)

;
--------------------------------------------------------------------------------

-- Table: external

CREATE TABLE external (
	ext_id INTEGER NOT NULL AUTO_INCREMENT, 
	ext_no VARCHAR(20) NOT NULL, 
	dept_id INTEGER, 
	role_id INTEGER NOT NULL, 
	name VARCHAR(50) NOT NULL, 
	email VARCHAR(100) NOT NULL, 
	mobile VARCHAR(20) NOT NULL, 
	company VARCHAR(100), 
	created_at DATETIME DEFAULT now(), 
	updated_at DATETIME DEFAULT now(), 
	PRIMARY KEY (ext_id), 
	UNIQUE (ext_no), 
	FOREIGN KEY(dept_id) REFERENCES department (dept_id), 
	FOREIGN KEY(role_id) REFERENCES `role` (role_id)
)

;
--------------------------------------------------------------------------------

-- Table: member

CREATE TABLE `member` (
	member_id INTEGER NOT NULL AUTO_INCREMENT, 
	login_id VARCHAR(50) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	emp_id INTEGER, 
	ext_id INTEGER, 
	user_type ENUM('EMPLOYEE','EXTERNAL') NOT NULL, 
	last_login_at DATETIME, 
	failed_attempts INTEGER NOT NULL DEFAULT '0', 
	locked_until DATETIME, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (member_id), 
	UNIQUE (login_id), 
	FOREIGN KEY(emp_id) REFERENCES employee (emp_id), 
	FOREIGN KEY(ext_id) REFERENCES external (ext_id)
)

;
--------------------------------------------------------------------------------

-- Table: notification

CREATE TABLE notification (
	notification_id INTEGER NOT NULL AUTO_INCREMENT, 
	recipient_emp_id INTEGER NOT NULL, 
	actor_emp_id INTEGER NOT NULL, 
	project_id INTEGER, 
	task_id INTEGER, 
	type VARCHAR(14) NOT NULL, 
	payload JSON, 
	is_read BOOL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME, 
	PRIMARY KEY (notification_id), 
	FOREIGN KEY(recipient_emp_id) REFERENCES employee (emp_id) ON DELETE CASCADE, 
	FOREIGN KEY(actor_emp_id) REFERENCES employee (emp_id) ON DELETE CASCADE, 
	FOREIGN KEY(project_id) REFERENCES project (project_id) ON DELETE CASCADE, 
	FOREIGN KEY(task_id) REFERENCES task (task_id) ON DELETE CASCADE
)

;
--------------------------------------------------------------------------------

-- Table: project

CREATE TABLE project (
	project_id INTEGER NOT NULL AUTO_INCREMENT, 
	project_name VARCHAR(200) NOT NULL, 
	description TEXT, 
	start_date DATE, 
	end_date DATE, 
	status VARCHAR(11), 
	owner_emp_id INTEGER, 
	created_at DATETIME DEFAULT now(), 
	updated_at DATETIME DEFAULT now(), 
	PRIMARY KEY (project_id), 
	FOREIGN KEY(owner_emp_id) REFERENCES employee (emp_id) ON DELETE SET NULL
)

;
--------------------------------------------------------------------------------

-- Table: project_member

CREATE TABLE project_member (
	project_id INTEGER NOT NULL, 
	emp_id INTEGER NOT NULL, 
	`role` VARCHAR(7), 
	PRIMARY KEY (project_id, emp_id), 
	FOREIGN KEY(project_id) REFERENCES project (project_id) ON DELETE CASCADE, 
	FOREIGN KEY(emp_id) REFERENCES employee (emp_id) ON DELETE CASCADE
)

;
--------------------------------------------------------------------------------

-- Table: task_member

CREATE TABLE task_member (
	task_id INTEGER NOT NULL, 
	emp_id INTEGER NOT NULL, 
	assigned_at DATETIME DEFAULT now(), 
	PRIMARY KEY (task_id, emp_id), 
	FOREIGN KEY(task_id) REFERENCES task (task_id) ON DELETE CASCADE, 
	FOREIGN KEY(emp_id) REFERENCES employee (emp_id) ON DELETE CASCADE
)

;
--------------------------------------------------------------------------------

-- Table: task

CREATE TABLE task (
	task_id INTEGER NOT NULL AUTO_INCREMENT, 
	project_id INTEGER NOT NULL, 
	title VARCHAR(300) NOT NULL, 
	description TEXT, 
	priority VARCHAR(6), 
	status VARCHAR(11), 
	parent_task_id INTEGER, 
	start_date DATE, 
	due_date DATE, 
	estimate_hours DECIMAL(6, 2), 
	created_at DATETIME DEFAULT now(), 
	updated_at DATETIME DEFAULT now(), 
	progress INTEGER, 
	PRIMARY KEY (task_id), 
	FOREIGN KEY(project_id) REFERENCES project (project_id) ON DELETE CASCADE, 
	FOREIGN KEY(parent_task_id) REFERENCES task (task_id) ON DELETE CASCADE
)

;
--------------------------------------------------------------------------------

-- Table: task_comment

CREATE TABLE task_comment (
	comment_id INTEGER NOT NULL AUTO_INCREMENT, 
	project_id INTEGER NOT NULL, 
	task_id INTEGER NOT NULL, 
	emp_id INTEGER NOT NULL, 
	content TEXT NOT NULL, 
	created_at DATETIME DEFAULT now(), 
	updated_at DATETIME DEFAULT now(), 
	PRIMARY KEY (comment_id), 
	FOREIGN KEY(project_id) REFERENCES project (project_id) ON DELETE CASCADE, 
	FOREIGN KEY(task_id) REFERENCES task (task_id) ON DELETE CASCADE, 
	FOREIGN KEY(emp_id) REFERENCES employee (emp_id) ON DELETE CASCADE
)

;
--------------------------------------------------------------------------------

-- Table: milestone

CREATE TABLE milestone (
	milestone_id INTEGER NOT NULL AUTO_INCREMENT, 
	project_id INTEGER NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	description TEXT, 
	due_date DATE, 
	status VARCHAR(8), 
	PRIMARY KEY (milestone_id), 
	FOREIGN KEY(project_id) REFERENCES project (project_id) ON DELETE CASCADE
)

;
--------------------------------------------------------------------------------

-- Table: task_history

CREATE TABLE task_history (
	history_id INTEGER NOT NULL AUTO_INCREMENT, 
	task_id INTEGER NOT NULL, 
	old_status VARCHAR(11), 
	new_status VARCHAR(11), 
	changed_by INTEGER, 
	changed_at DATETIME DEFAULT now(), 
	PRIMARY KEY (history_id), 
	FOREIGN KEY(task_id) REFERENCES task (task_id) ON DELETE CASCADE, 
	FOREIGN KEY(changed_by) REFERENCES employee (emp_id) ON DELETE SET NULL
)

;
--------------------------------------------------------------------------------

-- Table: role

CREATE TABLE `role` (
	role_id INTEGER NOT NULL AUTO_INCREMENT, 
	role_name VARCHAR(50) NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (role_id), 
	UNIQUE (role_name)
)

;
--------------------------------------------------------------------------------

