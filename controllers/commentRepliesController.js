exports.getReplies = (req, res) => {
    const db = require('../models/db');
    async function getReplies() {
        try {
            var blogPostId = 0;
            const sqlite3 = require('sqlite3').verbose();
            const baseUrl = req.baseUrl;
            var slug = baseUrl.split("/")['2'].toLowerCase();
            var commentId = baseUrl.split("/")['3'].toLowerCase();

            let blogPostIdSql = 'SELECT * FROM BlogPosts WHERE Slug LIKE \'' + slug + '\'';
            db.get(blogPostIdSql, [], (err, blogPost) => {

                if (err) {
                    console.error(err.message);
                    res.status(500).send('Internal Server Error');
                }


                blogPostId = blogPost.BlogPostId;


            });



            let repliesSql = 'SELECT * FROM Comments WHERE BlogPostSlug = "' + slug + '" AND ParentCommentId = ' + commentId;
            db.all(repliesSql, [], (err, replies) => {
                if (err) {
                    console.error(err.message);
                    res.status(500).send('Internal Server Error');
                }
                var htmlReplies = "";

                replies.forEach((reply) => {
                    htmlReplies += '<h6 class="text-white mbr-fonts-style display-7 mt-1" id="commentTitle' + reply.CommentId + '"><strong>Reply from ' + reply.Author + ':</strong></h6>' +
                        '<p class="mbr-text mbr-fonts-style mb-4 display-7">' + reply.Text + '</p>' +
                        '<p class="mbr-text mbr-fonts-style mb-1 display-7">Date Created: ' + reply.DateCreated + '</p>' +
                        '<p class="mbr-text mbr-fonts-style mb-1 display-7">Website: <a href="' + reply.Url + '" target="_new">' + reply.Url + '</a></p>' +
                        '<p class="mbr-text mbr-fonts-style mb-1 display-7">CommentId: ' + reply.CommentId + '</p>' +

                        '<a href = "javascript:OpenModal(\'modalReplyForm' + reply.CommentId + '\')" class="btn btn-primary btn-sm" >Reply</a >' +

                        '<h6 class="text-white mbr-fonts-style display-7"><strong>Replies:</strong></h6>' +

                        '<hr style="border-top: 1px solid #fafafa;" />' +
                        '<div class="row ml-5"> ' +
                        '   <div class="col-md-12">' +
                        '       <div id="' + reply.CommentId + '" style="margin-left: 25px;"></div>' +
                        '   </div>' +
                        '</div>' +


                        '<div class="modal fade" id="modalReplyForm' + reply.CommentId + '" tabindex="-1" aria-labelledby="replyForm' + reply.CommentId + 'Label" aria-hidden="true">' +
                        '   <div class="modal-dialog modal-md" style="height:auto" role="document">' +
                        '       <div class="modal-content">' +
                        '           <div class="modal-header">' +
                        '               <h5 class="modal-title" id="replyForm' + reply.CommentId + 'Title">Reply</h5>' +
                        '               <a href="#" class="no-anim close" data-bs-dismiss="modal" data-dismiss="modal" aria-label="Close">' +
                        '                   <span aria-hidden="true" >×</span >' +
                        '               </a>' +
                        '           </div>' +
                        '           <div class="modal-body">' +
                        '               <form style="display: block;" id="replyForm' + reply.CommentId + '">' +
                        '                   <div class="form-group">' +
                        '                       <label for="email">Email address</label>' +
                        '                       <input type="email" class="form-control form-control-sm" id="Email' + reply.CommentId + '" name="Email' + reply.CommentId + '" placeholder="your@email.com">' +
                        '                   </div>' +
                        '                   <div class="form-group">' +
                        '                       <label for="name">Full Name</label>' +
                        '                       <input type="text" class="form-control form-control-sm" id="Author' + reply.CommentId + '" name="Author' + reply.CommentId + '" placeholder="Full Name">' +
                        '                   </div>' +
                        '                   <div class="form-group">' +
                        '                       <label for="name">Display Name</label>' +
                        '                       <input type="text" class="form-control form-control-sm" id="DisplayName' + reply.CommentId + '" name="DisplayName' + reply.CommentId + '" placeholder="Full Name">' +
                        '                   </div>' +
                        '                   <div class="form-group">' +
                        '                       <label for="name">Website</label>' +
                        '                       <input type="text" class="form-control form-control-sm" id="Url' + reply.CommentId + '" name="Url' + reply.CommentId + '" placeholder="Website">' +
                        '                   </div>' +
                        '                   <div class="form-group">' +
                        '                       <label for="text">Comment Text</label>' +
                        '                       <textarea class="form-control" id="Text' + reply.CommentId + '" name="Text' + reply.CommentId + '' + reply.CommentId + '" rows="2"></textarea>' +
                        '                   </div>' +
                        '                   <a href="javascript:submitReplyForm(\'' + reply.CommentId + '\', \'' + blogPostId + '\');" class="no-anim btn btn-primary btn-sm display-4">Reply</a>' +
                        '                   <input Type="hidden" id="BlogPostSlug' + reply.CommentId + '" name="BlogPostSlug' + reply.CommentId + '" value="' + reply.BlogPostSlug + '" />' +
                        '                   <input Type="hidden" id="ParentCommentId' + reply.CommentId + '" name="ParentCommentId' + reply.CommentId + '" value="' + reply.CommentId + '" />' +
                        '                   <input Type="hidden" id="IsOpen' + reply.CommentId + '" name="IsOpen' + reply.CommentId + '" value="true" />' +
                        '                   <input Type="hidden" id="BlogPostId' + reply.CommentId + '" name="BlogPostId' + reply.CommentId + '" value="' + blogPostId + '" />' +
                        '               </form > ' +
                        '           </div>' +
                        '           <div class="modal-footer">' +
                        '               <div class="mbr-section-btn">' +
                        '                   <a href = "#" class="no-anim btn btn-primary btn-sm display-4" data-bs-dismiss="modal" data-dismiss="modal" >Close</a>' +
                        '               </div>' +
                        '           </div>' +
                        '       </div>' +
                        '   </div>' +
                        '</div>';
                });
                var result = {
                    replies: replies,
                    htmlReplies: htmlReplies
                };
                res.json(result);
            });




        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }



    getReplies();
};