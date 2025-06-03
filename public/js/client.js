const socket = io();
const username = prompt("Enter your name:").trim();

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const container = document.getElementById('message-container');
const notifSound = document.getElementById('notifSound');

const emojiToggle = document.getElementById('emoji-toggle');
const emojiPopup = document.getElementById('emoji-popup');

const cameraBtn = document.getElementById('camera-btn');
const imageInput = document.getElementById('image-input');

// New elements for camera capture
let cameraStream = null;
let videoElem = null;
let captureBtn = null;
let cameraContainer = null;

let currentPage = 1;
let loading = false;

// Scroll container logic (disabled loading more history)
container.addEventListener('scroll', () => {
  if (container.scrollTop === 0 && !loading) {
    loading = true;
    currentPage++;
    // No loading history as per your comment
    // socket.emit('load messages', currentPage);
  }
});

// Receive chat messages
socket.on('chat message', (msg) => {
  const item = createMessageElement(msg);
  messages.appendChild(item);
  scrollToBottom();

  if (msg.user !== username) {
    notifSound.play();
  }
});

// Receive user joined notification message
socket.on('user joined', (msg) => {
  const item = document.createElement('li');
  item.textContent = msg;
  item.className = 'user-joined-notification';
  messages.appendChild(item);
  scrollToBottom();
  notifSound.play();
});

// Submit form send message
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', { user: username, text: input.value });
    input.value = '';
  }
  // Hide emoji popup on send
  emojiPopup.classList.add('hidden');
});

// Ensure popup is hidden initially
emojiPopup.classList.add('hidden');

// Emoji toggle click - open/close popup
emojiToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  emojiPopup.classList.toggle('hidden');
});

// Click outside emoji popup closes it
document.addEventListener('click', (e) => {
  if (!emojiPopup.contains(e.target) && e.target !== emojiToggle) {
    emojiPopup.classList.add('hidden');
  }
});

// Clicking emoji sends message
emojiPopup.addEventListener('click', (e) => {
  if (e.target.classList.contains('emoji-btn')) {
    const emoji = e.target.textContent;
    socket.emit('chat message', { user: username, text: emoji });
    emojiPopup.classList.add('hidden');
  }
});

// Scroll to bottom helper
function scrollToBottom() {
  container.scrollTop = container.scrollHeight;
}

// Camera button click triggers file input
cameraBtn.addEventListener('click', () => {
  imageInput.click();
});

// When image selected, send as base64 string via socket
imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const base64 = evt.target.result;
    socket.emit('chat message', { user: username, image: base64 });
  };
  reader.readAsDataURL(file);

  // Reset input so same file can be selected again if needed
  imageInput.value = '';
});

/*** New Camera Capture Feature ***/

// Create and insert camera UI container and elements
function createCameraUI() {
  // Prevent duplicates
  if (cameraContainer) return;

  cameraContainer = document.createElement('div');
  cameraContainer.id = 'camera-container';

  videoElem = document.createElement('video');
  videoElem.autoplay = true;
  cameraContainer.appendChild(videoElem);

  captureBtn = document.createElement('button');
  captureBtn.textContent = 'Capture Photo';

  // Cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';

  cameraContainer.appendChild(captureBtn);
  cameraContainer.appendChild(cancelBtn);

  document.body.appendChild(cameraContainer);

  // Capture button handler
  captureBtn.addEventListener('click', capturePhoto);
  cancelBtn.addEventListener('click', stopCameraAndRemoveUI);
}

// Open camera stream
function openCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Camera API not supported by your browser.');
    return;
  }

  createCameraUI();

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      cameraStream = stream;
      videoElem.srcObject = stream;
      videoElem.play();
    })
    .catch(err => {
      alert('Could not access camera: ' + err);
      stopCameraAndRemoveUI();
    });
}

// Capture photo from video and send
function capturePhoto() {
  if (!videoElem) return;

  const canvas = document.createElement('canvas');
  canvas.width = videoElem.videoWidth;
  canvas.height = videoElem.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL('image/png');

  socket.emit('chat message', { user: username, image: dataUrl });

  stopCameraAndRemoveUI();
}

// Stop camera stream and remove UI
function stopCameraAndRemoveUI() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  if (cameraContainer) {
    document.body.removeChild(cameraContainer);
    cameraContainer = null;
  }
}

// Add a new button for camera open next to the existing cameraBtn
const openCameraBtn = document.createElement('button');
openCameraBtn.type = 'button';
openCameraBtn.id = 'open-camera-btn';
openCameraBtn.title = 'Open Camera';
openCameraBtn.innerHTML = '📸';

// Insert it right after the cameraBtn
cameraBtn.insertAdjacentElement('afterend', openCameraBtn);

// Bind openCamera to the new button
openCameraBtn.addEventListener('click', openCamera);

// Existing createMessageElement unchanged except return statement
function createMessageElement(msg) {
  const item = document.createElement('li');
  item.className = msg.user === username ? 'me' : 'other';

  // If image message
  if (msg.image) {
    const userSpan = document.createElement('span');
    userSpan.className = 'username';
    userSpan.textContent = msg.user;

    const img = document.createElement('img');
    img.src = msg.image;
    img.className = 'message-image';

    item.appendChild(userSpan);
    item.appendChild(img);
  } else {
    // Text message
    item.textContent = `${msg.user}: ${msg.text}`;
  }

  return item;
}
