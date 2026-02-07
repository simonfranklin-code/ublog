$(document).ready(function () {
    // Like button handler
    $('.like-btn').on('click', function () {
        const eventId = $(this).data('id');

        $.post(`/timeline/event/${eventId}/like`, function (response) {
            if (response.success) {
                alert('Liked the event!');
                location.reload(); // Reload to update like count
            }
        });
    });

    // Comment form handler
    $('.comment-form').on('submit', function (e) {
        e.preventDefault();
        const eventId = $(this).data('id');
        const content = $(this).find('input[name="content"]').val();

        $.post(`/timeline/event/${eventId}/comment`, { content }, function (response) {
            if (response.success) {
                alert('Comment added!');
                location.reload(); // Reload to update comments
            }
        });
    });
});
