
$(document).ready(function () {
    // Function to load pending friend requests
    function loadPendingRequests() {
        $.ajax({
            url: '/friends/requests', // Endpoint to fetch pending friend requests
            method: 'GET',
            success: function (response) {
                $('#pendingRequests').empty();

                if (response.pendingRequests.length === 0) {
                    $('#pendingRequests').html('<p>No pending requests.</p>');
                } else {
                    response.pendingRequests.forEach(request => {
                        $('#pendingRequests').append(`
                          <div class="row align-items-center mb-3">
                            <div class="col-md-6">
                              <span>${request.requester}</span>
                            </div>
                            <div class="col-md-6 text-end">
                              <button class="btn btn-success btn-sm acceptRequestBtn" data-requestid="${request.id}">Accept</button>
                              <button class="btn btn-danger btn-sm declineRequestBtn" data-requestid="${request.id}">Decline</button>
                            </div>
                          </div>
                        `);
                    });
                }
            },
            error: function () {
                alert('Failed to load pending requests.');
            }
        });
    }
    function loadFriends() {

        $.ajax({
            url: '/friends',
            method: 'GET',
            contentType: 'application/json',
            success: function (data) {
                const resultsContainer = $('#friends-table');
                resultsContainer.empty();
                if (data.friends && data.friends.length > 0) {
                    data.friends.forEach(user => {
                        const userItem = $(`
                        <div class="col-sm-12 col-lg-3 mb-2">
                          <div class="card p-2 mt-2">
                            <img class="img-fluid rounded-circle" src="${user.avatar}" alt="User Image">
                            <div class="card-body">
                              <a class="btn fw-bold fs-7 text-secondary text-truncate w-100 p-0" href="#">${user.username}</a>
                            </div>
                            <div class="card-footer">
                                <div class="card-tools">
                                    <button class="btn btn-tool btn-sm unFriendBtn" type="button" data-friendid="${ user.id }">Remove Friend</button>
                                </div>
                            </div>
                          </div>
                        </div>
                    `);
                        resultsContainer.append(userItem);
                    });
                } else {
                    const noResultsItem = $('<li class="list-group-item">No users found</li>');
                    resultsContainer.append(noResultsItem);
                }
            },
            error: function (xhr, status, error) {
                console.error('Error searching for users:', error);
            }
        });
    }

    loadFriends();
    // Call the function to load pending requests on page load
    loadPendingRequests();

    // Accept or Decline Friend Request (Re-use the handlers from before)
    $(document).on('click', '.acceptRequestBtn, .declineRequestBtn', function () {
        const reqId = $(this).data('requestid');
        const action = $(this).hasClass('acceptRequestBtn') ? 'accept' : 'decline';

        $.ajax({
            url: `/friends/${action}`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ reqId }),
            success: function (data) {
                if (data.success) {
                    alert(`Friend request ${action}ed.`);
                    loadFriends();
                    loadPendingRequests();
                }
            },
            error: function (err) {
                alert(`Failed to ${action} request.` + ':' + JSON.stringify(err));
            }
        });
    });

    $('#btnSearchUser').on('click', function (event) {
        event.preventDefault();
        const searchInput = $('#search').val();

        $.ajax({
            url: '/friends/search',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ search: searchInput }),
            success: function (data) {
                const resultsContainer = $('#userSearchResults');
                resultsContainer.empty();
                if (data.users && data.users.length > 0) {
                    data.users.forEach(user => {
                        const userItem = $(`
                        <div class="col-sm-12 col-lg-2 mb-2">
                          <div class="card p-2 mt-2">
                            <img class="img-fluid rounded-circle" src="${user.avatar}" alt="User Image">
                            <div class="card-body">
                              <a class="btn fw-bold fs-7 text-secondary text-truncate w-100 p-0" href="#">${user.username}</a>
                            </div>
                            <div class="card-footer">
                                <div class="card-tools">
                                    <button class="btn btn-tool btn-sm sendFriendRequest"  data-userId="${user.id}">Add Friend</button>
                                </div>
                            </div>
                          </div>
                        </div>
                    `);
                        resultsContainer.append(userItem);
                    });
                } else {
                    const noResultsItem = $('<li class="list-group-item">No users found</li>');
                    resultsContainer.append(noResultsItem);
                }
            },
            error: function (xhr, status, error) {
                console.error('Error searching for users:', error);
            }
        });
    });
    
    $(document).on('click', '.sendFriendRequest', function () {
        const userId = $(this).attr('data-userId');

        $.ajax({
            url: '/friends/request', // Server endpoint to send a friend request
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ receiverId: userId }), // Pass the userId in the request body
            success: function (response) {
                if (response.success) {
                    alert('Friend request sent successfully!');
                    console.log(`Friend request sent to user ID: ${userId}`);
                }
            },
            error: function (xhr, status, error) {
                // Handle error response
                alert('Failed to send friend request. Please try again.');
                console.error('Error sending friend request:', error);
            }
        });
    });

    $(document).on('click', '.unFriendBtn', function () {
   
        const friendId = $(this).attr('data-friendid');
        const formData = { "friendId": friendId };
        $.ajax({
            url: '/friends/remove', // Server endpoint to remove a friend
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData), // Pass the userId in the request body
            success: function (response) {
                if (response.success) {
                    alert('Friend successfully removed');
                    loadFriends();
                    console.log(`Friend successfully removed user ID: ${friendId}`);
                }



            },
            error: function (xhr, status, error) {
                // Handle error response
                alert('Failed to remove friend Please try again.');
                console.error('Error removing friend:', error);
            }
        });
    });
});
