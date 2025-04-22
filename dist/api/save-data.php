<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set headers for cross-origin requests
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Log request information
$logFile = '../logs/api.log';
if (!file_exists('../logs')) {
    mkdir('../logs', 0755, true);
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - OPTIONS request received\n", FILE_APPEND);
    exit();
}

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'message' => 'Only POST method is allowed']);
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Invalid method: {$_SERVER['REQUEST_METHOD']}\n", FILE_APPEND);
    exit();
}

// Get the raw POST data
$jsonData = file_get_contents('php://input');
file_put_contents($logFile, date('Y-m-d H:i:s') . " - Received data length: " . strlen($jsonData) . "\n", FILE_APPEND);

// Validate JSON data
if (!$jsonData) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'No data received']);
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - No data received\n", FILE_APPEND);
    exit();
}

// Decode the JSON data
$data = json_decode($jsonData, true);

// Check if JSON is valid
if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400); // Bad Request
    $errorMsg = json_last_error_msg();
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data: ' . $errorMsg]);
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Invalid JSON: $errorMsg\n", FILE_APPEND);
    exit();
}

// Define the path to save the data
$filePath = '../data/phone_data.json';

// Create a backup of the existing file
if (file_exists($filePath)) {
    $backupPath = '../data/phone_data_backup_' . date('YmdHis') . '.json';
    copy($filePath, $backupPath);
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Created backup at: $backupPath\n", FILE_APPEND);
}

// Save the data to the file
$result = file_put_contents($filePath, $jsonData);

if ($result === false) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'message' => 'Failed to save data']);
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Failed to save data\n", FILE_APPEND);
    exit();
}

// Log success
file_put_contents($logFile, date('Y-m-d H:i:s') . " - Data saved successfully: $result bytes written\n", FILE_APPEND);

// Return success response
http_response_code(200); // OK
echo json_encode(['success' => true, 'message' => 'Data saved successfully']);
?>
