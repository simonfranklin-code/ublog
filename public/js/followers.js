// public/js/followers.js
$(document).ready(function () {
    // Handle follow form submission

    $('#searchUserForm').on('submit', function (event) {
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
                        <div class="col-sm-12 col-lg-3 mb-2">
                          <div class="card p-2 mt-2">
                            <img class="img-fluid rounded-circle" src="${user.avatar}" alt="User Image">

                            <div class="card-body">
                              <a class="btn fw-bold fs-7 text-secondary text-truncate w-100 p-0" href="#">${user.username}</a>
                            </div>
                            <div class="card-footer">
                                <div class="card-tools">
                                    <button class="btn btn-tool btn-sm" onclick="followUser(${user.id})">Follow</button>
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

    // Initial load of followers and following lists
    loadFollowers();
    loadFollowing();
});
// Load followers into the followers list
function loadFollowers() {
    $.ajax({
        url: '/followers/getfollowers',
        method: 'GET',
        success: function (response) {
            const followersList = $('#followersList');
            followersList.empty();

            if (response.followers.length > 0) {
                response.followers.forEach(follower => {
                    const userItem = $(`
                        <div class="col-sm-12 col-lg-3 mb-2">
                          <div class="card p-2 mt-2">
                            <img class="img-fluid rounded-circle" src="${follower.user.avatar}" alt="User Image">

                            <div class="card-body">
                              <a class="btn fw-bold fs-7 text-secondary text-truncate w-100 p-0" href="#">${follower.user.username}</a>
                            </div>
                            <div class="card-footer">
                                <div class="card-tools">
                                    <button class="btn btn-tool btn-sm" onclick="followUser(${follower.user.id})">Follow</button>
                                    <button class="btn btn-tool btn-sm" onclick="unfollowUser(${follower.user.id})">Unfollow</button>
                                </div>
                            </div>
                          </div>
                        </div>

                        `);
                    followersList.append(userItem);
                });
            } else {
                followersList.append('<li class="list-group-item">No followers found.</li>');
            }
        },
        error: function (xhr) {
            alert('Failed to load followers.');
        }
    });
}

// Load following users into the following list
function loadFollowing() {
    $.ajax({
        url: '/followers/following',
        method: 'GET',
        success: function (response) {
            const followingList = $('#followingList');
            followingList.empty();

            if (response.following.length > 0) {
                response.following.forEach(following => {
                    const userItem = $(`

                        <div class="col-sm-12 col-lg-3 mb-2">
                          <div class="card p-2 mt-2">
                            <img class="img-fluid rounded-circle" src="${following.user.avatar}" alt="User Image">

                            <div class="card-body">
                              <a class="btn fw-bold fs-7 text-secondary text-truncate w-100 p-0" href="#">${following.user.username}</a>
                            </div>
                            <div class="card-footer">
                                <div class="card-tools">
                                    <button class="btn btn-tool btn-sm" onclick="followUser(${following.user.id})">Follow</button>
                                    <button class="btn btn-tool btn-sm" onclick="unfollowUser(${following.user.id})">Unfollow</button>
                                </div>
                            </div>
                          </div>
                        </div>
                        `);
                    followingList.append(userItem);
                });
            } else {
                followingList.append('<li class="list-group-item">You are not following anyone.</li>');
            }
        },
        error: function (xhr) {
            alert('Failed to load following.');
        }
    });
}
function followUser(userId) {


    $.ajax({
        url: '/followers/follow',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ UserId: userId }),
        success: function (response) {
            alert(response.message);
            // Refresh the followers/following lists
            loadFollowers();
            loadFollowing();
        },
        error: function (xhr) {
            alert('Failed to follow user: ' + xhr.responseJSON.message);
        }
    });
}

// Function to unfollow a user
window.unfollowUser = function (userId) {
    $.ajax({
        url: '/followers/unfollow',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ UserId: userId }),
        success: function (response) {
            alert(response.message);
            // Refresh the followers/following lists
            loadFollowers();
            loadFollowing();
        },
        error: function (xhr) {
            alert('Failed to unfollow user: ' + xhr.responseJSON.message);
        }
    });
};