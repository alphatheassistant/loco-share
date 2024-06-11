<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Temporary File Sharing</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="login-container">
    <input type="text" id="username" placeholder="Enter your username">
    <button id="login-btn">Login</button>
  </div>

  <div id="app-container" style="display: none;">
    <div id="nearby-users"></div>
    <div id="file-transfer-container">
      <input type="file" id="file-input">
      <button id="send-file-btn">Send File</button>
    </div>
    <div id="incoming-files"></div>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script src="scripts.js"></script>
</body>
</html>
