import nodemailer from "nodemailer";

// Validate email configuration
const validateEmailConfig = () => {
  if (!process.env.EMAIL_USER) {
    return { valid: false, error: "EMAIL_USER is not set in environment variables" };
  }
  if (!process.env.EMAIL_PASS) {
    return { valid: false, error: "EMAIL_PASS is not set in environment variables" };
  }
  return { valid: true };
};

// Create transporter for sending emails
// For Gmail, you'll need to use App Password
const createTransporter = () => {
  const config = validateEmailConfig();
  if (!config.valid) {
    throw new Error(config.error);
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASS, // Your Gmail App Password
    },
  });
};

// Verify transporter connection
export const verifyEmailConnection = async () => {
  try {
    const config = validateEmailConfig();
    if (!config.valid) {
      return { success: false, error: config.error };
    }

    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: "Email configuration is valid" };
  } catch (error) {
    console.error("Email verification error:", error);
    
    // Provide specific error messages
    if (error.code === 'EAUTH') {
      return { 
        success: false, 
        error: "Authentication failed. Please check your EMAIL_USER and EMAIL_PASS. Make sure you're using a Gmail App Password, not your regular password." 
      };
    } else if (error.code === 'ECONNECTION') {
      return { 
        success: false, 
        error: "Connection failed. Please check your internet connection." 
      };
    } else {
      return { 
        success: false, 
        error: error.message || "Failed to verify email configuration" 
      };
    }
  }
};

// Send OTP email
export const sendOTPEmail = async (email, otp) => {
  try {
    // Validate configuration first
    const config = validateEmailConfig();
    if (!config.valid) {
      console.error("Email configuration error:", config.error);
      return { success: false, error: config.error };
    }

    const transporter = createTransporter();

    // Verify connection before sending
    await transporter.verify();
    console.log("Email server connection verified");

    const mailOptions = {
      from: `"Medicare" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Email Verification OTP - Medicare",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #3B82F6; text-align: center; margin-bottom: 20px;">Email Verification</h2>
            <p style="color: #333333; font-size: 16px; line-height: 1.6;">
              Hello,
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6;">
              Thank you for registering with our Healthcare Portal. Please use the OTP below to verify your email address:
            </p>
            <div style="background-color: #3B82F6; color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <h1 style="margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="color: #666666; font-size: 14px; line-height: 1.6;">
              This OTP is valid for 10 minutes. If you didn't request this OTP, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            <p style="color: #999999; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} Healthcare Portal. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully:", info.messageId);
    console.log("Email sent to:", email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending OTP email - Full error:", error);
    console.error("Error code:", error.code);
    console.error("Error response:", error.response);
    
    // Provide user-friendly error messages
    let errorMessage = "Failed to send OTP email.";
    
    if (error.code === 'EAUTH') {
      errorMessage = "Email authentication failed. Please check your EMAIL_USER and EMAIL_PASS in .env file. Make sure you're using a Gmail App Password.";
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      errorMessage = "Connection error. Please check your internet connection and try again.";
    } else if (error.responseCode === 535) {
      errorMessage = "Authentication failed. Please verify your Gmail App Password is correct.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage, details: error.message };
  }
};

