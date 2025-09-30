CREATE DATABASE IF NOT EXISTS taskdb;
USE taskdb;

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','member') NOT NULL DEFAULT 'member'
);

-- 공지사항 테이블
CREATE TABLE IF NOT EXISTS notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  scope ENUM('GLOBAL','TEAM','PROJECT') NOT NULL,
  team_id INT NULL,
  project_id INT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  author_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted TINYINT DEFAULT 0
);

-- 일정 테이블
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기본 계정 (관리자)
INSERT IGNORE INTO users (username, password, role)
VALUES ('admin','1234','admin');
