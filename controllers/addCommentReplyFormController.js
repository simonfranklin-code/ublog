const { validationResult } = require('express-validator');
const db = require('../models/db');
exports.addCommentReply = (req, res) => {
    var commentId = 0;
    console.log(req.body); // Access posted data here
    console.log('Request received');
    const sqlite3 = require('sqlite3').verbose();



    // Validate user input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const { Email, Author, DisplayName, Url, Text, DateCreated, DateModified, BlogPostSlug, ParentCommentId, IsOpen, BlogPostId } = req.body;
        db.run("INSERT INTO Comments (Email, Author, DisplayName, Url, Text, DateCreated, DateModified, BlogPostSlug, ParentCommentId, IsOpen, BlogPostId ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [Email, Author, DisplayName, Url, Text, DateCreated, DateModified, BlogPostSlug, ParentCommentId, IsOpen, BlogPostId], (err) => {
            if (err) {
                db.run('ROLLBACK');
                return console.error(err.message);
            }
            db.get('SELECT last_insert_rowid() as id', (err, insertedRow) => {
                if (err) {
                    db.run('ROLLBACK');
                    return console.error(err.message);
                }
                let commentSql = 'SELECT * FROM Comments WHERE CommentId = ' + insertedRow.id;
                db.get(commentSql, [], (err, row) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return console.error(err.message);
                    }
                    var comment = row;
                    if (comment !== 'undefined') {
                        var commentSection =
                            '<h6 class="card-title mbr-fonts-style display-7 mt-1" id="commentTitle' + comment.CommentId + '"><strong>Comment from ' + comment.Author + ':</strong></h6>' +
                            '<p class="mbr-text mbr-fonts-style mb-4 display-7">' + comment.Text + '</p>' +
                            '<p class="mbr-text mbr-fonts-style mb-1 display-7">Date Created: ' + comment.DateCreated + '</p>' +
                            '<p class="mbr-text mbr-fonts-style mb-1 display-7">Website: <a href="' + comment.Url + '" target="_new">' + comment.Url + '</a></p>' +
                            '<p class="mbr-text mbr-fonts-style mb-1 display-7">CommentId: ' + comment.CommentId + '</p>' +

                            '<a href = "javascript:OpenModal(\'modalReplyForm' + comment.CommentId + '\')" class="btn btn-primary btn-sm" >Reply</a >' +

                            '<h6 class="card-title mbr-fonts-style display-7"><strong>Replies:</strong></h6>' +

                            '<hr style="border-top: 1px solid #fafafa;" />' +
                            '<div class="row ml-5"> ' +
                            '   <div class="col-md-12">' +
                            '       <div id="' + comment.CommentId + '" style="margin-left: 25px;"></div>' +
                            '   </div>' +
                            '</div>' +


                            '<div class="modal fade" id="modalReplyForm' + comment.CommentId + '" tabindex="-1" aria-labelledby="modalReplyForm' + comment.CommentId + 'Label" aria-hidden="true">' +
                            '   <div class="modal-dialog" style="height:auto" role="document">' +
                            '       <div class="modal-content">' +
                            '           <div class="modal-header">' +
                            '               <h5 class="modal-title" id="modalReplyForm' + comment.CommentId + 'Title">Reply</h5>' +
                            '               <a href="#" class="no-anim close" data-bs-dismiss="modal" data-dismiss="modal" aria-label="Close">' +
                            '                   <span aria-hidden="true" >×</span >' +
                            '               </a>' +
                            '           </div>' +
                            '           <div class="modal-body">' +
                            '               <form style="display: block;" id="replyForm' + comment.CommentId + '">' +
                            '                   <div class="form-group">' +
                            '                       <label for="email">Email address</label>' +
                            '                       <input type="email" class="form-control form-control-sm" id="Email' + comment.CommentId + '" name="Email' + comment.CommentId + '" placeholder="your@email.com">' +
                            '                   </div>' +
                            '                   <div class="form-group">' +
                            '                       <label for="name">Full Name</label>' +
                            '                       <input type="text" class="form-control form-control-sm" id="Author' + comment.CommentId + '" name="Author' + comment.CommentId + '" placeholder="Full Name">' +
                            '                   </div>' +
                            '                   <div class="form-group">' +
                            '                       <label for="name">Display Name</label>' +
                            '                       <input type="text" class="form-control form-control-sm" id="DisplayName' + comment.CommentId + '" name="DisplayName' + comment.CommentId + '" placeholder="Display Name">' +
                            '                   </div>' +
                            '                   <div class="form-group">' +
                            '                       <label for="name">Website</label>' +
                            '                       <input type="text" class="form-control form-control-sm" id="Url' + comment.CommentId + '" name="Url' + comment.CommentId + '" placeholder="Website">' +
                            '                   </div>' +
                            '                   <div class="form-group">' +
                            '                       <label for="text">Comment Text</label>' +
                            '                       <textarea class="form-control" id="Text' + comment.CommentId + '" name="Text' + comment.CommentId + '' + comment.CommentId + '" rows="3"></textarea>' +
                            '                   </div>' +
                            '                   <a href="javascript:submitReplyForm(\'' + comment.CommentId + '\');" class="no-anim btn btn-primary btn-sm display-4">Reply</a>' +
                            '                   <input Type="hidden" id="BlogPostSlug' + comment.CommentId + '" name="BlogPostSlug' + comment.CommentId + '" value="' + comment.BlogPostSlug + '" />' +
                            '                   <input Type="hidden" id="ParentCommentId' + comment.CommentId + '" name="ParentCommentId' + comment.CommentId + '" value="' + comment.CommentId + '" />' +
                            '                   <input Type="hidden" id="IsOpen' + comment.CommentId + '" name="IsOpen' + comment.CommentId + '" value="true" />' +
                            '                   <input Type="hidden" id="BlogPostId' + comment.CommentId + '" name="BlogPostId' + comment.CommentId + '" value="' + comment.BlogPostId + '" />' +
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

                        var result = {
                            commentSection: commentSection,
                            comment: row,
                        }
                        db.run('COMMIT');
                        res.json(result);
                    }
                });
            });
        });
    });
}