const { validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const NotificationStats = require('../models/NotificationStats');
const User = require('../models/User')
exports.getComments = async (req, res) => {
    try {
        const slug = req.params.slug;
        const blogPostId = await Comment.getBlogPostId (slug);
        const comments = await Comment.getComments(slug);

        let commentsSection = `
            <a href="javascript:OpenModal('modalAddCommentForm0')" class="btn btn-primary btn-sm">Add Comment</a>
            <hr style="border-top: 1px solid #fafafa;">
            <div class="modal fade" id="modalAddCommentForm0" tabindex="-1" aria-labelledby="modalAddCommentForm0Label" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add Comment</h5>
                            <a href="#" class="no-anim close" data-bs-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">×</span>
                            </a>
                        </div>
                        <div class="modal-body">
                            <form id="commentForm0">
                                <div class="form-group">
                                    <label for="email">Email address</label>
                                    <input type="Email" class="form-control form-control-sm" id="Email0" name="Email0" placeholder="your@email.com">
                                </div>
                                <div class="form-group">
                                    <label for="Author0">Full Name</label>
                                    <input type="text" class="form-control form-control-sm" id="Author0" name="Author0" placeholder="Full Name">
                                </div>
                                <div class="form-group">
                                    <label for="DisplayName0">Display Name</label>
                                    <input type="text" class="form-control form-control-sm" id="DisplayName0" name="DisplayName0" placeholder="Display Name">
                                </div>
                                <div class="form-group">
                                    <label for="Url0">Website</label>
                                    <input type="text" class="form-control form-control-sm" id="Url0" name="Url0" placeholder="Website">
                                </div>
                                <div class="form-group">
                                    <label for="CodeLanguage0">Language</label>
                                    <select class="form-control form-control-sm" id="CodeLanguage0" name="language">
                                        <option value='css'>CSS</option>
                                        <option value='javascript'>JavaScript</option>
                                        <option value='html'>Html</option>
                                        <option value='text'>Plain text</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="Title0">Comment Title</label>
                                    <input type="text" class="form-control form-control-sm" id="Title0" name="Title0" placeholder="Title">
                                </div>
                                <div class="form-group">
                                    <label for="CodeDescription0">Comment Code Description</label>
                                    <textarea class="form-control" id="CodeDescription0" name="CodeDescription0" rows="4"></textarea>
                                </div>
                                <div class="form-group">
                                    <label for="text">Comment Text</label>
                                    <textarea class="form-control" id="Text0" name="Text00" rows="4"></textarea>
                                </div>

                                <a href="javascript:submitCommentForm('0');" class="no-anim btn btn-primary btn-sm display-4">Reply</a>
                                <input type="hidden" id="BlogPostSlug0" name="BlogPostSlug0" value="${slug}">
                                <input type="hidden" id="ParentCommentId0" name="ParentCommentId0" value="0">
                                <input type="hidden" id="IsOpen0" name="IsOpen0" value="true">
                                <input type="hidden" id="BlogPostId0" name="BlogPostId0" value="${blogPostId ? blogPostId : null}">
                                <input type="hidden" id="UserId0" name="UserId0" value="${req.user.id}">
                            </form>
                        </div>
                        <div class="modal-footer">
                            <a href="#" class="no-anim btn btn-primary btn-sm display-4" data-bs-dismiss="modal">Close</a>
                        </div>
                    </div>
                </div>
            </div>

            `;

        for (const comment of comments) {
            let commentUser = await User.findById(comment.UserId);
            let likesCountForUser = await Like.getLikesCountForUser(comment.UserId);
            commentsSection += `
                <div id="commentContainer${comment.CommentId}">
                    <h5 class="mbr-text mbr-fonts-style mb-2 display-5">${comment.Title}</h5>
                    <hr style="border-top: 1px solid #fafafa;">
                    <p class="mbr-text mbr-fonts-style mb-4 display-7">${comment.CodeDescription}</p>
                    <p class="mbr-text mbr-fonts-style mb-4 display-7">${comment.Text}</p>
                    <div class="mbr-text mbr-fonts-style display-7">
                        <div class="nav-item dropdown user-menu">
                            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                            <img class="user-image rounded-circle shadow" style="width:24px; height: 24px; float: left;" src="${commentUser.avatar}" alt="User Image">&nbsp;<span class="d-none d-md-inline">${commentUser.username}</span></a>
                            <ul class="dropdown-menu dropdown-menu-lg dropdown-menu-end">
                                <!-- begin::User Image-->
                                <li class="user-header text-bg-primary text-center">
                                    <div class="row">
                                        <div class="col-12 pt-2">
                                            <img class="rounded-circle shadow" style="margin: 0 auto;text-align: center; height:64px;width: 64px;" src="${commentUser.avatar}" alt="User Image">
                                        </div>
                                    </div>
                                    <div class="row"> 
                                        <div class="col-12 pt-2">
                                            <p>${commentUser.username} - Web Developer Member since ${commentUser.dateCreated}</p>
                                        </div>
                                    </div>
                                </li>
                                <!-- end::User Image-->
                                <!-- begin::Menu Body-->
                                <li class="user-body">
                                    <!-- begin::Row-->
                                    <div class="row">
                                        <div class="col-4 text-center">
                                            <a href="#">Followers</a>
                                        </div>
                                        <div class="col-4 text-center">
                                            <a href="#">Likes(${likesCountForUser})</a>
                                        </div>
                                        <div class="col-4 text-center">
                                            <a href="#">Friends</a>
                                        </div>
                                    </div>
                                    <!-- end::Row-->
                                </li>
                                <!-- end::Menu Body-->
                                <!-- begin::Menu Footer-->
                                <li class="user-footer"> 
                                    <a class="btn btn-default btn-flat" href="/admin/dashboard">Dashboard</a>
                                    <a class="btn btn-default btn-flat float-end" href="/users/logout">Sign out</a>
                                </li>
                                <!-- end::Menu Footer-->
                            </ul>
                        </div>
                    </div>
                    <p class="mbr-text mbr-fonts-style mb-1 display-7">Date Created: ${comment.DateCreated}</p>
                    <p class="mbr-text mbr-fonts-style mb-1 display-7">Website: <a href="${comment.Url}" target="_new">${comment.Url}</a></p>
                    <p class="mbr-text mbr-fonts-style mb-1 display-7">CommentId: ${comment.CommentId}</p>
                    <a href="javascript:OpenModal('modalReplyForm${comment.CommentId}')" class="btn btn-primary btn-sm">Reply</a>
                    <a href="javascript:editCommentForm('${comment.CommentId}')" class="btn btn-secondary btn-sm">Edit</a>
                    <a href="javascript:deleteComment(${comment.CommentId})" class="btn btn-primary btn-sm">Delete</a>
                    <a href="javascript:likeComment(${comment.CommentId})"><i class="fas fa-thumbs-up"></i></a>
                    <a href="javascript:unlikeComment(${comment.CommentId})"><i class="fas fa-thumbs-down"></i></a>
                    <span class="mbr-text mbr-fonts-style display-7" id="commentLikesCount${comment.CommentId}">0</span>
                    <h6 class="text-white mbr-fonts-style display-7"><strong>Replies:</strong></h6>
                    <hr style="border-top: 1px solid #fafafa;">
                    <div class="row ml-5">
                        <div class="col-md-12">
                            <div id="${comment.CommentId}" style="margin-left: 25px;"></div>
                        </div>
                    </div>
                    <div class="modal fade" id="modalReplyForm${comment.CommentId}" tabindex="-1" aria-labelledby="modalReplyForm${comment.CommentId}Label" aria-hidden="true">
                        <div class="modal-dialog" role="document">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Reply</h5>
                                    <a href="#" class="no-anim close" data-bs-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">×</span>
                                    </a>
                                </div>
                                <div class="modal-body">
                                    <form id="replyForm${comment.CommentId}">
                                        <div class="form-group">
                                            <label for="Email${comment.CommentId}">Email address</label>
                                            <input type="email" class="form-control form-control-sm" id="Email${comment.CommentId}" name="Email${comment.CommentId}" placeholder="your@email.com">
                                        </div>
                                        <div class="form-group">
                                            <label for="Author${comment.CommentId}">Full Name</label>
                                            <input type="text" class="form-control form-control-sm" id="Author${comment.CommentId}" name="Author${comment.CommentId}" placeholder="Full Name">
                                        </div>
                                        <div class="form-group">
                                            <label for="DisplayName${comment.CommentId}">Display Name</label>
                                            <input type="text" class="form-control form-control-sm" id="DisplayName${comment.CommentId}" name="DisplayName${comment.CommentId}" placeholder="Full Name">
                                        </div>
                                        <div class="form-group">
                                            <label for="Url${comment.CommentId}">Website</label>
                                            <input type="text" class="form-control form-control-sm" id="Url${comment.CommentId}" name="Url${comment.CommentId}" placeholder="Website">
                                        </div>
                                        <div class="form-group">
                                            <label for="CodeLanguage${comment.CommentId}">Language</label>
                                            <select class="form-control form-control-sm" id="CodeLanguage${comment.CommentId}" name="CodeLanguage${comment.CommentId}">
                                                <option value='css'>CSS</option>
                                                <option value='javascript'>JavaScript</option>
                                                <option value='html'>Html</option>
                                                <option value='text'>Plain text</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label for="Title${comment.CommentId}">Comment Title</label>
                                            <input type="text" class="form-control form-control-sm" id="Title${comment.CommentId}" name="Title${comment.CommentId}" placeholder="Title">
                                        </div>
                                        <div class="form-group">
                                            <label for="CodeDescription${comment.CommentId}">Comment Code Description</label>
                                            <textarea class="form-control" id="CodeDescription${comment.CommentId}" name="CodeDescription${comment.CommentId}" rows="4"></textarea>
                                        </div>
                                        <div class="form-group">
                                            <label for="Text${comment.CommentId}">Comment Text</label>
                                            <textarea class="form-control" id="Text${comment.CommentId}" name="Text${comment.CommentId}" rows="2"></textarea>
                                        </div>
                                        <a href="javascript:submitReplyForm('${comment.CommentId}');" class="no-anim btn btn-primary btn-sm display-4">Reply</a>
                                        <input type="hidden" id="BlogPostSlug${comment.CommentId}" name="BlogPostSlug${comment.CommentId}" value="${comment.BlogPostSlug}">
                                        <input type="hidden" id="ParentCommentId${comment.CommentId}" name="ParentCommentId${comment.CommentId}" value="${comment.CommentId}">
                                        <input type="hidden" id="IsOpen${comment.CommentId}" name="IsOpen${comment.CommentId}" value="true">
                                        <input type="hidden" id="BlogPostId${comment.CommentId}" name="BlogPostId${comment.CommentId}" value="${comment.BlogPostId}">
                                        <input type="hidden" id="UserId${comment.CommentId}" name="UserId${comment.CommentId}" value="${req.user.id}">
                                    </form>
                                </div>
                                <div class="modal-footer">
                                    <a href="#" class="no-anim btn btn-primary btn-sm display-4" data-bs-dismiss="modal">Close</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Modal for Editing Comment -->
                    <div class="modal fade" id="editModal${comment.CommentId}" tabindex="-1" aria-labelledby="editModalLabel" aria-hidden="true">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Edit Comment</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    <form id="editCommentForm">
                                        <div class="form-group">
                                            <label for="editEmail${comment.CommentId}">Email address</label>
                                            <input type="Email" class="form-control form-control-sm" id="editEmail${comment.CommentId}" name="editEmail${comment.CommentId}" placeholder="your@email.com">
                                        </div>
                                        <div class="form-group">
                                            <label for="editAuthor${comment.CommentId}">Author</label>
                                            <input type="text" class="form-control form-control-sm" id="editAuthor${comment.CommentId}" name="editAuthor${comment.CommentId}" placeholder="Author">
                                        </div>
                                        <div class="form-group">
                                            <label for="editDisplayName${comment.CommentId}">Display Name</label>
                                            <input type="text" class="form-control form-control-sm" id="editDisplayName${comment.CommentId}" name="editDisplayName${comment.CommentId}" placeholder="Display Name">
                                        </div>
                                        <div class="form-group">
                                            <label for="editUrl${comment.CommentId}">Website</label>
                                            <input type="text" class="form-control form-control-sm" id="editUrl${comment.CommentId}" name="editUrl${comment.CommentId}" placeholder="Website">
                                        </div>
                                        <div class="form-group">
                                            <label for="editCodeLanguage${comment.CommentId}">Language</label>
                                            <select class="form-control form-control-sm" id="editCodeLanguage${comment.CommentId}" name="editCodeLanguage${comment.CommentId}">
                                                <option value='css'>CSS</option>
                                                <option value='javascript'>JavaScript</option>
                                                <option value='html'>Html</option>
                                                <option value='text'>Plain text</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label for="editTitle${comment.CommentId}">Comment Title</label>
                                            <input type="text" class="form-control form-control-sm" id="editTitle${comment.CommentId}" name="editTitle${comment.CommentId}" placeholder="Title">
                                        </div>
                                        <div class="form-group">
                                            <label for="editCodeDescription${comment.CommentId}">Comment Code Description</label>
                                            <textarea class="form-control" id="editCodeDescription${comment.CommentId}" name="editCodeDescription${comment.CommentId}" rows="4"></textarea>
                                        </div>
                                        <div class="form-group">
                                            <label for="editText${comment.CommentId}">Comment Text</label>
                                            <textarea class="form-control" id="editText${comment.CommentId}" name="editText${comment.CommentId}" rows="4"></textarea>
                                        </div>
                                        <input type="hidden" id="editBlogPostSlug${comment.CommentId}" name="editBlogPostSlug${comment.CommentId}">
                                        <input type="hidden" id="editParentCommentId${comment.CommentId}" name="editParentCommentId${comment.CommentId}">
                                        <input type="hidden" id="editIsOpen${comment.CommentId}" name="editIsOpen${comment.CommentId}" value="true">
                                        <input type="hidden" id="editBlogPostId${comment.CommentId}" name="editBlogPostId${comment.CommentId}">
                                        <input type="hidden" id="editUserId${comment.CommentId}" name="editUserId${comment.CommentId}">
                                        <input type="hidden" id="editCommentid${comment.CommentId}" name="editCommentid${comment.CommentId}">
                                    </form>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-primary btn-sm" onclick="updateComment(${comment.CommentId})">Save Changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
        }

        res.json({ comments, commentsSection });
    } catch (err) {
        Comment.logError(err);
        res.status(500).send('Internal Server Error');
    }
};


exports.getReplies = async (req, res) => {
    try {
        const { slug, commentId } = req.params;
        const blogPostId = await Comment.getBlogPostId(slug);
        const replies = await Comment.getReplies(slug, commentId);
        let htmlReplies = '';

        for (const reply of replies) {
            let commentUser = await User.findById(reply.UserId);
            let likesCountForUser = await Like.getLikesCountForUser(reply.UserId);

            htmlReplies += `
            <div id="commentContainer${reply.CommentId}">
                <h5 class="mbr-text mbr-fonts-style mb-2 display-5">${reply.Title}</h5>
                <hr style="border-top: 1px solid #fafafa;">
                <p class="mbr-text mbr-fonts-style mb-4 display-7">${reply.CodeDescription}</p>
                <p class="mbr-text mbr-fonts-style mb-4 display-7">${reply.Text}</p>
                <div class="mbr-text mbr-fonts-style display-7">
                    <div class="nav-item dropdown user-menu">
                        <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                        <img class="user-image rounded-circle shadow" style="width:24px; height: 24px; float: left;" src="${commentUser.avatar}" alt="User Image"> <span class="d-none d-md-inline">${commentUser.username}</span></a>
                        <ul class="dropdown-menu dropdown-menu-lg dropdown-menu-end">
                            <!-- begin::User Image-->
                            <li class="user-header text-bg-primary text-center">
                                <div class="row">
                                    <div class="col-12 pt-2">
                                        <img class="rounded-circle shadow" style="margin: 0 auto;text-align: center; height:64px;width: 64px;" src="${commentUser.avatar}" alt="User Image">
                                    </div>
                                </div>
                                <div class="row"> 
                                    <div class="col-12 pt-2">
                                        <p>${commentUser.username} - Web Developer Member since ${commentUser.dateCreated}</p>
                                    </div>
                                </div>
                            </li>
                            <!-- end::User Image-->
                            <!-- begin::Menu Body-->
                            <li class="user-body">
                                <!-- begin::Row-->
                                <div class="row">
                                    <div class="col-4 text-center">
                                        <a href="#">Followers</a>
                                    </div>
                                    <div class="col-4 text-center">
                                        <a href="#">(${likesCountForUser})</a>
                                    </div>
                                    <div class="col-4 text-center">
                                        <a href="#">Friends</a>
                                    </div>
                                </div>
                                <!-- end::Row-->
                            </li>
                            <!-- end::Menu Body-->
                            <!-- begin::Menu Footer-->
                            <li class="user-footer"> 
                                <a class="btn btn-default btn-flat" href="/admin/dashboard">Dashboard</a>
                                <a class="btn btn-default btn-flat float-end" href="/users/logout">Sign out</a>
                            </li>
                            <!-- end::Menu Footer-->
                        </ul>
                    </div>
                </div>
                <p class="mbr-text mbr-fonts-style mb-1 display-7">Date Created: ${reply.DateCreated}</p>
                <p class="mbr-text mbr-fonts-style mb-1 display-7">Website: <a href="${reply.Url}" target="_new">${reply.Url}</a></p>
                <p class="mbr-text mbr-fonts-style mb-1 display-7">CommentId: ${reply.CommentId}</p>
                <a href="javascript:OpenModal('modalReplyForm${reply.CommentId}')" class="btn btn-primary btn-sm">Reply</a>
                <a href="javascript:editReplyForm('${reply.CommentId}')" class="btn btn-primary btn-sm">Edit</a>
                <a href="javascript:deleteComment(${reply.CommentId})" class="btn btn-primary btn-sm">Delete</a>
                <a href="javascript:likeComment(${reply.CommentId})"><i class="fas fa-thumbs-up"></i></a>
                <a href="javascript:unlikeComment(${reply.CommentId})"><i class="fas fa-thumbs-down"></i></a>
                <span class="mbr-text mbr-fonts-style display-7" id="commentLikesCount${reply.CommentId}">0  likes</span>
                <h6 class="card-title mbr-fonts-style display-7"><strong>Replies:</strong></h6>
                <hr style="border-top: 1px solid #fafafa;">
                <div class="row ml-5">
                    <div class="col-md-12">
                        <div id="${reply.CommentId}" style="margin-left: 25px;"></div>
                    </div>
                </div>
                <div class="modal fade" id="modalReplyForm${reply.CommentId}" tabindex="-1" aria-labelledby="replyForm${reply.CommentId}Label" aria-hidden="true">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Reply</h5>
                                <a href="#" class="no-anim close" data-bs-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">×</span>
                                </a>
                            </div>
                            <div class="modal-body">
                                <form id="replyForm${reply.CommentId}">
                                    <div class="form-group">
                                        <label for="email">Email address</label>
                                        <input type="email" class="form-control form-control-sm" id="Email${reply.CommentId}" name="Email${reply.CommentId}" placeholder="your@email.com">
                                    </div>
                                    <div class="form-group">
                                        <label for="name">Full Name</label>
                                        <input type="text" class="form-control form-control-sm" id="Author${reply.CommentId}" name="Author${reply.CommentId}" placeholder="Full Name">
                                    </div>
                                    <div class="form-group">
                                        <label for="name">Display Name</label>
                                        <input type="text" class="form-control form-control-sm" id="DisplayName${reply.CommentId}" name="DisplayName${reply.CommentId}" placeholder="Full Name">
                                    </div>
                                    <div class="form-group">
                                        <label for="name">Website</label>
                                        <input type="text" class="form-control form-control-sm" id="Url${reply.CommentId}" name="Url${reply.CommentId}" placeholder="Website">
                                    </div>
                                    <div class="form-group">
                                        <label for="CodeLanguage${reply.CommentId}">Language</label>
                                        <select class="form-control form-control-sm" id="CodeLanguage${reply.CommentId}" name="CodeLanguage${reply.CommentId}">
                                            <option value='css'>CSS</option>
                                            <option value='javascript'>JavaScript</option>
                                            <option value='html'>Html</option>
                                            <option value='text'>Plain text</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="Title${reply.CommentId}">Comment Title</label>
                                        <input type="text" class="form-control form-control-sm" id="Title${reply.CommentId}" name="Title${reply.CommentId}" placeholder="Title">
                                    </div>
                                    <div class="form-group">
                                        <label for="CodeDescription${reply.CommentId}">Comment Code Description</label>
                                        <textarea class="form-control" id="CodeDescription${reply.CommentId}" name="CodeDescription${reply.CommentId}" rows="4"></textarea>
                                    </div>
                                    <div class="form-group">
                                        <label for="text">Comment Text</label>
                                        <textarea class="form-control" id="Text${reply.CommentId}" name="Text${reply.CommentId}" rows="2"></textarea>
                                    </div>
                                    <a href="javascript:submitReplyForm('${reply.CommentId}');" class="no-anim btn btn-primary btn-sm display-4">Reply</a>
                                    <input type="hidden" id="BlogPostSlug${reply.CommentId}" name="BlogPostSlug${reply.CommentId}" value="${reply.BlogPostSlug}">
                                    <input type="hidden" id="ParentCommentId${reply.CommentId}" name="ParentCommentId${reply.CommentId}" value="${reply.CommentId}">
                                    <input type="hidden" id="IsOpen${reply.CommentId}" name="IsOpen${reply.CommentId}" value="true">
                                    <input type="hidden" id="BlogPostId${reply.CommentId}" name="BlogPostId${reply.CommentId}" value="${blogPostId}">
                                    <input type="hidden" id="UserId${reply.CommentId}" name="UserId${reply.CommentId}" value="${req.user.id}">
                                </form>
                            </div>
                            <div class="modal-footer">
                                <a href="#" class="no-anim btn btn-primary btn-sm display-4" data-bs-dismiss="modal">Close</a>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Modal for Editing Comment -->
                <div class="modal fade" id="editReplyModal${reply.CommentId}" tabindex="-1" aria-labelledby="editModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Edit Comment</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="editReplyCommentForm">
                                    <div class="form-group">
                                        <label for="editReplyEmail${reply.CommentId}">Email address</label>
                                        <input type="Email" class="form-control form-control-sm" id="editReplyEmail${reply.CommentId}" name="editReplyEmail${reply.CommentId}" placeholder="your@email.com">
                                    </div>
                                    <div class="form-group">
                                        <label for="editReplyAuthor${reply.CommentId}">Author</label>
                                        <input type="text" class="form-control form-control-sm" id="editReplyAuthor${reply.CommentId}" name="editReplyAuthor${reply.CommentId}" placeholder="Author">
                                    </div>
                                    <div class="form-group">
                                        <label for="editReplyDisplayName${reply.CommentId}">Display Name</label>
                                        <input type="text" class="form-control form-control-sm" id="editReplyDisplayName${reply.CommentId}" name="editReplyDisplayName${reply.CommentId}" placeholder="Display Name">
                                    </div>
                                    <div class="form-group">
                                        <label for="editReplyUrl${reply.CommentId}">Website</label>
                                        <input type="text" class="form-control form-control-sm" id="editReplyUrl${reply.CommentId}" name="editReplyUrl${reply.CommentId}" placeholder="Website">
                                    </div>
                                    <div class="form-group">
                                        <label for="editReplyCodeLanguage${reply.CommentId}">Language</label>
                                        <select class="form-control form-control-sm" id="editReplyCodeLanguage${reply.CommentId}" name="editReplyCodeLanguage${reply.CommentId}">
                                            <option value='css'>CSS</option>
                                            <option value='javascript'>JavaScript</option>
                                            <option value='html'>Html</option>
                                            <option value='text'>Plain text</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="editReplyTitle${reply.CommentId}">Comment Title</label>
                                        <input type="text" class="form-control form-control-sm" id="editReplyTitle${reply.CommentId}" name="editReplyTitle${reply.CommentId}" placeholder="Title">
                                    </div>
                                    <div class="form-group">
                                        <label for="editReplyCodeDescription${reply.CommentId}">Comment Code Description</label>
                                        <textarea class="form-control" id="editReplyCodeDescription${reply.CommentId}" name="editReplyCodeDescription${reply.CommentId}" rows="4"></textarea>
                                    </div>
                                    <div class="form-group">
                                        <label for="editReplyText${reply.CommentId}">Comment Text</label>
                                        <textarea class="form-control" id="editReplyText${reply.CommentId}" name="editReplyText${reply.CommentId}" rows="4"></textarea>
                                    </div>
                                    <input type="hidden" id="editReplyBlogPostSlug${reply.CommentId}" name="editReplyBlogPostSlug${reply.CommentId}">
                                    <input type="hidden" id="editReplyParentCommentId${reply.CommentId}" name="editReplyParentCommentId${reply.CommentId}">
                                    <input type="hidden" id="editReplyIsOpen${reply.CommentId}" name="editReplyIsOpen${reply.CommentId}" value="true">
                                    <input type="hidden" id="editReplyBlogPostId${reply.CommentId}" name="editReplyBlogPostId${reply.CommentId}">
                                    <input type="hidden" id="editReplyUserId${reply.CommentId}" name="editReplyUserId${reply.CommentId}">
                                    <input type="hidden" id="editReplyCommentid${reply.CommentId}" name="editReplyCommentid${reply.CommentId}">
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-primary btn-sm" onclick="updateEditReply(${reply.CommentId})">Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }

        res.json({ replies, htmlReplies });
    } catch (err) {
        Comment.logError(err);
        res.status(500).send('Internal Server Error');
    }
};

exports.getRepliesJSON = async (req, res) => {
    try {
        const { slug, commentId } = req.params;
        //const blogPostId = await Comment.getBlogPostId(slug);
        const replies = await Comment.getReplies(slug, commentId);
        res.json({ replies });
    } catch (err) {
        Comment.logError(err);
        res.status(500).send('Internal Server Error');
    }
};






exports.addCommentReply = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const commentId = await Comment.addCommentReply(req.body);
        const comment = await Comment.getCommentById(commentId);

        if (comment) {
            //await NotificationStats.incrementStat(req.user.id, 'Comments');
            let likesCount = await Like.getCommentLikesCount(comment, commentId);
            let commentUser = await User.findById(comment.UserId);
            let likesCountForUser = await Like.getLikesCountForUser(comment.UserId);
            let commentSection = `
                <div id='commentContainer${comment.CommentId}'>
                    <h5 class="mbr-text mbr-fonts-style mb-2 display-5" id='commentTitle${comment.CommentId}'>${comment.Title}</h5>
                    <hr style="border-top: 1px solid #fafafa;">
                    <p class="mbr-text mbr-fonts-style mb-4 display-7">${comment.CodeDescription}</p>
                    <p class="mbr-text mbr-fonts-style mb-4 display-7">${comment.Text}</p>
                    <div class="mbr-text mbr-fonts-style display-7">
                        <div class="nav-item dropdown user-menu">
                            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                            <img class="user-image rounded-circle shadow" style="width:24px; height: 24px;" src="${commentUser.avatar}" alt="User Image">&nbsp;<span class="d-none d-md-inline">${commentUser.username}</span></a>
                            <ul class="dropdown-menu dropdown-menu-lg dropdown-menu-end">
                                <!-- begin::User Image-->
                                <li class="user-header text-bg-primary text-center">
                                    <div class="row">
                                        <div class="col-12 pt-2">
                                            <img class="rounded-circle shadow" style="margin: 0 auto;text-align: center; height:64px;width: 64px;" src="${commentUser.avatar}" alt="User Image">
                                        </div>
                                    </div>
                                    <div class="row"> 
                                        <div class="col-12 pt-2">
                                            <p>${commentUser.username} - Web Developer Member since ${commentUser.dateCreated}</p>
                                        </div>
                                    </div>
                                </li>
                                <!-- end::User Image-->
                                <!-- begin::Menu Body-->
                                <li class="user-body">
                                    <!-- begin::Row-->
                                    <div class="row">
                                        <div class="col-4 text-center">
                                            <a href="#">Followers</a>
                                        </div>
                                        <div class="col-4 text-center">
                                            <a href="#">Likes(${likesCountForUser})</a>
                                        </div>
                                        <div class="col-4 text-center">
                                            <a href="#">Friends</a>
                                        </div>
                                    </div>
                                    <!-- end::Row-->
                                </li>
                                <!-- end::Menu Body-->
                                <!-- begin::Menu Footer-->
                                <li class="user-footer"> 
                                    <a class="btn btn-default btn-flat" href="/admin/dashboard">Dashboard</a>
                                    <a class="btn btn-default btn-flat float-end" href="/users/logout">Sign out</a>
                                </li>
                                <!-- end::Menu Footer-->
                            </ul>
                        </div>
                    </div>
                    <p class="mbr-text mbr-fonts-style mb-1 display-7">Date Created: ${comment.DateCreated}</p>
                    <p class="mbr-text mbr-fonts-style mb-1 display-7">Website: <a href="${comment.Url}" target="_new">${comment.Url}</a></p>
                    <p class="mbr-text mbr-fonts-style mb-1 display-7">CommentId: ${comment.CommentId}</p>
                    <a href="javascript:OpenModal('modalReplyForm${comment.CommentId}')" class="btn btn-primary btn-sm">Reply</a>
                    <a href="javascript:deleteComment(${comment.CommentId})" class="btn btn-primary btn-sm">Delete</a>
                    <a href="javascript:likeComment(${comment.CommentId})"><i class="fas fa-thumbs-up"></i></a>
                    <a href="javascript:unlikeComment(${comment.CommentId})"><i class="fas fa-thumbs-down"></i></a>
                    <span class="mbr-text mbr-fonts-style display-7" id="commentLikesCount${comment.CommentId}">${likesCount} likes</span>
                    <h6 class="card-title mbr-fonts-style display-7"><strong>Replies:</strong></h6>
                    <hr style="border-top: 1px solid #fafafa;">
                    <div class="row ml-5">
                        <div class="col-md-12">
                            <div id="${comment.CommentId}" style="margin-left: 25px;"></div>
                        </div>
                    </div>
                    <div class="modal fade" id="modalReplyForm${comment.CommentId}" tabindex="-1" aria-labelledby="modalReplyForm${comment.CommentId}Label" aria-hidden="true">
                        <div class="modal-dialog" role="document">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Reply</h5>
                                    <a href="#" class="no-anim close" data-bs-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">×</span>
                                    </a>
                                </div>
                                <div class="modal-body">
                                    <form id="replyForm${comment.CommentId}">
                                        <div class="form-group">
                                            <label for="Email${comment.CommentId}">Email address</label>
                                            <input type="email" class="form-control form-control-sm" id="Email${comment.CommentId}" name="Email${comment.CommentId}" placeholder="your@email.com">
                                        </div>
                                        <div class="form-group">
                                            <label for="Author${comment.CommentId}">Full Name</label>
                                            <input type="text" class="form-control form-control-sm" id="Author${comment.CommentId}" name="Author${comment.CommentId}" placeholder="Full Name">
                                        </div>
                                        <div class="form-group">
                                            <label for="DisplayName${comment.CommentId}">Display Name</label>
                                            <input type="text" class="form-control form-control-sm" id="DisplayName${comment.CommentId}" name="DisplayName${comment.CommentId}" placeholder="Full Name">
                                        </div>
                                        <div class="form-group">
                                            <label for="Url${comment.CommentId}">Website</label>
                                            <input type="text" class="form-control form-control-sm" id="Url${comment.CommentId}" name="Url${comment.CommentId}" placeholder="Website">
                                        </div>
                                        <div class="form-group">
                                            <label for="CodeLanguage${comment.CommentId}">Language</label>
                                            <select class="form-control form-control-sm" id="CodeLanguage${comment.CommentId}" name="CodeLanguage${comment.CommentId}">
                                                <option value='css'>CSS</option>
                                                <option value='javascript'>JavaScript</option>
                                                <option value='html'>Html</option>
                                                <option value='text'>Plain text</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label for="Title${comment.CommentId}">Comment Title</label>
                                            <input type="text" class="form-control form-control-sm" id="Title${comment.CommentId}" name="Title${comment.CommentId}" placeholder="Title">
                                        </div>
                                        <div class="form-group">
                                            <label for="CodeDescription${comment.CommentId}">Comment Code Description</label>
                                            <textarea class="form-control" id="CodeDescription${comment.CommentId}" name="CodeDescription${comment.CommentId}" rows="4"></textarea>
                                        </div>
                                        <div class="form-group">
                                            <label for="text">Comment Text</label>
                                            <textarea class="form-control" id="Text${comment.CommentId}" name="Text${comment.CommentId}" rows="3"></textarea>
                                        </div>
                                        <a href="javascript:submitReplyForm('${comment.CommentId}');" class="no-anim btn btn-primary btn-sm display-4">Reply</a>
                                        <input type="hidden" id="BlogPostSlug${comment.CommentId}" name="BlogPostSlug${comment.CommentId}" value="${comment.BlogPostSlug}">
                                        <input type="hidden" id="ParentCommentId${comment.CommentId}" name="ParentCommentId${comment.CommentId}" value="${comment.CommentId}">
                                        <input type="hidden" id="IsOpen${comment.CommentId}" name="IsOpen${comment.CommentId}" value="true">
                                        <input type="hidden" id="BlogPostId${comment.CommentId}" name="BlogPostId${comment.CommentId}" value="${comment.BlogPostId}">
                                        <input type="hidden" id="UserId${comment.CommentId}" name="UserId${comment.CommentId}" value="${req.user.id}">
                                    </form>
                                </div>
                                <div class="modal-footer">
                                    <a href="#" class="no-anim btn btn-primary btn-sm display-4" data-bs-dismiss="modal">Close</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            res.json({ commentSection, comment });
        } else {
            res.status(500).send('Error retrieving the newly added comment');
        }
    } catch (err) {
        Comment.logError(err);
        res.status(500).send('Internal Server Error');
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const result = await Comment.deleteComment(commentId);
        if (result > 0) {
            res.json({ success: true, message: 'Comment deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Comment not found' });
        }
    } catch (err) {
        Comment.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getComment = async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const comment = await Comment.getCommentById(commentId);
        if (comment) {
            res.json({ success: true, Comment: comment });
        } else {
            res.status(404).json({ success: false, message: 'Comment not found' });
        }
    } catch (err) {
        Comment.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.updateCommentReply = async (req, res) => {
    try {
        const { Title, CodeDescription, Email, Author, DisplayName, Url, Text, CodeLanguage, BlogPostId, UserId, CommentId } = req.body;

        await Comment.updateComment({
            title: Title,
            codeDescription: CodeDescription,
            email: Email,
            author: Author,
            displayName: DisplayName,
            url: Url,
            text: Text,
            blogPostId: BlogPostId,
            userId: UserId,
            commentId: CommentId,
        });
        const comment = await Comment.getCommentById(CommentId);
        if (comment) {
            //await NotificationStats.incrementStat(req.user.id, 'Comments');
            let likesCount = await Like.getCommentLikesCount(comment, CommentId);
            let commentUser = await User.findById(comment.UserId);
            let likesCountForUser = await Like.getLikesCountForUser(comment.UserId);
            let commentSection = `
                <div id='commentContainer${comment.CommentId}'>
                    <h5 class="mbr-text mbr-fonts-style mb-2 display-5" id='commentTitle${comment.CommentId}'>${comment.Title}</h5>
                    <hr style="border-top: 1px solid #fafafa;">
                    <p class="mbr-text mbr-fonts-style mb-4 display-7">${comment.CodeDescription}</p>
                    <p class="mbr-text mbr-fonts-style mb-4 display-7">${comment.Text}</p>
                    <div class="mbr-text mbr-fonts-style display-7">
                        <div class="nav-item dropdown user-menu">
                            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                            <img class="user-image rounded-circle shadow" style="width:24px; height: 24px;" src="${commentUser.avatar}" alt="User Image">&nbsp;<span class="d-none d-md-inline">${commentUser.username}</span></a>
                            <ul class="dropdown-menu dropdown-menu-lg dropdown-menu-end">
                                <!-- begin::User Image-->
                                <li class="user-header text-bg-primary text-center">
                                    <div class="row">
                                        <div class="col-12 pt-2">
                                            <img class="rounded-circle shadow" style="margin: 0 auto;text-align: center; height:64px;width: 64px;" src="${commentUser.avatar}" alt="User Image">
                                        </div>
                                    </div>
                                    <div class="row"> 
                                        <div class="col-12 pt-2">
                                            <p>${commentUser.username} - Web Developer Member since ${commentUser.dateCreated}</p>
                                        </div>
                                    </div>
                                </li>
                                <!-- end::User Image-->
                                <!-- begin::Menu Body-->
                                <li class="user-body">
                                    <!-- begin::Row-->
                                    <div class="row">
                                        <div class="col-4 text-center">
                                            <a href="#">Followers</a>
                                        </div>
                                        <div class="col-4 text-center">
                                            <a href="#">Likes(${likesCountForUser})</a>
                                        </div>
                                        <div class="col-4 text-center">
                                            <a href="#">Friends</a>
                                        </div>
                                    </div>
                                    <!-- end::Row-->
                                </li>
                                <!-- end::Menu Body-->
                                <!-- begin::Menu Footer-->
                                <li class="user-footer"> 
                                    <a class="btn btn-default btn-flat" href="/admin/dashboard">Dashboard</a>
                                    <a class="btn btn-default btn-flat float-end" href="/users/logout">Sign out</a>
                                </li>
                                <!-- end::Menu Footer-->
                            </ul>
                        </div>
                    </div>
                    <p class="mbr-text mbr-fonts-style mb-1 display-7">Date Created: ${comment.DateCreated}</p>
                    <p class="mbr-text mbr-fonts-style mb-1 display-7">Website: <a href="${comment.Url}" target="_new">${comment.Url}</a></p>
                    <p class="mbr-text mbr-fonts-style mb-1 display-7">CommentId: ${comment.CommentId}</p>
                    <a href="javascript:OpenModal('modalReplyForm${comment.CommentId}')" class="btn btn-primary btn-sm">Reply</a>
                    <a href="javascript:deleteComment(${comment.CommentId})" class="btn btn-primary btn-sm">Delete</a>
                    <a href="javascript:likeComment(${comment.CommentId})"><i class="fas fa-thumbs-up"></i></a>
                    <a href="javascript:unlikeComment(${comment.CommentId})"><i class="fas fa-thumbs-down"></i></a>
                    <span class="mbr-text mbr-fonts-style display-7" id="commentLikesCount${comment.CommentId}">${likesCount} likes</span>
                    <h6 class="card-title mbr-fonts-style display-7"><strong>Replies:</strong></h6>
                    <hr style="border-top: 1px solid #fafafa;">
                    <div class="row ml-5">
                        <div class="col-md-12">
                            <div id="${comment.CommentId}" style="margin-left: 25px;"></div>
                        </div>
                    </div>
                    <div class="modal fade" id="modalReplyForm${comment.CommentId}" tabindex="-1" aria-labelledby="modalReplyForm${comment.CommentId}Label" aria-hidden="true">
                        <div class="modal-dialog" role="document">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Reply</h5>
                                    <a href="#" class="no-anim close" data-bs-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">×</span>
                                    </a>
                                </div>
                                <div class="modal-body">
                                    <form id="replyForm${comment.CommentId}">
                                        <div class="form-group">
                                            <label for="Email${comment.CommentId}">Email address</label>
                                            <input type="email" class="form-control form-control-sm" id="Email${comment.CommentId}" name="Email${comment.CommentId}" placeholder="your@email.com">
                                        </div>
                                        <div class="form-group">
                                            <label for="Author${comment.CommentId}">Full Name</label>
                                            <input type="text" class="form-control form-control-sm" id="Author${comment.CommentId}" name="Author${comment.CommentId}" placeholder="Full Name">
                                        </div>
                                        <div class="form-group">
                                            <label for="DisplayName${comment.CommentId}">Display Name</label>
                                            <input type="text" class="form-control form-control-sm" id="DisplayName${comment.CommentId}" name="DisplayName${comment.CommentId}" placeholder="Full Name">
                                        </div>
                                        <div class="form-group">
                                            <label for="Url${comment.CommentId}">Website</label>
                                            <input type="text" class="form-control form-control-sm" id="Url${comment.CommentId}" name="Url${comment.CommentId}" placeholder="Website">
                                        </div>
                                        <div class="form-group">
                                            <label for="CodeLanguage${comment.CommentId}">Language</label>
                                            <select class="form-control form-control-sm" id="CodeLanguage${comment.CommentId}" name="CodeLanguage${comment.CommentId}">
                                                <option value='css'>CSS</option>
                                                <option value='javascript'>JavaScript</option>
                                                <option value='html'>Html</option>
                                                <option value='text'>Plain text</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label for="Title${comment.CommentId}">Comment Title</label>
                                            <input type="text" class="form-control form-control-sm" id="Title${comment.CommentId}" name="Title${comment.CommentId}" placeholder="Title">
                                        </div>
                                        <div class="form-group">
                                            <label for="CodeDescription${comment.CommentId}">Comment Code Description</label>
                                            <textarea class="form-control" id="CodeDescription${comment.CommentId}" name="CodeDescription${comment.CommentId}" rows="4"></textarea>
                                        </div>
                                        <div class="form-group">
                                            <label for="text">Comment Text</label>
                                            <textarea class="form-control" id="Text${comment.CommentId}" name="Text${comment.CommentId}" rows="3"></textarea>
                                        </div>
                                        <a href="javascript:submitReplyForm('${comment.CommentId}');" class="no-anim btn btn-primary btn-sm display-4">Reply</a>
                                        <input type="hidden" id="BlogPostSlug${comment.CommentId}" name="BlogPostSlug${comment.CommentId}" value="${comment.BlogPostSlug}">
                                        <input type="hidden" id="ParentCommentId${comment.CommentId}" name="ParentCommentId${comment.CommentId}" value="${comment.CommentId}">
                                        <input type="hidden" id="IsOpen${comment.CommentId}" name="IsOpen${comment.CommentId}" value="true">
                                        <input type="hidden" id="BlogPostId${comment.CommentId}" name="BlogPostId${comment.CommentId}" value="${comment.BlogPostId}">
                                        <input type="hidden" id="UserId${comment.CommentId}" name="UserId${comment.CommentId}" value="${req.user.id}">
                                    </form>
                                </div>
                                <div class="modal-footer">
                                    <a href="#" class="no-anim btn btn-primary btn-sm display-4" data-bs-dismiss="modal">Close</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            res.json({ success: true, commentSection, comment });
        } else {
            res.status(500).send('Error retrieving the newly added comment');
        }






        //const updatedComments = await Comment.getAllCommentsForPost(BlogPostId);
        //res.json({ success: true, updatedCommentsSection: updatedComments });
    } catch (err) {
        Comment.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


exports.deleteReplies = async (req, res) => {
    try {
        const parentCommentId = req.params.parentCommentId;
        const result = await Comment.deleteReplies(parentCommentId);
        if (result > 0) {
            res.json({ success: true, message: 'Comment deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Comment not found' });
        }
    } catch (err) {
        Comment.logError(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

