$(function () {
    var socket = io();
    var msgCount = 0;
    var cls = 'end';
    // Get the current <script> tag
    const script = document.currentScript || document.querySelector('script[src*="deep-seek-chat.js"]');

    // Extract query string from the src
    const url = new URL(script.src);
    const userId = url.searchParams.get("id");
    const username = url.searchParams.get("username");
    const avatar = url.searchParams.get("avatar");

    console.log({ userId, username, avatar });

    // Session management
    if (!localStorage.getItem('sessionId')) {
        localStorage.setItem('sessionId', crypto.randomUUID());
    }
    let sessionId = localStorage.getItem('sessionId');
    const $chatMessages = $('#deep-seek-chat-messages');
    const $userInput = $('#deep-seek-message-input');
    const $sendBtn = $('#send-btn');


    async function sendMessage() {
        let session_id = localStorage.getItem('sessionId');
        const message = $userInput.val().trim();
        if (!message) return;

        // Disable input during processing
        $userInput.prop('disabled', true);
        $sendBtn.prop('disabled', true);

        try {
            showSpinner('chat-card-body');
            //appendMessage('user', username, message, avatar, userId, socket.id, false);
            socket.emit('chatMessage', message); // Emit message to the server
            $userInput.val(''); // Clear the input field

            //role = 'assistant';
            const response = await $.ajax({
                url: '/api/deepseek/createCompletion',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ message: message, session_id: session_id })
            });

            socket.emit('chatMessage', response.data.answer); // Emit message to the server
            hideSpinner('chat-card-body');

        } catch (error) {
            console.error('Error:', error);
            alert('Error communicating with the server');
        } finally {
            $userInput.val('').prop('disabled', false).focus();
            $sendBtn.prop('disabled', false);
        }
    }
    // Load chat history
    async function loadHistory() {
        try {
            const messages = await $.ajax({
                url: '/api/deepSeek/chatHistory',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ session_id: sessionId })
            });

            messages.forEach(message => {
                switch (message.role) {
                    case 'user':
                        appendMessage('user', username, message.content, avatar, userId, socket.id, false);
                        break;
                    case 'assistant':
                        appendMessage('assistant', username, message.content, avatar, userId, socket.id, false);
                        break;
                }

            });
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }
    function continueChat() {
        const selectedSessionId = $('#chat-list').val();
        const selectedText = $('#chat-list option:selected').text();
        if (!selectedSessionId) return alert('Please select a saved chat session to continue.');

        // Update chat session
        localStorage.setItem('sessionId', selectedSessionId);
        sessionId = selectedSessionId;

        // Clear current messages and reload the session
        $('#deep-seek-chat-messages').empty();
        loadHistory();
        $('#current-session-name').text(`Current session: ${selectedText}`);
    }

    $('#chat-list').on('change', async function () {
        try {
            const selectedSessionId = $(this).val();
            if (!selectedSessionId) return;
            // Save session to sessionStorage
            sessionStorage.setItem('sessionId', selectedSessionId);
            await loadChatSession(selectedSessionId);
            continueChat();
        } catch (err) {
            console.error('Failed to load saved chat session:', err);
            showToast('Failed to load saved chat', true);
        }
    });

    $('#new-chat').on('click', async function () {
        //const sessionId = localStorage.getItem('sessionId');
        const savedChatName = $('#saved-chat-select option:selected').text();
        const userId = window.USER?.id;

        if (!savedChatName || savedChatName.includes('-- Select')) {
            // Proceed normally if nothing was saved
            newChatSession();
            return;
        }

        // Extract the chat name from "ChatName (date)"
        const name = savedChatName.replace(/\s+\(.+?\)/, '').trim();

        try {
            await $.ajax({
                url: '/api/deepseek/deleteSavedChat',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ name }) // your controller uses name
            });

            showToast(`Deleted saved chat: ${name}`, false);

        } catch (err) {
            console.warn('Failed to delete saved chat:', err);
            showToast('Could not delete saved chat', true);
        }

        newChatSession();
    });

    function newChatSession() {
        const newSessionId = crypto.randomUUID();
        localStorage.setItem('sessionId', newSessionId);
        //sessionStorage.removeItem('activeSessionId');
        $('#deep-seek-chat-messages').empty();
        $('#saved-chat-select').val('');
        $('#deep-seek-message-input').val('').focus();
        loadSavedChatsIntoSelect();
        showToast('Started new chat session.', false);
    }


    async function loadChatSession(session_id) {
        if (!session_id) return;

        $('#deep-seek-chat-messages').empty();

        try {
            const messages = await $.ajax({
                url: '/api/deepseek/chatHistory',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ session_id: session_id })
            });

            messages.forEach(msg => {
                switch (msg.role) {
                    case 'user':
                        appendMessage('user', username, msg.content, avatar, userId, socket.id, false);
                        break;
                    case 'assistant':
                        appendMessage('assistant', username, msg.content, avatar, userId, socket.id, false);
                        break;
                }
            });

        } catch (err) {
            console.error('Failed to load saved chat session:', err);
            showToast('Failed to load saved chat', true);
        }
    }

    $('#clearChat').on('click', async function () {
        if (!confirm("Are you sure you want to clear this session's chat history?")) return;

        try {
            await $.ajax({
                url: '/api/deepseek/clearChatHistory',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ session_id: sessionId }),
                success: (response) => {
                    if (response.success && response.message) {
                        $('#deep-seek-chat-messages').empty();
                        showToast(response.message, false);
                    }
                },
                error: (error) => {
                    console.error('Error clearing chat history. Data: ' + JSON.stringify(error), error);
                    showToast('Error clearing chat history. Data: ' + JSON.stringify(error), true);
                }
            });

        } catch (error) {
            console.error('Error clearing chat history. Data: ' + JSON.stringify(error), error);
            showToast('Error clearing chat history. Data: ' + JSON.stringify(error), true);
        }
    });

    $('#saveChat').on('click', async function () {
        const session_id = localStorage.getItem('sessionId');
        const name = $('#chatName').val().trim();
        if (!name.match(/^[\w\s-]+$/)) return alert('Invalid chat name. Use only letters, numbers, spaces, hyphens.');

        await $.ajax({
            url: '/api/deepseek/saveChat',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ session_id: session_id, name })
        });
        loadSavedChatsIntoSelect();
    });
    loadSavedChatsIntoSelect();
    //async function loadSavedChats() {
    //    const res = await $.get('/api/deepseek/listSavedChats');
    //    const list = document.getElementById('chat-list');
    //    list.innerHTML = ''; // Clear any existing options
    //    res.data.forEach(chat => {
    //        const option = document.createElement('option');
    //        option.value = chat.session_id;
    //        option.textContent = chat.name;
    //        list.appendChild(option);
    //    });

    //}
    async function loadSavedChatsIntoSelect() {
        const res = await $.get('/api/deepseek/listSavedChats');
        const select = $('#chat-list');
        select.empty().append(`<option value=''>-- Select a Saved Chat --</option>`);

        res.data.forEach(chat => {
            select.append(`<option value="${chat.session_id}">${chat.name} (${chat.saved_at})</option>`);
        });
    }
    async function deleteChat(name) {
        if (!confirm(`Delete chat '${name}'?`)) return;

        await $.ajax({
            url: '/api/deepseek/deleteSavedChat',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ name })
        });
        loadSavedChatsIntoSelect();
    }
    loadSavedChatsIntoSelect();
    // Event handlers
    $sendBtn.on('click', sendMessage);
    $userInput.on('keypress', function (e) {
        if (e.which === 13) { // Enter key
            sendMessage();
        }
    });

    loadHistory();
    // On form submission, send the message
    //$('#deep-seek-chat-form').on('submit', function (e) {
    //    e.preventDefault(); // Prevent form from submitting the traditional way
    //    var message = $('#deep-seek-message-input').val();
    //    socket.emit('deepseek-chatMessage', message); // Emit message to the server
    //    $('#deep-seek-message-input').val(''); // Clear the input field
    //    return false;
    //});

    // Handle file upload
    $('#file-input').change(function () {
        const file = this.files[0];
        const formData = new FormData();
        formData.append('file', file);

        // Upload the file to the server
        $.ajax({
            url: '/upload',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: (response) => {
                // Emit the file message to the server
                socket.emit('sendFile', {
                    username: 'Your Username', // Replace with dynamic username
                    fileUrl: response.fileUrl,
                    fileName: file.name,
                });
            },
            error: (err) => {
                console.error('File upload failed:' + err.responseText, err);
            },
        });
    });
    socket.on('admin-alert', function (data) {
        if (data.type === 'rate-limit') {
            showToast(`[Rate Limit] User ${data.userId} hit limit on ${data.url}`, true);
        }
    });
    socket.on('chatError', (data) => {
        console.error('Chat Error:', data.error);
        showToast(`Chat failed: ${data.error}`, true);
    });
    // Listen for file messages
    socket.on('fileMessage', (data) => {
        const fileMessage = `
            <div class="direct-chat-msg">
                <div class="direct-chat-infos clearfix">
                    <span class="direct-chat-name float-start">${data.username}</span>
                    <span class="direct-chat-timestamp float-end">${new Date().toLocaleTimeString()}</span>
                </div>
                <div class="direct-chat-text">
                    ${data.username} posted a file to the uploads directory: <a href="${data.fileUrl}" target="_blank" download>${data.fileName}</a>
                </div>
            </div>`;
        $chatMessages.append(fileMessage);
        $chatMessages.scrollTop($chatMessages[0].scrollHeight);
    });

    //// Listen for user online event
    //socket.on('user-online', (data) => {
    //    //console.log(`${data.username} is online`);
    //    // Update your UI to show the user is online
    //    msgCount += 1;
    //    if (msgCount % 2 === 0) {
    //        cls = '';
    //    } else {
    //        cls = 'end';
    //    }
    //    var msgTemplate = `
    //        <div class="direct-chat-msg ${cls}">
    //            <div class="direct-chat-infos clearfix">
    //                <span class="direct-chat-name float-end">${data.username}&nbsp;<i class="far fa-file-video video_btn" data-socket-id="${data.socketId}"></i>&nbsp;<i class="bi bi-chat-text private_btn" data-privateId="${data.userId}"></i></span>
    //                <span class="direct-chat-timestamp float-start">${new Date().toISOString()}</span>
    //            </div>
    //            <!-- /.direct-chat-infos-->
    //            <img class="direct-chat-img" src="${data.avatar}" alt="message user image" draggable="false">
    //            <!-- /.direct-chat-img-->
    //            <div class="direct-chat-text">
    //                ${data.username} is online : Socket Id:${data.socketId}
    //            </div>
    //            <!-- /.direct-chat-text-->
    //        </div>
    //    `
    //    $chatMessages.append(msgTemplate); // Append the message to the chat
    //    $chatMessages.scrollTop($chatMessages[0].scrollHeight);
    //});

    //// Listen for user offline event
    //socket.on('user-offline', (data) => {
    //    console.log(`${data.username} is offline`);
    //    // Update your UI to show the user is offline
    //    msgCount += 1;
    //    if (msgCount % 2 === 0) {
    //        cls = '';
    //    } else {
    //        cls = 'end';
    //    }
    //    var msgTemplate = `
    //        <div class="direct-chat-msg ${cls}">
    //            <div class="direct-chat-infos clearfix">
    //                <span class="direct-chat-name float-end">${data.username}&nbsp;<i class="bi bi-chat-text private_btn" data-privateId="${data.id}"></i></span>
    //                <span class="direct-chat-timestamp float-start">${new Date().toISOString()}</span>
    //            </div>
    //            <!-- /.direct-chat-infos-->
    //            <img class="direct-chat-img" src="${data.avatar}" alt="message user image" draggable="false">
    //            <!-- /.direct-chat-img-->
    //            <div class="direct-chat-text">
    //                ${data.username} is offline
    //            </div>
    //            <!-- /.direct-chat-text-->
    //        </div>
    //    `
    //    $chatMessages.append(msgTemplate); // Append the message to the chat
    //    $chatMessages.scrollTop($chatMessages[0].scrollHeight);
    //});

    // Listen for incoming messages
    socket.on('chatMessage', function (data) {

        msgCount += 1;
        //userId = data.id;
        if (msgCount % 2 === 0) {
            cls = '';
        } else {
            cls = 'end';
        }

        var msgTemplate = `
            <div class="direct-chat-msg ${cls}">
                <div class="direct-chat-infos clearfix">
                    <span class="direct-chat-name float-end">${data.username}&nbsp;<i class="bi bi-chat-text private_btn" data-privateId="${data.id}"></i></span> 
                    <span class="direct-chat-timestamp float-start">${new Date().toISOString()}</span>
                </div>
                <!-- /.direct-chat-infos-->
                <img class="direct-chat-img" src="${data.avatar}" alt="message user image" draggable="false">
                <!-- /.direct-chat-img-->
                <div class="direct-chat-text">
                    ${data.message} 
                </div>
                <!-- /.direct-chat-text-->
            </div>
        `
        $chatMessages.append(msgTemplate); // Append the message to the chat
        $chatMessages.scrollTop($chatMessages[0].scrollHeight);
    });

    // Send a private message
    $(document).on('click', '.private_btn', function () {

        var targetUserId = $(this).attr('data-privateId');
        var message = $('#message-input').val();

        // Emit private message to the server
        socket.emit('privateMessage', { to: targetUserId, message: message });

        // Append a pending message
        appendPendingMessage(targetUserId, message);
    });

    $(document).on('click', '.media_btn', function () {
        startMedia();
    });
    $(document).on('click', '.end-call_btn', function () {
        endCall();
    });
    $(document).on('click', '.video_btn', async function () {

        const socketId = $(this).attr('data-socket-id'); // Target SocketId

        peerConnection = new RTCPeerConnection(servers);

        // Add local stream to the peer connection
        localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Sending ICE candidate:', {
                    to: socketId,
                    from: socket.id,
                    candidate: event.candidate,
                });

                socket.emit('ice-candidate', {
                    to: socketId,
                    from: socket.id, // Ensure this is the sender's ID
                    candidate: event.candidate,
                });
            }
        };

        // Handle remote stream
        peerConnection.ontrack = (event) => {
            $('#remote-video')[0].srcObject = event.streams[0];
        };

        // Create and send offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit('offer', {
            to: socketId,
            from: socket.id,
            offer,
        });
    });
    // Acknowledgment: Update message status to Delivered
    socket.on('messageDelivered', ({ to, message }) => {
        updateMessageStatus(to, message, 'Delivered');
    });
    // Listen for flash messages
    socket.on('flash', function (data) {
        // Create a Bootstrap Toast dynamically
        const toastHTML = `
                <div class="toast show ${!data.isError ? 'text-bg-primary' : 'text-bg-danger'}  border-0 mb-2" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header">
                        <strong class="me-auto">Notification</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">
                        ${data.message}
                    </div>
                </div>
            `;
        $('#toast-container').append(toastHTML);

        // Initialize and show the toast
        const toastEl = document.querySelector('.toast');
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    });

    function showToast(message, isError) {
        const toastHTML = `
        <div class="toast show ${!isError ? 'text-bg-primary' : 'text-bg-danger'}  border-0 mb-2" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">Notification</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">${message}</div>
        </div>`;
        $('#toast-container').append(toastHTML);
        new bootstrap.Toast($('.toast').last()[0]).show();
    }

    // End call
    function endCall() {
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }
        $('#remote-video')[0].srcObject = null;
    }

    // Start media stream
    function startMediaCall() {
        startMedia();
    }
    // Listen for incoming private messages
    socket.on('privateMessage', function (data) {
        appendMessage('user', data.username, data.message, data.avatar, data.from, data.socketId, true);
    });

    function appendMessage(role, username, message, avatar, userId, socketId, isPrivate) {
        const messageClass = role === 'user' ? 'user-message' : 'bot-message';
        const messageType = role === 'user' ? 'Question' : 'Answer';
        msgCount++;
        cls = msgCount % 2 === 0 ? '' : 'end';

        var msgTemplate = `
            <div class="direct-chat-msg ${cls}">
                <div class="direct-chat-infos clearfix">
                    <span class="direct-chat-name float-end">${username}&nbsp;<i class="far fa-file-video video_btn"></i>&nbsp;<i class="bi bi-chat-text private_btn" data-privateId="${userId}"></i></span>
                    <span class="direct-chat-timestamp float-start">${new Date().toISOString()}</span>
                </div>
                <!-- /.direct-chat-infos-->
                <img class="direct-chat-img" src="${avatar}" alt="message user image" draggable="false">
                <!-- /.direct-chat-img-->
                <div class="/*direct-chat-text*/">
                    <div class="card">
                        <div class="card-header">
                            ${messageType}
                            <div class="card-tools">
                                <a class="btn btn-sm btn-tool" href="javascript:OpenModal(&quot;saveChatModal&quot;)">
                                    <i class="far fa-save"></i>
                                </a>
                                <button class="btn btn-tool" type="button" data-lte-toggle="card-collapse">
                                    <i class="bi bi-plus-lg" data-lte-icon="expand"></i>
                                    <i class="bi bi-dash-lg" data-lte-icon="collapse"></i>
                                </button>
                                <button class="btn btn-tool" type="button" title="Contacts" data-lte-toggle="chat-pane">
                                    <i class="bi bi-chat-text-fill"></i></button>
                                <button class="btn btn-tool" type="button" data-lte-toggle="card-remove">
                                    <i class="bi bi-x-lg"></i></button>
                                <button class="btn btn-tool" id="clearChat" type="button">
                                    <i class="bi bi-dash-lg"></i></button>
                                <button class="btn btn-tool" type="button" data-lte-toggle="card-maximize" style="z-index: 10000;">
                                    <i class="bi bi-arrows-fullscreen" data-lte-icon="maximize" style="display: block;"></i>
                                    <i class="bi bi-fullscreen-exit" data-lte-icon="minimize" style="display: none;"></i></button>
                                </div>
                        </div>
                        <div class="card-body">
                            ${message}
                        </div>
                        <footer class="card-footer"></div>
                    </div>
                </div>
                <!-- /.direct-chat-text-->
            </div>
        `
        $chatMessages.append(msgTemplate);
        $chatMessages.scrollTop($chatMessages[0].scrollHeight);
    }

    function appendPendingMessage(to, message) {
        msgCount++;
        cls = msgCount % 2 === 0 ? '' : 'end';

        var msgTemplate = `
            <div class="direct-chat-msg ${cls}" data-pending="true" data-to="${to}" data-message="${message}">
                <div class="direct-chat-infos clearfix">
                    <span class="direct-chat-name float-end">You&nbsp;<i class="bi bi-chat-text private_btn"></i></span>
                    <span class="direct-chat-timestamp float-start">${new Date().toISOString()}</span>
                </div>
                <div class="direct-chat-text">${message} <span class="status"> (Pending)</span></div>
            </div>`;
        $chatMessages.append(msgTemplate);
    }

    function updateMessageStatus(to, message, status) {
        const pendingMessages = $('.direct-chat-msg[data-pending="true"]');
        pendingMessages.each(function () {
            const pendingTo = $(this).data('to');
            const pendingMessage = $(this).data('message');
            if (pendingTo === parseInt(to) && pendingMessage === message) {
                $(this).find('.status').text(` (${status})`);
                $(this).removeAttr('data-pending'); // Remove pending attribute
            }
        });
    }

    // Acknowledgment: Update message status to Delivered
    socket.on('messageDelivered', ({ to, message }) => {
        updateMessageStatus(to, message, 'Delivered');
    });

    // Acknowledgment: Update message status to Failed
    socket.on('messageFailed', ({ to, message }) => {
        updateMessageStatus(to, message, 'Failed: User offline');
    });

    // Update the online user list
    socket.on('updateUserList', (users) => {
        const userList = $('#user-list');
        userList.empty(); // Clear the current list
        const userIdsInDOM = new Set();

        users.forEach(onlineUser => {
            // Prevent duplicate entries by tracking already added user IDs
            if (!userIdsInDOM.has(onlineUser.userId)) {
                const userItem = `
                <li>
                    <a href="#" draggable="false"></a>
                    <img class="contacts-list-img" src="${onlineUser.avatar}" alt="${onlineUser.username}" draggable="false">
                    <div class="contacts-list-info">
                        <span class="contacts-list-name"></span>
                        ${onlineUser.username}<small class="contacts-list-date float-end">${new Date().toLocaleTimeString()}</small>
                        <span class="contacts-list-msg">User ${onlineUser.username} is online...(${onlineUser.socketId})</span> 
                   </div>
                </li>`;
                userList.append(userItem);
                userIdsInDOM.add(onlineUser.userId);
            }
        });
    });

    let localStream = null;
    let peerConnection = null;

    const servers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }, // Public STUN server
        ],
    };

    // Access media devices
    async function startMedia() {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            $('#local-video')[0].srcObject = localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
        }
    }

    // Start a call
    $('#start-call').click(async function () {
        const targetUserId = $('#call-target').val(); // Target SocketId

        peerConnection = new RTCPeerConnection(servers);

        // Add local stream to the peer connection
        localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Sending ICE candidate:', {
                    to: targetUserId,
                    from: socket.id,
                    candidate: event.candidate,
                });

                socket.emit('ice-candidate', {
                    to: targetUserId,
                    from: socket.id, // Ensure this is the sender's ID
                    candidate: event.candidate,
                });
            }
        };

        // Handle remote stream
        peerConnection.ontrack = (event) => {
            $('#remote-video')[0].srcObject = event.streams[0];
        };

        // Create and send offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit('offer', {
            to: targetUserId,
            from: socket.id,
            offer,
        });
    });

    // Handle offer
    socket.on('offer', async (data) => {
        peerConnection = new RTCPeerConnection(servers);

        // Add local stream to the peer connection
        localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    to: targetUserId,        // The recipient's ID
                    from: socket.id,         // Your socket ID (the sender's ID)
                    candidate: event.candidate, // The ICE candidate
                });
                console.log('Emitting ICE candidate:', { to: targetUserId, from: socket.id });
            }
        };

        // Handle remote stream
        peerConnection.ontrack = (event) => {
            $('#remote-video')[0].srcObject = event.streams[0];
        };

        // Set remote description and send answer
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit('answer', {
            to: data.from,
            from: socket.id,
            answer,
        });
    });

    // Handle answer
    socket.on('answer', async (data) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    // Handle ICE candidates
    socket.on('ice-candidate', (data) => {
        console.log(`ICE Candidate received from: ${data.from}`);
        peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
            .then(() => console.log('ICE candidate added successfully'))
            .catch((error) => console.error('Error adding ICE candidate:', error));
    });




});