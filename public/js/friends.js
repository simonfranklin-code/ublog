// public/js/friends.js
$(document).ready(function () {
    // Fetch and display pending requests and friends list
    fetch('/admin/friends/pending').then(res => res.json()).then(data => {
        // Handle displaying pending friend requests
    });

    fetch('/admin/friends/list').then(res => res.json()).then(data => {
        // Handle displaying list of friends
    });

    // Handle friend request acceptance or rejection
    $('.accept-request').on('click', function () {
        const requestId = $(this).data('id');
        $.post(`/admin/friends/accept/${requestId}`, function (response) {
            alert(response.message);
            location.reload();
        });
    });

    // Handle friend removal
    $('.remove-friend').on('click', function () {
        const friendId = $(this).data('id');
        $.post(`/admin/friends/remove/${friendId}`, function (response) {
            alert(response.message);
            location.reload();
        });
    });
});
