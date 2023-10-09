CREATE DATABASE plant_db;
SHOW DATABASES;
USE plant_db;

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    user_name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE plants (
    plant_id BINARY(16) PRIMARY KEY,
    plant_name VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE plant_environment_data (
    data_id INT PRIMARY KEY AUTO_INCREMENT,
    plant_id BINARY(16) NOT NULL,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    soil_moisture DECIMAL(5,2),
    light_intensity DECIMAL(5,2),
    light_retention_time TIME,
    recorded_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plant_id) REFERENCES plants(plant_id)
);

SHOW TABLES;
