$(function () {
    $('#preview-btn').on('click', function () {
        const html = $('#customHTML').val();
        const styles = $('#styles').val();

        const paramMatch = html.match(/<mbr-parameters>([\s\S]*?)<\/mbr-parameters>/);
        const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);

        const params = paramMatch ? paramMatch[1].trim() : '';
        const lessCode = styleMatch ? styleMatch[1].trim() : '';

        const fullLess = params + '\n' + lessCode;

        $('#preview').html(html);
        $('#preview style.less-preview').remove();

        if (fullLess) {
            less.render(fullLess).then(result => {
                const styleTag = $('<style>')
                    .addClass('less-preview')
                    .html(result.css);
                $('#preview').prepend(styleTag);
            }).catch(err => {
                alert("LESS Compile Error: " + err.message);
            });
        }
    });
});
$('#save-btn').on('click', function () {
    const html = $('#customHTML').val();
    const styles = $('#styles').val();
    $.post('/editor/edit/' + $('#anchor').val(), {
        customHTML: html,
        styles: styles
    }).done(function () {
        alert('Changes saved successfully!');
    }).fail(function (err) {
        alert('Failed to save changes: ' + err.responseText);
    });
});
