# SS_OAuth

This SS_OAuth is a simple project to demonstrate how OAuth work. In this project, I have used OAuth2. The OAuth process is shown using the google drive API. In this project, the user can log in using any google account to the application. The user can then select and upload any chosen file to the google drive of that respective Gmail account.

All cookies and session tokens can identify through the browser developer tool or your development IDE console.

## How to run this project on your PC?

To run this project without any trouble, please go through the following steps.

1. Install NODE on your PC.

  Please follow this guide to install | https://phoenixnap.com/kb/install-node-js-npm-on-windows

2. Download the SS_OAuth project file to your PC.

  You can do this by following methods.
  
    - Use the `GitHub Desktop` and fetch the project and then open through an editor.
    - Use the `Git Bash` to fetch the project and open it through an editor.
    - Download the project `as a ZIP` and then open it through an editor.

3. After opening the project via an editor, open a console or terminal in the project's root folder.

4. Then install node modules for the projects.

  > npm init -y

5. Then install all dependencies.

  > npm install

You will install the following dependencies to the project.
  ```
   "cookie-parser": "^1.4.5",
   "dotenv": "^8.2.0",
   "ejs": "^3.1.6",
   "express": "^4.17.1",
   "google-auth-library": "^7.0.3",
   "googleapis": "^39.2.0",
   "multer": "^1.4.2",
   "nodemon": "^2.0.7"
    ```
6. Open the `package.json` to check the nodemon script. Check for the following code block, and if that not included in the package file, input the following code and save.

  ```
  "scripts": {
      "dev": "nodemon server.js",
      "start": "node server.js"
    },  
    ```
7. The project is set to run on port 4800, but you can change it to any other available port.

  - In server.js

    ```
    app.listen(process.env.PORT || 4800, () => console.log("Server started and running!!"));
    ```
8. Type the following command in your terminal/console

  > npm run Dev

9. Project will run with nodemon.

10. If you need to restart the server, type the following command anywhere on the terminal/console and hit enter.

  >rs
