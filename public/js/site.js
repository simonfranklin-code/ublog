$(window).on("load", function () {
    populateComments();

});

function populateComments() {
    var url = window.location.pathname;
    var slug = url.split("/")['3'].toLowerCase();
    var comments = {};
    if (url.includes('/blog/')) {
        $.ajax({
            url: '/comments/getComments/' + slug,
            header: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            method: 'GET',
            dataType: 'json',
            contentType: 'application/json',
            mimeType: 'text/json',
            data: '',
            beforeSend: function () {

            },
            success: function (data) {

                $('#commentsArea').html(data.commentsSection);
                comments = data.comments;

            },
            complete: function () {
                comments.forEach(async (comment) => {

                    $.ajax({
                        url: '/likes/getCommentLikesCount',
                        type: 'POST',
                        cache: false,
                        data: { commentId: comment.CommentId }
                        ,
                        success: function (data) {
                            const likesCount = data.likesCount;
                            $('#commentLikesCount' + comment.CommentId).text(likesCount);
                        },
                        error: function (err) {

                        }
                    });
                    getReplies(comment);
                });

            }
        });
    }
}


function populateReviews() {
    // Fetch and display reviews
    var url = window.location.pathname;
    var slug = url.split("/")['3'].toLowerCase();
    $('#reviewsContainer').html('')
    $.ajax({
        url: '/reviews/reviewsBySlug/' + slug,
        method: 'GET',
        success: function (data) {
            if (data.success) {
                data.reviews.forEach(function (review) {
                    $('#reviewsContainer').append(createReviewHtml(review));
                });
            }
        },
        error: function (err) {
            console.error('Error fetching reviews:', err);
        }
    });
}


$(document).ready(function () {
    populateReviews();

    // Handle review form submission
    $('#reviewForm').submit(function (event) {
        event.preventDefault();
        var formData = $(this).serialize();
        var url = $('#BlogPostReviewId').val() ? '/reviews/updateReview' : '/reviews/addReview';
        $.ajax({
            url: url,
            method: $('#BlogPostReviewId').val() ? 'PUT' : 'POST',
            data: formData,
            success: function (data) {
                if (data.success) {
                    //alert('Review saved successfully!');
                    populateReviews();
                    $('#reviewModal').modal('hide');
                    //location.reload();
                } else {
                    alert('Failed to save review.');
                }
            },
            error: function (err) {
                console.error('Error saving review:', err);
                alert('Error saving review.');
            }
        });
    });

    // Populate review form for editing
    $(document).on('click', '.editReviewButton', function () {
        var reviewId = $(this).data('review-id');
        var review = $(`.review[data-review-id="${reviewId}"]`);
        $('#BlogPostReviewId').val(reviewId);
        $('#reviewForm [name="Rating"]').val(review.find('.review-rating').text());
        $('#reviewForm [name="Author"]').val(review.find('.review-author').text());
        $('#reviewForm [name="AuthorEmailAddress"]').val(review.find('.review-email').text());
        $('#reviewForm [name="ReviewText"]').val($(`#review-text${reviewId}`).html());

        $('#reviewModal').modal('show');
    });



    // Mark notification as read
    $(document).on('click', '.markAsReadButton', function () {
        var notificationId = $(this).data('notification-id');
        $.ajax({
            url: '/notifications/markAsRead',
            method: 'POST',
            data: { NotificationId: notificationId },
            success: function (data) {
                if (data.success) {
                    $(`.notification[data-notification-id="${notificationId}"]`).remove();
                }
            },
            error: function (err) {
                console.error('Error marking notification as read:', err);
                alert('Error marking notification as read.');
            }
        });
    });

    // Handle review deletion
    $(document).on('click', '.deleteReviewButton', function () {
        if (confirm('Are you sure you want to delete this review?')) {
            var reviewId = $(this).data('review-id');
            $.ajax({
                url: '/reviews/deleteReview/' + reviewId,
                method: 'DELETE',
                success: function (data) {
                    if (data.success) {
                        alert('Review deleted successfully!');
                        $(`#ReviewId${reviewId}`).remove();
                        //location.reload();
                    } else {
                        alert('Failed to delete review.');
                    }
                },
                error: function (err) {
                    console.error('Error deleting review:', err);
                    alert('Error deleting review.');
                }
            });
        }
    });

    // Handle review like
    $(document).on('click', '.likeReviewButton', function () {
        var reviewId = $(this).data('review-id');
        $.ajax({
            url: '/reviewLikes/likeReview',
            method: 'POST',
            data: { BlogPostReviewId: reviewId },
            success: function (data) {
                if (data.success) {
                    var likesCount = data.likesCount;
                    $(`.review[data-review-id="${reviewId}"] .review-likes-count`).text(likesCount);
                }
            },
            error: function (err) {
                console.error('Error liking review:', err);
                alert('Error liking review.');
            }
        });
    });

    // Handle review unlike
    $(document).on('click', '.unlikeReviewButton', function () {
        var reviewId = $(this).data('review-id');
        $.ajax({
            url: '/reviewLikes/unlikeReview',
            method: 'POST',
            data: { BlogPostReviewId: reviewId },
            success: function (data) {
                if (data.success) {
                    var likesCount = data.likesCount;
                    $(`.review[data-review-id="${reviewId}"] .review-likes-count`).text(likesCount);
                }
            },
            error: function (err) {
                console.error('Error unliking review:', err);
                alert('Error unliking review.');
            }
        });
    });
    // Handle follow user
    $('#followUserButton').click(function () {
        var UserId = 3; // Example user ID to follow
        $.ajax({
            url: '/followers/follow',
            method: 'POST',
            data: { UserId: UserId },
            success: function (data) {
                if (data.success) {
                    alert('User followed successfully!');
                } else {
                    alert('Failed to follow user.');
                }
            },
            error: function (err) {
                console.error('Error following user:', err);
                alert('Error following user.');
            }
        });
    });

    // Handle unfollow user
    $('#unfollowUserButton').click(function () {
        var UserId = 3; // Example user ID to unfollow
        $.ajax({
            url: '/followers/unfollow',
            method: 'POST',
            data: { UserId: UserId },
            success: function (data) {
                if (data.success) {
                    alert('User unfollowed successfully!');
                } else {
                    alert('Failed to unfollow user.');
                }
            },
            error: function (err) {
                console.error('Error unfollowing user:', err);
                alert('Error unfollowing user.');
            }
        });
    });
    // Reset review form on modal hide
    $('#reviewModal').on('hidden.bs.modal', function () {
        $('#reviewForm')[0].reset();
        $('#BlogPostReviewId').val('');
    });


});
function fetchAndDisplayNotifications() {
    // Fetch and display notifications
    $.ajax({
        url: '/notifications/getNotifications',
        method: 'GET',
        success: function (data) {
            if (data.success) {
                data.notifications.forEach(function (notification) {
                    $('#notificationsContainer').append(createNotificationHtml(notification));
                });
            }
        },
        error: function (err) {
            console.error('Error fetching notifications:', err);
        }
    });
}

function createNotificationHtml(notification) {
    return `
        <a class="dropdown-item d-flex align-items-center" data-notification-id="${notification.NotificationId}" href="#">
            <div class="mr-3">
                <div class="icon-circle bg-primary">
                    <i class="far fa-comment-dots text-white"></i>
                </div>
            </div>
            <div>
                <div class="small text-gray-500">${notification.CreatedAt}</div>
                <span class="font-weight-bold">${notification.Message} 
                    <button class="btn btn-sm btn-secondary markAsReadButton" data-notification-id="${notification.NotificationId}">Mark as read</button>
                </span>
            </div>
        </a>
            `;
}

function createReviewHtml(review) {
    return `
        <div class="review" data-review-id="${review.BlogPostReviewId}" id="ReviewId${review.BlogPostReviewId}">
            <p class="mbr-text mbr-fonts-style display-7 mb-2"><strong class="review-author">${review.Author}</strong> (Rating: <span class="review-rating">${review.Rating}</span>)</p>
            <p class="mbr-text mbr-fonts-style display-7 review-email mb-2">${review.AuthorEmailAddress}</p>
            <div id="review-text${review.BlogPostReviewId}"><p class="mbr-text mbr-fonts-style mb-4 display-7">${review.ReviewText}</p></div>
            <p class="mbr-text mbr-fonts-style display-7 mb-2">${review.ReviewDate}</p>
            <p class="mbr-text mbr-fonts-style display-7 mb-2">Likes: <span class="review-likes-count">${review.likesCount}</span></p>
            <button class="btn btn-primary btn-sm editReviewButton" data-review-id="${review.BlogPostReviewId}">Edit</button>
            <button class="btn btn-primary btn-sm deleteReviewButton" data-review-id="${review.BlogPostReviewId}">Delete</button>
            <a class="likeReviewButton" data-review-id="${review.BlogPostReviewId}"><i class="fas fa-thumbs-up"></i></a>
            <a class="unlikeReviewButton" data-review-id="${review.BlogPostReviewId}"><i class="fas fa-thumbs-down"></i></a>
            <hr style="border-top: 1px solid #fafafa"/>
          </div>
    `;
}


function getReplies(comment) {
    var url = window.location.pathname;
    var slug = url.split("/")['3'].toLowerCase();
    var replies = {};
    $.ajax({
        url: '/comments/getReplies/' + slug + '/' + comment.CommentId,
        header: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        method: 'GET',
        dataType: 'json',
        contentType: 'application/json',
        mimeType: 'text/json',
        data: '',
        beforeSend: function () {

        },
        success: function (data) {

            $('#' + comment.CommentId).html(data.htmlReplies);
            replies = data.replies;

        },
        complete: function () {

            replies.forEach(async (reply) => {

                getReplies(reply)
            });
        }
    });
}

function submitReplyForm(CommentId, blogPostId) {
    try {
        var formData = {
            Title: $("#Title" + CommentId).val(),
            CodeDescription: $("#CodeDescription" + CommentId).val(),
            Email: $("#Email" + CommentId).val(),
            Author: $("#Author" + CommentId).val(),
            DisplayName: $("#DisplayName" + CommentId).val(),
            Url: $("#Url" + CommentId).val(),
            Text: $("#Text" + CommentId).val(),
            DateModified: new Date().toISOString(),
            BlogPostSlug: $("#BlogPostSlug" + CommentId).val(),
            ParentCommentId: $("#ParentCommentId" + CommentId).val(),
            IsOpen: $("#IsOpen" + CommentId).val(),
            BlogPostId: $("#BlogPostId" + CommentId).val(),
            CodeLanguage: $("#CodeLanguage" + CommentId).val(),
            UserId: $("#UserId" + CommentId).val(),
        };

        $.ajax({
            url: '/comments/addCommentReply',
            type: 'POST',
            cache: false,
            data: formData,
            success: function (data) {
                //alert('Your reply was saved successfully!');
                var myModalEl = $("#modalReplyForm" + CommentId);
                var modal = bootstrap.Modal.getInstance(myModalEl)
                modal.hide();
                try {
                    populateComments();
                    /*$('#' + data.comment.ParentCommentId).append(data.commentSection);*/
                    var url = window.location.pathname + '#commentTitle' + data.comment.CommentId;
                    window.location.href = url;
                } catch (err) {
                    alert(JSON.stringify(err));
                }
            },
            error: function (err) {
                if (err.responseJSON !== 'undefined') {
                    if (err.responseJSON.errors !== 'undefined') {
                        var errorMessage = "";
                        err.responseJSON.errors.forEach((error) => {
                            errorMessage += error.path + ': ' + error.msg + ': ' + error.value + '\n'
                        });
                        alert(errorMessage);
                    }
                } else {
                    alert(JSON.stringify(err));
                }
            }
        });

    } catch (e) {
        alert(JSON.stringify(e));
    }
}

function submitCommentForm(CommentId) {
    try {

        var formData = {
            Title: $("#Title0").val(),
            CodeDescription: $("#CodeDescription0").val(),
            Email: $("#Email0").val(),
            Author: $("#Author0").val(),
            DisplayName: $("#DisplayName0").val(),
            Url: $("#Url0").val(),
            Text: $("#Text0").val(),
            DateModified: new Date().toISOString(),
            BlogPostSlug: $("#BlogPostSlug0").val(),
            ParentCommentId: CommentId,
            IsOpen: $("#IsOpen0").val(),
            BlogPostId: _blogPostId,
            CodeLanguage: $("#CodeLanguage0").val(),
            UserId: $("#UserId0").val(),
        };

        $.ajax({
            url: '/comments/addCommentReply',
            type: 'POST',
            cache: false,
            data: formData,
            success: function (data) {


                //alert('Your comment was saved successfully!');
                var myModalEl = $("#modalAddCommentForm0");
                var modal = bootstrap.Modal.getInstance(myModalEl)
                modal.hide();
                populateComments();
                //$('#commentsArea').append(data.commentSection);
                var url = window.location.pathname + '#commentTitle' + data.comment.CommentId;
                window.location.href = url;
            },
            error: function (err) {
                if (err.responseJSON !== 'undefined') {
                    if (err.responseJSON.errors !== 'undefined') {
                        var errorMessage = "";
                        err.responseJSON.errors.forEach((error) => {
                            errorMessage += error.path + ': ' + error.msg + ': ' + error.value + '\n'
                        });
                        alert(errorMessage);
                    }
                } else {
                    alert(JSON.stringify(err));
                }
            }
        });

    } catch (e) {
        alert(JSON.stringify(e));
    }
}

function editCommentForm(commentId) {
    // Make an AJAX call to fetch the existing comment data
    $.ajax({
        url: `/comments/getComment/${commentId}`,
        method: 'GET',
        success: function (data) {
            // Populate the modal form with the fetched data
            $("#editTitle" + commentId).val(data.Comment.Title);
            $("#editCodeDescription" + commentId).val(data.Comment.CodeDescription);
            $("#editEmail" + commentId).val(data.Comment.Email);
            $("#editAuthor" + commentId).val(data.Comment.Author);
            $("#editDisplayName" + commentId).val(data.Comment.DisplayName);
            $("#editUrl" + commentId).val(data.Comment.Url);
            $("#editText" + commentId).val(data.Comment.Text);
            $("#editCodeLanguage" + commentId).val(data.Comment.CodeLanguage);
            $("#editUserId" + commentId).val(data.Comment.UserId);
            $("#editBlogPostId" + commentId).val(data.Comment.BlogPostId);
            $("#editIsOpen" + commentId).val(data.Comment.IsOpen);

            // Open the modal
            $('#editModal' + commentId).modal('show');
        },
        error: function (err) {
            alert('Error fetching comment data.');
        }
    });
}

function updateComment(commentId) {
    const formData = {
        Title: $("#editTitle" + commentId).val(),
        CodeDescription: $("#editCodeDescription" + commentId).val(),
        Email: $("#editEmail" + commentId).val(),
        Author: $("#editAuthor" + commentId).val(),
        DisplayName: $("#editDisplayName" + commentId).val(),
        Url: $("#editUrl" + commentId).val(),
        Text: $("#editText" + commentId).val(),
        UserId: $("#editUserId" + commentId).val(),
        BlogPostId: $("#editBlogPostId" + commentId).val(),
        IsOpen: $("#editIsOpen" + commentId).val(),
        CommentId: commentId
    };

    $.ajax({
        url: '/comments/updateCommentReply',  // Update route
        type: 'PUT',
        data: formData,
        success: function (data) {
            // Update the comment on the page
            populateComments();
            //$('#commentsArea').append(data.commentSection);
            $('#editModal' + data.comment.CommentId).modal('hide');  // Close modal
        },
        error: function (err) {
            alert('Error updating comment.');
        }
    });
}

function editReplyForm(commentId) {
    // Make an AJAX call to fetch the existing comment data
    $.ajax({
        url: `/comments/getComment/${commentId}`,
        method: 'GET',
        success: function (data) {
            // Populate the modal form with the fetched data
            $("#editReplyTitle" + commentId).val(data.Comment.Title);
            $("#editReplyCodeDescription" + commentId).val(data.Comment.CodeDescription);
            $("#editReplyEmail" + commentId).val(data.Comment.Email);
            $("#editReplyAuthor" + commentId).val(data.Comment.Author);
            $("#editReplyDisplayName" + commentId).val(data.Comment.DisplayName);
            $("#editReplyUrl" + commentId).val(data.Comment.Url);
            $("#editReplyText" + commentId).val(data.Comment.Text);
            $("#editReplyCodeLanguage" + commentId).val(data.Comment.CodeLanguage);
            $("#editReplyUserId" + commentId).val(data.Comment.UserId);
            $("#editReplyBlogPostId" + commentId).val(data.Comment.BlogPostId);
            $("#editReplyIsOpen" + commentId).val(data.Comment.IsOpen);

            // Open the modal
            $('#editReplyModal' + commentId).modal('show');
        },
        error: function (err) {
            alert('Error fetching comment data.');
        }
    });
}
function updateEditReply(commentId) {
    const formData = {
        Title: $("#editReplyTitle" + commentId).val(),
        CodeDescription: $("#editReplyCodeDescription" + commentId).val(),
        Email: $("#editReplyEmail" + commentId).val(),
        Author: $("#editReplyAuthor" + commentId).val(),
        DisplayName: $("#editReplyDisplayName" + commentId).val(),
        Url: $("#editReplyUrl" + commentId).val(),
        Text: $("#editReplyText" + commentId).val(),
        UserId: $("#editReplyUserId" + commentId).val(),
        BlogPostId: $("#editReplyBlogPostId" + commentId).val(),
        IsOpen: $("#editReplyIsOpen" + commentId).val(),
        CommentId: commentId
    };

    $.ajax({
        url: '/comments/updateCommentReply',  // Update route
        type: 'PUT',
        data: formData,
        success: function (data) {
            // Update the comment on the page
            populateComments();
            //$('#commentsArea').append(data.commentSection);
            $('#editReplyModal' + data.comment.CommentId).modal('hide');  // Close modal
        },
        error: function (err) {
            alert('Error updating comment.');
        }
    });
}

function deleteComment(commentId) {

    $('#confirmDeleteBtn').data('id', commentId);
    $('#confirmDeleteModal').modal('show');
    $('#confirmDeleteBtn').on('click', function () {

        const commentId = $(this).data('id');

        $.ajax({
            url: '/comments/deleteComment/' + commentId,
            type: 'GET',
            cache: false,
            data: '',
            success: function (data) {
                if (data.success) {
                    // find the commentContainer div and remove it.
                    $(`#commentContainer${commentId}`).remove();
                    console.log(`Deleted comment ${commentId} successfully:`);
                }
            },
            complete: function () {
                var url = window.location.pathname;
                var slug = url.split("/")['2'].toLowerCase();
                $.ajax({
                    url: `/comments/getRepliesJSON/${slug}/${commentId}`,
                    type: 'GET',
                    cache: false,
                    data: '',
                    success: function (data) {
                        if (data.replies) {
                            data.replies.forEach(comment => {
                                deleteComment(comment.CommentId)
                                console.log(`Deleted comment ${comment.CommentId} successfully.`);
                            });

                        }
                    },
                    complete: function () {

                    },
                    error: function (err) {

                    }
                });
            },
            error: function (err) {
                alert(JSON.stringify(err));
                console.log(err);
            }
        });

        $('#confirmDeleteModal').modal('hide');
    });
}

function copyCode(id) {

    // Get the text from the <code> tag
    var codeText = $("#" + id).text();

    // Create a temporary <textarea> element
    var tempTextarea = $('<textarea>');

    // Append the <textarea> to the body
    $('body').append(tempTextarea);

    // Set the text of the <textarea> to the codeText
    tempTextarea.val(codeText).select();

    try {
        // Execute the copy command
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Copy command was ' + msg);
    } catch (err) {
        console.error('Oops, unable to copy', err);
    }

    // Remove the <textarea> from the DOM
    tempTextarea.remove();
}

function likePost(postId) {

    $.ajax({
        url: '/likes/likePost',
        type: 'POST',
        data: { postId: postId },
        success: function (data) {
            if (data.success) {
                var likesCount = parseInt($('#postLikesCount').text()) + 1;
                $('#postLikesCount').text(likesCount);
            }
        },
        error: function (err) {
            alert('Error liking post: ' + JSON.stringify(err));
        }
    });
}

function unlikePost(postId) {

    $.ajax({
        url: '/likes/unlikePost',
        type: 'POST',
        data: { postId: postId },
        success: function (data) {
            if (data.success) {
                var likesCount = parseInt($('#postLikesCount').text()) - 1;
                $('#postLikesCount').text(likesCount);
            }
        },
        error: function (err) {
            alert('Error unliking post: ' + JSON.stringify(err));
        }
    });
}

function likeComment(commentId) {

    $.ajax({
        url: '/likes/likeComment',
        type: 'POST',
        data: { commentId: commentId },
        success: function (data) {
            if (data.success) {
                var likesCount = data.likesCount;
                $(`#commentLikesCount${commentId}`).text('likes( ' + likesCount + ')');

            }
        },
        error: function (err) {
            alert('Error liking comment: ' + JSON.stringify(err));
        }
    });
}

function unlikeComment(commentId) {

    $.ajax({
        url: '/likes/unlikeComment',
        type: 'POST',
        data: { commentId: commentId },
        success: function (data) {
            if (data.success) {
                var likesCount = data.likesCount;
                $(`#commentLikesCount${commentId}`).text('likes( ' + likesCount + ')');
            }
        }.bind(this),
        error: function (err) {
            alert('Error unliking comment: ' + JSON.stringify(err));
        }
    });
}

// Send friend request
function sendFriendRequest(receiverId) {
    $.ajax({
        url: '/friends/sendFriendRequest',
        type: 'POST',
        data: { receiverId },
        success: function (data) {
            alert(data.message);
        },
        error: function (err) {
            alert('Failed to send friend request');
        }
    });
}

// Accept friend request
function acceptFriendRequest(senderId) {
    $.ajax({
        url: '/friends/acceptFriendRequest',
        type: 'POST',
        data: { senderId },
        success: function (data) {
            alert(data.message);
            // Update UI to reflect the new friend status
        },
        error: function (err) {
            alert('Failed to accept friend request');
        }
    });
}

// Reject friend request
function rejectFriendRequest(senderId) {
    $.ajax({
        url: '/friends/rejectFriendRequest',
        type: 'POST',
        data: { senderId },
        success: function (data) {
            alert(data.message);
            // Update UI to reflect the rejection
        },
        error: function (err) {
            alert('Failed to reject friend request');
        }
    });
}





