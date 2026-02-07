// public/js/blogs.js
$(document).ready(function () {
    let currentPage = 1;
    let sortField = 'DateCreated';
    let sortOrder = 'DESC';

    function fetchBlogs() {
        const title = $('#titleFilter').val();
        const author = $('#authorFilter').val();
        $.ajax({
            url: '/admin/blogs/api',
            data: { page: currentPage, sortField, sortOrder, title, author },
            success: function (data) {
                const tbody = $('#blogsTableBody');
                tbody.empty();
                data.forEach(blog => {
                    tbody.append(`
            <tr>
              <td>${blog.Title}</td>
              <td>${blog.Description}</td>
              <td>${blog.Author}</td>
              <td>${new Date(blog.DateCreated).toLocaleString()}</td>
              <td>
                <button class="btn btn-warning btn-sm edit-btn" data-id="${blog.BlogId}">Edit</button>
                <button class="btn btn-danger btn-sm delete-btn" data-id="${blog.BlogId}">Delete</button>
              </td>
            </tr>
          `);
                });
                $('#currentPage').text(currentPage);
                $('#previousPage').toggleClass('disabled', currentPage <= 1);
                $('#nextPage').toggleClass('disabled', data.length < 10);
            }
        });
    }

    $('#filterButton').on('click', function (e) {
        e.preventDefault();
        currentPage = 1;
        fetchBlogs();
    });

    $('#previousPage a').on('click', function (e) {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            fetchBlogs();
        }
    });

    $('#nextPage a').on('click', function (e) {
        e.preventDefault();
        currentPage++;
        fetchBlogs();
    });

    $('.sort').on('click', function (e) {
        e.preventDefault();
        const field = $(this).data('field');
        sortOrder = (sortField === field && sortOrder === 'ASC') ? 'DESC' : 'ASC';
        sortField = field;
        fetchBlogs();
    });

    $('#newBlogBtn').on('click', function () {
        $('#blogModalTitle').text('New Blog');
        $('#blogForm')[0].reset();
        $('#blogId').val('');
        $('#blogModal').modal('show');
    });

    $(document).on('click', '.edit-btn', function () {
        const blogId = $(this).data('id');
        $.get(`/admin/blogs/${blogId}`, function (blog) {
            $('#blogModalTitle').text('Edit Blog');
            $('#blogTitle').val(blog.Title);
            $('#blogDescription').val(blog.Description);
            $('#blogAuthor').val(blog.Author);
            $('#blogId').val(blog.BlogId);
            $('#blogModal').modal('show');
        });
    });

    $('#blogForm').on('submit', function (e) {
        e.preventDefault();
        const blogId = $('#blogId').val();
        const url = blogId ? `/admin/blogs/edit/${blogId}` : '/blogs';
        $.post(url, $(this).serialize(), function (response) {
            if (response.success) {
                $('#blogModal').modal('hide');
                fetchBlogs();
            }
        });
    });

    $(document).on('click', '.delete-btn', function () {
        const blogId = $(this).data('id');
        $('#confirmDeleteBtn').data('id', blogId);
        $('#confirmDeleteModal').modal('show');
    });

    $('#confirmDeleteBtn').on('click', function () {
        const blogId = $(this).data('id');
        $.post(`/admin/blogs/delete/${blogId}`, function (response) {
            if (response.success) {
                $('#confirmDeleteModal').modal('hide');
                fetchBlogs();
            }
        });
    });

    fetchBlogs();
});
