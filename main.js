// --- ADMIN CRM: QUẢN LÝ ĐA LUỒNG & TỰ ĐỘNG CHUYỂN TAB ---
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
const inputField = document.getElementById('msg-input');

// --- BIẾN QUẢN LÝ TAB TRẠNG THÁI ---
let currentAdminTab = 'pending'; // Bắt đầu ở tab 'Đang chờ'
let allPendingRooms = [];
let allResolvedRooms = [];

// --- LOGIC BẤM CHUYỂN TAB TRÊN GIAO DIỆN ---
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-menu .tab');
    if(tabs.length >= 2) {
        // Tab 1: Đang chờ xử lý
        tabs[0].onclick = () => {
            currentAdminTab = 'pending';
            tabs[0].classList.add('active');
            tabs[1].classList.remove('active');
            renderRoomList();
        };
        // Tab 2: Đã hoàn tất
        tabs[1].onclick = () => {
            currentAdminTab = 'resolved';
            tabs[1].classList.add('active');
            tabs[0].classList.remove('active');
            renderRoomList();
        };
    }
});

// 1. TỰ ĐỘNG QUÉT, PHÂN LOẠI KHÁCH HÀNG (SỐNG / CHẾT)
db.ref('chats').on('value', (snapshot) => {
    allPendingRooms = [];
    allResolvedRooms = [];
    const allRooms = snapshot.val();
    
    if(!allRooms) {
        renderRoomList();
        return;
    }

    // Đảo ngược để người nhắn mới nhất luôn nổi lên trên cùng
    const roomsArray = Object.keys(allRooms).map(roomId => {
        return { id: roomId, messages: allRooms[roomId] };
    }).reverse(); 

    roomsArray.forEach(room => {
        let lastMsg = 'Chưa có tin nhắn...';
        let gName = 'Khách Vô Danh';
        let isResolved = false; // Cờ kiểm tra xem phòng này đã bị đóng chưa
        
        // Quét lịch sử chat của phòng này
        Object.values(room.messages).forEach(msg => {
            if(msg.senderName) gName = msg.senderName;
            lastMsg = msg.text;
            
            // Nếu phát hiện có Lệnh Khóa Chat từ Admin -> Xác nhận là Đã xong
            if(msg.action === 'ADMIN_END_CHAT') {
                isResolved = true; 
            }
        });

        room.gName = gName;
        room.lastMsg = lastMsg;

        // Bỏ vào 2 giỏ riêng biệt
        if(isResolved) {
            allResolvedRooms.push(room);
        } else {
            allPendingRooms.push(room);
        }
    });

    // Vẽ lại danh sách ra màn hình
    renderRoomList();
});

// 2. HÀM VẼ DANH SÁCH RA MÀN HÌNH THEO TAB ĐANG CHỌN
function renderRoomList() {
    if(!userListDiv) return;
    userListDiv.innerHTML = '';
    
    // Đang đứng ở Tab nào thì lấy mảng của Tab đó ra vẽ
    const listToRender = currentAdminTab === 'pending' ? allPendingRooms : allResolvedRooms;

    // Nếu tab trống trơn
    if(listToRender.length === 0) {
        userListDiv.innerHTML = `
            <div style="text-align:center; padding: 40px 20px; color: #94a3b8;">
                <div style="font-size: 2.5rem; margin-bottom: 10px;">📭</div>
                <div style="font-size: 0.9rem; font-weight: 500;">Không có dữ liệu!</div>
            </div>
        `;
        return;
    }

    // Đổ danh sách thẻ khách hàng
    listToRender.forEach(room => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item' + (currentRoomId === room.id ? ' active' : '');
        userItem.onclick = () => loadRoom(room.id, room.gName, userItem);
        
        // Đổi màu sắc: Đang chờ = Cam rực rỡ + Chấm xanh. Đã xong = Xám xịt
        const dotHTML = currentAdminTab === 'pending' ? `<span class="status-dot"></span>` : ``;
        const avatarStyle = currentAdminTab === 'pending' 
            ? `background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);`
            : `background: #cbd5e1; box-shadow: none;`; 

        userItem.innerHTML = `
            <div class="user-avatar" style="${avatarStyle}">
                ${room.gName.charAt(0).toUpperCase()}
                ${dotHTML}
            </div>
            <div class="user-info">
                <div class="user-top-row">
                    <div class="user-name">${room.gName}</div>
                </div>
                <div class="user-preview">${room.lastMsg}</div>
            </div>
        `;
        userListDiv.appendChild(userItem);
    });
}

// 3. ADMIN CLICK VÀO KHÁCH ĐỂ MỞ PHÒNG CHAT
window.loadRoom = function(roomId, guestName, element) {
    currentRoomId = roomId;
    window.currentRoomId = roomId; 
    if(chatBox) chatBox.innerHTML = ''; 
    
    // Mở khóa ô text mặc định
    if(inputField) {
        inputField.disabled = false;
        inputField.placeholder = "Nhập tin nhắn hỗ trợ...";
    }
    
    // Đổi tên khách trên thanh Header
    const headerNameBox = document.getElementById('active-guest-name');
    if(headerNameBox) headerNameBox.textContent = guestName;
    
    const headerAvatar = document.getElementById('active-guest-avatar');
    if(headerAvatar) {
        headerAvatar.textContent = guestName.charAt(0).toUpperCase();
        
        // Chỉnh sửa Header tùy theo khách đang Mở hay đã Khóa
        if(currentAdminTab === 'resolved') {
            headerAvatar.style.background = '#cbd5e1';
            document.querySelector('.header-status').innerHTML = '<span style="width: 10px; height: 10px; background: #94a3b8; border-radius: 50%; display: inline-block;"></span> Đã đóng';
            document.querySelector('.btn-resolve').style.display = 'none'; // Ẩn luôn nút hoàn tất nếu đã xong
        } else {
            headerAvatar.style.background = 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)';
            document.querySelector('.header-status').innerHTML = '<span style="width: 10px; height: 10px; background: #10b981; border-radius: 50%; display: inline-block; animation: pulse-green 2s infinite;"></span> Đang online';
            document.querySelector('.btn-resolve').style.display = 'block';
        }
    }

    // Cập nhật thẻ đang Focus
    document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
    if(element) element.classList.add('active');

    // Load dữ liệu tin nhắn
    if (currentRoomRef) currentRoomRef.off();
    currentRoomRef = db.ref('chats/' + roomId);
    
    currentRoomRef.on('child_added', (snapshot) => {
        const data = snapshot.val();
        
        // Nếu load thấy lệnh Đã Khóa -> Khóa ô text
        if (data.action === 'ADMIN_END_CHAT') {
            if(inputField) {
                inputField.disabled = true;
                inputField.placeholder = "Phiên chat này đã được Admin đóng...";
            }
        }

        if(data.sender === 'system') return; 
        
        const msgDiv = document.createElement('div');
        msgDiv.className = data.sender === 'admin' ? 'message msg-sent' : 'message msg-received';
        msgDiv.innerHTML = data.text; 
        
        if(chatBox) {
            chatBox.appendChild(msgDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });
}

// 4. ADMIN GỬI TIN NHẮN
window.sendMessage = function() {
    if(!currentRoomId) {
        alert('Vui lòng click chọn một khách hàng!');
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
