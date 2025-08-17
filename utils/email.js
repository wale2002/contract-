// const nodemailer = require("nodemailer");
// const pug = require("pug");
// const htmlToText = require("html-to-text");

// module.exports = class Email {
//   constructor(user, url, tempPassword) {
//     this.to = user.email;
//     this.firstName = user.firstName;
//     this.url = url;
//     this.tempPassword = tempPassword;
//     this.from = `The Fifthlab Team <${process.env.EMAIL_FROM}>`;
//     console.log("Email constructor:", {
//       to: this.to,
//       firstName: this.firstName,
//       url,
//       tempPassword,
//       from: this.from,
//     });
//   }

//   newTransport() {
//     if (process.env.NODE_ENV === "production") {
//       console.log("Using Gmail transport");
//       return nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//           user: process.env.EMAIL_USERNAME1,
//           pass: process.env.EMAIL_PASSWORD1,
//         },
//       });
//     }
//     console.log("Using Mailtrap transport:", {
//       host: process.env.EMAIL_HOST,
//       port: process.env.EMAIL_PORT,
//       user: process.env.EMAIL_USERNAME,
//     });
//     return nodemailer.createTransport({
//       host: process.env.EMAIL_HOST,
//       port: process.env.EMAIL_PORT,
//       auth: {
//         user: process.env.EMAIL_USERNAME,
//         pass: process.env.EMAIL_PASSWORD,
//       },
//     });
//   }

//   async send(template, subject) {
//     console.log(
//       "Rendering template:",
//       `${__dirname}/../views/email/${template}.pug`
//     );
//     const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
//       firstName: this.firstName,
//       url: this.url,
//       tempPassword: this.tempPassword,
//       subject,
//     });

//     const mailOptions = {
//       from: this.from,
//       to: this.to,
//       subject,
//       html,
//       text: htmlToText.convert(html),
//     };
//     console.log("Mail options:", { from: this.from, to: this.to, subject });

//     try {
//       await this.newTransport().sendMail(mailOptions);
//       console.log(`Email sent successfully to ${this.to}`);
//     } catch (error) {
//       console.error(`Failed to send email to ${this.to}:, error`);
//       throw error; // Re-throw to catch in controller
//     }
//   }

//   async sendWelcome() {
//     await this.send("welcome", "Welcome to Fifthlab!");
//   }
// };

// const nodemailer = require("nodemailer");
// const pug = require("pug");
// const htmlToText = require("html-to-text");

// module.exports = class Email {
//   constructor(user, url, tempPassword) {
//     this.to = user.email;
//     this.firstName = user.firstName;
//     this.username = user.username; // Added
//     this.url = url;
//     this.tempPassword = tempPassword;
//     this.from = `The Fifthlab Team <${process.env.EMAIL_FROM}>`;
//     console.log("Email constructor:", {
//       to: this.to,
//       firstName: this.firstName,
//       username: this.username, // Added
//       url,
//       tempPassword,
//       from: this.from,
//     });
//   }

//   // ... (newTransport method unchanged)

//   async send(template, subject) {
//     console.log(
//       "Rendering template:",
//       `${__dirname}/../views/email/${template}.pug`
//     );
//     const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
//       firstName: this.firstName,
//       username: this.username, // Added
//       url: this.url,
//       tempPassword: this.tempPassword,
//       loginUrl: "https://your-app-url.com/login", // Added; adjust URL
//       subject,
//     });

//     const mailOptions = {
//       from: this.from,
//       to: this.to,
//       subject,
//       html,
//       text: htmlToText.convert(html),
//     };
//     console.log("Mail options:", { from: this.from, to: this.to, subject });

//     try {
//       await this.newTransport().sendMail(mailOptions);
//       console.log(`Email sent successfully to ${this.to}`);
//     } catch (error) {
//       console.error(`Failed to send email to ${this.to}:`, error);
//       throw error; // Re-throw to catch in controller
//     }
//   }

//   async sendWelcome() {
//     await this.send("welcome", "Welcome to Fifthlab!");
//   }
// };

// // C:\Users\gemre\Desktop\Contract\appfolder\utils\email.js
// const nodemailer = require("nodemailer");
// const pug = require("pug");
// const htmlToText = require("html-to-text");

// module.exports = class Email {
//   constructor(user, url, tempPassword) {
//     this.to = user.email;
//     this.firstName = user.firstName;
//     this.username = user.username;
//     this.url = url;
//     this.tempPassword = tempPassword;
//     this.from = `The Fifthlab Team <${process.env.EMAIL_FROM}>`;
//     console.log("Email constructor:", {
//       to: this.to,
//       firstName: this.firstName,
//       username: this.username,
//       url,
//       tempPassword,
//       from: this.from,
//     });
//   }

//   newTransport() {
//     if (process.env.NODE_ENV === "production") {
//       console.log("Using Gmail transport");
//       return nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//           user: process.env.EMAIL_USERNAME1,
//           pass: process.env.EMAIL_PASSWORD1,
//         },
//       });
//     }
//     console.log("Using Mailtrap transport:", {
//       host: process.env.EMAIL_HOST,
//       port: process.env.EMAIL_PORT,
//       user: process.env.EMAIL_USERNAME,
//     });
//     return nodemailer.createTransport({
//       host: process.env.EMAIL_HOST,
//       port: process.env.EMAIL_PORT,
//       auth: {
//         user: process.env.EMAIL_USERNAME,
//         pass: process.env.EMAIL_PASSWORD,
//       },
//     });
//   }

//   async send(template, subject) {
//     console.log(
//       "Rendering template:",
//       `${__dirname}/../views/email/${template}.pug`
//     );
//     const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
//       firstName: this.firstName,
//       username: this.username,
//       url: this.url,
//       tempPassword: this.tempPassword,
//       loginUrl: "https://your-app-url.com/login", // Adjust URL
//       subject,
//     });

//     const mailOptions = {
//       from: this.from,
//       to: this.to,
//       subject,
//       html,
//       text: htmlToText.convert(html),
//     };
//     console.log("Mail options:", { from: this.from, to: this.to, subject });

//     try {
//       await this.newTransport().sendMail(mailOptions);
//       console.log(`Email sent successfully to ${this.to}`);
//     } catch (error) {
//       console.error(`Failed to send email to ${this.to}:`, error);
//       throw error; // Re-throw to catch in controller
//     }
//   }

//   async sendWelcome() {
//     await this.send("welcome", "Welcome to Fifthlab!");
//   }
// };

// C:\Users\gemre\Desktop\Contract\appfolder\utils\email.js
const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

module.exports = class Email {
  constructor(user, url, tempPassword, options = {}) {
    this.to = user.email;
    this.firstName = user.firstName;
    this.username = user.username;
    this.url = url;
    this.tempPassword = tempPassword;
    this.from = `The Fifthlab Team <${process.env.EMAIL_FROM}>`;
    this.documentName = options.documentName; // Added for document upload
    this.uploaderName = options.uploaderName; // Added
    this.uploaderEmail = options.uploaderEmail; // Added
    this.organizationName = options.organizationName; // Added
    this.uploadTime = options.uploadTime; // Added
    this.documentsUrl = options.documentsUrl; // Added
    console.log("Email constructor:", {
      to: this.to,
      firstName: this.firstName,
      username: this.username,
      url,
      tempPassword,
      documentName: this.documentName,
      uploaderName: this.uploaderName,
      uploaderEmail: this.uploaderEmail,
      organizationName: this.organizationName,
      uploadTime: this.uploadTime,
      documentsUrl: this.documentsUrl,
      from: this.from,
    });
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      console.log("Using Gmail transport");
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USERNAME1,
          pass: process.env.EMAIL_PASSWORD1,
        },
      });
    }
    console.log("Using Mailtrap transport:", {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USERNAME,
    });
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    console.log(
      "Rendering template:",
      `${__dirname}/../views/email/${template}.pug`
    );
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      username: this.username,
      url: this.url,
      tempPassword: this.tempPassword,
      documentName: this.documentName,
      uploaderName: this.uploaderName,
      uploaderEmail: this.uploaderEmail,
      organizationName: this.organizationName,
      uploadTime: this.uploadTime,
      documentsUrl: this.documentsUrl,
      subject,
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
    };
    console.log("Mail options:", { from: this.from, to: this.to, subject });

    try {
      await this.newTransport().sendMail(mailOptions);
      console.log(`Email sent successfully to ${this.to}`);
    } catch (error) {
      console.error(`Failed to send email to ${this.to}:`, error);
      throw error; // Re-throw to catch in controller
    }
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to Fifthlab!");
  }

  async sendDocumentUpload() {
    await this.send("documentUpload", "New Document Uploaded to Fifthlab");
  }
};
