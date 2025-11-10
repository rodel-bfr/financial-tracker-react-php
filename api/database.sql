-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 10, 2025 at 05:55 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `financial_tracker`
--

-- --------------------------------------------------------

--
-- Table structure for table `budget_rules`
--

CREATE TABLE `budget_rules` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `needs_ratio` decimal(5,4) NOT NULL,
  `wants_ratio` decimal(5,4) NOT NULL,
  `savings_ratio` decimal(5,4) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `budget_rules`
--

INSERT INTO `budget_rules` (`id`, `name`, `start_date`, `end_date`, `needs_ratio`, `wants_ratio`, `savings_ratio`, `is_default`) VALUES
(1, 'Default Rule', '2000-01-01', NULL, 0.5000, 0.3000, 0.2000, 1);

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(7) DEFAULT '#CCCCCC',
  `type` enum('Needs','Wants','Savings','Income') NOT NULL,
  `is_predefined` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`, `color`, `type`, `is_predefined`) VALUES
(1, 'Rent', 'Monthly rent or mortgage payments.', '#D32F2F', 'Needs', 1),
(2, 'Groceries', 'Food and household supplies from supermarkets.', '#388E3C', 'Needs', 1),
(3, 'Utilities (Gas, Electric, Water)', 'Monthly bills like gas, electricity, water, and internet.', '#06294b', 'Needs', 1),
(4, 'Transport', 'Costs for public transport, fuel, and car maintenance.', '#F57C00', 'Needs', 1),
(5, 'Eating Out', 'Expenses from restaurants, cafes, and take-away food.', '#e57bbe', 'Wants', 1),
(6, 'Entertainment', 'Spending on leisure like movies, concerts, and events.', '#7B1FA2', 'Wants', 1),
(7, 'Shopping (Non-essential)', 'Purchases for non-essential items like clothing and gadgets.', '#0ee1c9', 'Wants', 1),
(8, 'General Savings', 'General contributions to savings accounts or investments.', '#b8d9ea', 'Savings', 1),
(10, 'Salary', 'Primary income from employment.', '#d1c323', 'Income', 1),
(11, 'Medicamentation', 'Expenses related to medicine and healthcare.', '#536DFE', 'Needs', 0),
(13, 'Contract Based Income', 'Contract Based Income', '#ae00ff', 'Income', 0),
(14, 'Non-Essential Subscriptions', 'Non-Essential Subscriptions', '#b2822e', 'Wants', 0),
(15, 'Essential Subscriptions', 'Essential Subscriptions', '#eb0580', 'Needs', 0);

-- --------------------------------------------------------

--
-- Table structure for table `recurring_expenses`
--

CREATE TABLE `recurring_expenses` (
  `id` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `category_id` int(11) NOT NULL,
  `recurrence_day` int(2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `contract_end_date` date DEFAULT NULL,
  `last_processed_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `recurring_expenses`
--

INSERT INTO `recurring_expenses` (`id`, `description`, `amount`, `category_id`, `recurrence_day`, `start_date`, `end_date`, `contract_end_date`, `last_processed_date`) VALUES
(1, 'Rent Payment ', 1500.00, 1, 15, '2025-01-01', '2025-12-31', NULL, '2025-11-10'),
(2, 'Scheduled Savings', 700.00, 8, 30, '2025-01-01', '2025-12-31', NULL, '2025-11-10'),
(3, 'Phone Contract', 15.00, 15, 15, '2025-01-01', '2025-12-31', '2025-12-31', '2025-11-10'),
(4, 'Internet Contract', 15.00, 15, 15, '2025-01-01', '2025-12-31', '2025-12-31', '2025-11-10'),
(5, 'Netflix', 15.00, 14, 15, '2025-01-01', '2025-12-31', NULL, '2025-11-10'),
(6, 'Gym Membership', 100.00, 14, 15, '2025-01-01', '2025-12-31', NULL, '2025-11-10');

-- --------------------------------------------------------

--
-- Table structure for table `recurring_incomes`
--

CREATE TABLE `recurring_incomes` (
  `id` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `category_id` int(11) NOT NULL,
  `recurrence_day` int(11) NOT NULL COMMENT 'Day of the month (1-31)',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `last_processed_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `recurring_incomes`
--

INSERT INTO `recurring_incomes` (`id`, `description`, `amount`, `category_id`, `recurrence_day`, `start_date`, `end_date`, `last_processed_date`) VALUES
(1, 'Salary', 3500.00, 10, 15, '2025-01-01', '2025-04-30', '2025-11-10'),
(2, 'Salary', 3800.00, 10, 15, '2025-05-01', '2025-12-31', '2025-11-10'),
(3, 'Contract Based Income', 1000.00, 13, 15, '2025-05-01', '2025-07-31', '2025-11-10');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('Income','Expense') NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `recurring_income_id` int(11) DEFAULT NULL,
  `recurring_expense_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `description`, `amount`, `type`, `category_id`, `transaction_date`, `recurring_income_id`, `recurring_expense_id`) VALUES
(5, 'Weekly shop at Lidl', -75.50, 'Expense', 2, '2025-01-05', NULL, NULL),
(6, 'Fresh vegetables from market', -25.00, 'Expense', 2, '2025-01-12', NULL, NULL),
(7, 'Restock pantry items', -90.00, 'Expense', 2, '2025-02-02', NULL, NULL),
(8, 'Groceries for the month', -150.00, 'Expense', 2, '2025-03-01', NULL, NULL),
(9, 'Quick grocery run', -34.50, 'Expense', 2, '2025-04-15', NULL, NULL),
(10, 'Stocking up for Easter', -80.00, 'Expense', 2, '2025-04-18', NULL, NULL),
(11, 'Monthly bus pass', -55.00, 'Expense', 4, '2025-01-02', NULL, NULL),
(12, 'Fuel for the car', -60.00, 'Expense', 4, '2025-01-20', NULL, NULL),
(13, 'Train ticket to visit family', -45.00, 'Expense', 4, '2025-02-14', NULL, NULL),
(14, 'Fuel top-up', -50.00, 'Expense', 4, '2025-03-18', NULL, NULL),
(15, 'Car wash and detailing', -25.00, 'Expense', 4, '2025-05-05', NULL, NULL),
(16, 'Parking fees for the month', -30.00, 'Expense', 4, '2025-05-30', NULL, NULL),
(17, 'Dinner with friends at \"The Grand Bistro\"', -120.00, 'Expense', 5, '2025-01-18', NULL, NULL),
(18, 'Lunch meeting', -45.00, 'Expense', 5, '2025-01-28', NULL, NULL),
(19, 'Weekend brunch', -60.00, 'Expense', 5, '2025-02-09', NULL, NULL),
(20, 'Takeaway pizza night', -35.00, 'Expense', 5, '2025-02-22', NULL, NULL),
(21, 'Anniversary dinner', -250.00, 'Expense', 5, '2025-03-15', NULL, NULL),
(22, 'Coffee and cake catch-up', -25.00, 'Expense', 5, '2025-04-10', NULL, NULL),
(23, 'Post-work drinks and snacks', -80.00, 'Expense', 5, '2025-05-16', NULL, NULL),
(24, 'Ice cream treat', -15.00, 'Expense', 5, '2025-06-01', NULL, NULL),
(25, 'Sunday roast at the pub', -95.00, 'Expense', 5, '2025-06-15', NULL, NULL),
(26, 'Cinema tickets for two', -30.00, 'Expense', 6, '2025-01-25', NULL, NULL),
(27, 'Concert tickets', -150.00, 'Expense', 6, '2025-02-18', NULL, NULL),
(28, 'Bowling night with colleagues', -55.00, 'Expense', 6, '2025-03-22', NULL, NULL),
(29, 'Video game purchase', -70.00, 'Expense', 6, '2025-04-01', NULL, NULL),
(30, 'Theater show', -200.00, 'Expense', 6, '2025-05-10', NULL, NULL),
(31, 'Museum entry fee', -65.00, 'Expense', 6, '2025-06-14', NULL, NULL),
(57, 'Salary', 3800.00, 'Income', 10, '2025-05-15', 2, NULL),
(58, 'Salary', 3800.00, 'Income', 10, '2025-06-15', 2, NULL),
(63, 'Contract Based Income', 1000.00, 'Income', 13, '2025-05-15', 3, NULL),
(64, 'Contract Based Income', 1000.00, 'Income', 13, '2025-06-15', 3, NULL),
(65, 'Scheduled Savings', -700.00, 'Expense', 8, '2025-01-30', NULL, 2),
(66, 'Scheduled Savings', -700.00, 'Expense', 8, '2025-02-28', NULL, 2),
(67, 'Scheduled Savings', -700.00, 'Expense', 8, '2025-03-30', NULL, 2),
(68, 'Scheduled Savings', -700.00, 'Expense', 8, '2025-04-30', NULL, 2),
(69, 'Scheduled Savings', -700.00, 'Expense', 8, '2025-05-30', NULL, 2),
(70, 'Phone Contract', -15.00, 'Expense', 15, '2025-01-15', NULL, 3),
(71, 'Phone Contract', -15.00, 'Expense', 15, '2025-02-15', NULL, 3),
(72, 'Phone Contract', -15.00, 'Expense', 15, '2025-03-15', NULL, 3),
(73, 'Phone Contract', -15.00, 'Expense', 15, '2025-04-15', NULL, 3),
(74, 'Phone Contract', -15.00, 'Expense', 15, '2025-05-15', NULL, 3),
(75, 'Phone Contract', -15.00, 'Expense', 15, '2025-06-15', NULL, 3),
(76, 'Internet Contract', -15.00, 'Expense', 15, '2025-01-15', NULL, 4),
(77, 'Internet Contract', -15.00, 'Expense', 15, '2025-02-15', NULL, 4),
(78, 'Internet Contract', -15.00, 'Expense', 15, '2025-03-15', NULL, 4),
(79, 'Internet Contract', -15.00, 'Expense', 15, '2025-04-15', NULL, 4),
(80, 'Internet Contract', -15.00, 'Expense', 15, '2025-05-15', NULL, 4),
(81, 'Internet Contract', -15.00, 'Expense', 15, '2025-06-15', NULL, 4),
(82, 'Netflix', -15.00, 'Expense', 14, '2025-01-15', NULL, 5),
(83, 'Netflix', -15.00, 'Expense', 14, '2025-02-15', NULL, 5),
(84, 'Netflix', -15.00, 'Expense', 14, '2025-03-15', NULL, 5),
(85, 'Netflix', -15.00, 'Expense', 14, '2025-04-15', NULL, 5),
(86, 'Netflix', -15.00, 'Expense', 14, '2025-05-15', NULL, 5),
(87, 'Netflix', -15.00, 'Expense', 14, '2025-06-15', NULL, 5),
(88, 'Gym Membership', -100.00, 'Expense', 14, '2025-01-15', NULL, 6),
(89, 'Gym Membership', -100.00, 'Expense', 14, '2025-02-15', NULL, 6),
(90, 'Gym Membership', -100.00, 'Expense', 14, '2025-03-15', NULL, 6),
(91, 'Gym Membership', -100.00, 'Expense', 14, '2025-04-15', NULL, 6),
(92, 'Gym Membership', -100.00, 'Expense', 14, '2025-05-15', NULL, 6),
(93, 'Gym Membership', -100.00, 'Expense', 14, '2025-06-15', NULL, 6),
(104, 'Rent Payment ', -1500.00, 'Expense', 1, '2025-01-15', NULL, 1),
(105, 'Rent Payment ', -1500.00, 'Expense', 1, '2025-02-15', NULL, 1),
(106, 'Rent Payment ', -1500.00, 'Expense', 1, '2025-03-15', NULL, 1),
(107, 'Rent Payment ', -1500.00, 'Expense', 1, '2025-04-15', NULL, 1),
(108, 'Rent Payment ', -1500.00, 'Expense', 1, '2025-05-15', NULL, 1),
(109, 'Rent Payment ', -1500.00, 'Expense', 1, '2025-06-15', NULL, 1),
(110, 'Salary', 3500.00, 'Income', 10, '2025-01-15', 1, NULL),
(111, 'Salary', 3500.00, 'Income', 10, '2025-02-15', 1, NULL),
(112, 'Salary', 3500.00, 'Income', 10, '2025-03-15', 1, NULL),
(113, 'Salary', 3500.00, 'Income', 10, '2025-04-15', 1, NULL),
(114, 'Dinner at \"La Pizzeria\"', -85.00, 'Expense', 5, '2025-01-10', NULL, NULL),
(115, 'New Winter Jacket from Zara', -149.99, 'Expense', 7, '2025-01-15', NULL, NULL),
(116, 'Concert tickets: Maneskin', -220.00, 'Expense', 6, '2025-01-20', NULL, NULL),
(117, 'Lunch with colleagues', -65.50, 'Expense', 5, '2025-01-25', NULL, NULL),
(118, 'New headphones from MediaWorld', -179.00, 'Expense', 7, '2025-01-28', NULL, NULL),
(119, 'Weekend hotel booking in Milan', -300.00, 'Expense', 6, '2025-02-05', NULL, NULL),
(120, 'Valentine\'s Day dinner at \"Ristorante del Cambio\"', -180.00, 'Expense', 5, '2025-02-14', NULL, NULL),
(121, 'Shopping for birthday gifts', -125.00, 'Expense', 7, '2025-02-20', NULL, NULL),
(122, 'Coffee & cake date', -25.00, 'Expense', 5, '2025-02-22', NULL, NULL),
(123, 'New video game: \"Cyberpunk 2077 Phantom Liberty\"', -69.99, 'Expense', 6, '2025-02-25', NULL, NULL),
(124, 'New sneakers from Nike', -130.00, 'Expense', 7, '2025-03-04', NULL, NULL),
(125, 'Theater tickets for \"Hamilton\"', -180.00, 'Expense', 6, '2025-03-08', NULL, NULL),
(126, 'Weekend brunch at \"Pai Bikery\"', -55.00, 'Expense', 5, '2025-03-15', NULL, NULL),
(127, 'Home decor shopping at IKEA', -250.00, 'Expense', 7, '2025-03-22', NULL, NULL),
(128, 'Cinema tickets for \"Dune: Part Two\"', -30.00, 'Expense', 6, '2025-03-28', NULL, NULL),
(129, 'Takeaway pizza night', -70.00, 'Expense', 5, '2025-03-30', NULL, NULL),
(130, 'Spring clothing haul from Zalando', -280.00, 'Expense', 7, '2025-04-05', NULL, NULL),
(131, 'Escape room with friends', -100.00, 'Expense', 6, '2025-04-12', NULL, NULL),
(132, 'Several work lunches', -150.00, 'Expense', 5, '2025-04-20', NULL, NULL),
(133, 'Cocktails at \"The Jerry Thomas Project\"', -80.00, 'Expense', 5, '2025-04-26', NULL, NULL),
(134, 'New skincare products from Sephora', -90.00, 'Expense', 7, '2025-04-28', NULL, NULL),
(135, 'Weekend getaway spa package in Tuscany', -350.00, 'Expense', 6, '2025-05-10', NULL, NULL),
(136, 'Shopping spree for summer clothes', -200.00, 'Expense', 7, '2025-05-18', NULL, NULL),
(137, 'Anniversary dinner celebration', -150.00, 'Expense', 5, '2025-05-25', NULL, NULL),
(138, 'Summer music festival ticket', -120.00, 'Expense', 6, '2025-06-01', NULL, NULL),
(139, 'Outdoor gear from Decathlon for hiking', -180.00, 'Expense', 7, '2025-06-05', NULL, NULL),
(140, 'Dinner on a terrace with a view', -90.00, 'Expense', 5, '2025-06-08', NULL, NULL),
(141, 'New Ray-Ban sunglasses', -140.00, 'Expense', 7, '2025-06-12', NULL, NULL),
(142, 'Aperitivo with friends', -85.00, 'Expense', 5, '2025-06-15', NULL, NULL),
(143, 'Trip to Gardaland', -95.00, 'Expense', 6, '2025-06-19', NULL, NULL),
(144, 'Manual Saving', -300.00, 'Expense', 8, '2025-06-01', NULL, NULL),
(157, 'Rent Payment ', -1500.00, 'Expense', 1, '2025-07-15', NULL, 1),
(158, 'Rent Payment ', -1500.00, 'Expense', 1, '2025-07-15', NULL, 1),
(159, 'Rent Payment ', -1500.00, 'Expense', 1, '2025-08-15', NULL, 1),
(160, 'Rent Payment ', -1500.00, 'Expense', 1, '2025-08-15', NULL, 1),
(161, 'Rent Payment ', -1500.00, 'Expense', 1, '2025-09-15', NULL, 1),
(162, 'Rent Payment ', -1500.00, 'Expense', 1, '2025-09-15', NULL, 1),
(163, 'Rent Payment ', -1500.00, 'Expense', 1, '2025-10-15', NULL, 1),
(164, 'Rent Payment ', -1500.00, 'Expense', 1, '2025-10-15', NULL, 1),
(165, 'Scheduled Savings', -700.00, 'Expense', 8, '2025-07-30', NULL, 2),
(166, 'Scheduled Savings', -700.00, 'Expense', 8, '2025-07-30', NULL, 2),
(167, 'Scheduled Savings', -700.00, 'Expense', 8, '2025-08-30', NULL, 2),
(168, 'Scheduled Savings', -700.00, 'Expense', 8, '2025-08-30', NULL, 2),
(169, 'Scheduled Savings', -700.00, 'Expense', 8, '2025-09-30', NULL, 2),
(170, 'Scheduled Savings', -700.00, 'Expense', 8, '2025-09-30', NULL, 2),
(171, 'Scheduled Savings', -700.00, 'Expense', 8, '2025-10-30', NULL, 2),
(172, 'Scheduled Savings', -700.00, 'Expense', 8, '2025-10-30', NULL, 2),
(173, 'Phone Contract', -15.00, 'Expense', 15, '2025-07-15', NULL, 3),
(174, 'Phone Contract', -15.00, 'Expense', 15, '2025-07-15', NULL, 3),
(175, 'Phone Contract', -15.00, 'Expense', 15, '2025-08-15', NULL, 3),
(176, 'Phone Contract', -15.00, 'Expense', 15, '2025-08-15', NULL, 3),
(177, 'Phone Contract', -15.00, 'Expense', 15, '2025-09-15', NULL, 3),
(178, 'Phone Contract', -15.00, 'Expense', 15, '2025-09-15', NULL, 3),
(179, 'Phone Contract', -15.00, 'Expense', 15, '2025-10-15', NULL, 3),
(180, 'Phone Contract', -15.00, 'Expense', 15, '2025-10-15', NULL, 3),
(181, 'Internet Contract', -15.00, 'Expense', 15, '2025-07-15', NULL, 4),
(182, 'Internet Contract', -15.00, 'Expense', 15, '2025-07-15', NULL, 4),
(183, 'Internet Contract', -15.00, 'Expense', 15, '2025-08-15', NULL, 4),
(184, 'Internet Contract', -15.00, 'Expense', 15, '2025-08-15', NULL, 4),
(185, 'Internet Contract', -15.00, 'Expense', 15, '2025-09-15', NULL, 4),
(186, 'Internet Contract', -15.00, 'Expense', 15, '2025-09-15', NULL, 4),
(187, 'Internet Contract', -15.00, 'Expense', 15, '2025-10-15', NULL, 4),
(188, 'Internet Contract', -15.00, 'Expense', 15, '2025-10-15', NULL, 4),
(189, 'Netflix', -15.00, 'Expense', 14, '2025-07-15', NULL, 5),
(190, 'Netflix', -15.00, 'Expense', 14, '2025-07-15', NULL, 5),
(191, 'Netflix', -15.00, 'Expense', 14, '2025-08-15', NULL, 5),
(192, 'Netflix', -15.00, 'Expense', 14, '2025-08-15', NULL, 5),
(193, 'Netflix', -15.00, 'Expense', 14, '2025-09-15', NULL, 5),
(194, 'Netflix', -15.00, 'Expense', 14, '2025-09-15', NULL, 5),
(195, 'Netflix', -15.00, 'Expense', 14, '2025-10-15', NULL, 5),
(196, 'Netflix', -15.00, 'Expense', 14, '2025-10-15', NULL, 5),
(197, 'Gym Membership', -100.00, 'Expense', 14, '2025-07-15', NULL, 6),
(198, 'Gym Membership', -100.00, 'Expense', 14, '2025-07-15', NULL, 6),
(199, 'Gym Membership', -100.00, 'Expense', 14, '2025-08-15', NULL, 6),
(200, 'Gym Membership', -100.00, 'Expense', 14, '2025-08-15', NULL, 6),
(201, 'Gym Membership', -100.00, 'Expense', 14, '2025-09-15', NULL, 6),
(202, 'Gym Membership', -100.00, 'Expense', 14, '2025-09-15', NULL, 6),
(203, 'Gym Membership', -100.00, 'Expense', 14, '2025-10-15', NULL, 6),
(204, 'Salary', 3800.00, 'Income', 10, '2025-07-15', 2, NULL),
(205, 'Salary', 3800.00, 'Income', 10, '2025-07-15', 2, NULL),
(206, 'Gym Membership', -100.00, 'Expense', 14, '2025-10-15', NULL, 6),
(207, 'Salary', 3800.00, 'Income', 10, '2025-08-15', 2, NULL),
(208, 'Salary', 3800.00, 'Income', 10, '2025-08-15', 2, NULL),
(209, 'Salary', 3800.00, 'Income', 10, '2025-09-15', 2, NULL),
(210, 'Salary', 3800.00, 'Income', 10, '2025-09-15', 2, NULL),
(211, 'Salary', 3800.00, 'Income', 10, '2025-10-15', 2, NULL),
(212, 'Salary', 3800.00, 'Income', 10, '2025-10-15', 2, NULL),
(213, 'Contract Based Income', 1000.00, 'Income', 13, '2025-07-15', 3, NULL),
(214, 'Contract Based Income', 1000.00, 'Income', 13, '2025-07-15', 3, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `budget_rules`
--
ALTER TABLE `budget_rules`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `recurring_expenses`
--
ALTER TABLE `recurring_expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `recurring_incomes`
--
ALTER TABLE `recurring_incomes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `fk_recurring_income` (`recurring_income_id`),
  ADD KEY `fk_recurring_expense` (`recurring_expense_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `budget_rules`
--
ALTER TABLE `budget_rules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `recurring_expenses`
--
ALTER TABLE `recurring_expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `recurring_incomes`
--
ALTER TABLE `recurring_incomes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=215;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `recurring_expenses`
--
ALTER TABLE `recurring_expenses`
  ADD CONSTRAINT `recurring_expenses_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `recurring_incomes`
--
ALTER TABLE `recurring_incomes`
  ADD CONSTRAINT `recurring_incomes_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `fk_recurring_expense` FOREIGN KEY (`recurring_expense_id`) REFERENCES `recurring_expenses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_recurring_income` FOREIGN KEY (`recurring_income_id`) REFERENCES `recurring_incomes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
