const mongoose = require("mongoose");

// Address Schema (remains the same as previous model)
const addressSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },
    addressLine: {
      type: String,
      // required: [true, "Address Line is required"],
      trim: true,
    },
    city: {
      type: String,
      // required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      // required: [true, "State is required"],
      trim: true,
    },
    zipcode: {
      type: String,
      // required: [true, "Zipcode is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^\d{5,6}(?:[-\s]\d{4})?$/.test(v);
        },
        message: (props) => `${props.value} is not a valid zipcode!`,
      },
    },
    country: {
      type: String,
      // required: [true, "Country is required"],
      trim: true,
      default: "India",
    },
    landmark: {
      type: String,
      trim: true,
    },
    primaryPhone: {
      type: String,
      // required: [true, "Primary Phone is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^(\+\d{1,3}[- ]?)?\d{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    secondaryPhone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return v ? /^(\+\d{1,3}[- ]?)?\d{10}$/.test(v) : true;
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },

  {
    _id: true,
    timestamps: true,
  }
);

// User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,

      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,

      sparse: true,
      default: undefined,
    },
    password: {
      type: String,

      minlength: [6, "Password must be at least 6 characters long"],
    },
    phone: {
      type: String,

      unique: true,
      validate: {
        validator: function (v) {
          return /^\+?[1-9]\d{1,14}$/.test(v); // E.164 format validation
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    appleId: {
      type: String,
      unique: true,
    },
    authProvider: {
      type: String,
      enum: ["email", "google", "phone"],
      default: "email",
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    profileImage: {
      type: String,
      default: null,
    },
    addresses: {
      type: [addressSchema],
      default: [],
    },
    otpVerification: {
      verified: {
        type: Boolean,
        default: false,
      },
      lastVerifiedAt: {
        type: Date,
        default: null,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index to allow null emails
userSchema.index({ email: 1 }, { unique: true, sparse: true });

// Pre-save hook for additional validations or transformations
userSchema.pre("save", function (next) {
  // Ensure phone number is in a standard format
  if (this.phone && !this.phone.startsWith("+")) {
    this.phone = `+91${this.phone}`;
  }

  next();
});

// Method to mark user as verified
userSchema.methods.markAsVerified = function () {
  this.otpVerification.verified = true;
  this.otpVerification.lastVerifiedAt = new Date();
  return this.save();
};

// Static method to find or create user by phone
userSchema.statics.findOrCreateByPhone = async function (phoneNumber) {
  // Ensure phone is in E.164 format
  const formattedPhone = phoneNumber.startsWith("+")
    ? phoneNumber
    : `+91${phoneNumber}`;

  let user = await this.findOne({ phone: formattedPhone });

  if (!user) {
    user = new this({
      phone: formattedPhone,
      otpVerification: {
        verified: false,
        lastVerifiedAt: null,
      },
    });
    await user.save();
  }

  return user;
};

// Method to get default address
userSchema.methods.getDefaultAddress = function () {
  return this.addresses.find((addr) => addr.isDefault);
};

module.exports = mongoose.model("User", userSchema);
