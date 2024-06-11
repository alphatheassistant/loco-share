const socket = io();

// Handle user login
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('username');
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');

loginBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (username) {
    socket.emit('login', { username });
    loginContainer.style.display = 'none';
    appContainer.style.display = 'block';

    // Get user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        socket.emit('location', { latitude, longitude });
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  }
});

// Handle nearby users
socket.on('nearby-users', (users) => {
  const nearbyUsersContainer = document.getElementById('nearby-users');
  nearbyUsersContainer.innerHTML = '';

  users.forEach((user) => {
    const userElement = document.createElement('div');
    userElement.textContent = user.username;
    nearbyUsersContainer.appendChild(userElement);

    // Handle file transfer
    userElement.addEventListener('click', () => {
      const fileInput = document.getElementById('file-input');
      fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const fileData = {
            receiver: user.id,
            name: file.name,
            type: file.type,
            data: reader.result
          };
          socket.emit('file-transfer', fileData);
        };
        reader.readAsDataURL(file);
      }
    });
  });
});

// Handle incoming files
socket.on('incoming-file', (fileData) => {
  const incomingFilesContainer = document.getElementById('incoming-files');
  const fileElement = document.createElement('div');
  fileElement.textContent = `Incoming file: ${fileData.name} from ${fileData.sender}`;

  const allowBtn = document.createElement('button');
  allowBtn.textContent = 'Allow';
  allowBtn.addEventListener('click', () => {
    socket.emit('file-transfer-response', { response: 'allow', fileData });
    // Handle file transfer (e.g., download the file)
  });

  const denyBtn = document.createElement('button');
  denyBtn.textContent = 'Deny';
  denyBtn.addEventListener('click', () => {
    socket.emit('file-transfer-response', { response: 'deny', fileData });
  });

  fileElement.appendChild(allowBtn);
  fileElement.appendChild(denyBtn);
  incomingFilesContainer.appendChild(fileElement);
});
