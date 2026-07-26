openssl genrsa -out ublog-key.pem 2048
openssl req -new -key ublog-key.pem -out ublog-csr.pem
openssl x509 -req -days 365 -in ublog-csr.pem -signkey ublog-key.pem -out ublog-cert.pem


