-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.43 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.15.0.7171
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for school_erp
CREATE DATABASE IF NOT EXISTS `school_erp` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `school_erp`;

-- Dumping structure for table school_erp.modules
CREATE TABLE IF NOT EXISTS `modules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `module_code` varchar(50) NOT NULL,
  `module_name` varchar(100) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `module_code` (`module_code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table school_erp.modules: ~5 rows (approximately)
INSERT INTO `modules` (`id`, `module_code`, `module_name`, `status`, `created_at`, `updated_at`) VALUES
	(1, 'STUDENT', 'Student Management', 'active', '2026-06-21 10:29:30', '2026-06-21 10:29:30'),
	(2, 'TEACHER', 'Teacher Management', 'active', '2026-06-21 11:07:49', '2026-06-21 11:07:49'),
	(3, 'STUDENT_ATTENDANCE', 'Student Attendance', 'active', '2026-06-21 11:21:09', '2026-06-21 11:21:09'),
	(4, 'TEACHER_ATTENDANCE', 'Teacher Attendance', 'active', '2026-06-21 11:26:03', '2026-06-21 11:26:03'),
	(5, 'ROLE_PERMISSION', 'Role & Permission', 'active', '2026-06-21 15:32:25', '2026-06-21 15:32:25');

-- Dumping structure for table school_erp.permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint unsigned NOT NULL,
  `module_id` bigint unsigned NOT NULL,
  `can_view` tinyint(1) DEFAULT '0',
  `can_create` tinyint(1) DEFAULT '0',
  `can_update` tinyint(1) DEFAULT '0',
  `can_delete` tinyint(1) DEFAULT '0',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_module` (`role_id`,`module_id`),
  KEY `module_id` (`module_id`),
  CONSTRAINT `permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `permissions_ibfk_2` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table school_erp.permissions: ~8 rows (approximately)
INSERT INTO `permissions` (`id`, `role_id`, `module_id`, `can_view`, `can_create`, `can_update`, `can_delete`, `status`, `created_at`, `updated_at`) VALUES
	(1, 1, 1, 1, 1, 1, 1, 'active', '2026-06-21 10:29:30', '2026-06-21 11:12:02'),
	(2, 1, 2, 1, 1, 1, 1, 'active', '2026-06-21 10:29:30', '2026-06-21 11:12:11'),
	(3, 1, 3, 1, 1, 1, 1, 'active', '2026-06-21 11:23:53', '2026-06-21 11:24:30'),
	(4, 1, 4, 1, 1, 1, 1, 'active', '2026-06-21 11:26:30', '2026-06-21 11:26:33'),
	(5, 1, 5, 1, 1, 1, 1, 'active', '2026-06-21 11:26:30', '2026-06-21 11:26:33'),
	(7, 4, 3, 1, 0, 0, 0, 'active', '2026-06-21 16:13:06', '2026-06-21 16:13:06'),
	(8, 3, 3, 1, 0, 0, 0, 'active', '2026-06-21 17:19:41', '2026-06-21 17:19:41'),
	(9, 3, 4, 1, 0, 0, 0, 'active', '2026-06-21 17:19:41', '2026-06-21 17:19:41');

-- Dumping structure for table school_erp.roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_name` varchar(100) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table school_erp.roles: ~6 rows (approximately)
INSERT INTO `roles` (`id`, `role_name`, `status`, `created_at`, `updated_at`) VALUES
	(1, 'Super Admin', 'active', '2026-06-21 10:29:30', '2026-06-21 10:29:30'),
	(2, 'Admin', 'active', '2026-06-21 10:29:30', '2026-06-21 10:29:30'),
	(3, 'Teacher', 'active', '2026-06-21 10:29:30', '2026-06-21 10:29:30'),
	(4, 'Student', 'active', '2026-06-21 10:29:30', '2026-06-21 10:29:30'),
	(5, 'Librarian', 'active', '2026-06-21 10:29:30', '2026-06-21 10:29:30'),
	(6, 'Transport', 'active', '2026-06-21 10:29:30', '2026-06-21 10:29:30');

-- Dumping structure for table school_erp.student_attendance
CREATE TABLE IF NOT EXISTS `student_attendance` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('Present','Absent','Late','Leave') NOT NULL,
  `class` varchar(20) DEFAULT NULL,
  `section` varchar(10) DEFAULT NULL,
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_date` (`student_id`,`attendance_date`),
  CONSTRAINT `student_attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table school_erp.student_attendance: ~2 rows (approximately)
INSERT INTO `student_attendance` (`id`, `student_id`, `attendance_date`, `status`, `class`, `section`, `remarks`, `created_at`, `updated_at`) VALUES
	(1, 2, '2026-06-21', 'Present', '10', 'A', 'Present Boy', '2026-06-21 11:25:10', '2026-06-21 15:41:15'),
	(2, 2, '2026-06-22', 'Present', '10', 'A', 'Present', '2026-06-21 15:43:18', '2026-06-21 15:43:28');

-- Dumping structure for table school_erp.student_details
CREATE TABLE IF NOT EXISTS `student_details` (
  `user_id` bigint unsigned NOT NULL,
  `class` varchar(20) DEFAULT NULL,
  `section` varchar(10) DEFAULT NULL,
  `father_name` varchar(100) DEFAULT NULL,
  `mother_name` varchar(100) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `student_details_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table school_erp.student_details: ~2 rows (approximately)
INSERT INTO `student_details` (`user_id`, `class`, `section`, `father_name`, `mother_name`, `dob`) VALUES
	(2, '10', 'A', 'Bittu', 'Rekha', '2002-06-22'),
	(4, '10', 'A', 'Deepak', 'Sunita', '2026-06-15');

-- Dumping structure for table school_erp.teacher_attendance
CREATE TABLE IF NOT EXISTS `teacher_attendance` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `teacher_id` bigint unsigned NOT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('Present','Absent','Late','Leave') DEFAULT 'Present',
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_teacher_date` (`teacher_id`,`attendance_date`),
  CONSTRAINT `teacher_attendance_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table school_erp.teacher_attendance: ~1 rows (approximately)
INSERT INTO `teacher_attendance` (`id`, `teacher_id`, `attendance_date`, `status`, `check_in_time`, `check_out_time`, `created_at`, `updated_at`) VALUES
	(1, 3, '2026-06-21', 'Present', '13:50:00', '00:00:00', '2026-06-21 11:32:12', '2026-06-21 17:20:06');

-- Dumping structure for table school_erp.teacher_details
CREATE TABLE IF NOT EXISTS `teacher_details` (
  `user_id` bigint unsigned NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `qualification` varchar(100) DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `teacher_details_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table school_erp.teacher_details: ~4 rows (approximately)
INSERT INTO `teacher_details` (`user_id`, `department`, `qualification`, `gender`, `date_of_birth`, `profile_picture`, `joining_date`, `subject`) VALUES
	(3, 'SST', 'B.sc', 'Male', '2002-06-23', NULL, '2026-06-15', 'SST'),
	(5, 'EVS', 'B.tech', 'Male', '2001-06-02', 'uploads\\teachers\\1782192731442-253753941.jpg', '2026-06-09', 'IT'),
	(6, 'EVS', 'B.Tech', 'Male', '1996-06-17', 'uploads\\teachers\\1782194815423-901277672.jpg', '2026-06-16', 'SST'),
	(7, 'IT', 'B.sc', 'Male', '1990-06-09', '/uploads/teachers/7/profile-1782195797282.jpg', '2026-06-09', 'SST');

-- Dumping structure for table school_erp.user_roles
CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table school_erp.user_roles: ~7 rows (approximately)
INSERT INTO `user_roles` (`id`, `user_id`, `role_id`, `status`, `created_at`) VALUES
	(1, 1, 1, 'active', '2026-06-21 10:37:21'),
	(2, 2, 4, 'active', '2026-06-21 10:39:21'),
	(3, 3, 3, 'active', '2026-06-21 11:31:35'),
	(4, 4, 4, 'active', '2026-06-21 17:42:50'),
	(5, 5, 3, 'active', '2026-06-23 05:32:11'),
	(6, 6, 3, 'active', '2026-06-23 06:06:55'),
	(7, 7, 3, 'active', '2026-06-23 06:23:17');

-- Dumping structure for table school_erp.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `login_id` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `login_id` (`login_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table school_erp.users: ~7 rows (approximately)
INSERT INTO `users` (`id`, `login_id`, `password`, `full_name`, `email`, `mobile`, `status`, `created_at`, `updated_at`) VALUES
	(1, 'SA001', '$2a$12$Em9Sg2K43D5LRPvEaVPQ0OPOtP3UiIWR0xivcHayBf34/KMiJvGdm', 'SuperAdmin', 'SuperAdmin@gmail.com', '989898989', 'active', '2026-06-21 10:35:05', '2026-06-21 10:35:36'),
	(2, 'STD001', '$2b$10$hyjwGey.ZV.9UCDUa6jkF.MkqjnTBnVvMKAM6H8TdyoGUAuAZB9xe', 'Nikhil', 'nikhil@gmail.com', '898989898', 'active', '2026-06-21 10:39:21', '2026-06-21 10:39:21'),
	(3, 'TC001', '$2b$10$W0diP0hFg7vCdSONWhR9euI8dWBL4e4QUVq5uomtTLxy6bHtfkKGW', 'Rekha', 'rekha@gmail.com', '7878787878', 'active', '2026-06-21 11:31:35', '2026-06-21 11:31:35'),
	(4, 'STD002', '$2b$10$WUDRq5VJ3KMrhfDIQOnut.tjAnVf31i8nuTLKJAF.6rxTOSr7cthG', 'Rakesh', 'Rakesh@gmail.com', '676767676', 'active', '2026-06-21 17:42:50', '2026-06-21 17:42:50'),
	(5, 'TC002', '$2b$10$wNJ2Sekd9Wipj32PWNYNmOp9NgjlbWqtYZIgszAA6B0/RgWi7ZG7u', 'Rahul', 'rahul@gmail.com', '8787878787', 'active', '2026-06-23 05:32:11', '2026-06-23 05:32:11'),
	(6, 'TC003', '$2b$10$Vgx.D33xAuTMVvCCy3Nw/eW5VtSYVkyxYsbeYFdkptrhnW22R0EFu', 'Gaurav', 'gaurav@gmail.com', '323232332', 'active', '2026-06-23 06:06:55', '2026-06-23 06:06:55'),
	(7, 'TC004', '$2b$10$TlLkzmULZIx1hv5M/AoizOq6zdJDYFOt8Kt7rVDirTKwhxkQYx5ti', 'Rishi', 'rishi@gmail.com', '90909090', 'active', '2026-06-23 06:23:17', '2026-06-23 06:23:17');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
