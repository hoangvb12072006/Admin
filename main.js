// --- ADMIN: QUẢN LÝ ĐA LUỒNG KHÁCH HÀNG ---
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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

let currentRoomId = null;
let currentRoomRef = null;
const chatBox = document.getElementById('chat-box');
const userListDiv = document.querySelector('.user-list');

// 1. TỰ ĐỘNG QUÉT VÀ HIỂN THỊ DANH SÁCH KHÁCH HÀNG
db.ref('chats').on('value', (snapshot) => {
    if(userListDiv) userListDiv.innerHTML = '';
    const allRooms = snapshot.val();
    
    if(!allRooms) return;

    // Đảo ngược mảng để phòng có tin nhắn mới nhất luôn bị đẩy lên đầu
    const roomsArray = Object.keys(allRooms).map(roomId => {
        return { id: roomId, messages: allRooms[roomId] };
    }).reverse();

    roomsArray.forEach(room => {
        let lastMsg = 'Chưa có tin nhắn...';
        let gName = 'Khách Vô Danh';
        
        // Quét tin nhắn để lấy Tên khách và Nội dung chat cuối cùng
        Object.values(room.messages).forEach(msg => {
            if(msg.senderName) gName = msg.senderName;
            lastMsg = msg.text;
        });

        // Khởi tạo thẻ UI cho khách hàng bên cột trái
        const userItem = document.createElement('div');
        userItem.className = 'user-item' + (currentRoomId === room.id ? ' active' : '');
        userItem.onclick = () => loadRoom(room.id, gName, userItem);
        
        userItem.innerHTML = `
            <div class="user-avatar">${gName.charAt(0).toUpperCase()}</div>
            <div class="user-info">
                <div class="user-name">${gName}</div>
                <div class="user-preview">${lastMsg}</div>
            </div>
        `;
        userListDiv.appendChild(userItem);
    });
});

// 2. ADMIN CLICK VÀO KHÁCH ĐỂ MỞ PHÒNG CHAT RIÊNG
window.loadRoom = function(roomId, guestName, element) {
    currentRoomId = roomId;
    if(chatBox) chatBox.innerHTML = ''; // Làm sạch khung chat
    
    // Đổi tên khách trên thanh Header của Admin
    const headerNameBoxes = document.querySelectorAll('.chat-header div div');
    if(headerNameBoxes.length > 0) headerNameBoxes[0].textContent = guestName;
    const headerAvatar = document.querySelector('.header-avatar');
    if(headerAvatar) headerAvatar.textContent = guestName.charAt(0).toUpperCase();

    // Tắt luồng lắng nghe của phòng cũ để chữ không bị loạn sang phòng mới
    if (currentRoomRef) currentRoomRef.off();
    
    // Mở luồng chat của phòng mới
    currentRoomRef = db.ref('chats/' + roomId);
    currentRoomRef.on('child_added', (snapshot) => {
        const data = snapshot.val();
        if(data.sender === 'system') return; // Không hiển thị text báo cáo hệ thống
        
        const msgDiv = document.createElement('div');
        msgDiv.className = data.sender === 'admin' ? 'message msg-sent' : 'message msg-received';
        msgDiv.textContent = data.text;
        
        if(chatBox) {
            chatBox.appendChild(msgDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });
}

// 3. ADMIN GỬI TIN NHẮN VÀO PHÒNG ĐANG CHỌN
window.sendMessage = function() {
    if(!currentRoomId) {
        alert('Vui lòng click chọn một khách hàng bên cột trái trước khi gửi tin nhắn!');
        return;
    }
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
