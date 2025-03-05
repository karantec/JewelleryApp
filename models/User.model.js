const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['Home', 'Work', 'Other'],
    default: 'Home'
  },
  addressLine: { 
    type: String, 
    required: [true, "Address Line is required"],
    trim: true
  },
  city: { 
    type: String, 
    required: [true, "City is required"],
    trim: true
  },
  state: { 
    type: String, 
    required: [true, "State is required"],
    trim: true
  },
  zipcode: { 
    type: String, 
    required: [true, "Zipcode is required"],
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{5,6}(?:[-\s]\d{4})?$/.test(v);
      },
      message: props => `${props.value} is not a valid zipcode!`
    }
  },
  country: { 
    type: String, 
    required: [true, "Country is required"],
    trim: true,
    default: 'India'
  },
  landmark: { 
    type: String,
    trim: true
  },
  primaryPhone: { 
    type: String, 
    required: [true, "Primary Phone is required"],
    trim: true,
    validate: {
      validator: function(v) {
        return /^(\+\d{1,3}[- ]?)?\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  secondaryPhone: { 
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return v ? /^(\+\d{1,3}[- ]?)?\d{10}$/.test(v) : true;
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  isDefault: { 
    type: Boolean, 
    default: false 
  }
}, { 
  _id: true,
  timestamps: true 
});

const userSchema = new mongoose.Schema({
  name: { 
    type: String,
    trim: true,
    required: [true, "Name is required"],
    minlength: [2, "Name must be at least 2 characters long"],
    maxlength: [50, "Name cannot exceed 50 characters"]
  },
  email: { 
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  password: { 
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"]
  },
  phone: { 
    type: String, 
    required: [true, "Phone number is required"],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^(\+\d{1,3}[- ]?)?\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  profileImage: { 
    type: String,
    default: null
  },
  addresses: { 
    type: [addressSchema], 
    default: [] 
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound unique index to allow null emails
userSchema.index({ email: 1 }, { unique: true, sparse: true });

// Virtual for full name or other computed properties
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Pre-save hook for additional validations or transformations
userSchema.pre('save', function(next) {
  // Ensure phone number is in a standard format
  if (this.phone && !this.phone.startsWith('+')) {
    this.phone = `+91${this.phone}`;
  }
  next();
});

// Method to get default address
userSchema.methods.getDefaultAddress = function() {
  return this.addresses.find(addr => addr.isDefault);
};

module.exports = mongoose.model('User', userSchema);