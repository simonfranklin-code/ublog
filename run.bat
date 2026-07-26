@echo off
cd /d "C:\Users\Susana Rijo\Source\repos\Smf\YouBlog\YouBlog.ExpressApp"
start "about:blank" http://localhost:10000/blog/ublog/ublog
node app.js
pause