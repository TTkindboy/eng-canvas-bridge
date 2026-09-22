# FSenglish Calendar Privacy Policy

Last updated: September 22, 2026

FSenglish Calendar uses the schedule file opened by the user in Canvas to create Canvas calendar items.

The selected PDF or DOCX file is sent over HTTPS to the FSenglish Calendar server for parsing. Uploaded files and parsed schedule contents are not intentionally stored after processing. The server and its hosting provider may process basic request information, such as an IP address, for operation and security.

For troubleshooting, the extension also sends the Canvas user ID and name, course ID and name, and file ID and filename to the server when available. Diagnostic metadata, file size and type, parsing counts, timing, and errors are recorded using Pydantic Logfire. Uploaded document contents are not intentionally included in these logs.

The extension reads the user's Canvas CSRF token only to create calendar items in Canvas. This token is sent only to Canvas and is not stored by FSenglish Calendar. The extension also stores a small marker in the user's browser to prevent the same file from being imported twice.

FSenglish Calendar does not sell user data or use it for advertising, profiling, lending, or any purpose unrelated to converting schedule files into Canvas calendar items. Data is shared only with the services necessary to operate the extension or when required by law.
