// --- CẤU HÌNH KẾT NỐI FIREBASE CHÍNH THỨC CỦA ADMIN ---
const firebaseConfig = {
    apiKey: "AIzaSyD9Vi39Xuj8qf_bYjtZLAjpOkEvMIhzD1Y",
    authDomain: "hoangkun-chat.firebaseapp.com",
    databaseURL: "https://hoangkun-chat-default-rtdb.firebaseio.com",
    projectId: "hoangkun-chat",
    storageBucket: "hoangkun-chat.firebasestorage.app",
    messagingSenderId: "713375578505",
    appId: "1:713375578505:web:6d7d5c2a2d9a1608998958",
    measurementId: "G-JY93M87T99"
};

// Khởi tạo Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const currentRoomId = "room_khach_8921"; 
const chatBox = document.getElementById('chat-box');

// Làm sạch khung chat để nhận dữ liệu thật
if (chatBox) chatBox.innerHTML = ''; 

// Tránh lỗi nảy đúp tin nhắn khi f5
db.ref('chats/' + currentRoomId).off();

// ==========================================
// LOGIC ĐỘC QUYỀN DÀNH CHO ADMIN
// ==========================================
db.ref('chats/' + currentRoomId).on('child_added', (snapshot) => {
    const data = snapshot.val();
    const msgDiv = document.createElement('div');
    
    // Nếu là admin tự gửi -> nằm bên phải (msg-sent)
    // Nếu là khách gửi tới -> nằm bên trái (msg-received)
    msgDiv.className = data.sender === 'admin' ? 'message msg-sent' : 'message msg-received';
    msgDiv.textContent = data.text;
    
    if(chatBox) {
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Hiện chữ xem trước ở sidebar trái khi có khách nhắn
    if(data.sender === 'user') {
        const previewText = document.querySelector('.user-preview');
        if(previewText) previewText.textContent = data.text;
    }
});

// Hàm gửi tin nhắn
window.sendMessage = function() {
    const input = document.getElementById('msg-input');
    if(input && input.value.trim() !== '') {
        // CHỐT CỨNG QUYỀN ADMIN Ở ĐÂY
        db.ref('chats/' + currentRoomId).push({ 
            sender: 'admin', 
            text: input.value, 
            timestamp: Date.now() 
        });
        input.value = '';
    }
}
