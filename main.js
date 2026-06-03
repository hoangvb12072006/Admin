// --- CẤU HÌNH KẾT NỐI FIREBASE CHÍNH THỨC CỦA HOÀNG KUN ---
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
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Nhận diện đường dẫn: Có chữ "admin" (viết hoa/thường đều được) thì là trang chủ shop
const isPageAdmin = window.location.pathname.toLowerCase().includes('admin');
const currentRoomId = "room_khach_8921"; 

if (!isPageAdmin) {
    // ==========================================
    // LOGIC CHO KHÁCH (Nằm ở kho HoangKunCode)
    // ==========================================
    const chatBox = document.getElementById('chat-box');
    if(chatBox) chatBox.innerHTML = '';

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

    window.sendMessage = function() {
        const input = document.getElementById('msg-input');
        if(input && input.value.trim() !== '') {
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
    // LOGIC CHO ADMIN (Nằm ở kho Admin)
    // ==========================================
    const chatBox = document.getElementById('chat-box');
    if(chatBox) chatBox.innerHTML = '';

    db.ref('chats/' + currentRoomId).on('child_added', (snapshot) => {
        const data = snapshot.val();
        const msgDiv = document.createElement('div');
        msgDiv.className = data.sender === 'admin' ? 'message msg-sent' : 'message msg-received';
        msgDiv.textContent = data.text;
        
        if(chatBox) {
            chatBox.appendChild(msgDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        if(data.sender === 'user') {
            const previewText = document.querySelector('.user-preview');
            if(previewText) previewText.textContent = data.text;
        }
    });

    window.sendMessage = function() {
        const input = document.getElementById('msg-input');
        if(input && input.value.trim() !== '') {
            db.ref('chats/' + currentRoomId).push({ 
                sender: 'admin', 
                text: input.value, 
                timestamp: Date.now() 
            });
            input.value = '';
        }
    }
}
