// --- CẤU HÌNH KẾT NỐI FIREBASE CHÍNH THỨC CỦA HOÀNG KUN ---
const firebaseConfig = {
    apiKey: "AIzaSyD9Vi39Xuj8qf_bYjtZLAjpOkEvMIhzD1Y",
    authDomain: "hoangkun-chat.firebaseapp.com",
    // Mình đã thêm sẵn link Database cực chuẩn cho bạn ở đây:
    databaseURL: "https://hoangkun-chat-default-rtdb.firebaseio.com",
    projectId: "hoangkun-chat",
    storageBucket: "hoangkun-chat.firebasestorage.app",
    messagingSenderId: "713375578505",
    appId: "1:713375578505:web:6d7d5c2a2d9a1608998958",
    measurementId: "G-JY93M87T99"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Nhận diện tự động xem đang ở trang Khách hay trang Admin
const isPageAdmin = window.location.pathname.includes('admin');
const currentRoomId = "room_khach_8921"; 

if (!isPageAdmin) {
    // ==========================================
    // LOGIC CHO KHÁCH (CHAT.HTML)
    // ==========================================
    const chatBox = document.getElementById('chat-box');
    if(chatBox) chatBox.innerHTML = ''; // Xóa tin nhắn mẫu

    // Lắng nghe tin nhắn mới
    db.ref('chats/' + currentRoomId).on('child_added', (snapshot) => {
        const data = snapshot.val();
        const msgDiv = document.createElement('div');
        msgDiv.className = data.sender === 'admin' ? 'message msg-received' : 'message msg-sent';
        msgDiv.textContent = data.text;
        
        if(chatBox) {
            chatBox.appendChild(msgDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });

    // Hàm gửi tin nhắn của Khách
    window.sendMessage = function() {
        const input = document.getElementById('msg-input');
        if(input.value.trim() !== '') {
            db.ref('chats/' + currentRoomId).push({ 
                sender: 'user', 
                text: input.value, 
                timestamp: Date.now() 
            });
            input.value = '';
        }
    }
} else {
    // ==========================================
    // LOGIC CHO ADMIN (ADMIN/INDEX.HTML)
    // ==========================================
    const chatBox = document.getElementById('chat-box');
    if(chatBox) chatBox.innerHTML = ''; // Xóa tin nhắn mẫu

    // Admin lắng nghe tin nhắn
    db.ref('chats/' + currentRoomId).on('child_added', (snapshot) => {
        const data = snapshot.val();
        const msgDiv = document.createElement('div');
        msgDiv.className = data.sender === 'admin' ? 'message msg-sent' : 'message msg-received';
        msgDiv.textContent = data.text;
        
        if(chatBox) {
            chatBox.appendChild(msgDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        // Cập nhật text xem trước ở cột bên trái
        if(data.sender === 'user') {
            const previewText = document.querySelector('.user-preview');
            if(previewText) previewText.textContent = data.text;
        }
    });

    // Hàm gửi tin nhắn của Admin
    window.sendMessage = function() {
        const input = document.getElementById('msg-input');
        if(input.value.trim() !== '') {
            db.ref('chats/' + currentRoomId).push({ 
                sender: 'admin', 
                text: input.value, 
                timestamp: Date.now() 
            });
            input.value = '';
        }
    }
}
