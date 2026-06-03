// --- ADMIN CRM: QUẢN LÝ ĐA LUỒNG, TÌM KIẾM, TAB & MÃ KHÁCH HÀNG ---
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
const searchInput = document.querySelector('.search-box');

// --- BIẾN QUẢN LÝ TAB & TÌM KIẾM ---
let currentAdminTab = 'pending'; 
let allPendingRooms = [];
let allResolvedRooms = [];
let searchQuery = '';

// 1. KÍCH HOẠT THANH TÌM KIẾM (Gõ đến đâu lọc đến đó)
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderRoomList();
    });
}

// 2. KÍCH HOẠT SỰ KIỆN BẤM CHUYỂN TAB
const tabs = document.querySelectorAll('.tab-menu .tab');
if(tabs.length >= 2) {
    tabs[0].onclick = () => {
        currentAdminTab = 'pending';
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
        renderRoomList(); // Vẽ lại danh sách
    };
    tabs[1].onclick = () => {
        currentAdminTab = 'resolved';
        tabs[1].classList.add('active');
        tabs[0].classList.remove('active');
        renderRoomList(); // Vẽ lại danh sách
    };
}

// 3. TỰ ĐỘNG QUÉT VÀ PHÂN LOẠI KHÁCH HÀNG
db.ref('chats').on('value', (snapshot) => {
    allPendingRooms = [];
    allResolvedRooms = [];
    const allRooms = snapshot.val();
    
    if(!allRooms) {
        renderRoomList();
        return;
    }

    // Đảo ngược mảng để phòng mới nhất lên đầu
    const roomsArray = Object.keys(allRooms).map(roomId => {
        return { id: roomId, messages: allRooms[roomId] };
    }).reverse(); 

    roomsArray.forEach(room => {
        let lastMsg = 'Chưa có tin nhắn...';
        let gName = 'Khách Vô Danh';
        let isResolved = false; 
        
        Object.values(room.messages).forEach(msg => {
            if(msg.senderName) gName = msg.senderName;
            lastMsg = msg.text;
            if(msg.action === 'ADMIN_END_CHAT') isResolved = true; 
        });

        // 🌟 TẠO MÃ KHÁCH HÀNG TỰ ĐỘNG (Lấy 5 số cuối của ID phòng)
        let cusId = "#" + room.id.replace('room_', '').slice(-5);
        let displayName = cusId + " - " + gName; // Format: Mã trước - Tên sau

        room.gName = gName;             // Tên gốc để lấy chữ cái đầu làm Avatar
        room.displayName = displayName; // Tên đã ghép Mã Khách Hàng
        room.cusId = cusId;
        room.lastMsg = lastMsg;

        // Phân loại vào 2 mảng Tab
        if(isResolved) {
            allResolvedRooms.push(room);
        } else {
            allPendingRooms.push(room);
        }
    });

    renderRoomList();
});

// 4. HÀM VẼ DANH SÁCH RA MÀN HÌNH (CÓ LỌC TÌM KIẾM)
function renderRoomList() {
    if(!userListDiv) return;
    userListDiv.innerHTML = '';
    
    // Lấy dữ liệu theo Tab đang chọn
    let listToRender = currentAdminTab === 'pending' ? allPendingRooms : allResolvedRooms;

    // Lọc dữ liệu nếu Admin đang gõ vào thanh Tìm kiếm
    if (searchQuery !== '') {
        listToRender = listToRender.filter(room => 
            room.displayName.toLowerCase().includes(searchQuery) || 
            room.lastMsg.toLowerCase().includes(searchQuery)
        );
    }

    // Nếu không có dữ liệu
    if(listToRender.length === 0) {
        userListDiv.innerHTML = `
            <div style="text-align:center; padding: 40px 20px; color: #94a3b8;">
                <div style="font-size: 2.5rem; margin-bottom: 10px;">📭</div>
                <div style="font-size: 0.9rem; font-weight: 500;">Không tìm thấy khách hàng!</div>
            </div>
        `;
        return;
    }

    // Đổ danh sách khách hàng ra
    listToRender.forEach(room => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item' + (currentRoomId === room.id ? ' active' : '');
        
        // Truyền thẳng displayName (Mã + Tên) vào hàm loadRoom
        userItem.onclick = () => loadRoom(room.id, room.displayName, room.gName, userItem);
        
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
                    <div class="user-name">${room.displayName}</div>
                </div>
                <div class="user-preview">${room.lastMsg}</div>
            </div>
        `;
        userListDiv.appendChild(userItem);
    });
}

// 5. ADMIN CLICK VÀO KHÁCH ĐỂ MỞ PHÒNG CHAT
// (Thêm tham số originalName để lấy đúng chữ cái đầu cho Avatar)
window.loadRoom = function(roomId, displayName, originalName, element) {
    currentRoomId = roomId;
    window.currentRoomId = roomId; 
    if(chatBox) chatBox.innerHTML = ''; 
    
    // Mở khóa ô nhập
    if(inputField) {
        inputField.disabled = false;
        inputField.placeholder = "Nhập tin nhắn hỗ trợ...";
    }
    
    // Cập nhật Header với Mã Khách Hàng + Tên
    const headerNameBox = document.getElementById('active-guest-name');
    if(headerNameBox) headerNameBox.textContent = displayName;
    
    // Avatar vẫn lấy chữ cái đầu của Tên Gốc
    const headerAvatar = document.getElementById('active-guest-avatar');
    if(headerAvatar) {
        headerAvatar.textContent = originalName.charAt(0).toUpperCase();
        
        if(currentAdminTab === 'resolved') {
            headerAvatar.style.background = '#cbd5e1';
            document.querySelector('.header-status').innerHTML = '<span style="width: 10px; height: 10px; background: #94a3b8; border-radius: 50%; display: inline-block;"></span> Đã đóng';
            document.querySelector('.btn-resolve').style.display = 'none'; 
        } else {
            headerAvatar.style.background = 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)';
            document.querySelector('.header-status').innerHTML = '<span style="width: 10px; height: 10px; background: #10b981; border-radius: 50%; display: inline-block; animation: pulse-green 2s infinite;"></span> Đang online';
            document.querySelector('.btn-resolve').style.display = 'block';
        }
    }

    document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
    if(element) element.classList.add('active');

    if (currentRoomRef) currentRoomRef.off();
    currentRoomRef = db.ref('chats/' + roomId);
    
    currentRoomRef.on('child_added', (snapshot) => {
        const data = snapshot.val();
        
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

// 6. ADMIN GỬI TIN NHẮN
window.sendMessage = function() {
    if(!currentRoomId) {
        alert('Vui lòng click chọn một khách hàng!'); return;
    }
    const input = document.getElementById('msg-input');
    if(input && input.value.trim() !== '') {
        db.ref('chats/' + currentRoomId).push({ 
            sender: 'admin', text: input.value, timestamp: Date.now() 
        });
        input.value = '';
    }
}
