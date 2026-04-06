$(function(){
    var socket = io();
    var msgCount = 0;
    var cls = 'end';
    // On form submission, send the message
    $('#chat-form').on('submit', function (e) {
        e.preventDefault(); // Prevent form from submitting the traditional way
        var message = $('#message-input').val();
        socket.emit('chatMessage', message); // Emit message to the server
        $('#message-input').val(''); // Clear the input field
        return false;
    });

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
        $('#messages').append(fileMessage);
    });

    // Listen for user online event
    socket.on('user-online', (data) => {
        //console.log(`${data.username} is online`);
        // Update your UI to show the user is online
        msgCount += 1;
        if (msgCount % 2 === 0) {
            cls = '';
        } else {
            cls = 'end';
        }
        var msgTemplate = `
            <div class="direct-chat-msg ${cls}">
                <div class="direct-chat-infos clearfix">
                    <span class="direct-chat-name float-end">${data.username}&nbsp;<i class="far fa-file-video video_btn" data-socket-id="${data.socketId}"></i>&nbsp;<i class="bi bi-chat-text private_btn" data-privateId="${data.userId}"></i></span>
                    <span class="direct-chat-timestamp float-start">${new Date().toISOString()}</span>
                </div>
                <!-- /.direct-chat-infos-->
                <img class="direct-chat-img" src="${data.avatar}" alt="message user image" draggable="false">
                <!-- /.direct-chat-img-->
                <div class="direct-chat-text">
                    ${data.username} is online : Socket Id:${data.socketId}
                </div>
                <!-- /.direct-chat-text-->
            </div>
        `
        $('#messages').append(msgTemplate); // Append the message to the chat
    });

    // Listen for user offline event
    socket.on('user-offline', (data) => {
        console.log(`${data.username} is offline`);
        // Update your UI to show the user is offline
        msgCount += 1;
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
                    ${data.username} is offline
                </div>
                <!-- /.direct-chat-text-->
            </div>
        `
        $('#messages').append(msgTemplate); // Append the message to the chat
    });

    // Listen for incoming messages
    socket.on('chatMessage', function (data) {
        msgCount += 1;

        if (msgCount % 2 === 0) {
            cls = '';
        } else {
            cls = 'end';
        }

        var msgTemplate = `
            <div class="direct-chat-msg ${cls}">
                <div class="direct-chat-infos clearfix">
                    <span class="direct-chat-name float-end">${data.username}&nbsp;<i class="far fa-file-video video_btn" data-socket-id="${data.socketId}"></i>&nbsp;<i class="bi bi-chat-text private_btn" data-privateId="${data.id}"></i></span> 
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
        $('#messages').append(msgTemplate); // Append the message to the chat
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
        appendMessage(data.username, data.message, data.avatar, data.from, data.socketId, true);
    });
    function appendMessage(username, message, avatar, userId, socketId, isPrivate) {
        msgCount++;
        cls = msgCount % 2 === 0 ? '' : 'end';

        var msgTemplate = `
            <div class="direct-chat-msg ${cls}">
                <div class="direct-chat-infos clearfix">
                    <span class="direct-chat-name float-end">${username}&nbsp;<i class="far fa-file-video video_btn" data-socket-id="${socketId}"><i class="bi bi-chat-text private_btn" data-privateId="${userId}"></i></span>
                    <span class="direct-chat-timestamp float-start">${new Date().toLocaleTimeString()}</span>
                </div>
                <img class="direct-chat-img" src="${avatar}" alt="message user image">
                <div class="direct-chat-text">${isPrivate === true ? "Private message from " : ''}${username}: ${message} (${socketId})</div>
            </div>`;
        $('#messages').append(msgTemplate);
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
        $('#messages').append(msgTemplate);
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