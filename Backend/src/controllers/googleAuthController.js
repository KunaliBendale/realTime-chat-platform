import axios from "axios";
import qs from "querystring";
import User from "../models/userModel.js";
import { generateToken } from "../utils/generateToken.js";

// Google OAuth URLs
const GOOGLE_AUTH_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";

const GOOGLE_TOKEN_URL =
  "https://oauth2.googleapis.com/token";

const GOOGLE_USER_INFO_URL =
  "https://www.googleapis.com/oauth2/v3/userinfo";

/**
 * Exchange authorization code for Google user profile
 */
const exchangeCodeForUserProfile = async (code) => {
  try {
    // STEP 1: Exchange code for access token
    const tokenResponse = await axios.post(
      GOOGLE_TOKEN_URL,
      qs.stringify({
        code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token } = tokenResponse.data;

    // STEP 2: Fetch Google profile
    const userResponse = await axios.get(
      GOOGLE_USER_INFO_URL,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    return userResponse.data;
  } catch (error) {
    console.error(
      "Google Exchange Error:",
      error.response?.data || error.message
    );

    throw new Error("Failed to authenticate with Google");
  }
};

/**
 * Redirect user to Google login page
 */
export const loginWithGoogle = async (req, res) => {
  try {
    // Random state for CSRF protection
    const state = Math.random().toString(36).substring(2);

    // Store state in secure cookie
    res.cookie("oauth_state", state, {
      httpOnly: true,
      secure: false, // localhost only
      maxAge: 10 * 60 * 1000, // 10 mins
       sameSite: "lax",
    });

    const params = {
      client_id: process.env.CLIENT_ID,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      response_type: "code",
      scope:  "openid email profile",
      access_type: "offline",
      prompt: "consent",
      state,
    };

    const googleAuthUrl =
      `${GOOGLE_AUTH_URL}?${qs.stringify(params)}`;

    return res.redirect(googleAuthUrl);
  } catch (error) {
    console.error("Google Login Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to initiate Google login",
    });
  }
};

/**
 * Google OAuth callback
 */
export const googleCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // OAuth error from Google
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code missing",
      });
    }

    // Verify state
    const storedState = req.cookies?.oauth_state;

    if (!storedState || storedState !== state) {
      return res.status(400).json({
        success: false,
        message: "Invalid OAuth state",
      });
    }

    // Remove state cookie
    res.clearCookie("oauth_state");

    // Get Google user
    const googleUser = await exchangeCodeForUserProfile(code);
    
    if (!googleUser.email_verified) {
      return res.status(400).json({
        success: false,
        message: "Google email not verified",
      });
    }

    // Find existing user
    let user = await User.findOne({
      $or: [
        { email: googleUser.email },
        {
          "providers.provider": "google",
          "providers.providerId": googleUser.sub,
        },
      ],
    });
  

    // Create user if doesn't exist
    if (!user) {
      user = await User.create({
        name:
          googleUser.given_name ||
          googleUser.name?.split(" ")[0] ||
          "User",

      
        email: googleUser.email,

        profilePic: googleUser.picture,

        providers: [
          {
            provider: "google",
            providerId: googleUser.sub,
          },
        ],
      });
    } else {
      // Link Google provider if missing
      const hasGoogleProvider = user.providers.some(
        (provider) =>
          provider.provider === "google" &&
          provider.providerId === googleUser.sub
      );

      if (!hasGoogleProvider) {
        user.providers.push({
          provider: "google",
          providerId: googleUser.sub,
        });

        await user.save();
      }
    }

    // Generate JWT
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Google authentication successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error(
      "Google Callback Error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Google authentication failed",
    });
  }
};